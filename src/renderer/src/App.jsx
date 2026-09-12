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

import { useEffect } from "react"
import "./App.css"
import Player from "./components/Player"
import { usePlayerStore } from "./stores/usePlayerStore"
import { handleDropped, shuffleArray } from "./utils"
import DragDropHandler from "./components/DragDropHandler"
import { useSettingsStore } from "./stores/useSettingsStore"
import Tabs from "./components/Tabs"
import FileSystemTab from "./components/FileSystemTab"
import QueueTab from "./components/QueueTab"
import LibraryTab from "./components/LibraryTab"
import { useCacheStore } from "./stores/useCacheStore"
import PlaylistDialog from "./components/PlaylistDialog"
import { usePlaylistsStore } from "./stores/usePlaylistsStore"

function App() {
	const { setQueue, setAutoplay, setNextAction } = usePlayerStore()
	const { setSettings } = useSettingsStore()
	const { setCache } = useCacheStore()
	const { setPlaylists } = usePlaylistsStore()

	useEffect(() => {
		// load settings
		let shufflePlayOnStart = false
		window.electron.ipcRenderer
			.invoke("readConfigFile", { path: "settings.json" })
			.then((d) => {
				const settings = JSON.parse(d)
				// console.log(settings)
				shufflePlayOnStart = settings.shufflePlay ?? false
				setSettings(settings)
			})
			.catch(() => console.log("Couldn't parse settings file"))
		// load cache
		window.electron.ipcRenderer
			.invoke("readConfigFile", { path: "cache.json" })
			.then((d) => setCache(JSON.parse(d)))
			.catch(() => console.log("Couldn't parse cache file"))
		// load playlists
		window.electron.ipcRenderer
			.invoke("readConfigFile", { path: "playlists.json" })
			.then((d) => {
				// console.log(d)
				const parsed = JSON.parse(d)
				const data = Array.isArray(parsed) ? parsed : []
				setPlaylists(data)

			})
			.catch(() => console.log("Couldn't parse playlists file"))
		// parse arguments
		window.electron.ipcRenderer.invoke("get_args", {})
			.then((elt) => {
				// console.log(elt)
				return handleDropped(elt)
			})
			.then((songs) => {
				// const songs = elt.args.files.value.filter((v) => isMusicFile(v))
				if (songs && songs.length < 1) return
				setAutoplay(true)
				setQueue([...new Set(shufflePlayOnStart ? shuffleArray(songs) : songs)])
				setNextAction('setArgQueue')
			})
			.catch((e) => console.log(e))
	}, [])

	return (
		<main className="text-white from-slate-950 to-pink-950 to-150% via-slate-950 via-30% bg-linear-180 flex flex-col justify-start overflow-y-scroll h-screen gap-4 pt-20 select-none">
			<div className="px-8 flex flex-col w-full h-full justify-start gap-4 max-w-200 mx-auto">
				<LibraryTab />
				<QueueTab />
				<FileSystemTab />
				<div className="my-24">&nbsp;</div>
			</div>
			<Tabs />
			<DragDropHandler />
			<PlaylistDialog />
			<Player />
		</main>
	)
}

export default App
