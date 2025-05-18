import glob from "fast-glob";
import { readFile } from "fs/promises";
import { dirname, join, relative, resolve } from "path";
import sirv from "sirv";
import type { Plugin } from "vite";
import { filesToIndex, transformFile } from "./markdown.js";

export function markdownDocsPlugin(options: { contentDir: string }): Plugin {
  const { contentDir } = options;

  async function generateDirectoryIndex(dirPath: string) {
    const files = await glob(["**/*.md", "!**/*.draft.md"], {
      cwd: dirPath,
      absolute: true,
    });

    const entries = await Promise.all(
      files.map(async (filename) => {
        const content = await readFile(filename, "utf-8");
        return { filename, content };
      }),
    );

    return filesToIndex(entries);
  }

  return {
    name: "vite-markdown-docs",

    configureServer(server) {
      // Serve static files directly from content directory
      server.middlewares.use(`/${contentDir}`, sirv(contentDir));

      // Handle markdown to JSON transformation and directory indexes
      server.middlewares.use((req, res, next) => {
        // We only want to handle JSON files within contentDir
        if (
          !req.url ||
          !req.url.startsWith(`/${contentDir}`) ||
          !req.url.endsWith(".json")
        ) {
          next();
          return;
        }

        const relativePath = req.url.replace("/", "");

        if (relativePath.endsWith("index.json")) {
          generateDirectoryIndex(resolve(dirname(relativePath)))
            .then((index) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(index));
            })
            .catch(next);
        } else {
          // Handle regular markdown file request
          const mdPath = relativePath.replace(".json", ".md");

          readFile(mdPath, "utf-8")
            .then((content) => transformFile({ filename: mdPath, content }))
            .then((transformed) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(transformed, null, 2));
            })
            .catch(next);
        }
      });
    },

    async generateBundle() {
      // Process markdown files
      const files = await glob("**/*.md", {
        cwd: contentDir,
        absolute: true,
      });

      // Transform markdown files to JSON
      for (const filename of files) {
        const content = await readFile(filename, "utf-8");
        const transformed = await transformFile({ filename, content });
        const outPath = relative(contentDir, filename).replace(".md", ".json");

        this.emitFile({
          type: "asset",
          fileName: join(contentDir, outPath),
          source: JSON.stringify(transformed, null, 2),
        });
      }

      // Generate directory indexes
      const dirs = new Set(
        files.map((file) => dirname(relative(contentDir, file))),
      );

      for (const dir of dirs) {
        const dirPath = join(contentDir, dir);
        const index = await generateDirectoryIndex(dirPath);

        this.emitFile({
          type: "asset",
          fileName: join(contentDir, dir, "index.json"),
          source: JSON.stringify(index, null, 2),
        });
      }

      // Copy all non-markdown files
      const assets = await glob("**/*", {
        cwd: contentDir,
        absolute: true,
        ignore: ["**/*.md"],
      });

      for (const asset of assets) {
        const relativePath = relative(contentDir, asset);
        const content = await readFile(asset);

        this.emitFile({
          type: "asset",
          fileName: join(contentDir, relativePath),
          source: content,
        });
      }
    },
  };
}
