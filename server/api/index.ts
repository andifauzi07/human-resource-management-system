// Entry point Vercel serverless function.
// @vercel/node mendeteksi Express app yang diekspor dan membungkusnya
// menjadi handler Lambda — TIDAK boleh memanggil app.listen di sini.
// Entry dev lokal tetap di src/server.ts.
import app from "../src/app";

export default app;
