import { z } from "zod";

export const companySchema = z.strictObject({ name: z.string().trim().min(1) });
