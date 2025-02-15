import { renderToString } from "react-dom/server";
import type { ManifestFile } from "./entrypointPlugin.js";

type SocialTag = {
  key: string;
  value: string;
};

function SocialTags(props: {
  title: string;
  description: string;
  image: string;
}) {
  const entries = Object.entries(props).map(([key, value]) => {
    return { key, value };
  });

  // OpenGraph meta tags -- used by most apps
  const openGraph: SocialTag[] = [
    { key: "type", value: "website" },
    { key: "site_name", value: "Indie Tabletop Club" },
    ...entries,
  ];

  // Twitter meta tags -- used by some apps
  const twitterTags: SocialTag[] = [
    // This tag MUST be defined for Discord to preview links nicely
    { key: "card", value: "summary_large_image" },
    ...entries,
  ];

  return (
    <>
      {openGraph.map((tag) => {
        return (
          <meta
            key={tag.key + tag.value}
            property={`og:${tag.key}`}
            content={tag.value}
          />
        );
      })}

      {twitterTags.map((tag) => {
        return (
          <meta
            key={tag.key + tag.value}
            name={`twitter:${tag.key}`}
            content={tag.value}
          />
        );
      })}
    </>
  );
}

/**
 * Adds reference to Vite client and React fast refresh preamble.
 *
 * @see https://vite.dev/guide/backend-integration.html
 */
function DevMode() {
  return (
    <>
      <script type="module">
        {`import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$ = () => {};window.$RefreshSig$ = () => (type) => type;window.__vite_plugin_react_preamble_installed__ = true;`}
      </script>
      <script type="module" src="/@vite/client" />
    </>
  );
}

/**
 * Uses Vite's manifest chunk to reference production files with hashed
 * filenames.
 */
function Entrypoint(props: { files: ManifestFile[] }) {
  return (
    <>
      {props.files.map(({ fileName, type }) => {
        switch (type) {
          case "js": {
            return <script key={fileName} type="module" src={`/${fileName}`} />;
          }

          case "css": {
            return (
              <link key={fileName} rel="stylesheet" href={`/${fileName}`} />
            );
          }

          default: {
            return null;
          }
        }
      })}
    </>
  );
}

export type EntrypointOptions = {
  /**
   * Sets document title, as well social sharing titles.
   *
   * Note that when entrypoint is set to `dev`, the document title will include
   * a `[DEV]` marker before the actual supplied title.
   */
  title: string;
  /**
   * Sets document description, as well as social sharing descriptions.
   */
  description: string;
  /**
   * Config to be used for social sharing.
   */
  social: {
    /**
     * Social sharing title. Defaults to root title.
     */
    title?: string;
    /**
     * Social sharing description. Defaults to root description.
     */
    description?: string;
    /**
     * Path to a social sharing image. Will appear as a wide graphic on supported
     * platforms.
     */
    image: string;
  };
  /**
   * If supplied, sets initial body color. This is useful to set the 'mood' when
   * the JS bundle is initially loading.
   */
  bodyColor?: string;
  /**
   * If supplied, adds Fathom Analytics code, and configures it for PWA usage.
   */
  fathomSiteId?: string;
  /**
   * If supplied, adds Adobe Fonts code (previously Typekit).
   */
  typekitProjectId?: string;
  /**
   * Sets favicon href and type.
   *
   * Ideally, use 64x64 PNGs, with a circular cutout for the actual icon.
   */
  favicon: {
    href: string;
    type: string;
  };
  /**
   * Any data that might already be available on the server can be provided
   * to the client throught this property.
   *
   * You should name-space any data provided. E.g. use `{ sharedArmy: data }`
   * instead of just dumping the army data in.
   *
   * This makes it easier to differentiate what data was provided on the client.
   */
  prefetched?: unknown;
  /**
   * The app's entrypoint.
   *
   * In dev mode, should be a reference to the development-time index file. In
   * prod mode, the main chunk from Vite's manifest should be passed.
   *
   */
  files: ManifestFile[];

  dev: boolean;
};

/**
 * Generates app entrypoint.
 *
 * Can use used for both dev and prod (see entrypoint), set custom social tags,
 * add prefetched data, and more...
 */
export function generateEntrypointHtml(opts: EntrypointOptions) {
  const title = opts.dev ? `[DEV] ${opts.title}` : opts.title;
  const social = {
    title: opts.title,
    description: opts.description,
    ...opts.social,
  };

  const html = renderToString(
    <html lang="en">
      <head>
        {/* Config */}
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, interactive-widget=resizes-content, maximum-scale=1"
        />

        {/* General */}
        <title>{title}</title>
        <meta name="description" content={opts.description} />

        {opts.favicon && <link rel="icon" {...opts.favicon} />}

        <link rel="manifest" href="/manifest.json" />

        {/* Analytics */}
        {opts.fathomSiteId && (
          <script
            src="https://cdn.usefathom.com/script.js"
            data-site={opts.fathomSiteId}
            data-spa="auto"
            defer
          />
        )}

        {/* Fonts & Styles */}
        {opts.typekitProjectId && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${opts.typekitProjectId}.css`}
          />
        )}

        {opts.bodyColor && (
          <style>{`body { background-color: ${opts.bodyColor}; }`}</style>
        )}

        {/* Social Sharing */}
        <SocialTags {...social} />

        {/* Production Entrypoint */}
        {!opts.dev && <Entrypoint files={opts.files} />}
      </head>

      <body>
        <div id="root" />

        {/* Dev Entrypoint */}
        {opts.dev && (
          <>
            <DevMode />
            <Entrypoint files={opts.files} />
          </>
        )}

        {/* Prefetched Data */}
        {!!opts.prefetched && (
          <script>{`window.PREFETCHED = ${JSON.stringify(
            opts.prefetched,
          )}`}</script>
        )}
      </body>
    </html>,
  );

  return `<!DOCTYPE html>${html}`;
}
