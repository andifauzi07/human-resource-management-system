import { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { restoreSession } from '@/features/auth/session';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute('/')({
	beforeLoad: async ({ location }) => {
		await restoreSession();
		if (!useAuthStore.getState().user) {
			throw redirect({ to: '/login', search: { redirect: location.href } });
		}
	},
	pendingComponent: PendingScreen,
	component: HomePage
});

function PendingScreen() {
	return (
		<main className="flex min-h-svh items-center justify-center bg-background">
			<Spinner className="size-6 text-primary" />
			<span className="sr-only">Memuat…</span>
		</main>
	);
}

function HomePage() {
	const navigate = useNavigate();
	const user = useAuthStore((state) => state.user);
	const [loggingOut, setLoggingOut] = useState(false);

	async function handleLogout() {
		setLoggingOut(true);
		try {
			await authApi.logout();
		} finally {
			useAuthStore.getState().clear();
			await navigate({ to: '/login' });
		}
	}

	if (!user) return null;

	return (
		<main className="flex min-h-svh items-center justify-center bg-background py-10">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-lg font-semibold tracking-tight">
						Selamat datang di HRIS
					</CardTitle>
					<CardDescription>
						Anda berhasil masuk ke sistem.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4">
					<dl className="grid gap-2 text-sm">
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">Email</dt>
							<dd className="font-medium">{user.email}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">Role</dt>
							<dd>
								<span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
									{user.role}
								</span>
							</dd>
						</div>
					</dl>
					<Button variant="outline" onClick={handleLogout} disabled={loggingOut}>
						{loggingOut && <Spinner />}
						Keluar
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
