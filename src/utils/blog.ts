import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPostEntry = CollectionEntry<"blog">;
export const POSTS_PER_PAGE = 10;

export const isPublicBlogPost = (post: BlogPostEntry) => !(import.meta.env.PROD && post.data.draft);

export const getBlogPosts = async () => (await getCollection("blog")).filter(isPublicBlogPost);

export const sortPostsByDate = (posts: BlogPostEntry[]) =>
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const postDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  calendar: "iso8601",
  numberingSystem: "latn",
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const formatPostDate = (date: Date) => {
  const parts = postDateFormatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
};

export const getPostYear = (date: Date) =>
  postDateFormatter.formatToParts(date).find((part) => part.type === "year")?.value ?? "";

export const getTotalPages = (itemCount: number, pageSize = POSTS_PER_PAGE) =>
  Math.max(1, Math.ceil(itemCount / pageSize));

export const getPageItems = <T>(items: T[], page: number, pageSize = POSTS_PER_PAGE) =>
  items.slice((page - 1) * pageSize, page * pageSize);

export const getPageNumbers = (totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1);

export const toTaxonomySlug = (value: string) => encodeURIComponent(value);

export const fromTaxonomySlug = (value: string) => decodeURIComponent(value);

export const countValues = (values: string[]) => {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
};

export const getReadingTimeMinutes = (body: string) => {
  const readableText = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_\-[\]()+~|]/g, " ");
  const cjkCharacterCount =
    readableText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0;
  const latinWordCount = readableText.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = cjkCharacterCount / 500 + latinWordCount / 200;

  return Math.max(1, Math.ceil(minutes));
};

export const getRelatedPosts = (post: BlogPostEntry, posts: BlogPostEntry[], limit = 3) => {
  const currentTags = new Set(post.data.tags);

  return posts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      post: candidate,
      sharedTagCount: candidate.data.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter(({ sharedTagCount }) => sharedTagCount > 0)
    .sort((a, b) => {
      if (b.sharedTagCount !== a.sharedTagCount) {
        return b.sharedTagCount - a.sharedTagCount;
      }

      return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
    })
    .slice(0, limit)
    .map(({ post }) => post);
};
