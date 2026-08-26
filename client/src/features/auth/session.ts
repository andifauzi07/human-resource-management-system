import { refreshSession } from "@/lib/api";

/**
 * Pemulihan sesi saat boot (silent refresh via httpOnly cookie).
 * Promise dimemoisasi modul-scope sehingga meski beberapa route memanggil
 * ini dalam satu app load, request refresh hanya dikirim sekali.
 */
let restorePromise: Promise<boolean> | null = null;

export function restoreSession(): Promise<boolean> {
	restorePromise ??= refreshSession();
	return restorePromise;
}
