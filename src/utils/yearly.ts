import {
  countValues,
  filterBlogPostsByTaxonomy,
  getBlogPosts,
  getPageNumbers,
  getPostYear,
  getTotalPages,
} from "./blog";
import { getProjectYears, getProjects } from "./projects";

export const getYearActivityCounts = async () => {
  const posts = await getBlogPosts();
  const projects = await getProjects();

  return countValues([
    ...posts.map((post) => getPostYear(post.data.pubDate)),
    ...getProjectYears(projects),
  ]).sort(([a], [b]) => Number(b) - Number(a));
};

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
