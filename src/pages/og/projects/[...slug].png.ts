import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { renderOgImage } from "../../../og/image";
import { getProjects } from "../../../utils/projects";

type Project = CollectionEntry<"projects">;

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getProjects();

  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
};

export const GET: APIRoute<{ project: Project }> = async ({ props }) =>
  new Response(
    await renderOgImage({
      title: props.project.data.title,
      description: props.project.data.description,
      tags: props.project.data.tags,
      kind: "project",
      meta: `${props.project.data.category} / ${props.project.data.status} / ${props.project.data.period}`,
    }),
    {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
