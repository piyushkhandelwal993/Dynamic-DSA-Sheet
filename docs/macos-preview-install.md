# macOS Preview Install Note

The first free-first macOS release of DSA Sheet may be unsigned or not notarized.

If a user downloads an unsigned macOS app from GitHub, macOS Gatekeeper can show messages such as:

- "DSA Sheet is damaged and can't be opened"
- "Apple cannot check it for malicious software"
- "The app is from an unidentified developer"

This does not mean the app bundle is necessarily corrupted. It usually means macOS does not trust the downloaded app because it is not Developer ID signed and notarized.

## Best Production Fix

For a professional public macOS release:

1. Enroll in the Apple Developer Program.
2. Create a Developer ID Application certificate.
3. Configure GitHub Actions signing secrets:
   - `CSC_LINK`
   - `CSC_KEY_PASSWORD`
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`
4. Enable notarization in the release workflow.
5. Rebuild and publish a new release.

This is the correct fix for real users.

## Free-First Tester Workaround

For internal testers only, after installing the app:

```bash
xattr -dr com.apple.quarantine "/Applications/DSA Sheet.app"
```

Then open the app again.

If the app is not in `/Applications`, replace the path with the actual app location.

## Important

Do not present the quarantine command as the normal public install flow.

It is acceptable for preview testers, but the public release should be signed and notarized.
