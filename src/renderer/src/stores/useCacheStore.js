import { create } from 'zustic'

const persist = () => (set, get) => (next) => async (partial) => {
  await next(partial)
  // doesn't await in order not to slow the process when a lot of cache is to get saved. Rather lose cache than lag.
  window.electron.ipcRenderer.invoke('writeConfigFile', {
    path: 'cache.json',
    content: JSON.stringify(get())
  })
}

export const useCacheStore = create(
  (set) => ({
    thumbnailCache: {},
    setThumbnailCache: (v) => set((state) => ({ thumbnailCache: v })),
    setCache: (c) => set((state) => c)
  }),
  [persist()]
)
