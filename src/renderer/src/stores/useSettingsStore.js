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

const persist = () => (set, get) => (next) => async (partial) => {
	await next(partial)
	const s = get()
	window.electron.ipcRenderer.invoke("writeConfigFile", {
		path: "settings.json",
		content: JSON.stringify({
			volume: s.volume ?? defaults.volume,
			powerSavingMode: s.powerSavingMode ?? defaults.powerSavingMode,
			defaultAutoplay: s.defaultAutoplay ?? defaults.defaultAutoplay,
			shufflePlay: s.shufflePlay ?? defaults.shufflePlay,
			loopMode: s.loopMode ?? defaults.loopMode,
			tab: s.tab ?? defaults.tab,
			libraryLocations: s.libraryLocations ?? defaults.libraryLocations,
			libraryFilter: s.libraryFilter ?? defaults.libraryFilter,
			downloadLocation: s.downloadLocation ?? defaults.downloadLocation,
			playlistsFolded: s.playlistsFolded ?? defaults.playlistsFolded,
			albumsFolded: s.albumsFolded ?? defaults.albumsFolded,
			ytCookiesEnabled: s.ytCookiesEnabled ?? defaults.ytCookiesEnabled,
			ytCookiesBrowser: s.ytCookiesBrowser ?? defaults.ytCookiesBrowser,
			showYtCookiesHint: s.showYtCookiesHint ?? defaults.showYtCookiesHint,
			showLyricsPanel: s.showLyricsPanel ?? defaults.showLyricsPanel
		})
	})
}

const defaults = {
	volume: 0.45,
	powerSavingMode: false,
	defaultAutoplay: true,
	shufflePlay: false,
	loopMode: "off", // queue, current, off
	tab: "library",
	libraryLocations: [],
	libraryFilter: "songs",
	downloadLocation: "",
	playlistsFolded: false,
	albumsFolded: false,
	ytCookiesEnabled: false,
	ytCookiesBrowser: "",
	showYtCookiesHint: true,
	showLyricsPanel: false
}

export const useSettingsStore = create(
	(set) => ({
		volume: defaults.volume,
		powerSavingMode: defaults.powerSavingMode,
		defaultAutoplay: defaults.defaultAutoplay,
		shufflePlay: defaults.shufflePlay,
		loopMode: defaults.loopMode, // queue, current, off
		tab: defaults.tab,
		libraryLocations: defaults.libraryLocations,
		libraryFilter: defaults.libraryFilter,
		downloadLocation: defaults.downloadLocation,
		playlistsFolded: defaults.playlistsFolded,
		albumsFolded: defaults.albumsFolded,
		ytCookiesEnabled: defaults.ytCookiesEnabled,
		ytCookiesBrowser: defaults.ytCookiesBrowser,
		showYtCookiesHint: defaults.showYtCookiesHint,
		showLyricsPanel: defaults.showLyricsPanel,
		forceRefreshLocationsTracker: defaults.forceRefreshLocationsTracker,
		setVolume: (v) => set((state) => ({ volume: v })),
		setDefaultAutoplay: (v) => set((state) => ({ defaultAutoplay: v })),
		setShufflePlay: (v) => set((state) => ({ shufflePlay: v })),
		setLoopMode: (v) => set((state) => ({ loopMode: v })),
		setTab: (v) => set((state) => ({ tab: v })),
		setPowerSavingMode: (v) => set((state) => ({ powerSavingMode: v })),
		setLibraryLocations: (v) => set((state) => ({ libraryLocations: v })),
		setLibraryFilter: (v) => set((state) => ({ libraryFilter: v })),
		setDownloadLocation: (v) => set((state) => ({ downloadLocation: v })),
		setPlaylistsFolded: (v) => set((state) => ({ playlistsFolded: v })),
		setAlbumsFolded: (v) => set((state) => ({ albumsFolded: v })),
		setYtCookiesEnabled: (v) => set((state) => ({ ytCookiesEnabled: v })),
		setYtCookiesBrowser: (v) => set((state) => ({ ytCookiesBrowser: v })),
		setShowYtCookiesHint: (v) => set((state) => ({ showYtCookiesHint: v })),
		setShowLyricsPanel: (v) => set((state) => ({ showLyricsPanel: v })),
		setForceRefreshLocationsTracker: (v) =>
			set((state) => ({ forceRefreshLocationsTracker: v })),
		setSettings: (s) =>
			set((state) => ({
				volume: s.volume ?? defaults.volume,
				powerSavingMode: s.powerSavingMode ?? defaults.powerSavingMode,
				defaultAutoplay: s.defaultAutoplay ?? defaults.defaultAutoplay,
				shufflePlay: s.shufflePlay ?? defaults.shufflePlay,
				loopMode: s.loopMode ?? defaults.loopMode,
				tab: s.tab ?? defaults.tab,
				libraryLocations: s.libraryLocations ?? defaults.libraryLocations,
				libraryFilter: s.libraryFilter ?? defaults.libraryFilter,
				downloadLocation: s.downloadLocation ?? defaults.downloadLocation,
				playlistsFolded: s.playlistsFolded ?? defaults.playlistsFolded,
				albumsFolded: s.albumsFolded ?? defaults.albumsFolded,
				ytCookiesEnabled: s.ytCookiesEnabled ?? defaults.ytCookiesEnabled,
				ytCookiesBrowser: s.ytCookiesBrowser ?? defaults.ytCookiesBrowser,
				showYtCookiesHint: s.showYtCookiesHint ?? defaults.showYtCookiesHint,
				showLyricsPanel: s.showLyricsPanel ?? defaults.showLyricsPanel,
				forceRefreshLocationsTracker: defaults.forceRefreshLocationsTracker
			}))
	}),
	[persist()]
)
