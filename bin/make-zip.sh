#!/usr/bin/env bash
#
# Build an installable plugin ZIP for WP Admin > Plugins > Add New > Upload.
#
# Ships only what the plugin loads at runtime, wrapped in a single
# `applicator-directory/` folder (WordPress rejects the archive without it).
#
# Usage: npm run zip
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="applicator-directory"
MAIN="$ROOT/$SLUG.php"

# Everything the PHP actually loads. Keep in sync with the enqueues/includes
# in applicator-directory.php if that ever changes.
PAYLOAD=(
  "$SLUG.php"
  "assets/css/applicator.css"
  "assets/js/applicator.js"
  "templates/applicator-list.php"
)

# --- Version: the header and the constant must agree -------------------------
# APPDIR_VERSION drives asset cache-busting and the one-time cache flush, so a
# mismatch means browsers keep serving stale CSS after a deploy.
header_version="$(sed -n 's/^ \* Version:[[:space:]]*\([0-9.]*\).*/\1/p' "$MAIN" | head -1)"
const_version="$(sed -n "s/.*APPDIR_VERSION', '\([0-9.]*\)'.*/\1/p" "$MAIN" | head -1)"

if [ -z "$header_version" ] || [ -z "$const_version" ]; then
  echo "error: could not read the version from $SLUG.php" >&2
  exit 1
fi

if [ "$header_version" != "$const_version" ]; then
  echo "error: version mismatch - plugin header is $header_version, APPDIR_VERSION is $const_version" >&2
  echo "       Bump both, or the deployed CSS/JS stays cached." >&2
  exit 1
fi

VERSION="$const_version"

# --- Warn if the wp-scripts sources have drifted from the shipped assets -----
# src/ is a mirror of assets/; only assets/ is enqueued, so drift ships silently.
if [ -f "$ROOT/src/style.scss" ] && ! diff -q <(tail -n +3 "$ROOT/src/style.scss") <(tail -n +3 "$ROOT/assets/css/applicator.css") >/dev/null 2>&1; then
  echo "warning: src/style.scss has drifted from assets/css/applicator.css" >&2
fi

# --- Stage and zip ----------------------------------------------------------
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

for path in "${PAYLOAD[@]}"; do
  if [ ! -f "$ROOT/$path" ]; then
    echo "error: missing required file: $path" >&2
    exit 1
  fi
  mkdir -p "$STAGE/$SLUG/$(dirname "$path")"
  cp "$ROOT/$path" "$STAGE/$SLUG/$path"
done

find "$STAGE" -name '.DS_Store' -delete

mkdir -p "$ROOT/dist"
ZIP="$ROOT/dist/$SLUG-$VERSION.zip"
rm -f "$ZIP"
( cd "$STAGE" && zip -rqX "$ZIP" "$SLUG" )

echo "Built $ZIP (v$VERSION)"
unzip -l "$ZIP" | sed '1,3d;$d'
