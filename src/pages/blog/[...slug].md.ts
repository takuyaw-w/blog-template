import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getBlogPosts } from "../../utils/blog";

export async function getStaticPaths() {
  const posts = await getBlogPosts();

  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}

export async function GET({ props }) {
  const post = props;
  const filePaths = [
    post.filePath ? resolve(process.cwd(), post.filePath) : undefined,
    resolve(process.cwd(), "src/content/blog", post.id, "index.md"),
    resolve(process.cwd(), "src/content/blog", post.id, "index.mdx"),
    resolve(process.cwd(), "src/content/blog", `${post.id}.md`),
    resolve(process.cwd(), "src/content/blog", `${post.id}.mdx`),
  ].filter((filePath, index, paths) => filePath !== undefined && paths.indexOf(filePath) === index);
  let markdown = post.body;

  for (const filePath of filePaths) {
    try {
      markdown = await readFile(filePath, "utf-8");
      break;
    } catch {
      // The content cache can temporarily retain the old path after a file is moved.
    }
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
