import { vanillaExtractPlugin as vanilla } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import type { ConfigEnv, PluginOption, UserConfig } from "vite";

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
   * Determines the input file when runnig `vite build`.
   */
  buildInput?: string;

  /**
   * Determines the input file when runnig `vite` (i.e. the dev server).
   */
  serveInput?: string
}) {
  const {
    additionalPlugins = [],
    buildInput ="/index.html",
    serveInput ="/index.html",
    resolveAlias,
  } = props;

  return function configureVite({ command }: ConfigEnv): UserConfig {
    return {
      define: {
        // These vars are supplied by Netlify
        BRANCH: JSON.stringify(process.env.BRANCH),
        COMMIT_SHORTCODE: JSON.stringify(process.env.COMMIT_REF?.slice(0, 7)),
      },

      plugins: [react(), vanilla(), ...additionalPlugins],

      esbuild: {
        target: "es2022",
      },

      server: {
        port: props.port,
      },

      resolve: {
        alias: resolveAlias ? { "@": resolveAlias } : undefined,
      },

      build: {
        sourcemap: true,
        manifest: true,

        rollupOptions: {
          input:
             command === "build"
              ? buildInput
              : serveInput,
        },
      },
    };
  };
}
