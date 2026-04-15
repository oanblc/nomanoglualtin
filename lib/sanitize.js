// SSR-safe HTML sanitize helper.
// Sayfalar içeriği client-side useEffect ile çeker, bu yüzden sanitize çağrısı
// sadece hydration sonrası browser'da gerçekleşir. SSR sırasında no-op döner.

let sanitizer = (dirty) => String(dirty ?? '');

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DOMPurify = require('dompurify');
  sanitizer = (dirty) => DOMPurify.sanitize(dirty ?? '');
}

export const sanitize = (dirty) => sanitizer(dirty);
