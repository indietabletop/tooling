import { vanillaExtractPlugin as vanillaEsbuild } from "@vanilla-extract/esbuild-plugin";
import { vanillaExtractPlugin as vanilla } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import type { PluginOption, UserConfig } from "vite";
import { entrypointPlugin, type RenderFn } from "./entrypointPlugin.js";
import { markdownDocsPlugin } from "./markdownDocsPlugin.js";

export function defineNetlifyConfig(props: {
  /**
   * The server port number.
   */
  port: number;

  /**
   * By default, react and vanilla extract are always configured.
   */
  additionalPlugins?: PluginOption[];

  /**
   * Can be used to import from `@` at the path specified here. Has to match
   * tsconfig > compilerOptions > paths.
   *
   * Do not use this, just use relative imports.
   *
   * @deprecated
   */
  resolveAlias?: string;

  /**
   * A directory with source markdown docs files.
   *
   * If supplied, markdown files in the supplied directory will be transformed
   * into JSON files.
   */
  docsDir?: string;

  /**
   * Reference to the main app entrypoint
   */
  inputFile: string;

  /**
   * Functions that should return a string representing the HTML entrypoint.
   */
  renderEntrypoint: RenderFn;
}): UserConfig {
  const {
    additionalPlugins = [],
    docsDir,
    inputFile,
    renderEntrypoint: render,
    resolveAlias,
  } = props;

  return {
    optimizeDeps: {
      // Makes sure that .css.ts files can be used in development alongside
      // Vite's optimizeDeps setting, which otherwise doesn't work. See:
      // https://github.com/vanilla-extract-css/vanilla-extract/discussions/1051
      esbuildOptions: {
        plugins: [vanillaEsbuild({ runtime: true })],
      },
    },

    define: {
      // These vars are supplied by Netlify
      BRANCH: JSON.stringify(process.env.BRANCH),
      COMMIT_SHORTCODE: JSON.stringify(process.env.COMMIT_REF?.slice(0, 7)),
    },

    plugins: [
      entrypointPlugin({ inputFile, render }),
      react(),
      vanilla(),
      docsDir && markdownDocsPlugin({ contentDir: docsDir }),
      ...additionalPlugins,
    ],

    server: {
      port: props.port,
    },

    resolve: {
      alias: resolveAlias ? { "@": resolveAlias } : undefined,
    },

    build: {
      sourcemap: true,
      rollupOptions: { input: inputFile },
    },
  };
}
