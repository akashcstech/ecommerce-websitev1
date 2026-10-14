/**
 * Asset URL resolver: maps any external image links (e.g. Unsplash)
 * to local downloaded assets in /assets/images/
 */

export const HERO_ASSETS = [
  "/assets/images/hero/hero-1.jpg",
  "/assets/images/hero/hero-2.jpg",
  "/assets/images/hero/hero-3.jpg",
] as const;

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "photo-1599669454699-248893623440": "/assets/images/products/aura-studio-anc-wireless-headphones.jpg",
  "photo-1520170350707-b2da59970118": "/assets/images/products/nordic-soundcraft-reference-over-ear.jpg",
  "photo-1628202926206-c63a34b1618f": "/assets/images/products/pulse-air-wireless-earbuds.jpg",
  "photo-1658993376064-dd47b2da0e97": "/assets/images/products/chrono-fit-smartwatch.jpg",
  "photo-1660844817855-3ecc7ef21f12": "/assets/images/products/chrono-fit-smartwatch-lite.jpg",
  "photo-1558126319-c9feecbf57ee": "/assets/images/products/midnight-pro-watch-series.jpg",
  "photo-1622760807800-66cf1466fc08": "/assets/images/products/monolith-retro-low-top-sneakers.jpg",
  "photo-1587563871167-1ee9c731aefb": "/assets/images/products/aero-minimalist-street-runner.jpg",
  "photo-1632497775901-50ba4637399f": "/assets/images/products/urban-noir-high-top.jpg",
  "photo-1600054904350-1d493ae5f922": "/assets/images/products/weekend-canvas-classics.jpg",
  "photo-1587374833532-f4fe0e61f589": "/assets/images/products/everyday-cotton-polo.jpg",
  "photo-1576871337650-d711e9c0470b": "/assets/images/products/advanz-graphic-tee-pack.jpg",
  "photo-1714144069905-f9bd839184af": "/assets/images/products/studio-essentials-tee.jpg",
  "photo-1556306535-38febf6782e7": "/assets/images/products/classic-wayfarer-sunglasses.jpg",
  "photo-1629139033414-76f3c0eacf84": "/assets/images/products/heritage-leather-bifold-wallet.jpg",
  "photo-1492707892479-7bc8d5a4ee93": "/assets/images/products/quilted-crossbody-bag.jpg",
  "photo-1586652171272-8f18c34f79af": "/assets/images/products/round-tortoise-reading-glasses.jpg",
  "www.madebyvadim.com": "/assets/images/products/everyday-carry-kit.jpg",
  "photo-1562655074-76c602f03a0e": "/assets/images/products/teacup-pendant-lamp.jpg",
  "photo-1623088030797-a38ef73fb64d": "/assets/images/products/stoneware-morning-mug.jpg",
  "photo-1583968275064-5ba1034f649b": "/assets/images/products/amber-glass-table-lamp.jpg",
  "photo-1578827843335-8ed1f6d11611": "/assets/images/products/feather-print-ceramic-mug.jpg",
};

const DEFAULT_FALLBACK_IMAGE = "/assets/images/products/aura-studio-anc-wireless-headphones.jpg";

/**
 * Normalizes an image URL, redirecting any Unsplash or remote web image link to local assets.
 */
export function getAssetImageUrl(url?: string | null): string {
  if (!url) return DEFAULT_FALLBACK_IMAGE;

  // Keep data URLs intact (e.g. file uploads in admin)
  if (url.startsWith("data:")) return url;

  // Local assets are already redirected
  if (url.startsWith("/assets/") || url.startsWith("assets/")) {
    return url.startsWith("/") ? url : `/${url}`;
  }

  // Intercept any Unsplash link
  if (url.includes("images.unsplash.com") || url.includes("unsplash.com")) {
    // Check known photo IDs in map
    for (const [key, localPath] of Object.entries(PRODUCT_IMAGE_MAP)) {
      if (url.includes(key)) {
        return localPath;
      }
    }

    // Try extracting photo id path
    try {
      const parsed = new URL(url);
      const cleanPath = parsed.pathname.replace(/^\/+/, "");
      const baseKey = cleanPath.split("/").pop()?.replace(/\.[^/.]+$/, "") || "";
      if (baseKey) {
        if (PRODUCT_IMAGE_MAP[baseKey]) {
          return PRODUCT_IMAGE_MAP[baseKey];
        }
        return `/assets/images/products/${baseKey}.jpg`;
      }
    } catch {
      // If parsing fails, fall back below
    }

    return DEFAULT_FALLBACK_IMAGE;
  }

  return url;
}
