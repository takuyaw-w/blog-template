import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

export type GitFileHistory = {
  publishedAt?: Date;
  updatedAt?: Date;
};

const historyCache = new Map<string, GitFileHistory>();

const toRepoPath = (filePath: string) => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  return path.relative(process.cwd(), absolutePath);
};

export const getGitFileHistory = (filePath: string | undefined): GitFileHistory => {
  if (filePath === undefined || !existsSync(path.resolve(process.cwd(), ".git"))) {
    return {};
  }

  const repoPath = toRepoPath(filePath);
  const cached = historyCache.get(repoPath);

  if (cached) {
    return cached;
  }

  try {
    const output = execFileSync("git", ["log", "--follow", "--format=%aI", "--", repoPath], {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const dates = output
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.valueOf()));
    const history = {
      publishedAt: dates.at(-1),
      updatedAt: dates.at(0),
    };

    historyCache.set(repoPath, history);

    return history;
  } catch {
    const history = {};

    historyCache.set(repoPath, history);

    return history;
  }
};
