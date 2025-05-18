import matter from "gray-matter";
import { marked } from "marked";
import markedFootnote from "marked-footnote";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { basename } from "path";

type File = {
  filename: string;
  content: string;
};

marked.use(gfmHeadingId(), markedFootnote());

function filenameToSlug(filename: string): string {
  return basename(filename, ".md");
}

export async function transformFile(file: File) {
  const { content: md, data } = matter(file.content);
  const content = await marked.parse(md);
  const slug = filenameToSlug(file.filename);

  return {
    id: slug,
    data,
    content,
  };
}

export function filesToIndex(files: File[]) {
  return files
    .map(({ filename, content }) => {
      const { data: frontmatter } = matter(content);
      const slug = filenameToSlug(filename);

      return {
        id: slug,
        data: frontmatter,
      };
    })
    .sort((left, right) => {
      if (left.id > right.id) {
        return -1;
      }

      if (right.id > left.id) {
        return 1;
      }

      return 0;
    });
}
