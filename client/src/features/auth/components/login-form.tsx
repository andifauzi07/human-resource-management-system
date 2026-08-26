import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authApi, ApiClientError } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { loginFormSchema, type LoginFormValues } from "../schemas/login.schema";
import { safeRedirectTarget } from "../redirect";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

interface LoginFormProps {
	redirectTarget?: string;
}

export function LoginForm({ redirectTarget }: LoginFormProps) {
	const navigate = useNavigate();
	const [values, setValues] = useState<LoginFormValues>({
		email: "",
		password: ""
	});
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function setField(field: keyof LoginFormValues, value: string) {
		setValues((prev) => ({ ...prev, [field]: value }));
		setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError(null);

		const parsed = loginFormSchema.safeParse(values);
		if (!parsed.success) {
			const errors: FieldErrors = {};
			for (const issue of parsed.error.issues) {
				const key = issue.path[0];
				if (key === "email" || key === "password") {
					errors[key] ??= issue.message;
				}
			}
			setFieldErrors(errors);
			return;
		}

		setSubmitting(true);
		try {
			const data = await authApi.login(parsed.data.email, parsed.data.password);
			useAuthStore.getState().setAuth(data.accessToken, data.user);
			await navigate({ to: safeRedirectTarget(redirectTarget) });
		} catch (error) {
			setFormError(
				error instanceof ApiClientError
					? error.message
					: "Terjadi kesalahan, coba lagi."
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="text-lg font-semibold tracking-tight">
					Masuk ke HRIS
				</CardTitle>
				<CardDescription>
					Gunakan email dan password karyawan Anda.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="grid gap-4" noValidate>
					{formError && (
						<div
							role="alert"
							className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
						>
							{formError}
						</div>
					)}
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							placeholder="nama@perusahaan.id"
							value={values.email}
							onChange={(e) => setField("email", e.target.value)}
							aria-invalid={Boolean(fieldErrors.email)}
							aria-describedby={
								fieldErrors.email ? "email-error" : undefined
							}
						/>
						{fieldErrors.email && (
							<p id="email-error" className="text-destructive text-xs">
								{fieldErrors.email}
							</p>
						)}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							autoComplete="current-password"
							value={values.password}
							onChange={(e) => setField("password", e.target.value)}
							aria-invalid={Boolean(fieldErrors.password)}
							aria-describedby={
								fieldErrors.password ? "password-error" : undefined
							}
						/>
						{fieldErrors.password && (
							<p id="password-error" className="text-destructive text-xs">
								{fieldErrors.password}
							</p>
						)}
					</div>
					<Button type="submit" disabled={submitting}>
						{submitting && <Spinner />}
						Masuk
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
