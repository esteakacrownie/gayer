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

import { useCallback, useState } from "react"
import SongFilesList from "./SongFilesList"
import { getFolderName, getSortedFilesAt, shuffleArray } from "../utils"
import { useFilesStore } from "../stores/useFilesStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import {
	MdAddCircleOutline,
	MdCheckCircleOutline,
	MdPlayArrow,
	MdPlaylistAdd
} from "react-icons/md"
import PowerSavingButton from "./PowerSavingButton"
import { useSettingsStore } from "../stores/useSettingsStore"
import { cn } from "@sglara/cn"
import { IoIosFolderOpen } from "react-icons/io"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"

export default function FileSystemTab() {
	const { setFiles, setFilesIgnoreExistenceCheck } = useFilesStore()

	const { queue, setQueue, setAutoplay, setNextAction, currentTrack } = usePlayerStore()

	const { libraryLocations, setLibraryLocations, tab, setTab, shufflePlay } = useSettingsStore()

	const { setSelectedSongPath } = usePlaylistsStore()

	const [folderSongs, setFolderSongs] = useState([])
	const [folder, setFolder] = useState("")

	const openFolder = useCallback(async () => {
		const dir = await window.electron.ipcRenderer.invoke("open_folder", {})
		if (!dir) return
		setFolder(dir)
		const { songs, timed } = await getSortedFilesAt(dir, true)
		setFiles(timed)
		setFolderSongs(songs)
		setFilesIgnoreExistenceCheck(songs)
	}, [setFiles, setFilesIgnoreExistenceCheck])

	const handlePlayAll = useCallback(() => {
		if (folderSongs.length == 0) return
		setAutoplay(true)
		const list = shufflePlay ? shuffleArray(folderSongs) : folderSongs
		setQueue([...new Set(list.concat(queue))])
		setNextAction("setNext")
		setTab("queue")
	}, [folderSongs, queue, setAutoplay, setNextAction, setQueue, setTab, shufflePlay])

	const handleAddAllToPLaylist = useCallback(() => {
		if (folderSongs.length == 0) return
		setSelectedSongPath(folderSongs)
	}, [folderSongs, setSelectedSongPath])

	const handleAddToQueue = useCallback(() => {
		if (folderSongs.length == 0) return
		const list = shufflePlay ? shuffleArray(folderSongs) : folderSongs
		setQueue([...new Set(queue.concat(list))])
		if (queue.length == 0 && currentTrack == "") {
			setNextAction("setNext")
		}
		setTab("queue")
	}, [currentTrack, folderSongs, setQueue, shufflePlay, queue, setNextAction, setTab])

	const handleAddLibrary = useCallback(() => {
		if (!folder) return
		if (libraryLocations.includes(folder)) {
			setLibraryLocations([...new Set(libraryLocations.filter((elt) => elt != folder))])
		} else {
			setLibraryLocations([...new Set(libraryLocations.concat(folder))])
		}
	}, [folder, libraryLocations, setLibraryLocations])

	if (tab != "filesystem") return

	return (
		<>
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row gap-1 outline-none justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={handleAddToQueue}
				>
					<MdPlaylistAdd size={16} />
					<span>Add all to queue</span>
				</button>
				<button
					className="flex flex-row gap-1 outline-none justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={handlePlayAll}
				>
					<MdPlayArrow size={16} />
					<span>Play all</span>
				</button>
				<button
					className="flex flex-row gap-1 outline-none justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={handleAddAllToPLaylist}
				>
					<MdAddCircleOutline size={16} />
					<span>Add all to playlist</span>
				</button>
				<button
					className={cn(
						"flex flex-row gap-1 outline-none justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
						libraryLocations.includes(folder)
							? "bg-pink-900 hover:bg-pink-800 border-pink-300"
							: ""
					)}
					onClick={handleAddLibrary}
				>
					{libraryLocations.includes(folder) ? (
						<MdCheckCircleOutline size={16} />
					) : (
						<MdAddCircleOutline size={16} />
					)}
					<span>
						{libraryLocations.includes(folder) ? "In Library" : "Add to Library"}
					</span>
				</button>
				<PowerSavingButton />
			</div>
			<div
				className="flex flex-row items-center px-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-400 rounded-lg cursor-pointer transition ease-out duration-200"
				onClick={openFolder}
			>
				<IoIosFolderOpen size={20} />
				<span className="m-2 line-clamp-1">
					{getFolderName(folder ?? "") || "Choose directory..."}
				</span>
			</div>
			<SongFilesList />
		</>
	)
}
