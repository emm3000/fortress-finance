export const AUTH_ERROR_FALLBACK = "No pudimos completar la operación. Inténtalo de nuevo.";

const NETWORK_MESSAGE =
  "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const RATE_LIMIT_MESSAGE = "Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.";

const MESSAGE_BY_CODE: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
  user_already_exists: "Ya existe una cuenta con ese correo.",
  email_exists: "Ya existe una cuenta con ese correo.",
  weak_password: "La contraseña es demasiado débil. Usa una más larga y variada.",
  over_email_send_rate_limit: RATE_LIMIT_MESSAGE,
  over_request_rate_limit: RATE_LIMIT_MESSAGE,
  otp_expired: "El código expiró o no es válido. Solicita uno nuevo.",
};

const MESSAGE_BY_STATUS: Record<number, string> = {
  429: RATE_LIMIT_MESSAGE,
};

type AuthErrorLike = {
  name?: unknown;
  code?: unknown;
  status?: unknown;
};

/**
 * Map a Supabase Auth failure to Spanish copy. The original message is never
 * returned: unknown errors get a generic fallback.
 */
export const getAuthErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return AUTH_ERROR_FALLBACK;
  }

  const { name, code, status } = error as AuthErrorLike;

  if (name === "AuthRetryableFetchError") {
    return NETWORK_MESSAGE;
  }

  if (typeof code === "string" && code in MESSAGE_BY_CODE) {
    return MESSAGE_BY_CODE[code];
  }

  if (typeof status === "number" && status in MESSAGE_BY_STATUS) {
    return MESSAGE_BY_STATUS[status];
  }

  return AUTH_ERROR_FALLBACK;
};
