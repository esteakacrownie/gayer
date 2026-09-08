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

import { useState } from "react"
import { FaFolder } from "react-icons/fa6"
import SongFilesList from "./SongFilesList"
import { getFolderName, getSortedFilesAt, shuffleArray } from "../utils"
import { useFilesStore } from "../stores/useFilesStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import {
	MdAddCircleOutline,
	MdCheckCircleOutline,
	MdPlayArrow,
	MdPlaylistAdd,
} from "react-icons/md"
import PowerSavingButton from "./PowerSavingButton"
import { useSettingsStore } from "../stores/useSettingsStore"
import { cn } from "@sglara/cn"

export default function FileSystemTab() {
	const { setFiles } = useFilesStore()

	const { queue, setQueue, setAutoplay, setNextAction, currentTrack } =
		usePlayerStore()

	const { libraryLocations, setLibraryLocations, tab, setTab, shufflePlay } =
		useSettingsStore()

	const [folderSongs, setFolderSongs] = useState([])
	const [folder, setFolder] = useState("")

	const openFolder = async () => {
		const dir = await window.electron.ipcRenderer.invoke("open_folder", {})
		if (!dir) return
		setFolder(dir)
		const { songs, timed } = await getSortedFilesAt(dir, true)
		setFiles(timed)
		setFolderSongs(songs)
	}

	const handlePlayAll = () => {
		if (folderSongs.length == 0) return
		setAutoplay(true)
		const list = shufflePlay ? shuffleArray(folderSongs) : folderSongs
		setQueue([...new Set(list.concat(queue))])
		setNextAction("setNext")
		setTab("queue")
	}

	const handleAddToQueue = () => {
		if (folderSongs.length == 0) return
		const list = shufflePlay ? shuffleArray(folderSongs) : folderSongs
		setQueue([...new Set(queue.concat(list))])
		if (queue.length == 0 && currentTrack == "") {
			setNextAction("setNext")
		}
		setTab("queue")
	}

	const handleAddLibrary = () => {
		if (!folder) return
		if (libraryLocations.includes(folder)) {
			setLibraryLocations([
				...new Set(libraryLocations.filter((elt) => elt != folder)),
			])
		} else {
			setLibraryLocations([...new Set(libraryLocations.concat(folder))])
		}
	}

	if (tab != "filesystem") return

	return (
		<>
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={handleAddToQueue}
				>
					<MdPlaylistAdd size={16} />
					<span>Add all to queue</span>
				</button>
				<button
					className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={handlePlayAll}
				>
					<MdPlayArrow size={16} />
					<span>Play all</span>
				</button>
				<button
					className={cn(
						"flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
						libraryLocations.includes(folder)
							? "bg-violet-950 hover:bg-violet-900"
							: "",
					)}
					onClick={handleAddLibrary}
				>
					{libraryLocations.includes(folder) ? (
						<MdCheckCircleOutline size={16} />
					) : (
						<MdAddCircleOutline size={16} />
					)}
					<span>
						{libraryLocations.includes(folder)
							? "In Library"
							: "Add to Library"}
					</span>
				</button>
				<PowerSavingButton />
			</div>
			<div
				className="flex flex-row items-center px-2 bg-slate-800 hover:bg-slate-700 border-2 border-slate-400 rounded-lg cursor-pointer transition ease-out duration-200"
				onClick={openFolder}
			>
				<FaFolder size={16} />
				<span className="m-2 line-clamp-1">
					{getFolderName(folder ?? "") || "Choose directory..."}
				</span>
			</div>
			<SongFilesList />
		</>
	)
}
