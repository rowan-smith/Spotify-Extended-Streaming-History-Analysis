# Spotify Extended Streaming History Analysis

Explore your Spotify Extended Streaming History in the browser. Upload JSON exports, filter your listening data, and browse interactive charts, all processed locally on your device.

## Development

The web app source lives in `/analysis`. Production builds output to `/analysis/docs` for GitHub Pages. Unit tests live in `/tests/unit` and e2e tests in `/tests/e2e`.

```bash
cd analysis
npm install
npm run dev      # local development
npm run build    # build to analysis/docs

# tests
cd ../tests
npx vitest run              # unit tests
npx playwright test          # e2e tests
```

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b your-feature`
3. Make changes in `/analysis` and run `npm run build` if you changed the app (commit updated `/analysis/docs` for Pages deploys).
4. Open a pull request with a clear description and screenshots for UI changes.

### Guidelines

- Keep analysis client-side. Do not add backends that receive user exports.
- Match existing TypeScript/React patterns in `/analysis/src`.
- Prefer focused PRs over large mixed changes.
- Update assumptions or data-handling copy when filter behaviour changes.

## Report issues

Bug reports and feature requests: [GitHub Issues](https://github.com/rowan-smith/Spotify-Extended-Streaming-History-Analysis/issues)