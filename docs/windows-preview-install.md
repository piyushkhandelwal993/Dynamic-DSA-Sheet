# Windows Preview Install Note

The first free-first Windows release of DSA Sheet may be unsigned.

That means Windows SmartScreen can show a warning such as:

- "Windows protected your PC"
- "Unknown publisher"

This is expected for the preview release.

## How to install anyway

1. Open the installer.
2. If Windows shows a warning, click **More info**.
3. Click **Run anyway**.
4. Finish the installer normally.

## Why this happens

Public Windows app trust normally requires paid code signing.

For the free-first launch, DSA Sheet can ship as a preview build without Windows signing so real users can start using the product earlier.

## Important

This does **not** affect the app’s local learning logic.

Inside the app, code still runs locally on your machine and the product still checks:

- correctness
- concept usage
- code quality
- progression

## Later plan

A later release can move to a fully signed Windows installer for a smoother install experience.

