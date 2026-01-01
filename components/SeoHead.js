import Head from 'next/head';
import Script from 'next/script';
import { useSettings } from '../contexts/SettingsContext';
import { useCookieConsent } from './CookieConsent';

export default function SeoHead({
  title,
  description,
  keywords,
  ogImage,
  canonical
}) {
  const { seo, faviconBase64 } = useSettings();
  const { consent } = useCookieConsent() || {};

  // Sayfa bazlı veya genel SEO değerleri
  const pageTitle = title || seo.siteTitle || 'Nomanoğlu Kuyumculuk';
  const pageDescription = description || seo.siteDescription || '';
  const pageKeywords = keywords || seo.siteKeywords || '';
  const pageOgImage = ogImage || seo.ogImage || '';
  const pageCanonical = canonical || seo.canonicalUrl || '';

  // Analytics sadece çerez onayı verildiyse yüklensin
  const canLoadAnalytics = consent === true;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {pageKeywords && <meta name="keywords" content={pageKeywords} />}
        <meta name="robots" content={seo.robotsContent || 'index, follow'} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* Favicon */}
        {faviconBase64 && <link rel="icon" href={faviconBase64} />}

        {/* Canonical URL */}
        {pageCanonical && <link rel="canonical" href={pageCanonical} />}

        {/* Open Graph */}
        <meta property="og:type" content={seo.ogType || 'website'} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {pageOgImage && <meta property="og:image" content={pageOgImage} />}
        {pageCanonical && <meta property="og:url" content={pageCanonical} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content={seo.twitterCard || 'summary_large_image'} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {pageOgImage && <meta name="twitter:image" content={pageOgImage} />}

        {/* Site Verification */}
        {seo.googleSiteVerification && (
          <meta name="google-site-verification" content={seo.googleSiteVerification} />
        )}
        {seo.bingSiteVerification && (
          <meta name="msvalidate.01" content={seo.bingSiteVerification} />
        )}

        {/* Custom Head Scripts - bunlar her zaman yüklenebilir (SEO amaçlı) */}
        {seo.headScripts && (
          <script dangerouslySetInnerHTML={{ __html: seo.headScripts }} />
        )}
      </Head>

      {/* Google Analytics - sadece çerez onayı varsa */}
      {canLoadAnalytics && seo.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seo.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager - sadece çerez onayı varsa */}
      {canLoadAnalytics && seo.googleTagManagerId && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${seo.googleTagManagerId}');
          `}
        </Script>
      )}

      {/* Meta Pixel - sadece çerez onayı varsa */}
      {canLoadAnalytics && seo.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${seo.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}

// Body Script Component - sayfa içinde kullanılacak
export function BodyScripts() {
  const { seo } = useSettings();
  const { consent } = useCookieConsent() || {};

  const canLoadAnalytics = consent === true;

  return (
    <>
      {/* GTM Noscript - sadece çerez onayı varsa */}
      {canLoadAnalytics && seo.googleTagManagerId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${seo.googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
      )}

      {/* Body Start Scripts */}
      {seo.bodyStartScripts && (
        <div dangerouslySetInnerHTML={{ __html: seo.bodyStartScripts }} />
      )}

      {/* Meta Pixel Noscript - sadece çerez onayı varsa */}
      {canLoadAnalytics && seo.metaPixelId && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${seo.metaPixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
    </>
  );
}

// Body End Scripts
export function BodyEndScripts() {
  const { seo } = useSettings();

  if (!seo.bodyEndScripts) return null;

  return <div dangerouslySetInnerHTML={{ __html: seo.bodyEndScripts }} />;
}
