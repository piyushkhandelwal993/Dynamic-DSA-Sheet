# GitHub-Only Contribution Workflow

DSA Sheet can accept problem contributions without a custom backend server.

The flow is:

1. A learner creates a contribution inside the desktop app.
2. The app runs local validation and saves a queued JSON file.
3. The learner opens GitHub and creates a contribution issue using the matching template.
4. Maintainers validate and review the contribution.
5. GitHub Actions validates the issue payload, updates `contributions/review-status.json`, and for published contributions applies the accepted asset directly into `src/data/...`.
6. GitHub Pages republishes both the content bundle and `contributions/status.json`.
7. The desktop app refreshes review status and synced content from the published feeds.

## Supported contribution types

- Test case
- Bulk test cases
- Video link

## Learner flow

1. Open a problem in the desktop app.
2. Click `Contribute`.
3. Validate locally.
4. Save draft or submit.
5. Open `Contribution History`.
6. Use `View Detail` to inspect the payload.
7. Use `Open Queue Folder` to access the queued JSON file.
8. Create a GitHub issue using:
   - `Test Case Contribution`
   - `Video Link Contribution`
9. Paste the exported payload into the issue.

## Maintainer flow

1. Review the GitHub issue.
2. Validate the payload and intended change.
3. Move the issue through labels such as `contribution-under-review`, `contribution-approved`, and `contribution-published`.
4. When the contribution reaches `contribution-published`, automation updates both `contributions/review-status.json` and the target problem content in `src/data/...`.

Example:

```json
{
  "generatedAt": "2026-07-01T12:00:00.000Z",
  "items": [
    {
      "id": "contrib_20260701_abcd1234",
      "status": "approved",
      "reviewedAt": "2026-07-01T12:10:00.000Z",
      "note": "Valid edge case. Approved for inclusion."
    }
  ]
}
```

## Published status feed

GitHub Pages publishes:

- `content/manifest.json`
- `content/catalog-*.json`
- `contributions/status.json`

The desktop app reads:

`https://piyushkhandelwal993.github.io/Dynamic-DSA-Sheet/contributions/status.json`

## Why this works without a backend

- GitHub Issues act as the intake surface.
- GitHub Actions + GitHub Pages act as the automation and hosting layer.
- The desktop app stays local-first and only needs a static JSON status feed.

## Published content behavior

- `video-link` contributions update the problem's `video` field.
- `test-case` contributions append a unique test case if the same input/output pair is not already present.
- `bulk-test-cases` contributions append each unique test case from the published batch.

After the publish workflow completes, the desktop app can pick up both the new review state and the updated problem content.
