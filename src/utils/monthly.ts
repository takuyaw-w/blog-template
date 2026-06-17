import {
  getBlogPosts,
  getPostMonthKey,
  getReadingTimeMinutes,
  sortPostsByDate,
  type BlogPostEntry,
} from "./blog";
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

export const getBlogMonthReadingTimeMinutes = (blogMonth: BlogMonth) =>
  blogMonth.posts.reduce((total, post) => total + getReadingTimeMinutes(post.body), 0);

export const getBlogMonthPopularTags = (blogMonth: BlogMonth, limit = 6) => {
  const tagCounts = new Map<string, number>();

  for (const post of blogMonth.posts) {
    for (const tag of post.data.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return [...tagCounts.entries()]
    .sort(([tagA, countA], [tagB, countB]) =>
      countB === countA ? tagA.localeCompare(tagB) : countB - countA,
    )
    .slice(0, limit);
};

const formatCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export const getBlogMonthSummary = (blogMonth: BlogMonth) => {
  const activity = [
    blogMonth.posts.length > 0
      ? formatCount(blogMonth.posts.length, "blog entry", "blog entries")
      : undefined,
    blogMonth.projects.length > 0
      ? formatCount(blogMonth.projects.length, "project update", "project updates")
      : undefined,
  ].filter((item) => item !== undefined);
  const tags = getBlogMonthPopularTags(blogMonth, 3).map(([tag]) => tag);

  if (activity.length === 0) {
    return "No public entries are linked to this month yet.";
  }

  if (tags.length === 0) {
    return `${activity.join(" / ")} logged this month.`;
  }

  return `${activity.join(" / ")} around ${tags.join(" / ")}.`;
};
