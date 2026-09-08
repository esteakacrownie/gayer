/* Copyright (C) 2026 esteakacrownie

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>. */

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
