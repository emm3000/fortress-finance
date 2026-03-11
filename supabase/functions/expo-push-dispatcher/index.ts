import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

type QueueRow = {
  id: string;
  user_id: string;
  event_id: string | null;
  notification_type: "ATTACK" | "REWARD" | "SHOP";
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  dedupe_key: string;
  status: QueueStatus;
  attempts: number;
  next_retry_at: string | null;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_SECONDS = 30;
const MAX_BACKOFF_SECONDS = 60 * 60;

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const computeNextRetryAt = (attempts: number) => {
  const seconds = Math.min(
    MAX_BACKOFF_SECONDS,
    BASE_BACKOFF_SECONDS * 2 ** Math.max(attempts - 1, 0),
  );
  return new Date(Date.now() + seconds * 1_000).toISOString();
};

const getBatchSize = (req: Request) => {
  const url = new URL(req.url);
  const raw = Number(url.searchParams.get("batch") ?? "25");
  if (!Number.isFinite(raw) || raw <= 0) return 25;
  return Math.min(Math.floor(raw), 100);
};

const markAsClaimed = async (
  supabase: ReturnType<typeof createClient>,
  row: QueueRow,
) => {
  const { data, error } = await supabase
    .from("notification_dispatch_queue")
    .update({
      status: "PROCESSING",
      attempts: row.attempts + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .in("status", ["PENDING", "FAILED"])
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as QueueRow | null;
};

const markAsSent = async (
  supabase: ReturnType<typeof createClient>,
  row: QueueRow,
) => {
  const { error } = await supabase
    .from("notification_dispatch_queue")
    .update({
      status: "SENT",
      sent_at: new Date().toISOString(),
      next_retry_at: null,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
};

const markAsFailed = async (
  supabase: ReturnType<typeof createClient>,
  row: QueueRow,
  message: string,
) => {
  const shouldStop = row.attempts >= MAX_ATTEMPTS;
  const { error } = await supabase
    .from("notification_dispatch_queue")
    .update({
      status: shouldStop ? "FAILED" : "PENDING",
      next_retry_at: shouldStop ? null : computeNextRetryAt(row.attempts),
      last_error: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (error) throw error;
};

const sendExpoPush = async (
  row: QueueRow,
  tokens: string[],
  expoAccessToken: string | null,
) => {
  const messages = tokens.map((token) => ({
    to: token,
    title: row.title,
    body: row.body,
    data: row.payload ?? {},
    sound: "default",
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(expoAccessToken
        ? { Authorization: `Bearer ${expoAccessToken}` }
        : {}),
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with status ${response.status}`);
  }

  const body = await response.json();
  const data = Array.isArray(body?.data) ? body.data : [];
  const hasError = data.some((item: Record<string, unknown>) =>
    item?.status === "error"
  );
  if (hasError) {
    throw new Error("Expo push returned one or more ticket errors");
  }
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") ?? null;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const batchSize = getBatchSize(req);
  const nowIso = new Date().toISOString();

  const { data: dueRows, error: dueError } = await supabase
    .from("notification_dispatch_queue")
    .select("*")
    .in("status", ["PENDING", "FAILED"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (dueError) {
    return json(500, { error: dueError.message });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const due of (dueRows ?? []) as QueueRow[]) {
    try {
      const claimed = await markAsClaimed(supabase, due);
      if (!claimed) {
        skipped += 1;
        continue;
      }

      const { data: tokenRows, error: tokenError } = await supabase
        .from("user_push_tokens")
        .select("token_string")
        .eq("user_id", claimed.user_id);

      if (tokenError) {
        throw tokenError;
      }

      const tokens = (tokenRows ?? [])
        .map((row) => row.token_string as string)
        .filter((token) => typeof token === "string" && token.length > 0);

      if (tokens.length === 0) {
        throw new Error("No push tokens found for user");
      }

      await sendExpoPush(claimed, tokens, expoAccessToken);

      const { error: logError } = await supabase
        .from("notification_logs")
        .insert({
          user_id: claimed.user_id,
          title: claimed.title,
          body: claimed.body,
          type: claimed.notification_type,
          status: "SENT",
        });

      if (logError) throw logError;

      await markAsSent(supabase, claimed);
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown dispatch error";
      try {
        await markAsFailed(supabase, due, message);
      } catch {
        // Best effort only; job will remain visible for manual recovery.
      }
    }
  }

  return json(200, {
    scanned: (dueRows ?? []).length,
    sent,
    failed,
    skipped,
    batchSize,
  });
});
