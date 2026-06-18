import {
  countValues,
  filterBlogPostsByTaxonomy,
  getBlogPosts,
  getPageNumbers,
  getPostYear,
  getTotalPages,
} from "./blog";
import { getProjectYears, getProjects } from "./projects";

export type YearActivitySummary = {
  year: string;
  blogCount: number;
  projectCount: number;
  totalCount: number;
};

export const getYearActivitySummaries = async (): Promise<YearActivitySummary[]> => {
  const posts = await getBlogPosts();
  const projects = await getProjects();
  const blogCounts = new Map(countValues(posts.map((post) => getPostYear(post.data.pubDate))));
  const projectCounts = new Map(countValues(getProjectYears(projects)));
  const years = new Set([...blogCounts.keys(), ...projectCounts.keys()]);

  return [...years]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => {
      const blogCount = blogCounts.get(year) ?? 0;
      const projectCount = projectCounts.get(year) ?? 0;

      return {
        year,
        blogCount,
        projectCount,
        totalCount: blogCount + projectCount,
      };
    });
};

export const getYearActivityCounts = async () =>
  (await getYearActivitySummaries()).map(({ year, totalCount }) => [year, totalCount] as const);

export const getYearStaticPaths = async (paginated = false) => {
  const posts = await getBlogPosts();
  const values = (await getYearActivityCounts()).map(([value]) => value);

  if (!paginated) {
    return values.map((value) => ({
      params: { year: value },
      props: { value },
    }));
  }

  return values.flatMap((value) => {
    const totalPages = getTotalPages(filterBlogPostsByTaxonomy(posts, "year", value).length);

    return getPageNumbers(totalPages)
      .filter((page) => page > 1)
      .map((page) => ({
        params: { year: value, page: String(page) },
        props: { value, page },
      }));
  });
};
