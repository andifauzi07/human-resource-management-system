/**
 * Sanitasi nilai param `?redirect=` — hanya path relatif yang diizinkan
 * (harus dimulai "/" dan bukan "//" protokol-relative) untuk mencegah
 * open redirect. Selain itu fallback ke "/".
 */
export function safeRedirectTarget(raw: string | undefined): string {
	if (raw && /^\/(?!\/)/.test(raw)) return raw;
	return "/";
}
