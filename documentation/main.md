# Main process `src/main/`

This section of the application initializes the main window and the [renderer process](./renderer.md) (front-end), and provides IPC handles to expand its functionality.

## Initialization

The main process first creates global references to object instances that are gonna be used for the whole program's lifetime, as well as some utility functions:

- App identifcation information (name, ID, version, mainWindow reference)
- Functional / State variables and constants
- Object instances (YouTube Music API object)

## Background tasks

Even after the main window gets spawn, some background tasks remain active. This includes:

- Checking for updates for Gayer (`startUpdatePolling`)
- Initializing YouTube Music API (`initYTMusic`)
- Downloading and updating yt-dlp and its ffmpeg modules (`initYTModules`)

## Utils

## Privileged protocols

## Spawning main window

## Handles
