import { html } from "common-tags";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Manifest, ManifestChunk } from "vite";

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(path, "utf-8")) as T;
}

export async function readEntrypointManifest(path: string) {
  const { "src/main.tsx": chunk } = await readJson<Manifest>(path);
  return chunk;
}

/**
 * Generates production HTML file.
 *
 * Note that this function assumes that Vite menifest file exists, so that it
 * can access hashed filenames and include them in the output.
 *
 * If manifest is missing, it will error-out.
 */
export function generateProdHtml(props: {
  openGraph?: OpenGraphMetadata;
  prefetched?: unknown;
  entrypointManifest: ManifestChunk;
}) {
  const { entrypointManifest: chunk } = props;

  const headDeps = [`<script type="module" src="/${chunk.file}"></script>`];

  if (chunk.css) {
    const stylesheets = chunk.css.map(
      (file) => `<link rel="stylesheet" href="/${file}" />`,
    );
    headDeps.push(...stylesheets);
  }

  return generateHtmlFile({ ...props, headDeps });
}

/**
 * Generates development HTML file.
 *
 * This includes references to source files, vite client, and fast refresh.
 *
 * @see https://vite.dev/guide/backend-integration.html
 */
export function generateDevHtml(props?: {
  openGraph?: OpenGraphMetadata;
  prefetched?: unknown;
}) {
  return generateHtmlFile({
    ...props,
    titlePrefix: "[DEV]",
    bodyDeps: [
      `<script type="module">
        import RefreshRuntime from "/@react-refresh";
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
        window.__vite_plugin_react_preamble_installed__ = true;
      </script>`,
      `<script type="module" src="/@vite/client"></script>`,
      `<script type="module" src="/src/main.tsx"></script>`,
    ],
  });
}

function socialSharingTags(metadata: Record<string, string>): string[] {
  const entries = Object.entries(metadata).map(([key, value]) => {
    return { key, value };
  });

  return [
    // OpenGraph meta tags -- used by most apps
    ...entries
      .concat([
        { key: "type", value: "website" },
        { key: "site_name", value: "Indie Tabletop Club" },
      ])
      .map(({ key, value }) => {
        return `<meta property="og:${key}" content="${value}" />`;
      }),

    // Twitter meta tags -- used by some apps
    ...entries
      // This tag MUST be defined for Discord to preview links nicely
      .concat([{ key: "card", value: "summary_large_image" }])
      .map(({ key, value }) => {
        return `<meta name="twitter:${key}" content="${value}" />`;
      }),
  ];
}

type OpenGraphMetadata = {
  title?: string;
  description?: string;
  image?: string;
};

function generateHtmlFile(props?: {
  openGraph?: OpenGraphMetadata;
  bodyDeps?: string[];
  headDeps?: string[];
  titlePrefix?: string;

  /**
   * Data to serialize into the HTML response, so that they don't have to be
   * fetched again on the client.
   */
  prefetched?: unknown;
}) {
  const prefix = props?.titlePrefix ? `${props.titlePrefix} ` : "";
  const title = prefix + "Eternøl App";
  const description = "Build and share your Eternøl armies. Free to use.";

  return generateHtmlFile_({
    title,
    description,
    fathomId: "GOREZTCZ",
  });

  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <!-- Config -->
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />

        <!-- General -->
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />

        <!-- Analytics -->
        <script
          src="https://cdn.usefathom.com/script.js"
          data-site="GOREZTCZ"
          data-spa="auto"
          defer
        ></script>

        <!-- Fonts & Styles -->
        <link rel="stylesheet" href="https://use.typekit.net/ccw0oro.css" />
        <style>
          body {
            background-color: #98d9c4;
          }
        </style>

        <!-- Social Sharing -->
        ${socialSharingTags({
          // Defaults
          title: title,
          description: description,
          image: "/og_banner.png",

          // Overrides
          ...props?.openGraph,
        })}

        <!-- Dependencies -->
        ${props?.headDeps}
      </head>

      <body>
        <div id="root"></div>
        ${props?.bodyDeps}
        ${props?.prefetched &&
        `<script>window.PREFETCHED = ${JSON.stringify(
          props.prefetched,
        )}</script>`}
      </body>
    </html>
  `;
}

function generateHtmlFile_(props: {
  openGraph?: OpenGraphMetadata;
  bodyDeps?: string[];
  headDeps?: string[];
  title: string;
  description: string;
  fathomId: string;

  /**
   * Default favicon is `/favicon.png`
   */
  favicon?: { type: string; href: string };

  /**
   * Data to serialize into the HTML response, so that they don't have to be
   * fetched again on the client.
   */
  prefetched?: unknown;
}) {
  const {
    title,
    description,
    fathomId,
    favicon = { type: "image/png", href: "/favicon.png" },
  } = props;

  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <!-- Config -->
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />

        <!-- General -->
        <title>${title}</title>
        <meta name="description" content="${description}" />
        <link rel="icon" type="${favicon.type}" href="${favicon.href}" />
        <link rel="manifest" href="/manifest.json" />

        <!-- Analytics -->
        <script
          src="https://cdn.usefathom.com/script.js"
          data-site="${fathomId}"
          data-spa="auto"
          defer
        ></script>

        <!-- Fonts & Styles -->
        <link rel="stylesheet" href="https://use.typekit.net/ccw0oro.css" />
        <style>
          body {
            background-color: #98d9c4;
          }
        </style>

        <!-- Social Sharing -->
        ${socialSharingTags({
          // Defaults
          title: title,
          description: description,
          image: "/og_banner.png",

          // Overrides
          ...props.openGraph,
        })}

        <!-- Dependencies -->
        ${props.headDeps}
      </head>

      <body>
        <div id="root"></div>
        ${props.bodyDeps}
        ${props.prefetched &&
        `<script>window.PREFETCHED = ${JSON.stringify(
          props.prefetched,
        )}</script>`}
      </body>
    </html>
  `;
}

export async function generateEntrypoint(props: {
  openGraph?: OpenGraphMetadata;
  prefetched?: unknown;
  isProd: boolean;
}) {
  if (props.isProd) {
    const manifestPath = resolve("./dist/.vite/manifest.json");
    const entrypointManifest = await readEntrypointManifest(manifestPath);
    return generateProdHtml({ ...props, entrypointManifest });
  }

  return generateDevHtml(props);
}
