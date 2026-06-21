/** Boş veya geçersiz gövdede res.json() patlamasını önler. */
export async function parseResponseJson<T>(res: Response): Promise<T | null> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return null;
  }
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

export function apiErrorMessage(
  res: Response,
  data: { error?: string; reason?: string } | null,
  fallback: string,
): string {
  if (data?.reason) return data.reason;
  if (data?.error) return data.error;
  if (!res.ok) return `${fallback} (${res.status})`;
  return fallback;
}
