import type {
  PrepareUserOpRequest,
  PrepareUserOpResponse,
  SubmitUserOpRequest,
  SubmitUserOpResponse,
  UserOperation,
} from "@/types/user-operation";

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof body === "object" && body && "error" in body && body.error
        ? String(body.error)
        : `Relay API error (${res.status})`,
    );
  }
  return body;
}

export async function fetchRelayerStatus(): Promise<{ enabled: boolean }> {
  const res = await fetch("/api/relay/status", { cache: "no-store" });
  return parseJson(res);
}

export async function prepareUserOp(
  request: PrepareUserOpRequest,
): Promise<PrepareUserOpResponse> {
  const res = await fetch("/api/relay/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseJson(res);
}

export async function submitUserOp(
  request: SubmitUserOpRequest,
): Promise<SubmitUserOpResponse> {
  const res = await fetch("/api/relay/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return parseJson(res);
}

export function attachSignature(
  userOp: UserOperation,
  signature: string,
): UserOperation {
  const sig = signature.startsWith("0x") ? signature : `0x${signature}`;
  return { ...userOp, signature: sig };
}
