import type { OutputBundle } from "rollup";
import type { Plugin } from "vite";

export type ManifestFile = {
  fileName: string;
  type: "script" | "stylesheet";
};

function toManifest(bundle: OutputBundle): ManifestFile[] {
  const entrypoint = Object.values(bundle)
    .filter((chunk) => chunk.type === "chunk")
    .find((chunk) => chunk.isEntry);

  if (!entrypoint) {
    throw new Error(`No entrypoint found.`);
  }

  const css = Array.from(entrypoint.viteMetadata?.importedCss ?? []);
  return [
    { fileName: entrypoint.fileName, type: "script" },
    ...css.map((cssFileName): ManifestFile => {
      return { fileName: cssFileName, type: "stylesheet" };
    }),
  ];
}

export type RenderFn = (props: {
  dev: boolean;
  files: ManifestFile[];
}) => string;

export function entrypointPlugin(options: {
  inputFile: string;
  render: RenderFn;
}): Plugin {
  return {
    name: "vite-entrypoint-plugin",

    configureServer(server) {
      // This will be added to the end of the middleware chain
      return () => {
        server.middlewares.use((_req, res) => {
          const entrypoint: ManifestFile = {
            fileName: options.inputFile,
            type: "script",
          };
          res.setHeader("Content-Type", "text/html");
          res.end(options.render({ dev: true, files: [entrypoint] }));
        });
      };
    },

    generateBundle(_, bundle) {
      const manifest = toManifest(bundle);

      this.emitFile({
        fileName: "entrypoint.json",
        type: "asset",
        source: JSON.stringify(manifest),
      });
    },
  };
}
