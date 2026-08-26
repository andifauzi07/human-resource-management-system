import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { LoginForm } from '@/features/auth/components/login-form';

// Param ?redirect= divalidasi Zod; sanitasi open-redirect dilakukan di
// safeRedirectTarget saat navigasi (hanya path relatif "^/" dan bukan "//").
const loginSearchSchema = z.object({
	redirect: z.string().optional()
});

export const Route = createFileRoute('/login')({
	validateSearch: loginSearchSchema,
	beforeLoad: () => {
		if (useAuthStore.getState().user) {
			throw redirect({ to: '/' });
		}
	},
	component: LoginPage
});

function LoginPage() {
	const { redirect } = Route.useSearch();
	return (
		<main className="flex min-h-svh items-center justify-center bg-background py-10">
			<LoginForm redirectTarget={redirect} />
		</main>
	);
}
