# Preloading script `src/preload/`

Exposes Electron functionality to the [renderer process](./renderer.md) (front-end) through the `window.electron` javascript object.
In the codebase, it is used in multiple ways:

- `window.electron.ipcRenderer`: access IPC (inter-process communication) in the [renderer process](./renderer.md) to send data to the [main process](./main.md) (back-end), and receive data from it.
- `window.electron.[callbackHandle]`: call a custom method (synchronously or asynchronously) exposed in `src/preload/index.js`

## Some examples of IPC usage in the app

- `window.electron.ipcRenderer.on(channel, callback(event, data))`: subscribe to a call event `channel` from the [main process](./main.md), running `callback` when receiving the event
- `window.electron.ipcRenderer.invoke(handleName, data)`: **asynchronously** trigger the registered callback matching `handleName` in the [main process](./main.md), passing `data` as the argument object

## Custom methods

- `getFilePaths(files): string[paths]`: recovers full path(s) from a File array selected by the user in the [renderer process](./renderer.md)
