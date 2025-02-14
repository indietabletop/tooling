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

function filenameToId(filename: string): string {
  return basename(filename, ".md");
}

export async function transformFile(file: File) {
  const { content: md, data } = matter(file.content);
  const content = await marked.parse(md);

  return {
    id: filenameToId(file.filename),
    data,
    content,
  };
}

export function filesToIndex(files: File[]) {
  return files.map(({ filename, content }) => {
    const { data: frontmatter } = matter(content);

    return {
      id: filenameToId(filename),
      data: frontmatter,
    };
  });
}
