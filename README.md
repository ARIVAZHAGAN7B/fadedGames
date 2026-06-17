# Realtime Bingo

A no-login multiplayer Bingo game built with React, Vite, Tailwind CSS, Node, Express, and Socket.IO.

## Features

- Nickname-only room entry
- Host-created rooms with shareable six-character codes
- RAM-only server state
- Auto-generated or manually entered boards sized by player count
- Turn-based number calling
- Live board updates over Socket.IO
- Server-verified Bingo claims
- Automatic room cleanup when the last player leaves

## Local Development

```bash
npm install
npm run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:4000`

For deployment, set `VITE_SERVER_URL` in the client environment to the deployed backend URL. Set `CLIENT_ORIGIN` on the server to the deployed frontend URL.
