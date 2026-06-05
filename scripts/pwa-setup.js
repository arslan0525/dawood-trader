/**
 * Injects manifest.json and sw.js into the Expo web build output.
 * Run after: npx expo export --platform web
 */
const fs   = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const WEB  = path.join(__dirname, '..', 'web');

// Copy manifest + sw to dist root
['manifest.json', 'sw.js'].forEach(file => {
  const src  = path.join(WEB, file);
  const dest = path.join(DIST, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file} → dist/${file}`);
  } else {
    console.warn(`⚠️  ${file} not found in web/`);
  }
});

// Copy app icons to dist root (PWA requires exact paths in manifest)
const iconSrc = path.join(__dirname, '..', 'assets', 'icon.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, path.join(DIST, 'icon-192.png'));
  fs.copyFileSync(iconSrc, path.join(DIST, 'icon-512.png'));
  console.log('✅ App icons copied → dist/icon-192.png + icon-512.png');
}

// Patch dist/index.html — inject manifest + SW registration
const indexPath = path.join(DIST, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found — did expo export run?');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

const pwaHead = `
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Dawood Trader" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <style id="pwa-scroll-fix">
    :root { --vh: 1vh; }
    * { -webkit-overflow-scrolling: touch; }
    body { overscroll-behavior: none; }
    div[style*="overflow-y: scroll"], div[style*="overflow-y:scroll"],
    div[style*="overflow: scroll"], div[style*="overflow:scroll"] {
      touch-action: pan-y !important;
      overscroll-behavior: contain;
    }
  </style>`;

const swScript = `
  <script>
    /* Capture beforeinstallprompt BEFORE React loads — critical for Android Chrome */
    window.__pwaPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window.__pwaPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    });
    window.addEventListener('appinstalled', function() {
      window.__pwaPrompt = null;
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });
    /* PWA viewport height fix — 100vh is wrong on Android PWA standalone mode.
       Set --vh CSS variable to actual window.innerHeight so scroll containers
       get the correct bounded height on every device. */
    function fixVh() {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    }
    fixVh();
    window.addEventListener('resize', fixVh);
    window.addEventListener('orientationchange', function() { setTimeout(fixVh, 150); });
    /* Register service worker */
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(function (r) { console.log('[SW] Registered', r.scope); })
          .catch(function (e) { console.warn('[SW] Error:', e); });
      });
    }
  </script>`;

// Inject into <head> if not already present
if (!html.includes('/manifest.json')) {
  html = html.replace('</head>', pwaHead + '\n</head>');
  console.log('✅ Injected PWA meta tags');
}
if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', swScript + '\n</body>');
  console.log('✅ Injected service worker registration');
}

// SEO + canonical + og:url meta tags
if (!html.includes('og:title')) {
  const APP_URL = 'https://dawood-trader-kappa.vercel.app';
  const seo = `
  <meta name="description" content="Dawood Trader — Pakistan's professional distribution, inventory, billing and customer management system." />
  <link rel="canonical" href="${APP_URL}/" />
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${APP_URL}/" />
  <meta property="og:title"       content="Dawood Trader — Distribution Management System" />
  <meta property="og:description" content="Complete distribution, inventory, billing and customer management for Pakistan businesses." />
  <meta property="og:image"       content="${APP_URL}/icon-512.png" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:url"         content="${APP_URL}/" />
  <meta name="twitter:title"       content="Dawood Trader" />
  <meta name="twitter:image"       content="${APP_URL}/icon-512.png" />`;
  html = html.replace('</head>', seo + '\n</head>');
  console.log('✅ Injected SEO + canonical + og:url tags');
}

// Always ensure apple-touch-icon uses the correct built icon path
html = html.replace(/href="\/assets\/icon\.png"/g, 'href="/icon-192.png"');

// Patch expo-reset: use 100dvh for html so mobile PWA gets correct height
// 100dvh = dynamic viewport height (excludes browser/system UI) — no overflow:hidden on html/body needed
html = html.replace(
  /(<style id="expo-reset">[\s\S]*?html,\s*\n?\s*body\s*\{\s*\n?\s*height:\s*100%[\s\S]*?<\/style>)/,
  (match) => match.replace(
    /html,\s*\n?\s*body\s*\{\s*\n?\s*height:\s*100%;?\s*\n?\s*\}/,
    'html, body { height: 100%; }'
  )
);

// Always inject/replace PWA scroll fix CSS
const scrollFixCSS = `<style id="pwa-scroll-fix">
  /* Mobile PWA scroll fix — use dvh (dynamic viewport height) for modern browsers */
  html { height: -webkit-fill-available; }
  @supports (height: 100dvh) { html { height: 100dvh; } }
  body { height: 100%; overflow: hidden; overscroll-behavior: none; }
  #root { height: 100%; display: flex; flex: 1; }
  /* Allow touch-scroll on all scrollable divs — critical for Android PWA */
  * { -webkit-overflow-scrolling: touch; }
  div { touch-action: pan-y pinch-zoom; }
  div[style*="overflow-y: scroll"], div[style*="overflow-y:scroll"],
  div[style*="overflow: scroll"], div[style*="overflow:scroll"],
  div[style*="overflow: auto"], div[style*="overflow:auto"] {
    touch-action: pan-y !important;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch !important;
  }
</style>`;
if (html.includes('id="pwa-scroll-fix"')) {
  html = html.replace(/<style id="pwa-scroll-fix">[\s\S]*?<\/style>/, scrollFixCSS);
} else {
  html = html.replace('</head>', scrollFixCSS + '\n</head>');
}
console.log('✅ Injected PWA scroll fix CSS');

fs.writeFileSync(indexPath, html);
console.log('✅ dist/index.html patched');
console.log('\nPWA setup complete! 🚀');
