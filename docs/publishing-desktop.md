# Publishing DSA Sheet Desktop

This project now has the base structure needed to ship the Electron desktop app professionally.

## What Is Already Wired

- Electron desktop entrypoint: `desktop/main.js`
- Packager: `electron-builder`
- Desktop distribution scripts:
  - `npm run desktop:package`
  - `npm run desktop:dist`
  - `npm run desktop:publish`
- GitHub Actions release workflow:
  - `.github/workflows/release-desktop.yml`
- Optional app updates via `electron-updater`
- First-run Java prerequisite detection in the app UI
- Desktop security improvements:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - restrictive `window.open` handling
  - CSP added to `desktop/index.html`

## Node Version For Packaging

Use Node 22 LTS for desktop packaging.

This repo now includes:

- `.nvmrc`
- `package.json` `engines.node = >=22.12 <23`

Reason:

The current Electron Builder dependency tree expects Node 22.12+ for packaging-related tooling.

## Release Targets

Current build targets:

- macOS: `dmg`, `zip`
- Windows: `nsis`
- Linux: `AppImage`

## Before First Public Release

### 1. App Icons

The project is now wired to use:

- `build/icon.icns` for macOS
- `build/icon.ico` for Windows
- `build/icon.png` for Linux

Regenerate them from your source art with:

```bash
npm run desktop:generate-icons -- /absolute/path/to/source-icon.png
```

### 2. Choose Your Release Mode

You have two valid launch paths:

#### Free-first release

- signed macOS if you already have Apple signing available
- unsigned Windows preview
- unsigned Linux AppImage
- clear release notes that Windows is a preview build and may show OS trust warnings

This is the fastest path if you want real users now without buying Windows signing.

#### Fully signed release

- signed macOS
- signed Windows
- Linux AppImage

This is the more polished path, but it requires signing credentials.

### 3. Configure Signing Secrets

For macOS distribution outside the App Store, configure:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

For Windows signing, configure an appropriate certificate path/password workflow.

If you are using the free-first launch, Windows signing can be skipped for now.

## GitHub Release Flow

Tag a release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:

1. install dependencies
2. install Temurin JDK 17 for Java runner tests
3. build TypeScript
4. run the unified production gate (`npm run release:check`)
5. build desktop installers
6. publish installers and update metadata to the GitHub Release
7. upload CI artifacts for debugging

## Latest Download Links

Once the release assets are published, users can always install the latest build from stable URLs:

- Windows:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-windows-x64.exe`
- macOS Apple Silicon:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-mac-arm64.dmg`
- macOS Intel:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-mac-x64.dmg`
- Linux:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-linux-x64.AppImage`

There is also a hosted download page on GitHub Pages:

- `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/`

This page is better for users than sending them directly to the full release asset list.

For an exact operator checklist, see:

- [docs/first-release-checklist.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/first-release-checklist.md)
- [docs/release-notes-template.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/release-notes-template.md)
- [docs/versioning-and-updates.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/versioning-and-updates.md)
- [docs/release-runbook.md](/Users/piyushkhandelwal/Documents/dsa-sheet/docs/release-runbook.md)
- [docs/macos-preview-install.md](/Users/piyushkhandelwal/Documents/dsa-sheet/docs/macos-preview-install.md)
- [docs/windows-preview-install.md](/Users/piyushkhandelwal/Documents/dsa-sheet/docs/windows-preview-install.md)

## Optional Desktop Updates

The desktop app checks GitHub Releases for newer versions on launch when it is running as a packaged app.

The update flow is optional:

1. the app detects a newer release
2. an update banner appears
3. the user clicks `Update Now`
4. the app downloads the update
5. the user clicks `Restart And Install`

The installed app is separate from user data. Progress and workspaces remain in `~/.dsa-sheet`, so normal app updates should keep user data intact.

Important:

- package version and Git tag should match, for example `1.0.1` and `v1.0.1`
- release builds must use `npm run desktop:publish` on tags
- do not manually upload only installers and forget updater metadata
- macOS auto-update should be treated as production-ready after signing/notarization is configured

## Local Distribution Commands

Build unpacked app:

```bash
npm run desktop:package
```

Build distributable installers:

```bash
npm run desktop:dist
```

Publish distributable installers and updater metadata:

```bash
npm run desktop:publish
```

## Important Product Constraint

The app executes Java and C++ locally.

Users currently need:

- JDK 17+ for Java
- a C++17-compatible `g++` compiler for C++

The app detects both toolchains and shows setup guidance, but the most polished future release would either:

- bundle a runtime, or
- download/manage one on first launch

## Recommended Release Sequence

### v1

- signed macOS build if available
- Windows preview build if you do not yet have code signing
- Linux AppImage
- Java prerequisite detection
- GitHub Releases distribution

### v1.1

- signed Windows release
- bundled Java runtime or guided runtime installer
- signed/notarized macOS update path
- release notes and changelog polish
