#!/usr/bin/env sh
set -eu

package="@tonycletus/docshift"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required to install DocShift CLI." >&2
  echo "Install Node.js from https://nodejs.org, then rerun this script." >&2
  exit 1
fi

major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$major" -lt 20 ]; then
  echo "Node.js 20 or newer is required. Current version: $(node -v)" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required to install DocShift CLI." >&2
  exit 1
fi

npm install -g "$package"
echo "Installed DocShift CLI. Run: docshift doctor"
