import { getCollection, type CollectionEntry } from "astro:content";
import { countValues, toTaxonomySlug } from "./blog";

export type ProjectEntry = CollectionEntry<"projects">;
export type ProjectTaxonomyType = "category" | "tag";

export const sortProjectsByOrder = (projects: ProjectEntry[]) =>
  [...projects].sort((a, b) => a.data.order - b.data.order);

export const getProjects = async () => sortProjectsByOrder(await getCollection("projects"));

export const getProjectYear = (project: ProjectEntry) => {
  const idMatch = /^(?<year>\d{4})(?:\/|$)/.exec(project.id);

  if (idMatch?.groups) {
    return idMatch.groups.year;
  }

  return /(?<year>\d{4})/.exec(project.data.period)?.groups?.year;
};

export const getProjectYears = (projects: ProjectEntry[]) =>
  projects.map(getProjectYear).filter((year) => year !== undefined);

export const filterProjectsByYear = (projects: ProjectEntry[], year: string) =>
  projects.filter((project) => getProjectYear(project) === year);

export const getProjectsByYear = async (year: string) =>
  sortProjectsByOrder(filterProjectsByYear(await getCollection("projects"), year));

export const getProjectPath = (id: string) => `/projects/${id}/`;

export const getProjectCategoryPath = (category: string) =>
  `/projects/categories/${toTaxonomySlug(category)}/`;

export const getProjectTagPath = (tag: string) => `/projects/tags/${toTaxonomySlug(tag)}/`;

export const getProjectTaxonomyIndexPath = (type: ProjectTaxonomyType) =>
  type === "category" ? "/projects/categories/" : "/projects/tags/";

export const getProjectTaxonomyBasePath = (type: ProjectTaxonomyType, value: string) =>
  `${getProjectTaxonomyIndexPath(type)}${toTaxonomySlug(value)}`;

export const getProjectTaxonomyValues = (projects: ProjectEntry[], type: ProjectTaxonomyType) =>
  countValues(
    type === "category"
      ? projects.map((project) => project.data.category)
      : projects.flatMap((project) => project.data.tags),
  );

export const filterProjectsByTaxonomy = (
  projects: ProjectEntry[],
  type: ProjectTaxonomyType,
  value: string,
) =>
  projects.filter((project) =>
    type === "category" ? project.data.category === value : project.data.tags.includes(value),
  );

export const getProjectTaxonomyStaticPaths = async (type: ProjectTaxonomyType) => {
  const projects = await getCollection("projects");
  const values = getProjectTaxonomyValues(projects, type).map(([value]) => value);

  return values.map((value) => ({
    params: { [type]: value },
    props: { value },
  }));
};

export const getProjectTaxonomyPage = async (type: ProjectTaxonomyType, value: string) =>
  sortProjectsByOrder(filterProjectsByTaxonomy(await getCollection("projects"), type, value));

export const getProjectTaxonomyCopy = (type: ProjectTaxonomyType, value: string, count: number) => {
  if (type === "category") {
    return {
      eyebrow: "Project Category",
      lead: `${count} project${count === 1 ? "" : "s"} in this category.`,
      emptyTitle: `No projects in ${value} yet.`,
      emptyDescription: "Published projects for this category will appear here.",
    };
  }

  return {
    eyebrow: "Project Tag",
    lead: `${count} project${count === 1 ? "" : "s"} tagged with this label.`,
    emptyTitle: `No projects tagged ${value} yet.`,
    emptyDescription: "Published projects with this tag will appear here.",
  };
};
