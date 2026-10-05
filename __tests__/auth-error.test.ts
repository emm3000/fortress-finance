import { AUTH_ERROR_FALLBACK, getAuthErrorMessage } from "@/utils/auth-error";

const fakeAuthError = (
  message: string,
  status: number,
  code: string | undefined,
  name = "AuthApiError"
) => Object.assign(new Error(message), { name, status, code });

describe("getAuthErrorMessage", () => {
  it.each([
    ["invalid_credentials", 400, "Correo o contraseña incorrectos."],
    ["email_not_confirmed", 400, "Confirma tu correo antes de iniciar sesión."],
    ["user_already_exists", 422, "Ya existe una cuenta con ese correo."],
    ["email_exists", 422, "Ya existe una cuenta con ese correo."],
    ["weak_password", 422, "La contraseña es demasiado débil. Usa una más larga y variada."],
    [
      "over_email_send_rate_limit",
      429,
      "Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.",
    ],
    [
      "over_request_rate_limit",
      429,
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    ],
    ["otp_expired", 403, "El código expiró o no es válido. Solicita uno nuevo."],
  ])("maps each known Supabase Auth error to its Spanish message (%s)", (code, status, message) => {
    const error = fakeAuthError("English text from the server", status, code);

    expect(getAuthErrorMessage(error)).toBe(message);
  });

  it("maps each known Supabase Auth error to its Spanish message (network failure)", () => {
    const error = fakeAuthError("Network request failed", 0, undefined, "AuthRetryableFetchError");

    expect(getAuthErrorMessage(error)).toBe(
      "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
    );
  });

  it("maps legacy responses that carry only a status", () => {
    const error = fakeAuthError("Too many requests", 429, undefined);

    expect(getAuthErrorMessage(error)).toBe(
      "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
    );
  });

  it("does not match inherited object keys as error codes or statuses", () => {
    expect(getAuthErrorMessage(fakeAuthError("x", 400, "constructor"))).toBe(AUTH_ERROR_FALLBACK);
    expect(getAuthErrorMessage(fakeAuthError("x", 400, "toString"))).toBe(AUTH_ERROR_FALLBACK);
  });

  it("falls back to a generic Spanish message for an unknown error and never returns the original message", () => {
    const unknown = [
      fakeAuthError("Something exotic happened", 400, "exotic_code"),
      new Error("Raw English failure"),
      "plain string",
      null,
    ];

    for (const error of unknown) {
      const message = getAuthErrorMessage(error);

      expect(message).toBe(AUTH_ERROR_FALLBACK);
      expect(message).not.toMatch(/exotic|Raw English|plain string/);
    }
  });
});
