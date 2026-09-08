# Gleamy Audio Player

Local audio/music player, made without AI assistance (if that's something you value :3)

## Features

- Play local audio in different ways
  - Drag and drop multiple files and folders from your file manager onto the app to add them to the queue
  - Build and search your own custom audio library in app, by registering locations from your computer
  - Manually select a folder to open
- Reorder and shuffle queue
- Queue loop and currently played audio loop modes supported
- Power saving / appearance toggle, if your machine struggles with pretty blurs and overly long queues :p

## Hotkeys

- `space` : toggle pause / play
- `ctrl+right/left` | `ctrl+n/p` : next/previous song in queue
- `ctrl+l` : toggle loop modes
- `ctrl+s` : toggle shuffling
- `ctrl+up/down` : increase / decrease volume

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For Windows
$ npm run build:win

# For MacOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
