# Publishing DSA Sheet Desktop

This project now has the base structure needed to ship the Electron desktop app professionally.

## What Is Already Wired

- Electron desktop entrypoint: `desktop/main.js`
- Packager: `electron-builder`
- Desktop distribution scripts:
  - `npm run desktop:package`
  - `npm run desktop:dist`
- GitHub Actions release workflow:
  - `.github/workflows/release-desktop.yml`
- First-run Java prerequisite detection in the app UI
- Desktop security improvements:
  - `contextIsolation: true`
  - `nodeIntegration: false`
  - `sandbox: true`
  - restrictive `window.open` handling
  - CSP added to `desktop/index.html`

## Node Version For Packaging

Use Node 20 LTS for desktop packaging.

This repo now includes:

- `.nvmrc`
- `package.json` `engines.node = 20.x`

Reason:

`electron-builder` packaging is stable on Node 20 in the release workflow. A local dry-run under newer Node versions can fail with an ESM loader error inside builder dependencies.

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
2. build TypeScript
3. run tests
4. build desktop installers
5. upload artifacts
6. attach them to the GitHub Release

For an exact operator checklist, see:

- [docs/first-release-checklist.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/first-release-checklist.md)
- [docs/release-notes-template.md](/Users/piyushkhandelwal/Documents/New%20project/dsa-sheet/docs/release-notes-template.md)

## Local Distribution Commands

Build unpacked app:

```bash
npm run desktop:package
```

Build distributable installers:

```bash
npm run desktop:dist
```

## Important Product Constraint

The app currently executes Java locally using `java` and `javac`.

That means users need JDK 17+ installed unless you later bundle or provision a runtime automatically.

The app now detects this and shows a setup banner, but the most polished future release would either:

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
- auto-update support
- release notes and changelog polish
