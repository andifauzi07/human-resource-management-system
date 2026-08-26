import { z } from "zod";

// Mirror dari loginSchema di server/src/controllers/auth.controller.ts
// (duplikasi disadari — lihat design.md D3).
export const loginFormSchema = z.object({
	email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
	password: z.string().min(1, "Password wajib diisi")
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
