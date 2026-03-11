type ApiErrorObject = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
};

type ApiErrorResponseData = {
  error?: unknown;
  message?: unknown;
};

type ApiLikeError = {
  response?: {
    data?: ApiErrorResponseData;
  };
  message?: unknown;
};

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiLikeError;
  const data = apiError?.response?.data;

  if (data) {
    if (typeof data.error === "string") {
      const message = toNonEmptyString(data.error);
      if (message) return message;
    }

    if (data.error && typeof data.error === "object") {
      const nestedError = data.error as ApiErrorObject;
      const message = toNonEmptyString(nestedError.message);
      if (message) return message;
    }

    const dataMessage = toNonEmptyString(data.message);
    if (dataMessage) return dataMessage;
  }

  const rootMessage = toNonEmptyString(apiError?.message);
  return rootMessage ?? fallback;
};
