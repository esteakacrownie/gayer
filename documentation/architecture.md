# Project Architecture

Gayer, as an Electron application, is built in 3 distinct parts:

1. The [main process](./main.md)
   <br/>
   This is the part of the application responsible for the lower level processing, including but not limited, to:
    - filesystem management
    - application initialization
    - spawning windows
    - managing callbacks ("handlers") from the renderer process
2. The [preloading script](./preload.md)
   <br/>
   This part of the application serves as a bridge between the main process and the renderer process. It aims to expose methods from the main process to the renderer process using an API (typically by giving the `window` object extra properties and methods)
3. The [renderer process](./renderer.md)
   <br/>
   Its role is to handle the front-end of the application, such as:
    - presenting the UI to the user
    - handling use input
    - sending data to the back-end (main process) using the handles exposed by the preloading script

The content of the project (the code that runs the application) is bundled in `src/`. The 3 parts mentioned above are bundled respectively in `src/main/`, `src/preload/`, and `src/renderer`.

Gayer is built upon the following stack:

- Electron-Vite (template, boilerplate)
- React.js (front-end framework)
- Node.js (back-end framework)
- Electron-Builder (bundler)
- Prettier + Eslint (formatting and linting)
- Tailwind CSS (styling framework)

Gayer makes use of the following [extra packages](../package.json):

- ytmusic-api (queries wrapper for YouTube Music)
- cn (Tailwind CSS utility to merge classes with priority management)
- braccato/parsers (parsing lyrics request content into exploitable data to be displayed)
- album-art (Spotify cover artworks query wrapper)
- motion (framework to animate react components)
- ytdlp-nodejs (yt-dlp binary wrapper for Node.js, to manage downloads from YouTube)
- zustic (lightweight equivalent of Zustand, global reactive state manager)
- appdirsjs (provides standard api to access global system user data directories)
