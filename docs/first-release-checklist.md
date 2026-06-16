# First Desktop Release Checklist

Use this checklist when preparing the first public desktop release of DSA Sheet.

## Local Prep

- [ ] Use Node 20 LTS
- [ ] Run `npm ci`
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Confirm app launches with `npm run desktop`
- [ ] Confirm the Java setup banner appears correctly on a machine without JDK
- [ ] Confirm Run and Submit work on a machine with JDK 17+

## Branding

- [ ] Regenerate icons if the source art changed:

```bash
npm run desktop:generate-icons -- /absolute/path/to/source-icon.png
```

- [ ] Confirm these files exist:
  - `build/icon.png`
  - `build/icon.ico`
  - `build/icon.icns`

## GitHub Repo Setup

- [ ] Push the latest code to GitHub
- [ ] Enable GitHub Actions
- [ ] Confirm `.github/workflows/release-desktop.yml` is present

## GitHub Secrets

### Required for macOS signing / notarization

- [ ] `CSC_LINK`
- [ ] `CSC_KEY_PASSWORD`
- [ ] `APPLE_ID`
- [ ] `APPLE_APP_SPECIFIC_PASSWORD`
- [ ] `APPLE_TEAM_ID`

### Optional / recommended

- [ ] Windows code-signing credentials

## Release Notes

- [ ] Copy `docs/release-notes-template.md`
- [ ] Fill in the release version
- [ ] List supported platforms
- [ ] Mention Java 17+ requirement clearly

## First Tag

- [ ] Commit final release-ready changes
- [ ] Create tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## GitHub Actions Verification

- [ ] macOS build succeeds
- [ ] Windows build succeeds
- [ ] Linux build succeeds
- [ ] Release artifacts are attached to GitHub Release

Expected artifacts:

- [ ] `.dmg`
- [ ] `.zip`
- [ ] `.exe`
- [ ] `.AppImage`

## Manual QA Before Sharing

- [ ] Install macOS build on a clean machine
- [ ] Install Windows build on a clean machine
- [ ] Confirm first launch works
- [ ] Confirm topic switching works
- [ ] Confirm workspace restore works
- [ ] Confirm Run/Submit UX works
- [ ] Confirm Java guidance is understandable

## Public Release Copy

Make sure the release page tells users:

- DSA Sheet is a desktop app
- It provides adaptive next-problem guidance
- Java 17+ is currently required for code execution
- macOS / Windows / Linux availability

