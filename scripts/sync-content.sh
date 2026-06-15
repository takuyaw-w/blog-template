#!/usr/bin/env bash
set -euo pipefail

: "${CONTENT_REPO:?CONTENT_REPO is required}"
: "${CONTENT_DEPLOY_KEY_B64:?CONTENT_DEPLOY_KEY_B64 is required}"

CONTENT_BRANCH="${CONTENT_BRANCH:-main}"

mkdir -p ~/.ssh
chmod 700 ~/.ssh

printf '%s' "$CONTENT_DEPLOY_KEY_B64" | base64 -d > ~/.ssh/content_deploy_key
chmod 600 ~/.ssh/content_deploy_key

ssh-keyscan github.com >> ~/.ssh/known_hosts

rm -rf .content

GIT_SSH_COMMAND="ssh -i ~/.ssh/content_deploy_key -o IdentitiesOnly=yes" \
  git clone --depth=1 --branch "$CONTENT_BRANCH" \
  "git@github.com:${CONTENT_REPO}.git" .content

rm -rf src/content/blog
rm -rf src/content/projects
rm -rf src/content/about

mkdir -p src/content/blog
mkdir -p src/content/projects
mkdir -p src/content/about

cp -R .content/blog/. src/content/blog/
cp -R .content/projects/. src/content/projects/
cp -R .content/about/. src/content/about/

echo "Content synced from ${CONTENT_REPO}@${CONTENT_BRANCH}"
