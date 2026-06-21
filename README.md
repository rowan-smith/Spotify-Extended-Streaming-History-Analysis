# Spotify Extended Streaming History Analysis

Explore your Spotify Extended Streaming History in the browser. Upload JSON exports, filter your listening data, and browse interactive charts, all processed locally on your device.

## Development

The web app source lives in `/web`. Production builds output to `/docs` for GitHub Pages.

```bash
cd web
npm install
npm run dev      # local development
npm run build    # build to /docs
```

### Cloudflare Web Analytics (optional)

Uncomment the beacon script in `web/index.html` and set your token from the Cloudflare dashboard to track anonymous page views.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b your-feature`
3. Make changes in `/web` and run `npm run build` if you changed the app (commit updated `/docs` for Pages deploys).
4. Open a pull request with a clear description and screenshots for UI changes.

### Guidelines

- Keep analysis client-side. Do not add backends that receive user exports.
- Match existing TypeScript/React patterns in `/web/src`.
- Prefer focused PRs over large mixed changes.
- Update assumptions or data-handling copy when filter behaviour changes.

## Report issues

Bug reports and feature requests: [GitHub Issues](https://github.com/rowan-smith/Spotify-Extended-Streaming-History-Analysis/issues)

## License

See repository license file if present; otherwise treat as open source for personal and educational use.
