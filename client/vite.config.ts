import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
	// tanstackRouter harus sebelum plugin react agar routeTree tergenerasi lebih dulu
	plugins: [tanstackRouter(), react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
		},
	},
	server: {
		// Origin 5173 adalah kontrak dengan CORS_ORIGIN server (.env.development).
		// Jika port sibuk, GAGAL cepat — jangan diam-diam pindah port yang tak dikenal CORS.
		port: 5173,
		strictPort: true,
	},
});
