import { format } from "prettier";
import { expect, test } from "vitest";
import { generateHtml } from "./generate.js";

test("Minimal Prod", async () => {
  const html = generateHtml({
    title: "Test",
    description: "I am a test",
    socialImage: "/image.png",
    favicon: { href: "/favicon.png", type: "image/png" },
    entrypoint: {
      type: "prod",
      manifestChunk: { file: "index-hash.js", css: ["index.css"] },
    },
  });

  const prettyHtml = await format(html, { parser: "html" });

  expect(prettyHtml).toMatchInlineSnapshot(
    `
    "<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />
        <title>Test</title>
        <meta name="description" content="I am a test" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Indie Tabletop Club" />
        <meta property="og:title" content="Test" />
        <meta property="og:description" content="I am a test" />
        <meta property="og:image" content="/image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Test" />
        <meta name="twitter:description" content="I am a test" />
        <meta name="twitter:image" content="/image.png" />
        <script type="module" src="/index-hash.js"></script>
        <link rel="stylesheet" href="/index.css" />
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
    "
  `,
  );
});

test("Complete Prod", async () => {
  const html = generateHtml({
    title: "Test",
    description: "I am a test",
    socialImage: "/image.png",
    favicon: { href: "/favicon.png", type: "image/png" },
    fathomSiteId: "fathom-XXX",
    typekitProjectId: "typekit-XXX",
    bodyColor: "#ffffff",
    prefetched: { data: "anything..." },
    entrypoint: {
      type: "prod",
      manifestChunk: { file: "index-hash.js", css: ["index.css"] },
    },
  });

  const prettyHtml = await format(html, { parser: "html" });

  expect(prettyHtml).toMatchInlineSnapshot(`
    "<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />
        <title>Test</title>
        <meta name="description" content="I am a test" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Indie Tabletop Club" />
        <meta property="og:title" content="Test" />
        <meta property="og:description" content="I am a test" />
        <meta property="og:image" content="/image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Test" />
        <meta name="twitter:description" content="I am a test" />
        <meta name="twitter:image" content="/image.png" />
        <script
          src="https://cdn.usefathom.com/script.js"
          data-site="fathom-XXX"
          data-spa="auto"
          defer=""
        ></script>
        <link rel="stylesheet" href="https://use.typekit.net/typekit-XXX.css" />
        <style>
          body {
            background-color: #ffffff;
          }
        </style>
        <script type="module" src="/index-hash.js"></script>
        <link rel="stylesheet" href="/index.css" />
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.PREFETCHED = { data: "anything..." };
        </script>
      </body>
    </html>
    "
  `);
});

test("Minimal Dev Mode", async () => {
  const html = generateHtml({
    title: "Test",
    description: "I am a test",
    socialImage: "/image.png",
    entrypoint: { type: "dev", path: "/src/main.tsx" },
    favicon: { href: "/favicon.png", type: "image/png" },
  });

  const prettyHtml = await format(html, { parser: "html" });

  expect(prettyHtml).toMatchInlineSnapshot(`
    "<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />
        <title>Test</title>
        <meta name="description" content="I am a test" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Indie Tabletop Club" />
        <meta property="og:title" content="Test" />
        <meta property="og:description" content="I am a test" />
        <meta property="og:image" content="/image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Test" />
        <meta name="twitter:description" content="I am a test" />
        <meta name="twitter:image" content="/image.png" />
      </head>
      <body>
        <div id="root"></div>
        <script type="module">
          import RefreshRuntime from "/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <script type="module" src="/@vite/client"></script>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
    "
  `);
});
