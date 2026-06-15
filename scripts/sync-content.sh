#!/usr/bin/env bash
set -euo pipefail

readonly SSH_DIR="$HOME/.ssh"
readonly SSH_KEY_PATH="$SSH_DIR/content_deploy_key"
readonly CONTENT_WORK_DIR=".content"

readonly BLOG_SOURCE_DIR="$CONTENT_WORK_DIR/blog"
readonly PROJECTS_SOURCE_DIR="$CONTENT_WORK_DIR/projects"
readonly ABOUT_SOURCE_DIR="$CONTENT_WORK_DIR/about"

readonly BLOG_TARGET_DIR="src/content/blog"
readonly PROJECTS_TARGET_DIR="src/content/projects"
readonly ABOUT_TARGET_DIR="src/content/about"

CONTENT_BRANCH="${CONTENT_BRANCH:-main}"

function log_info() {
  echo "[sync-content] $*"
}

function log_error() {
  echo "[sync-content] ERROR: $*" >&2
}

function fail() {
  log_error "$*"
  exit 1
}

function require_environment_variables() {
  if [ -z "${CONTENT_REPO:-}" ]; then
    fail "CONTENT_REPO is required"
  fi

  if [ -z "${CONTENT_DEPLOY_KEY_B64:-}" ]; then
    fail "CONTENT_DEPLOY_KEY_B64 is required"
  fi

  if [[ "$CONTENT_REPO" != */* ]]; then
    fail "CONTENT_REPO must be in owner/repo format. actual: ${CONTENT_REPO}"
  fi
}

function setup_ssh_key() {
  log_info "Setting up SSH key"

  mkdir -p "$SSH_DIR"
  chmod 700 "$SSH_DIR"

  if ! printf '%s' "$CONTENT_DEPLOY_KEY_B64" | base64 -d > "$SSH_KEY_PATH"; then
    fail "Failed to decode CONTENT_DEPLOY_KEY_B64"
  fi

  chmod 600 "$SSH_KEY_PATH"

  ssh-keyscan github.com >> "$SSH_DIR/known_hosts"
}

function clone_content_repository() {
  log_info "Cloning ${CONTENT_REPO}@${CONTENT_BRANCH}"

  rm -rf "$CONTENT_WORK_DIR"

  GIT_SSH_COMMAND="ssh -i $SSH_KEY_PATH -o IdentitiesOnly=yes" \
    git clone --depth=1 --branch "$CONTENT_BRANCH" \
    "git@github.com:${CONTENT_REPO}.git" "$CONTENT_WORK_DIR"
}

function reset_directory() {
  local target_dir="$1"

  rm -rf "$target_dir"
  mkdir -p "$target_dir"
}

function copy_required_directory() {
  local source_dir="$1"
  local target_dir="$2"

  reset_directory "$target_dir"

  if [ ! -d "$source_dir" ]; then
    fail "Required content directory not found: ${source_dir}"
  fi

  cp -R "$source_dir/." "$target_dir/"
  log_info "Synced ${source_dir} -> ${target_dir}"
}

function copy_optional_directory() {
  local source_dir="$1"
  local target_dir="$2"

  reset_directory "$target_dir"

  if [ ! -d "$source_dir" ]; then
    log_info "Optional content directory not found: ${source_dir}. Created empty ${target_dir}"
    return 0
  fi

  cp -R "$source_dir/." "$target_dir/"
  log_info "Synced ${source_dir} -> ${target_dir}"
}

function sync_content_directories() {
  copy_optional_directory "$BLOG_SOURCE_DIR" "$BLOG_TARGET_DIR"
  copy_optional_directory "$PROJECTS_SOURCE_DIR" "$PROJECTS_TARGET_DIR"
  copy_required_directory "$ABOUT_SOURCE_DIR" "$ABOUT_TARGET_DIR"
}

function main() {
  require_environment_variables
  setup_ssh_key
  clone_content_repository
  sync_content_directories

  log_info "Content synced from ${CONTENT_REPO}@${CONTENT_BRANCH}"
}

main "$@"
