import { z } from "zod";

const SessionSchema = z.object({
  userId: z.string(),
  expiresAt: z.string(),
  authMethod: z.enum(["email", "wallet", "passkey", "social"])
});

export type Session = z.infer<typeof SessionSchema>;

export const sessionService = {
  serialize(session: Session) {
    return JSON.stringify(SessionSchema.parse(session));
  },
  deserialize(payload: string) {
    return SessionSchema.parse(JSON.parse(payload));
  }
};
