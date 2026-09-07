import { create } from 'zustic'

const persist = () => (set, get) => (next) => async (partial) => {
  await next(partial)
  window.electron.ipcRenderer.invoke('writeConfigFile', {
    path: 'playlists.json',
    content: JSON.stringify(get())
  })
}

export const usePlaylistsStore = create(
  (set) => ({
    playlists: [], //[ { name, songs: ["path/to/song1"] } ]
    setPlaylists: (v) => set((state) => ({ playlists: v }))
  }),
  [persist()]
)
