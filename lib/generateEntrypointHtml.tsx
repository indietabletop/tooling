import { renderToString } from "react-dom/server";
import type { ManifestChunk } from "vite";

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
 * Adds reference to source files, Vite client, and fast refresh for React.
 *
 * @see https://vite.dev/guide/backend-integration.html
 */
function DevMode(props: { path: string }) {
  return (
    <>
      <script type="module">
        {`import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$ = () => {};window.$RefreshSig$ = () => (type) => type;window.__vite_plugin_react_preamble_installed__ = true;`}
      </script>
      <script type="module" src="/@vite/client" />
      <script type="module" src={props.path} />
    </>
  );
}

/**
 * Uses Vite's manifest chunk to reference production files with hashed
 * filenames.
 */
function ProdEntrypoint(props: { manifestChunk: ManifestChunk }) {
  const { manifestChunk } = props;

  return (
    <>
      <script type="module" src={`/${manifestChunk.file}`} />
      {manifestChunk.css?.map((file) => {
        return <link key={file} rel="stylesheet" href={`/${file}`} />;
      })}
    </>
  );
}

/**
 * Generates app entrypoint.
 *
 * Can use used for both dev and prod (see entrypoint), set custom social tags,
 * add prefetched data, and more...
 */

export function generateEntrypointHtml(props: {
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
  favicon: { href: string; type: string };

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
  entrypoint:
    | {
        type: "dev";
        path: string;
      }
    | {
        type: "prod";
        manifestChunk: ManifestChunk;
      };
}) {
  const isDevMode = props.entrypoint.type === "dev";
  const title = isDevMode ? `[DEV] ${props.title}` : props.title;
  const social = {
    title: props.title,
    description: props.description,
    ...props.social,
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
        <meta name="description" content={props.description} />

        {props.favicon && <link rel="icon" {...props.favicon} />}

        <link rel="manifest" href="/manifest.json" />

        {/* Analytics */}
        {props.fathomSiteId && (
          <script
            src="https://cdn.usefathom.com/script.js"
            data-site={props.fathomSiteId}
            data-spa="auto"
            defer
          />
        )}

        {/* Fonts & Styles */}
        {props.typekitProjectId && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${props.typekitProjectId}.css`}
          />
        )}

        {props.bodyColor && (
          <style>{`body { background-color: ${props.bodyColor}; }`}</style>
        )}

        {/* Social Sharing */}
        <SocialTags {...social} />

        {/* Production Entrypoint */}
        {props.entrypoint.type === "prod" && (
          <ProdEntrypoint manifestChunk={props.entrypoint.manifestChunk} />
        )}
      </head>

      <body>
        <div id="root" />

        {props.entrypoint.type === "dev" && (
          <DevMode path={props.entrypoint.path} />
        )}

        {!!props.prefetched && (
          <script>{`window.PREFETCHED = ${JSON.stringify(
            props.prefetched,
          )}`}</script>
        )}
      </body>
    </html>,
  );

  return `<!DOCTYPE html>${html}`;
}
