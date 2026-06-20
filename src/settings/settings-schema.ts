import { z } from "zod";

export const settingsSchema = z.object({
  language: z.enum(["en", "tr"]),
  preferredCurrency: z.enum(["USD", "EUR", "TRY"]),
  biometricEnabled: z.boolean()
});
