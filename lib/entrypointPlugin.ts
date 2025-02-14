import type { OutputBundle } from "rollup";
import type { Plugin } from "vite";

export type ManifestFile = {
  file: string;
  css: string[];
};

function toManifest(bundle: OutputBundle) {
  return Object.fromEntries(
    Object.values(bundle)
      .filter((chunk) => chunk.type === "chunk")
      .map((chunk) => {
        const css = Array.from(chunk.viteMetadata?.importedCss ?? []);
        return [chunk.name, { file: chunk.fileName, css }];
      }),
  );
}

export type RenderFn = (props: { dev: boolean; file: ManifestFile }) => string;

export function entrypointPlugin(options: {
  inputFile: string;
  render: RenderFn;
}): Plugin {
  return {
    name: "vite-entrypoint-plugin",

    transformIndexHtml: {
      order: "pre",
      handler(_, bar) {
        if (bar.bundle) {
          const manifest = toManifest(bar.bundle);
          return options.render({ dev: false, file: manifest.index });
        }

        const devChunk = { file: options.inputFile, css: [] };
        return options.render({ dev: true, file: devChunk });
      },
    },

    generateBundle(_, bundle) {
      const manifest = toManifest(bundle);

      this.emitFile({
        fileName: "entrypoint.json",
        type: "asset",
        source: JSON.stringify(manifest.index),
      });
    },
  };
}
