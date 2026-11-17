# ytm4shadeora

Small Render-ready Node.js backend for Shadeora music search using the unofficial `youtubei.js` client.

## What it does

- `GET /health` — service health check
- `GET /api/search?q=artist+song&limit=20` — searches YouTube Music and returns song metadata
- Keeps playback in the browser through the official YouTube player; this service does not download or proxy audio
- Includes a short in-memory search cache to reduce repeated requests

## Run locally

```bash
npm install
copy .env.example .env
npm start
```

Test with `http://localhost:3000/api/search?q=Daft%20Punk`.

## Render

- Runtime: Node
- Root directory: repository root
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `FRONTEND_ORIGIN=https://shadeora.web.app`

Render provides `PORT` automatically.

## Important

This uses YouTube's unofficial internal API and is not affiliated with YouTube. It can stop working if YouTube changes its internal endpoints. The response only provides search metadata; playback should use a compliant YouTube embed in the client.
