export type ApiErrorPayload = {
  message?: string;
  code?: string;
};

export function isApiErrorPayload(value: object): value is ApiErrorPayload {
  return (
    (!("message" in value) || typeof value.message === "string") &&
    (!("code" in value) || typeof value.code === "string")
  );
}

export function parseJsonObject(text: string): object {
  const parsed = JSON.parse(text) as object;

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Invalid JSON payload");
  }

  return parsed;
}

export async function readJsonObject(res: Response): Promise<object> {
  const text = await res.text();
  return parseJsonObject(text);
}

export async function readErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const obj = await readJsonObject(res);

    if (
      isApiErrorPayload(obj) &&
      typeof obj.message === "string" &&
      obj.message.length > 0
    ) {
      return obj.message;
    }

    return fallback;
  } catch {
    return fallback;
  }
}
