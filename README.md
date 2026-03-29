# Discord Soundboard UI

A lightweight React soundboard UI for your Discord bot.

## Run locally

1. `cd soundboard-ui`
2. `npm install`
3. copy `.env.example` to `.env` and adjust `VITE_API_BASE` if needed
4. `npm run dev`

## How it works

- The UI authenticates the user through your backend.
- It loads guilds and voice channels.
- It sends `POST /api/play` requests to trigger audio playback.

## Next integration step

Implement the backend routes:

- `/api/auth/login`
- `/api/auth/status`
- `/api/auth/logout`
- `/api/guilds`
- `/api/guilds/:id/voice-channels`
- `/api/play`

Then connect the React app to your Discord bot service.
