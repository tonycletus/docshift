$ErrorActionPreference = "Stop"

$package = "@tonycletus/docshift"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 20 or newer is required. Install Node.js from https://nodejs.org, then rerun this script."
}

$major = [int](& node -p "process.versions.node.split('.')[0]")
if ($major -lt 20) {
  throw "Node.js 20 or newer is required. Current version: $(& node -v)"
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue) -and -not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is required to install DocShift CLI."
}

npm install -g $package
Write-Host "Installed DocShift CLI. Run: docshift doctor"
