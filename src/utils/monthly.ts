import { getBlogPosts, getPostMonthKey, sortPostsByDate, type BlogPostEntry } from "./blog";
import { getProjects, type ProjectEntry } from "./projects";

export type BlogMonth = {
  year: string;
  month: string;
  label: string;
  path: string;
  posts: BlogPostEntry[];
  projects: ProjectEntry[];
};

export const getProjectMonthKey = (project: ProjectEntry) => {
  const idMatch = /^(?<year>\d{4})\/(?<month>\d{2})\//.exec(project.id);

  if (idMatch?.groups) {
    return `${idMatch.groups.year}/${idMatch.groups.month}`;
  }

  const periodMatch = /(?<year>\d{4})(?:[-/.年]\s*)(?<month>\d{1,2})/.exec(project.data.period);

  if (!periodMatch?.groups) {
    return undefined;
  }

  return `${periodMatch.groups.year}/${periodMatch.groups.month.padStart(2, "0")}`;
};

export const getBlogMonthPath = (year: string, month: string) => `/blog/${year}/${month}/`;

export const getBlogMonths = async () => {
  const posts = sortPostsByDate(await getBlogPosts());
  const projects = await getProjects();
  const monthsByKey = new Map<string, BlogMonth>();

  const getOrCreateMonth = (key: string) => {
    const [year, month] = key.split("/");
    const existing = monthsByKey.get(key);

    if (existing) {
      return existing;
    }

    const blogMonth = {
      year,
      month,
      label: `${year}-${month}`,
      path: getBlogMonthPath(year, month),
      posts: [],
      projects: [],
    };

    monthsByKey.set(key, blogMonth);

    return blogMonth;
  };

  for (const post of posts) {
    getOrCreateMonth(getPostMonthKey(post.data.pubDate)).posts.push(post);
  }

  for (const project of projects) {
    const key = getProjectMonthKey(project);

    if (key !== undefined) {
      getOrCreateMonth(key).projects.push(project);
    }
  }

  return [...monthsByKey.values()].sort((a, b) => b.label.localeCompare(a.label));
};

export const getBlogMonth = async (year: string, month: string) =>
  (await getBlogMonths()).find((blogMonth) => blogMonth.year === year && blogMonth.month === month);
