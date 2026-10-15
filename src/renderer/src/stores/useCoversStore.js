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

import { create } from "zustic"

const defaults = {
	thumbnailCache: {},
	thumbnailCacheOverride: {}
}

const updateCovers = (v) => {
	window.electron.ipcRenderer.invoke("update_covers", { coversData: v })
	return v
}

export const useCoversStore = create((set) => ({
	thumbnailCache: defaults.thumbnailCache,
	thumbnailCacheOverride: defaults.thumbnailCacheOverride,
	setThumbnailCache: (v) => set((state) => ({ thumbnailCache: updateCovers(v) })),
	removeThumbnailEntries: (v) =>
		set((state) => {
			if (!Array.isArray(v)) return
			const res = { ...state.thumbnailCache }
			for (let i of v) {
				if (res[i]) {
					delete res[i]
				}
			}
			return { thumbnailCache: res }
		}),
	setThumbnailTracksOverride: (tracks, replacement) =>
		set((state) => {
			const res = {}
			for (let t of tracks) {
				res[t] = replacement
			}
			return { thumbnailCacheOverride: res }
		}),
	clearThumbnailCacheOverride: () => set((state) => ({ thumbnailCacheOverride: {} })),
	initThumbnailCache: (v) => set((state) => ({ thumbnailCache: v }))
}))
