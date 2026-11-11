# Reentry Hiring Guide

A local React app for exploring how hiring practices and protections vary by state.

The current MVP is anonymous and keeps answers only in browser memory. It does
not use accounts, analytics, a database, or a backend service.

## Start the app

Open Terminal, move into this folder, and run:

```sh
cd /Users/andy/Documents/Codex/2026-09-29/i-h/reentry-hiring-guide
nvm use
npm run dev
```

Then open the local address shown in Terminal (normally http://localhost:5173).

Keep that Terminal window open while using the app. Press `Control+C` there to stop it.

## Useful checks

```sh
npm run build
npm run lint
```

`npm run build` confirms the app can be packaged. `npm run lint` checks the source for common mistakes.

## GitHub Pages

This repository includes a GitHub Actions workflow that builds and publishes
the app whenever the `main` branch is updated.

After creating the public repository:

1. Open **Settings → Pages** in GitHub.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push to `main`, or run the **Deploy to GitHub Pages** workflow manually from
   the Actions tab.

The published URL will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/fair-chance-guide/
```
