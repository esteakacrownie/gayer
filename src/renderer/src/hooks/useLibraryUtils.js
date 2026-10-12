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

import { useCallback } from "react"
import { useLibraryStore } from "../stores/useLibraryStore"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function useLibraryUtils() {
	const { setSearch } = useLibraryStore()
	const { setTab, setLibraryFilter, setAlbumsFolded, setPlaylistsFolded } = useSettingsStore()

	const showSongInLibrary = useCallback(
		(name) => {
			setLibraryFilter("songs")
			setTab("library")
			setSearch(name)
		},
		[setLibraryFilter, setSearch, setTab]
	)

	const showAlbumInLibrary = useCallback(
		(name) => {
			setLibraryFilter("playlists")
			setPlaylistsFolded(false)
			setAlbumsFolded(false)
			setTab("library")
			setSearch(name)
		},
		[setAlbumsFolded, setLibraryFilter, setSearch, setPlaylistsFolded, setTab]
	)

	return {
		showSongInLibrary,
		showAlbumInLibrary
	}
}
