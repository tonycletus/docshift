export const APP_NAME = "DocShift";
export const APP_SLUG = "docshift";
export const APP_VERSION = "1.1.1";
export const PUBLIC_APP_URL = "https://docshift.tonycletus.com";
export const GITHUB_REPO = "tonycletus/docshift";
export const GITHUB_URL = `https://github.com/${GITHUB_REPO}`;
export const LATEST_RELEASE_URL = `${GITHUB_URL}/releases/latest`;
export const LATEST_DOWNLOAD_URL = `${LATEST_RELEASE_URL}/download`;
export const CLI_PACKAGE = "@tonycletus/docshift";

export const desktopDownloads = [
  {
    platform: "Windows",
    label: "Windows 10 & 11",
    arch: "x64 installer",
    artifact: "DocShiftSetup.exe",
    href: `${LATEST_DOWNLOAD_URL}/DocShiftSetup.exe`,
  },
  {
    platform: "macOS",
    label: "Apple Silicon",
    arch: "arm64 DMG",
    artifact: "DocShift-macos-arm64.dmg",
    href: `${LATEST_DOWNLOAD_URL}/DocShift-macos-arm64.dmg`,
  },
  {
    platform: "Linux",
    label: "Debian, Ubuntu, Mint",
    arch: "amd64 DEB",
    artifact: "docshift-linux-amd64.deb",
    href: `${LATEST_DOWNLOAD_URL}/docshift-linux-amd64.deb`,
  },
] as const;

export const cliDownloads = {
  installSh: `${PUBLIC_APP_URL}/install.sh`,
  installPs1: `${PUBLIC_APP_URL}/install.ps1`,
  releaseInstallSh: `${LATEST_DOWNLOAD_URL}/install.sh`,
  releaseInstallPs1: `${LATEST_DOWNLOAD_URL}/install.ps1`,
};

export function isDesktopMode() {
  return import.meta.env.VITE_APP_DESKTOP === "true";
}
