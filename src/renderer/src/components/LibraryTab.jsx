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

import { cn } from "@sglara/cn"
import { useSettingsStore } from "../stores/useSettingsStore"
import PowerSavingButton from "./PowerSavingButton"
import { useCallback, useEffect, useMemo, useState } from "react"
import { IoMdClose } from "react-icons/io"
import { GiCompactDisc } from "react-icons/gi"
import { IoMusicalNotes, IoChevronBack } from "react-icons/io5"
import { FaFolder } from "react-icons/fa6"
import {
	MdAddCircleOutline,
	MdInfoOutline,
	MdPlayArrow,
	MdPlaylistAdd,
	MdRefresh,
} from "react-icons/md"
import {
	getFolderName,
	getSongName,
	getSortedFilesAt,
	isMusicFile,
	shuffleArray,
	toSearchString,
} from "../utils"
import SongElement from "./SongElement"
import { usePlayerStore } from "../stores/usePlayerStore"
import PlaylistElement from "./PlaylistElement"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"

export default function LibraryTab() {
	const maxLength = 25

	const { queue, setQueue, currentTrack, setAutoplay, setNextAction, selectedPlaylist, setSelectedPlaylist } =
		usePlayerStore()

	const {
		libraryFilter,
		setLibraryFilter,
		libraryLocations,
		setLibraryLocations,
		powerSavingMode,
		tab,
		setTab,
		shufflePlay,
	} = useSettingsStore()

	const { playlists } = usePlaylistsStore()

	const [search, setSearch] = useState("")
	const [songs, setSongs] = useState([])
	const [songsScrollPage, setSongsScrollPage] = useState(1)
	const [albumSongsCount, setAlbumSongsCount] = useState([])

	const clearSearch = () => {
		setSearch("")
	}

	const addLocation = async () => {
		const dir = await window.electron.ipcRenderer.invoke("open_folder", {})
		if (!dir) return
		if (!libraryLocations.includes(dir)) {
			setLibraryLocations([...new Set(libraryLocations.concat(dir))])
		}
	}

	const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([])

	useEffect(() => {
		if (selectedPlaylist) {
			fetchSelectedPlaylistSongs()
		} else {
			setSelectedPlaylistSongs([])
		}
	}, [selectedPlaylist, songs, playlists])

	const handlePlayAll = () => {
		if (filteredSongs.length == 0) return
		let list =
			libraryFilter == "songs" ? filteredSongs : (selectedPlaylist ? filteredSelectedPlaylistSongs : filteredAlbumsSongs)
		if (shufflePlay) {
			list = shuffleArray(list)
		}
		setAutoplay(true)
		setQueue([...new Set(list.concat(queue))])
		setNextAction("setNext")
		setTab("queue")
	}

	const handleAddAllToQueue = () => {
		if (filteredSongs.length == 0) return
		let list =
			libraryFilter == "songs" ? filteredSongs : (selectedPlaylist ? filteredSelectedPlaylistSongs : filteredAlbumsSongs)
		if (shufflePlay) {
			list = shuffleArray(list)
		}
		setQueue([...new Set(queue.concat(list))])
		if (queue.length == 0 && currentTrack == "") {
			setNextAction("setNext")
		}
		setTab("queue")
	}

	const removeLocation = (l) => {
		setLibraryLocations(libraryLocations.filter((elt) => elt != l))
	}

	const scrollSongPageMore = () => {
		let page = Math.min(
			Math.ceil(filteredSongs.length / maxLength),
			songsScrollPage + 1,
		)
		setSongsScrollPage(page)
	}

	const scrollSongPageLess = () => {
		let page = Math.max(1, songsScrollPage - 1)
		setSongsScrollPage(page)
	}

	const filteredSongs = useMemo(() => {
		return songs.filter((n) =>
			toSearchString(`${getFolderName(n)} - ${getSongName(n)}`).includes(
				toSearchString(search),
			),
		)
	}, [songs, search])

	const idInPlaylists = useCallback((id) => {
		return playlists.map((e) => e.id).includes(id)
	}, [playlists])

	const hasAlbumFilteredSong = useCallback((elt) => {
		for (let s of filteredSongs) {
			if (s.includes(elt)) {
				return true
			}
		}
		return false
	}, [filteredSongs])

	const fetchSongs = useCallback(async () => {
		let allSongs = []
		for (let i of libraryLocations) {
			const { songs: sorted } = await getSortedFilesAt(i)
			allSongs = [
				...new Set(
					allSongs.concat(sorted.filter((s) => isMusicFile(s))),
				),
			]
			const dirs = await window.electron.ipcRenderer.invoke("ls_dirs", { path: i })
			for (let j of dirs) {
				const { songs: album_sorted } = await getSortedFilesAt(j)
				allSongs = [
					...new Set(
						allSongs.concat(
							album_sorted.filter((s) => isMusicFile(s)),
						),
					),
				]
			}
		}
		for (let i of playlists) {
			allSongs = [
				...new Set(
					allSongs.concat(
						i.songs,
					),
				),
			]
		}
		// console.log(allSongs)
		return allSongs
	}, [playlists])

	const fetchSelectedPlaylistSongs = useCallback(async () => {
		if (idInPlaylists(selectedPlaylist)) {
			setSelectedPlaylistSongs(getPlaylistFromId(selectedPlaylist).songs)
		} else {
			const { songs: album_sorted } = await getSortedFilesAt(selectedPlaylist)
			// console.log(album_sorted)
			setSelectedPlaylistSongs(album_sorted.filter((s) => isMusicFile(s)))
		}
	}, [selectedPlaylist, playlists, idInPlaylists, setSelectedPlaylistSongs])

	const fetchPlaylistsSongsCount = useCallback(async () => {
		const counts = []
		for (let i of playlists) {
			counts.push({ id: i.id, name: i.name, count: i.songs.length })
		}
		// console.log(counts)
		return counts
	}, [playlists])

	// [ {AlbumPath: song count} ]
	const fetchAlbumsSongsCount = useCallback(async () => {
		let allAlbums = []
		for (let i of libraryLocations) {
			allAlbums.push(i)
			const dirs = await window.electron.ipcRenderer.invoke("ls_dirs", { path: i })
			allAlbums = allAlbums.concat(dirs)
		}
		allAlbums = [...new Set(allAlbums)]
		const counts = []
		for (let i of allAlbums) {
			const songs = await window.electron.ipcRenderer.invoke("ls", { path: i })
			const count = (songs || []).filter((elt) => isMusicFile(elt)).length
			if (!count) continue
			counts.push({ path: i, count })
		}
		// console.log(counts)
		return counts
	}, [libraryLocations])

	const refreshLocationsContent = () => {
		setSongs([])
		setAlbumSongsCount([])
		setSelectedPlaylistSongs([])
		fetchSongs()
			.then((s) => setSongs(s))
			.catch(() => console.log("Couldn't fetch songs"))
		fetchAlbumsSongsCount()
			.then((c) => setAlbumSongsCount(c))
			.catch(() => console.log("Couldn't fetch albums"))
	}

	const getPlaylistFromId = useCallback((id) => {
		return playlists.filter((e) => e.id == id)[0] ?? { id: "id", name: "", songs: [] }
	}, [playlists])

	const hasPlaylistFilteredSong = useCallback((elt) => {
		for (let s of filteredSongs) {
			if (elt.songs.includes(s)) {
				return true
			}
		}
		return false
	}, [filteredSongs])

	const filteredPlaylists = useMemo(() => {
		return playlists.filter(
			(elt) => {
				const element = getPlaylistFromId(elt.id)
				return toSearchString(element.name).includes(
					toSearchString(search),
				) || hasPlaylistFilteredSong(element)
			}
		)
	}, [playlists, search])

	const filteredAlbums = useMemo(() => {
		return albumSongsCount.filter(
			(elt) =>
				toSearchString(getFolderName(elt.path)).includes(
					toSearchString(search),
				) || hasAlbumFilteredSong(elt.path),
		)
	}, [albumSongsCount, search])

	const filteredAlbumsSongs = useMemo(() => {
		let list = []
		filteredAlbums.map((elt) => {
			list = list.concat(songs.filter((s) => s.includes(elt.path)))
		})
		filteredPlaylists.map((e) => {
			list = list.concat(getPlaylistFromId(e.id).songs)
		})
		return new Set(list)
	}, [songs, playlists, filteredAlbums, filteredPlaylists, search])

	const filteredSelectedPlaylistSongs = useMemo(() => {
		return selectedPlaylistSongs.filter((n) =>
			toSearchString(`${getFolderName(n)} - ${getSongName(n)}`).includes(
				toSearchString(search),
			),
		)
	}, [selectedPlaylistSongs, search])

	useEffect(() => {
		refreshLocationsContent()
	}, [libraryLocations, selectedPlaylist])

	useEffect(() => {
		setSongsScrollPage(
			Math.max(
				Math.min(
					songsScrollPage,
					Math.ceil(filteredSongs.length / maxLength),
				),
				1,
			),
		)
		setSongsScrollPage(1)
	}, [filteredSongs])

	if (tab != "library") return

	return (
		<>
			{/* Main toolbar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row relative gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={refreshLocationsContent}
				>
					<MdRefresh size={16} />
					<span>Refresh</span>
					<div className="absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200" />
				</button>
				{libraryFilter == "locations" && (
					<>
						<button
							className="flex flex-row relative gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={addLocation}
						>
							<MdAddCircleOutline size={16} />
							<span>Add location</span>
							<div className="absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200" />
						</button>
					</>
				)}
				{libraryFilter != "locations" && (
					<>
						<button
							className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={handleAddAllToQueue}
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
					</>
				)}
				<PowerSavingButton />
			</div>
			{/* Search bar */}
			<div className="relative w-full flex flex-row">
				<input
					className={cn(
						"outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 transition ease-out duration-200",
						"focus:shadow-pink-400/40",
					)}
					type="text"
					placeholder="Search your Library"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<button
					className="absolute right-0 top-0 h-full p-2 cursor-pointer hover:scale-125 transition ease-out duration-200"
					onClick={clearSearch}
				>
					<IoMdClose size={20} />
				</button>
			</div>
			{/* Filter bar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row relative gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={() => {
						setLibraryFilter("locations")
					}}
				>
					<FaFolder size={12} />
					<span>Locations</span>
					<div
						className={cn(
							"absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "locations"
								? "bg-pink-300 outline-2 outline-pink-300"
								: "",
						)}
					/>
				</button>

				<button
					className="flex flex-row relative gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={() => {
						setLibraryFilter("playlists")
					}}
				>
					<GiCompactDisc size={14} />
					<span>Playlists</span>
					<div
						className={cn(
							"absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "playlists"
								? "bg-pink-300 outline-2 outline-pink-300"
								: "",
						)}
					/>
				</button>
				<button
					className="flex flex-row relative gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={() => {
						setLibraryFilter("songs")
					}}
				>
					<IoMusicalNotes size={14} />
					<span>Songs</span>
					<div
						className={cn(
							"absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "songs"
								? "bg-pink-300 outline-2 outline-pink-300"
								: "",
						)}
					/>
				</button>
				{libraryFilter != "locations" && !(libraryFilter == "playlists" && selectedPlaylist) && (
					<>
						<div className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer">
							<MdInfoOutline size={16} />
							<span>
								{libraryFilter == "songs"
									? filteredSongs.length
									: filteredAlbums.length + filteredPlaylists.length}{" "}
								item(s) found
							</span>
						</div>
					</>
				)}
			</div>
			{/* Content */}
			{libraryFilter == "locations" && (
				<div className="flex flex-col gap-2">
					{libraryLocations.map((elt) => (
						<li
							key={elt}
							className="relative p-1 flex flex-col justify-around items-start rounded-lg overflow-clip font-bold text-white/75 bg-slate-800 select-none border-2 border-slate-400/50"
						>
							<span className="ml-2 line-clamp-1 text-shadow-lg text-shadow-black/25">
								{getFolderName(elt)}
							</span>
							<span className="ml-2 line-clamp-1 text-xs opacity-75">
								{elt}
							</span>
							<button
								onClick={() => {
									removeLocation(elt)
								}}
								className="h-full w-8 absolute top-0 right-0 flex flex-col justify-center items-center cursor-pointer hover:scale-125 transition ease-out duration-200"
							>
								<IoMdClose size={20} />
							</button>
						</li>
					))}
				</div>
			)}
			{libraryFilter == "playlists" && (
				<>
					{selectedPlaylist ? (
						<>
							<div className="flex flex-col gap-2">
								<div className="flex flex-row justify-start gap-2">
									<div className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200" onClick={() => setSelectedPlaylist("")}>
										<IoChevronBack size={20} />
									</div>
									<div className="w-full flex flex-col pr-12 text-center justify-center">
										<p className="font-bold text-lg line-clamp-1">{idInPlaylists(selectedPlaylist) ? getPlaylistFromId(selectedPlaylist).name : getFolderName(selectedPlaylist)}</p>
										<p className="font-bold text-xs line-clamp-1">{selectedPlaylistSongs.length > 0 ? selectedPlaylistSongs.length : ""}&nbsp;{selectedPlaylistSongs.length > 0 ? "item(s)" : ""}</p>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									{filteredSelectedPlaylistSongs
										.map((elt) => (
											<SongElement key={elt} song={elt} />
										))}
								</div>
							</div>
						</>
					) : (
						<div className="flex flex-col gap-2">
							{filteredPlaylists.map((elt) => (
								<PlaylistElement key={elt.id} playlist={elt.id} count={getPlaylistFromId(elt.id).songs.length} isPlaylist={true} />
							))}
							{filteredAlbums.map((elt) => (
								<PlaylistElement key={elt.path} playlist={elt.path} count={elt.count} />
							))}
						</div>
					)}
				</>
			)}
			{libraryFilter == "songs" && (
				<div className="flex flex-col gap-2">
					{filteredSongs
						.slice(
							powerSavingMode
								? (songsScrollPage - 1) * maxLength
								: 0,
							powerSavingMode
								? songsScrollPage * maxLength - 1
								: songs.length,
						)
						.map((elt) => (
							<SongElement key={elt} song={elt} />
						))}
					{powerSavingMode && filteredSongs.length > maxLength && (
						<div className="flex flex-row my-1 gap-2 text-sm justify-center">
							<button
								className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
								onClick={scrollSongPageLess}
							>
								<span className="cursor-pointer font-bold min-w-16">
									Previous
								</span>
							</button>
							<button className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer">
								<span>
									Page {songsScrollPage} of{" "}
									{Math.ceil(
										filteredSongs.length / maxLength,
									)}
								</span>
							</button>
							<button
								className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
								onClick={scrollSongPageMore}
							>
								<span className="cursor-pointer font-bold min-w-16">
									Next
								</span>
							</button>
						</div>
					)}
				</div>
			)}
		</>
	)
}
