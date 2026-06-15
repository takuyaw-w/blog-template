import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { renderOgImage } from "../../og/image";
import { getBlogPosts } from "../../utils/blog";

type BlogPost = CollectionEntry<"blog">;

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getBlogPosts();

  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
};

export const GET: APIRoute<{ post: BlogPost }> = async ({ props }) =>
  new Response(
    await renderOgImage({
      title: props.post.data.title,
      description: props.post.data.description,
      tags: props.post.data.tags,
    }),
    {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
