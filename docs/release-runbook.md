# DSA Sheet Release Runbook

Use this runbook every time you want to give users the latest desktop app.

This flow assumes:

- GitHub Releases are the source of truth for installers
- GitHub Pages hosts the content manifest and download page
- users install once, then app updates and content sync take over

## Public URLs

### Download page

- `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/`

### Latest installer URLs

- Windows:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-windows-x64.exe`
- macOS Apple Silicon:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-mac-arm64.dmg`
- macOS Intel:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-mac-x64.dmg`
- Linux:
  - `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest/download/DSA-Sheet-linux-x64.AppImage`

## What Changes Require What

### Only content changed

Examples:

- new problems
- topic metadata
- hints
- test cases
- roadmap updates

Do this:

- push to `main`
- let `Publish Content Bundle` run

No new desktop installer is required.

### App code changed

Examples:

- UI changes
- editor behavior
- analyzer logic
- desktop shell
- local runner changes

Do this:

- bump app version
- push tag
- let `Release Desktop App` run

## Exact Release Flow For The Next App Version

Example version:

- `package.json`: `2.0.1`
- git tag: `v2.0.1`

### 1. Update version

Edit [package.json](/Users/piyushkhandelwal/Documents/dsa-sheet/package.json) and set:

```json
"version": "2.0.1"
```

### 2. Run local checks

```bash
cd /Users/piyushkhandelwal/Documents/dsa-sheet
npm ci
npm run release:check
CONTENT_BASE_URL='https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/content/' npm run content:export
```

### 3. Commit the release

```bash
git add .
git commit -m "Release v2.0.1"
```

### 4. Push main first

```bash
git push origin main
```

This is important because the content publishing workflow runs from `main`.

### 5. Create and push the tag

```bash
git tag v2.0.1
git push origin v2.0.1
```

### 6. Watch two workflows

#### A. `Publish Content Bundle`

It should publish:

- `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/content/manifest.json`
- the latest content bundle JSON
- the download page

#### B. `Release Desktop App`

It should build and upload:

- `DSA-Sheet-windows-x64.exe`
- `DSA-Sheet-mac-arm64.dmg`
- `DSA-Sheet-mac-x64.dmg`
- `DSA-Sheet-linux-x64.AppImage`
- updater metadata files

## Release Verification Checklist

After the workflows finish, verify:

### GitHub Pages

- the download page opens:
  - `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/`
- the manifest opens:
  - `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/content/manifest.json`

### GitHub Release

Open:

- `https://github.com/piyushkhandelwal993/Dynamic-DSA-Sheet/releases/latest`

Check that the release contains:

- Windows installer
- macOS Apple Silicon DMG
- macOS Intel DMG
- Linux AppImage
- updater metadata files

### Direct installer links

Open each one once:

- Windows latest link
- macOS arm64 latest link
- macOS x64 latest link
- Linux latest link

They should start downloading the correct file.

## What To Share With Users

For normal users, share only this:

- `https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/`

Do not send users raw GitHub artifact lists unless needed.

## How Future Updates Reach Users

### App updates

- released through GitHub Releases
- detected by `electron-updater`
- user updates from inside the app

### Content updates

- published through GitHub Pages
- synced from `content/manifest.json`
- no reinstall needed

## If A Release Fails

### If `Publish Content Bundle` fails

- content sync stays on the previous good bundle
- desktop app still works
- fix workflow and re-run it

### If `Release Desktop App` fails

- users keep using the old installer/app version
- content updates can still continue independently
- fix the failing platform job and re-tag only if needed

## Recommended Operator Habit

Use this sequence every time:

1. push content and app changes to `main`
2. verify Pages updated
3. tag the release
4. verify GitHub Release assets
5. share only the download page
