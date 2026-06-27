#!/bin/bash

# posttooluse hook: formats the project after a code change so written files
# stay consistent. fires on edit/write tools.
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# read the edited file path from the tool payload on stdin.
FILE_PATH="$(jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"

# only format when a code file changed; skip docs and other unsupported files.
case "$FILE_PATH" in
  *.ts | *.tsx | *.js | *.jsx | *.cjs | *.mjs | *.json | *.jsonc | *.css) ;;
  *) exit 0 ;;
esac

cd "$PROJECT_DIR"

# make mise's toolchain available if it is installed.
export PATH="$HOME/.local/bin:$PATH"
if command -v mise >/dev/null 2>&1; then
  eval "$(mise activate bash)"
fi

# skip silently when node tooling is unavailable (e.g. a local shell w/o mise).
command -v npm >/dev/null 2>&1 || exit 0

npm run format >/dev/null 2>&1 || true
exit 0
