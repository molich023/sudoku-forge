# Sudoku Forge

A modern, open-source Sudoku game prototype designed to run offline as a standalone web/PWA app.

## Included
- Easy / Medium / Hard / Extreme / Expert generation
- Daily / Weekly / Monthly challenge IDs
- Offline-first gameplay
- Click/tap digit input
- Error checking and illegal-move detection
- Unique per-game timer and pause handling
- Accuracy, mistakes, score and completion statistics
- Hints with human-style explanations
- Auto-complete (explicit user action)
- Candidate notes
- Local player profile and leaderboard
- Anti-forgery integrity checks for locally stored game records
- Responsive mobile/desktop UI
- PWA manifest + service worker
- No external runtime dependencies

## Run immediately

Open `index.html` in a browser.

For a fully installable PWA, serve the folder from a local/static HTTP server:

```bash
python -m http.server 8080
```

Then open:

`http://127.0.0.1:8080`

On Android/Chrome, use **Add to Home screen**.

## Development

The game is intentionally dependency-free so it can be tested in Termux without installing a large toolchain.

The next production stage should replace the local-only leaderboard/account layer with a server API, WebAuthn/passkeys or OAuth, signed challenge manifests, server-authoritative scoring, and encrypted/signed sync.

## License

MIT
