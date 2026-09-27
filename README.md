# Iron Log

Personal strength-training tracker. Data stays in the browser (`localStorage`). No backend.

## Features

- Multiple user profiles on one device
- Exercises organized by muscle group
- Custom routines (PPL, Upper/Lower, A/B/C/D, or your own)
- Today view: next day, last session for that day, missed configured exercises
- Workout log: date, exercises, sets with weight + reps
- Progress charts per exercise
- Body-weight tracker

## Develop

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Create a GitHub repo named `workout-tracker` (or change `base` in `vite.config.ts` to match the repo name).
2. Push this project.
3. Run:

```bash
npm run deploy
```

4. In the repo on GitHub: **Settings → Pages → Deploy from branch → `gh-pages`**.

The app uses HashRouter, so routes work on GitHub Pages without a server rewrite.

## Notes

- Clearing site data / another browser = empty history.
- Export/import is not included yet; ask if you want a JSON backup button.
