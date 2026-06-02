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
  <link rel="apple-touch-icon" href="/assets/icon.png" />`;

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

// SEO meta tags
if (!html.includes('og:title')) {
  const seo = `
  <meta name="description" content="Dawood Trader — Pakistan's professional distribution, inventory, billing and customer management system." />
  <meta property="og:title" content="Dawood Trader — Distribution Management System" />
  <meta property="og:description" content="Complete distribution, inventory, billing and customer management for Pakistan businesses." />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Dawood Trader" />`;
  html = html.replace('</head>', seo + '\n</head>');
  console.log('✅ Injected SEO meta tags');
}

fs.writeFileSync(indexPath, html);
console.log('✅ dist/index.html patched');
console.log('\nPWA setup complete! 🚀');
