// Entry point Vercel serverless function.
// Sengaja file JS murni (bukan TS): platform mengompilasi file ini di luar
// pipeline tsc kita, sehingga ia harus menunjuk artefak build yang sudah
// valid sebagai ESM (ekstensi lengkap + alias ter-rewrite oleh tsc-alias).
// TIDAK boleh memanggil app.listen di sini — entry dev tetap src/server.ts.
import app from "../dist/app.js";

export default app;
