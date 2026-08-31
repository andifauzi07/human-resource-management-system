import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

export const Route = createRootRoute({
	component: () => (
		<QueryClientProvider client={queryClient}>
			<Outlet />
		</QueryClientProvider>
	)
});
