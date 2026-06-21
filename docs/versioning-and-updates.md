# Versioning And Updates

DSA Sheet uses GitHub Releases plus `electron-updater` for optional desktop updates.

The update experience is intentionally user-controlled:

1. the app checks for a newer released version on launch
2. if one exists, it shows an update banner
3. the user can click `Update Now`
4. the app downloads the installer metadata in the background
5. the user clicks `Restart And Install` when ready

Local progress is stored outside the installed app at `~/.dsa-sheet`, so updating the app should not remove:

- profile and XP
- solved progress
- skill profile
- submissions
- generated workspace files
- desktop preferences

## Version Number Rules

Use semantic versioning:

- `PATCH`, for example `1.0.1`: bug fixes, typo fixes, small UI fixes, problem/test-case corrections.
- `MINOR`, for example `1.1.0`: new topics, new problems, new feedback signals, meaningful UI additions.
- `MAJOR`, for example `2.0.0`: breaking storage/schema changes or major behavior changes that require migration notes.

Prefer small frequent releases. A desktop app feels healthier when users see steady improvements.

## Release Checklist

For every release:

1. Update `package.json` version.
2. Update release notes from `docs/release-notes-template.md`.
3. Run local checks:

```bash
nvm use
npm ci
npm run release:check
```

4. Commit the version change and notes.
5. Create a matching Git tag:

```bash
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

The tag must match the package version. For example:

- `package.json` version: `1.0.1`
- Git tag: `v1.0.1`

## What CI Publishes

On a version tag, `.github/workflows/release-desktop.yml` runs on macOS, Windows, and Linux.

The workflow uses:

```bash
npm run desktop:publish
```

That command lets Electron Builder upload both installer files and update metadata to GitHub Releases.

Update metadata files are important. The app checks these files to know whether a newer version exists:

- `latest.yml` for Windows
- macOS update metadata for the `zip` target
- Linux AppImage metadata where supported

Do not replace the publish flow with manual upload-only releases unless you also preserve the generated update metadata.

## Free-First Signing Notes

The current workflow is configured for a free-first release path.

- Windows can ship unsigned, but users may see an "Unknown publisher" warning.
- macOS auto-update is best treated as fully production-ready only after signing/notarization is configured.
- Linux AppImage can be distributed through GitHub Releases.

When signing is ready, add signing secrets deliberately and update the release workflow. Do not leave empty signing environment variables in CI because Electron Builder can treat them as configured-but-invalid credentials.

## Data Migration Rule

Before changing any file under `~/.dsa-sheet`, add a migration plan.

Safe changes:

- adding new optional fields
- adding new topic/problem data
- adding new preference keys with defaults

Risky changes:

- renaming existing fields
- changing progress status values
- changing submission history format
- moving workspace paths

For risky changes, ship a minor or major version with migration code and release notes explaining the change.
