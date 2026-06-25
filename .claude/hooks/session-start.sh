#!/bin/bash
# sessionstart hook for claude code on the web.
# installs mise, provisions the node version specified in package.json,
# prepares a local env file, and installs npm dependencies so linters and
# tests are runnable as soon as the session starts.
set -euo pipefail

# only run in the remote (web) environment. local sessions manage their own
# toolchain; set CLAUDE_CODE_REMOTE=true to exercise this hook locally.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR"

# install mise if it is not already available, then activate it.
if ! command -v mise >/dev/null 2>&1; then
  curl -fsSL https://mise.run | sh
fi
export PATH="$HOME/.local/bin:$PATH"
eval "$(mise activate bash)"

# install the node version required by package.json via mise.
# reads devengines.runtime.version (falling back to engines.node) and
# installs the latest release of that major so it matches ci's
# node-version-file: package.json resolution.
NODE_RANGE="$(jq -r '.devEngines.runtime.version // .engines.node // ""' package.json)"
NODE_MAJOR="$(printf '%s' "$NODE_RANGE" | grep -oE '[0-9]+' | head -n1)"
NODE_MAJOR="${NODE_MAJOR:-24}"
mise use -g "node@${NODE_MAJOR}"
eval "$(mise activate bash)"
hash -r 2>/dev/null || true

# provide a local env file for development if one does not exist yet.
if [ -f .env.example ] && [ ! -f .env.local ]; then
  cp .env.example .env.local
fi

# install npm dependencies (install, not ci, so the cached container layer
# can be reused across sessions).
npm install

# keep mise activated for every shell spawned during this session.
if [ -n "${CLAUDE_ENV_FILE:-}" ] && ! grep -q 'mise activate bash' "$CLAUDE_ENV_FILE" 2>/dev/null; then
  echo 'eval "$(mise activate bash)"' >> "$CLAUDE_ENV_FILE"
fi
