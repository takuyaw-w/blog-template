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
  const filePath = post.filePath ? resolve(process.cwd(), post.filePath) : undefined;
  const markdown = filePath ? await readFile(filePath, "utf-8") : post.body;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
