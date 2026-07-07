#!/usr/bin/env bash
#
# TEMPORARY — verification scaffolding for the preview-deployment setup.
#
# Confirms that TURSO_API_TOKEN can perform the exact control-plane operations
# the preview workflows rely on: branch a database from production, resolve its
# URL, mint a database auth token, and destroy the copy. It never writes to the
# production database.
#
# DELETE THIS SCRIPT once a real preview deploy has succeeded — it is not part of
# the pipeline.
#
# Usage (run locally, with a group-scoped, full-access token):
#   export TURSO_API_TOKEN=...            # the Platform API token
#   export TURSO_PRODUCTION_DB_NAME=...   # the production database name
#   ./.github/scripts/verify-preview-db.sh
set -euo pipefail

: "${TURSO_API_TOKEN:?set TURSO_API_TOKEN to the group-scoped Platform API token}"
: "${TURSO_PRODUCTION_DB_NAME:?set TURSO_PRODUCTION_DB_NAME to the production database name}"

VERIFY_DB_NAME="btnopen-preview-verify"

# never let a misconfiguration point the destructive step at production.
if [ "$VERIFY_DB_NAME" = "$TURSO_PRODUCTION_DB_NAME" ]; then
	echo "Refusing to run: verify name collides with production." >&2
	exit 1
fi

# destroy the throwaway copy on any exit, including failure partway through.
cleanup() {
	if turso db show "$VERIFY_DB_NAME" >/dev/null 2>&1; then
		echo "Cleaning up $VERIFY_DB_NAME…"
		turso db destroy "$VERIFY_DB_NAME" --yes
	fi
}
trap cleanup EXIT

echo "1/4 Branching $VERIFY_DB_NAME from $TURSO_PRODUCTION_DB_NAME…"
turso db create "$VERIFY_DB_NAME" --from-db "$TURSO_PRODUCTION_DB_NAME"

echo "2/4 Resolving the connection URL…"
turso db show "$VERIFY_DB_NAME" --url >/dev/null

echo "3/4 Minting a database auth token…"
turso db tokens create "$VERIFY_DB_NAME" >/dev/null

echo "4/4 Destroying $VERIFY_DB_NAME…"
turso db destroy "$VERIFY_DB_NAME" --yes
trap - EXIT

echo
echo "PASS: the token can branch from production, mint tokens, and destroy in this group."
echo "You can now delete this script: .github/scripts/verify-preview-db.sh"
