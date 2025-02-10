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

function ProdEntrypoint(props: { manifestChunk: ManifestChunk }) {
  const { manifestChunk } = props;

  return (
    <>
      <script type="module" src={`/${manifestChunk.file}`} />
      {manifestChunk.css?.map((file) => {
        return <link rel="stylesheet" href={`/${file}`} />;
      })}
    </>
  );
}

export function generateEntrypointHtml(props: {
  title: string;
  description: string;
  socialImage: string;
  bodyColor?: string;
  fathomSiteId?: string;
  typekitProjectId?: string;
  favicon: { href: string; type: string };
  prefetched?: unknown;
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
        <title>{props.title}</title>
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
        <SocialTags
          title={props.title}
          description={props.description}
          image={props.socialImage}
        />

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
