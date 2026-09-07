import { create } from 'zustic'

const persist = () => (set, get) => (next) => async (partial) => {
  await next(partial)
  window.electron.ipcRenderer.invoke('writeConfigFile', {
    path: 'settings.json',
    content: JSON.stringify(get())
  })
}

export const useSettingsStore = create(
  (set) => ({
    volume: 0.45,
    powerSavingMode: false,
    defaultAutoplay: true,
    shufflePlay: false,
    loopMode: 'off', // queue, current, off
    tab: 'queue',
    libraryLocations: [],
    libraryFilter: 'locations',
    setVolume: (v) => set((state) => ({ volume: v })),
    setDefaultAutoplay: (v) => set((state) => ({ defaultAutoplay: v })),
    setShufflePlay: (v) => set((state) => ({ shufflePlay: v })),
    setLoopMode: (v) => set((state) => ({ loopMode: v })),
    setTab: (v) => set((state) => ({ tab: v })),
    setPowerSavingMode: (v) => set((state) => ({ powerSavingMode: v })),
    setLibraryLocations: (v) => set((state) => ({ libraryLocations: v })),
    setLibraryFilter: (v) => set((state) => ({ libraryFilter: v })),
    setSettings: (s) =>
      set((state) => ({
        volume: s.volume ?? 0.45,
        powerSavingMode: s.powerSavingMode ?? false,
        defaultAutoplay: s.defaultAutoplay ?? true,
        shufflePlay: s.shufflePlay ?? false,
        loopMode: s.loopMode ?? 'off',
        tab: s.tab ?? 'queue',
        libraryLocations: s.libraryLocations ?? [],
        libraryFilter: s.libraryFilter ?? 'playlists'
      }))
  }),
  [persist()]
)
