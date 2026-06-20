import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPostEntry = CollectionEntry<"blog">;
export const POSTS_PER_PAGE = 10;
export type BlogTaxonomyType = "category" | "tag" | "year";

export const isPublicBlogPost = (post: BlogPostEntry) => !(import.meta.env.PROD && post.data.draft);

export const getBlogPosts = async () => (await getCollection("blog")).filter(isPublicBlogPost);

export const sortPostsByDate = (posts: BlogPostEntry[]) =>
  [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

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

export const getPostMonth = (date: Date) =>
  postDateFormatter.formatToParts(date).find((part) => part.type === "month")?.value ?? "";

export const getPostMonthKey = (date: Date) => `${getPostYear(date)}/${getPostMonth(date)}`;

export const getTotalPages = (itemCount: number, pageSize = POSTS_PER_PAGE) =>
  Math.max(1, Math.ceil(itemCount / pageSize));

export const getPageItems = <T>(items: T[], page: number, pageSize = POSTS_PER_PAGE) =>
  items.slice((page - 1) * pageSize, page * pageSize);

export const getPageNumbers = (totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1);

export const toTaxonomySlug = (value: string) => encodeURIComponent(value);

export const fromTaxonomySlug = (value: string) => decodeURIComponent(value);

export const getBlogListingPage = async (page: number) => {
  const posts = sortPostsByDate(await getBlogPosts());

  return {
    posts,
    totalPages: getTotalPages(posts.length),
    currentPosts: getPageItems(posts, page),
  };
};

export const getBlogListingStaticPaths = async () => {
  const posts = await getBlogPosts();
  const totalPages = getTotalPages(posts.length);

  return getPageNumbers(totalPages)
    .filter((page) => page > 1)
    .map((page) => ({
      params: { page: String(page) },
      props: { page },
    }));
};

export const getBlogTaxonomyValue = (post: BlogPostEntry, type: BlogTaxonomyType) => {
  if (type === "category") {
    return post.data.category;
  }

  if (type === "year") {
    return getPostYear(post.data.pubDate);
  }

  return post.data.tags;
};

export const getBlogTaxonomyValues = (posts: BlogPostEntry[], type: BlogTaxonomyType) => {
  const values =
    type === "tag"
      ? posts.flatMap((post) => post.data.tags)
      : posts.map((post) => getBlogTaxonomyValue(post, type) as string);

  return [...new Set(values)];
};

export const filterBlogPostsByTaxonomy = (
  posts: BlogPostEntry[],
  type: BlogTaxonomyType,
  value: string,
) =>
  posts.filter((post) => {
    const taxonomyValue = getBlogTaxonomyValue(post, type);

    return Array.isArray(taxonomyValue) ? taxonomyValue.includes(value) : taxonomyValue === value;
  });

export const getBlogTaxonomyIndexPath = (type: BlogTaxonomyType) =>
  type === "category" ? "/categories/" : type === "tag" ? "/tags/" : "/years/";

export const getBlogTaxonomyBasePath = (type: BlogTaxonomyType, value: string) => {
  if (type === "year") {
    return `/years/${value}`;
  }

  return `${getBlogTaxonomyIndexPath(type)}${toTaxonomySlug(value)}`;
};

export const getBlogTaxonomyCopy = (type: BlogTaxonomyType, value: string) => {
  if (type === "category") {
    return {
      emptyTitle: `No blog posts in ${value} yet.`,
      emptyDescription: "Published blog entries for this category will appear here.",
    };
  }

  if (type === "tag") {
    return {
      emptyTitle: `No blog posts tagged ${value} yet.`,
      emptyDescription: "Published blog entries with this tag will appear here.",
    };
  }

  return {
    emptyTitle: `No blog posts from ${value} yet.`,
    emptyDescription: "Published blog entries from this year will appear here.",
  };
};

export const getBlogTaxonomyPage = async (type: BlogTaxonomyType, value: string, page: number) => {
  const posts = sortPostsByDate(filterBlogPostsByTaxonomy(await getBlogPosts(), type, value));

  return {
    posts,
    totalPages: getTotalPages(posts.length),
    currentPosts: getPageItems(posts, page),
  };
};

export const getBlogTaxonomyStaticPaths = async (type: BlogTaxonomyType, paginated = false) => {
  const posts = await getBlogPosts();
  const values = getBlogTaxonomyValues(posts, type);

  if (!paginated) {
    return values.map((value) => ({
      params: { [type]: value },
      props: { value },
    }));
  }

  return values.flatMap((value) => {
    const totalPages = getTotalPages(filterBlogPostsByTaxonomy(posts, type, value).length);

    return getPageNumbers(totalPages)
      .filter((page) => page > 1)
      .map((page) => ({
        params: { [type]: value, page: String(page) },
        props: { value, page },
      }));
  });
};

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
