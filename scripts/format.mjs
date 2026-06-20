#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const mode = args.includes("--check")
  ? "--check"
  : args.includes("--write")
    ? "--write"
    : undefined;
const filesIndex = args.indexOf("--files");
const explicitFiles = filesIndex === -1 ? [] : args.slice(filesIndex + 1);

if (mode === undefined || (args.includes("--check") && args.includes("--write"))) {
  console.error("Usage: node scripts/format.mjs --check|--write [--files <path>...]");
  process.exit(1);
}

const ignoredDirectories = new Set([
  ".agents",
  ".astro",
  ".codegraph",
  ".codex",
  ".content",
  ".git",
  ".vscode",
  ".wrangler",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const oxfmtExtensions = new Set([
  ".css",
  ".cjs",
  ".js",
  ".jsx",
  ".json",
  ".jsonc",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);
const prettierExtensions = new Set([".astro"]);

const binSuffix = process.platform === "win32" ? ".cmd" : "";
const oxfmt = join("node_modules", ".bin", `oxfmt${binSuffix}`);
const prettier = join("node_modules", ".bin", `prettier${binSuffix}`);

const normalizePath = (path) => path.replaceAll("\\", "/");

const walk = async (path) => {
  let pathStat;

  try {
    pathStat = await stat(path);
  } catch {
    return [];
  }

  if (pathStat.isFile()) {
    return [path];
  }

  if (!pathStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        return [];
      }

      return walk(join(path, entry.name));
    }),
  );

  return files.flat();
};

const assertExecutable = (command, packageName) => {
  if (existsSync(command)) {
    return;
  }

  console.error(`format: ${packageName} is not installed. Run pnpm install first.`);
  process.exit(1);
};

const runFormatter = (command, formatterArgs, files) => {
  if (files.length === 0) {
    return 0;
  }

  const result = spawnSync(command, [...formatterArgs, ...files], { stdio: "inherit" });

  if (result.error) {
    console.error(`format: failed to run ${command}: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
};

const discoveredFiles = explicitFiles.length > 0 ? explicitFiles : await walk(".");
const files = [...new Set(discoveredFiles.map(normalizePath))].sort();
const oxfmtFiles = files.filter((file) => oxfmtExtensions.has(extname(file)));
const prettierFiles = files.filter((file) => prettierExtensions.has(extname(file)));

assertExecutable(oxfmt, "oxfmt");
assertExecutable(prettier, "prettier");

const oxfmtStatus = runFormatter(oxfmt, [mode], oxfmtFiles);
if (oxfmtStatus !== 0) {
  process.exit(oxfmtStatus);
}

const prettierStatus = runFormatter(prettier, [mode], prettierFiles);
process.exit(prettierStatus);
