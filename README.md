# Realtime Browser Games

A no-login multiplayer game app built with React, Vite, Tailwind CSS, Node, Express, and Socket.IO.

The app currently includes three realtime games:

- Bingo
- Hand Cricket
- TAG

## Shared Features

- Nickname-only room entry
- Host-created rooms with shareable six-character room codes
- Active room browser on the home screen
- Realtime room updates over Socket.IO
- Copyable room links with game type and room code
- Host-controlled room settings before the game starts
- RAM-only server state
- Automatic room cleanup when the last player leaves

## Bingo

Realtime turn-based Bingo for 2 to 4 players.

### Bingo Features

- Player-sized number boards based on player count
- Auto-generated or manually entered boards
- Host can add bot players
- Turn-based number calling
- Mouse/touch number calling from the board
- Keyboard number calling for the current turn
- Optional click/call animations using the sparkles toggle
- Live called-number history
- Server-verified Bingo claims
- Winner result screen with restart support

### Bingo Controls

- Click a board cell to call that number on your turn.
- Type a number on the keyboard to call it on your turn.
- Press `Enter` to commit a partially typed number early.
- Press `Escape` to cancel a partially typed number.
- Use the sparkles button to turn call animations on or off.

## Hand Cricket

Realtime Hand Cricket with classic 1v1 mode and team mode.

### Hand Cricket Features

- Classic two-player match
- Team mode with captains, teams, batting order, and player selection
- Odd/even toss flow
- Secret number picks from 0 to 10
- Same-number wicket rule
- Innings, target chase, wickets, score, strike rate, and economy tracking
- Timed toss, decision, selection, and ball-pick phases
- Mouse/touch number picking
- Keyboard number picking
- Optional pick animations using the sparkles toggle
- Restart support for the host

### Hand Cricket Controls

- Click a number from `0` to `10` during toss or ball selection.
- Press `0` to `9` on the keyboard to pick that number.
- Press `1` then `0` quickly to pick `10`.
- Use the sparkles button to turn pick animations on or off.

## TAG

Realtime same-keyboard platform chase game for 2 to 4 players.

### TAG Features

- Same-room realtime chase gameplay
- Configurable player count
- Configurable round length: 60, 120, or 180 seconds
- Three maps: Grass, Winter, and Desert
- Platform movement with jumping
- Teleporters and map obstacles
- One player is marked `It`; tagging passes `It` to another player
- The player who is `It` when time runs out loses
- Host restart support

### TAG Controls

- Move left: `A` or `ArrowLeft`
- Move right: `D` or `ArrowRight`
- Jump: `W`, `ArrowUp`, or `Space`

## Local Development

Install dependencies from the repository root:

```bash
npm install
```

Run the server and client together:

```bash
npm run dev
```

Client: `http://localhost:5173`

Server: `http://localhost:4000`

If PowerShell blocks `npm.ps1` on Windows, use `npm.cmd`:

```bash
npm.cmd run dev
```

## Useful Scripts

```bash
npm run client
npm run server
npm run build
npm run start
```

## Deployment

Set `VITE_SERVER_URL` in the client environment to the deployed backend URL.

Set `CLIENT_ORIGIN` on the server to the deployed frontend URL. Multiple origins can be comma-separated.
