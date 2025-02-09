import { renderToString } from "react-dom/server";

export function generateHtml(props: {
  title: string;
  description: string;
  bodyColor?: string;
  fathomSiteId?: string;
  typekitProjectId?: string;
  prefetched?: unknown;
  socialImage?: string;
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
        <link rel="icon" type="image/png" href="/favicon.png" />
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
      </head>

      <body>
        <div id="root" />

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
