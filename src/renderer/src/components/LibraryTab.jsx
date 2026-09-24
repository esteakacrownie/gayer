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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IoMdArrowDropdown, IoMdClose } from "react-icons/io"
import { GiCompactDisc } from "react-icons/gi"
import { IoMusicalNotes, IoChevronBack } from "react-icons/io5"
import { FaFolder } from "react-icons/fa6"
import {
	MdAddCircleOutline,
	MdInfoOutline,
	MdPlayArrow,
	MdPlaylistAdd,
	MdRefresh,
	MdSettings
} from "react-icons/md"
import {
	getFolderName,
	getSongName,
	getSortedFilesAt,
	isMusicFile,
	shuffleArray,
	toSearchString,
	albumArtQueryForPath
} from "../utils"
import SongElement from "./SongElement"
import { usePlayerStore } from "../stores/usePlayerStore"
import PlaylistElement from "./PlaylistElement"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import PlaylistExportButton from "./PlaylistExportButton"
import DeletePlaylistButton from "./DeletePlaylistButton"
import EditablePlaylistSongList from "./EditablePlaylistSongList"
import { useLibraryStore } from "../stores/useLibraryStore"
import { motion } from "motion/react"
import { PiPlaylist } from "react-icons/pi"
import { useFilesStore } from "../stores/useFilesStore"
import { useCacheStore } from "../stores/useCacheStore"

export default function LibraryTab() {
	const maxLength = 25

	const {
		queue,
		setQueue,
		history,
		setHistory,
		currentTrack,
		setAutoplay,
		setNextAction,
		selectedPlaylist,
		setSelectedPlaylist
	} = usePlayerStore()

	const {
		libraryFilter,
		setLibraryFilter,
		libraryLocations,
		setLibraryLocations,
		forceRefreshLocationsTracker,
		powerSavingMode,
		tab,
		setTab,
		shufflePlay,
		playlistsFolded,
		setPlaylistsFolded,
		albumsFolded,
		setAlbumsFolded
	} = useSettingsStore()

	const { playlists, setSelectedSongPath } = usePlaylistsStore()
	const { getPlaylistFromId, idInPlaylists } = usePlaylistUtils()
	const { search, setSearch } = useLibraryStore()
	const { filesIgnoreExistenceCheck } = useFilesStore()

	const [songs, setSongs] = useState([])
	const [songsScrollPage, setSongsScrollPage] = useState(1)
	const [albumSongsCount, setAlbumSongsCount] = useState([])
	const [selectedAlbumSongs, setSelectedAlbumSongs] = useState([]) // unfiltered

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

	const handlePlayAll = () => {
		if (filteredSongs.length == 0) return
		let list =
			libraryFilter == "songs"
				? filteredSongs
				: selectedPlaylist
					? filteredSelectedAlbumSongs
					: filteredAlbumsSongs
		// console.log(list)
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
			libraryFilter == "songs"
				? filteredSongs
				: selectedPlaylist
					? filteredSelectedAlbumSongs
					: filteredAlbumsSongs
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
		let page = Math.min(Math.ceil(filteredSongs.length / maxLength), songsScrollPage + 1)
		setSongsScrollPage(page)
	}

	const scrollSongPageLess = () => {
		let page = Math.max(1, songsScrollPage - 1)
		setSongsScrollPage(page)
	}

	const filteredSongs = useMemo(() => {
		const res = songs.filter((n) =>
			toSearchString(`${getFolderName(n)} - ${getSongName(n)}`).includes(
				toSearchString(search)
			)
		)
		return res
	}, [songs, search])

	const hasAlbumFilteredSong = useCallback(
		(elt) => {
			for (let s of filteredSongs) {
				if (s.includes(elt)) {
					return true
				}
			}
			return false
		},
		[filteredSongs]
	)

	const fetchSongs = useCallback(async () => {
		let allSongs = []

		// from library locations and subfolders
		for (let i of libraryLocations) {
			const { songs: sorted } = await getSortedFilesAt(i)
			allSongs = [...new Set(allSongs.concat(sorted.filter((s) => isMusicFile(s))))]
			const dirs = await window.electron.ipcRenderer.invoke("ls_dirs", { path: i })
			for (let j of dirs) {
				const { songs: album_sorted } = await getSortedFilesAt(j)
				allSongs = [...new Set(allSongs.concat(album_sorted.filter((s) => isMusicFile(s))))]
			}
		}

		// from playlists + check songs exist
		let playlistSongs = []
		for (let i of playlists) {
			playlistSongs = [...playlistSongs, ...i.songs]
		}
		const playlistSongsExistDb = await window.electron.ipcRenderer.invoke("get_files_exist", {
			paths: [...new Set(playlistSongs)]
		})
		let playlistSongsExist = []
		Object.keys(playlistSongsExistDb).map((e) => {
			if (playlistSongsExistDb[e] === true) {
				playlistSongsExist.push(e)
			}
		})
		allSongs = [...new Set(allSongs.concat(playlistSongsExist))]
		// console.log(allSongs)
		return allSongs
	}, [playlists, libraryLocations])

	const fetchSelectedAlbumSongs = useCallback(async () => {
		if (!idInPlaylists(selectedPlaylist)) {
			const { songs: album_sorted } = await getSortedFilesAt(selectedPlaylist)
			// console.log(album_sorted)
			setSelectedAlbumSongs(album_sorted.filter((s) => isMusicFile(s)))
		} else {
			setSelectedAlbumSongs(getPlaylistFromId(selectedPlaylist).songs)
		}
	}, [selectedPlaylist, idInPlaylists, setSelectedAlbumSongs, getPlaylistFromId])

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
		// setSongs([])
		// setAlbumSongsCount([])
		// setSelectedAlbumSongs([])
		fetchSongs()
			.then((s) => setSongs(s))
			.catch(() => console.log("Couldn't fetch songs"))
		fetchAlbumsSongsCount()
			.then((c) => setAlbumSongsCount(c))
			.catch(() => console.log("Couldn't fetch albums"))
	}

	const hasPlaylistFilteredSong = useCallback(
		(elt) => {
			for (let s of filteredSongs) {
				if (elt.songs.includes(s)) {
					return true
				}
			}
			return false
		},
		[filteredSongs]
	)

	const filteredPlaylists = useMemo(() => {
		return playlists.filter((elt) => {
			const element = getPlaylistFromId(elt.id)
			return (
				toSearchString(element.name).includes(toSearchString(search)) ||
				hasPlaylistFilteredSong(element)
			)
		})
	}, [playlists, search, getPlaylistFromId, hasPlaylistFilteredSong])

	const filteredAlbums = useMemo(() => {
		return albumSongsCount.filter(
			(elt) =>
				toSearchString(getFolderName(elt.path)).includes(toSearchString(search)) ||
				hasAlbumFilteredSong(elt.path)
		)
	}, [albumSongsCount, search, hasAlbumFilteredSong])

	const filteredAlbumsSongs = useMemo(() => {
		let list = []
		filteredAlbums.map((elt) => {
			list = list.concat(songs.filter((s) => s.includes(elt.path)))
		})
		filteredPlaylists.map((e) => {
			list = list.concat(getPlaylistFromId(e.id).songs)
		})
		return [...new Set(list)]
	}, [filteredAlbums, filteredPlaylists, getPlaylistFromId, songs])

	const filteredSelectedAlbumSongs = useMemo(() => {
		return selectedAlbumSongs.filter((n) =>
			toSearchString(`${getFolderName(n)} - ${getSongName(n)}`).includes(
				toSearchString(search)
			)
		)
	}, [selectedAlbumSongs, search])

	// fetch album or playlist songs upon browsing
	useEffect(() => {
		if (selectedPlaylist) {
			fetchSelectedAlbumSongs()
		} else {
			setSelectedAlbumSongs([])
		}
	}, [selectedPlaylist, songs, playlists])

	// refresh content on disk update
	useEffect(() => {
		refreshLocationsContent()
	}, [libraryLocations, forceRefreshLocationsTracker])

	// reset scroll page on search filter update
	useEffect(() => {
		setSongsScrollPage(
			Math.max(Math.min(songsScrollPage, Math.ceil(filteredSongs.length / maxLength)), 1)
		)
		setSongsScrollPage(1)
	}, [filteredSongs])

	// remove non-existent media from queue and history
	useEffect(() => {
		const ignore = filesIgnoreExistenceCheck.filter((e) => !songs.includes(e))
		setQueue([...queue.filter((e) => songs.includes(e) || ignore.includes(e))])
		setHistory([...history.filter((e) => songs.includes(e) || ignore.includes(e))])
		if (!songs.includes(currentTrack) && !ignore.includes(currentTrack)) {
			setNextAction("setNext")
		}
	}, [songs])

	if (tab != "library") return

	return (
		<>
			<CoverArtUpdater songs={songs} />
			{/* Main toolbar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={refreshLocationsContent}
				>
					<MdRefresh size={16} />
					<span>Refresh</span>
					<div className="absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200" />
				</button>
				{libraryFilter == "locations" && (
					<>
						<button
							className={cn(
								"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
								libraryLocations.length == 0 &&
									"bg-slate-700 hover:bg-slate-600 brightness-120 contrast-125 shadow-purple-500/25 shadow-[0_0_7px_7px]"
							)}
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
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={handleAddAllToQueue}
						>
							<MdPlaylistAdd size={16} />
							<span>Add all to queue</span>
						</button>
						<button
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
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
						"outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pr-8 transition ease-out duration-200",
						"focus:shadow-pink-400/40"
					)}
					autoFocus
					type="text"
					spellCheck={false}
					placeholder="Search your Library"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<button
					className="absolute outline-none right-0 top-0 h-full p-2 cursor-pointer hover:scale-125 active:scale-95 transition ease-out duration-200"
					onClick={clearSearch}
				>
					<IoMdClose size={20} />
				</button>
			</div>
			{/* Filter bar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						libraryFilter == "songs" && "brightness-105"
					)}
					onClick={() => {
						setLibraryFilter("songs")
					}}
				>
					<IoMusicalNotes size={14} />
					<span>Songs</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full  top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "songs" ? "bg-pink-300 outline-2 outline-pink-300" : ""
						)}
					/>
				</button>
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						libraryFilter == "playlists" && "brightness-105"
					)}
					onClick={() => {
						setLibraryFilter("playlists")
					}}
				>
					<GiCompactDisc size={14} />
					<span>Playlists</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full  top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "playlists"
								? "bg-pink-300 outline-2 outline-pink-300"
								: ""
						)}
					/>
				</button>
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer shadow-purple-400/35 shadow-[0_0_3px_3px]",
						libraryFilter == "locations" && "brightness-105",
						libraryLocations.length == 0 &&
							libraryFilter != "locations" &&
							"bg-slate-700 hover:bg-slate-600 brightness-120 contrast-125 shadow-purple-500/25 shadow-[0_0_7px_7px]"
					)}
					onClick={() => {
						setLibraryFilter("locations")
					}}
				>
					<FaFolder size={12} />
					<span>Locations</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							libraryFilter == "locations"
								? "bg-pink-300 outline-2 outline-pink-300"
								: ""
						)}
					/>
				</button>
				{libraryFilter != "locations" &&
					!(libraryFilter == "playlists" && selectedPlaylist) && (
						<>
							<div className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700">
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
				{libraryFilter == "playlists" && (
					<>
						<button
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={() => {
								setSelectedSongPath("*")
							}}
						>
							<MdSettings size={16} />
							<span>Manage playlists</span>
						</button>
					</>
				)}
				{libraryFilter == "playlists" && selectedPlaylist && (
					<>
						{idInPlaylists(selectedPlaylist) && <PlaylistExportButton />}
						<DeletePlaylistButton pid={selectedPlaylist} />
					</>
				)}
			</div>
			{/* Content */}
			{libraryFilter == "locations" && (
				<motion.ul className="flex flex-col gap-2">
					{libraryLocations.map((elt) => (
						<motion.li
							layout
							key={elt}
							className="relative p-1 flex flex-col justify-around items-start rounded-lg overflow-clip font-bold text-white/75 bg-slate-800 select-none border-2 border-slate-400/50"
						>
							<span className="ml-2 line-clamp-1 text-shadow-lg text-shadow-black/25">
								{getFolderName(elt)}
							</span>
							<span className="ml-2 line-clamp-1 text-xs opacity-75">{elt}</span>
							<button
								onClick={() => {
									removeLocation(elt)
								}}
								className="h-full w-8 absolute top-0 right-0 flex flex-col justify-center items-center cursor-pointer hover:scale-125 transition ease-out duration-200"
							>
								<IoMdClose size={20} />
							</button>
						</motion.li>
					))}
				</motion.ul>
			)}
			{libraryFilter == "playlists" && (
				<>
					{selectedPlaylist ? (
						<>
							{" "}
							{/* Is a custom playlist ? */}
							{idInPlaylists(selectedPlaylist) ? (
								<EditablePlaylistSongList
									songs={selectedAlbumSongs}
									filteredSongs={filteredSelectedAlbumSongs}
								/>
							) : (
								<>
									<div className="flex flex-col gap-2">
										<div className="flex flex-row justify-start gap-2">
											<motion.div
												className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
												onClick={() => setSelectedPlaylist("")}
												initial={{
													scale: 1.0
												}}
												animate={{
													scale: 1.0
												}}
												whileTap={{
													scale: 0.8
												}}
												transition={{
													duration: 0.025,
													ease: "easeOut"
												}}
											>
												<IoChevronBack size={20} />
											</motion.div>
											<div className="w-full flex flex-col pr-12 text-center justify-center">
												<p className="font-bold text-lg line-clamp-1 translate-y-px">
													{getFolderName(selectedPlaylist)}
												</p>
												<p className="font-bold text-xs line-clamp-1">
													{selectedAlbumSongs.length > 0
														? selectedAlbumSongs.length
														: ""}
													&nbsp;
													{selectedAlbumSongs.length > 0 ? "item(s)" : ""}
												</p>
											</div>
										</div>
										<motion.ul className="flex flex-col gap-2">
											{filteredSelectedAlbumSongs.map((elt) => (
												<motion.li layout key={elt}>
													<SongElement song={elt} />
												</motion.li>
											))}
										</motion.ul>
									</div>
								</>
							)}
						</>
					) : (
						<motion.ul className="flex flex-col gap-2">
							<motion.li
								layout
								key="PlaylistFolder"
								className="flex flex-row items-center gap-2 cursor-pointer bg-pink-400/35 hover:bg-pink-400/50 px-2 py-1 rounded-lg transition ease-out duration-200"
								onClick={() => setPlaylistsFolded(!playlistsFolded)}
							>
								<motion.div
									initial={{
										rotate: playlistsFolded ? "-90deg" : 0
									}}
									animate={{
										rotate: playlistsFolded ? "-90deg" : 0
									}}
								>
									<IoMdArrowDropdown size={24} />
								</motion.div>
								<PiPlaylist size={20} />
								<span className="line-clamp-1 font-bold">Playlists</span>
							</motion.li>
							{!playlistsFolded &&
								filteredPlaylists.map((elt) => (
									<motion.li layout key={elt.id}>
										<PlaylistElement
											playlist={elt.id}
											count={getPlaylistFromId(elt.id).songs.length}
											isPlaylist={true}
										/>
									</motion.li>
								))}
							<motion.li
								layout
								key="AlbumFolder"
								className="flex flex-row items-center gap-2 cursor-pointer bg-pink-400/35 hover:bg-pink-400/50 px-2 py-1 rounded-lg transition ease-out duration-200"
								onClick={() => setAlbumsFolded(!albumsFolded)}
							>
								<motion.div
									initial={{
										rotate: albumsFolded ? "-90deg" : 0
									}}
									animate={{
										rotate: albumsFolded ? "-90deg" : 0
									}}
								>
									<IoMdArrowDropdown size={24} />
								</motion.div>
								<GiCompactDisc size={20} />
								<span className="line-clamp-1 font-bold">Albums</span>
							</motion.li>
							{!albumsFolded &&
								filteredAlbums.map((elt) => (
									<motion.li layout key={elt.path}>
										<PlaylistElement playlist={elt.path} count={elt.count} />
									</motion.li>
								))}
						</motion.ul>
					)}
				</>
			)}
			{libraryFilter == "songs" && (
				<motion.ul className="flex flex-col gap-2">
					{filteredSongs
						.slice(
							powerSavingMode ? (songsScrollPage - 1) * maxLength : 0,
							powerSavingMode ? songsScrollPage * maxLength - 1 : songs.length
						)
						.map((elt) => (
							<motion.li layout key={elt}>
								<SongElement song={elt} />
							</motion.li>
						))}
					{powerSavingMode && filteredSongs.length > maxLength && (
						<div className="flex flex-row my-1 gap-2 text-sm justify-center">
							<button
								className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
								onClick={scrollSongPageLess}
							>
								<span className="cursor-pointer font-bold min-w-16">Previous</span>
							</button>
							<button className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer">
								<span>
									Page {songsScrollPage} of{" "}
									{Math.ceil(filteredSongs.length / maxLength)}
								</span>
							</button>
							<button
								className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
								onClick={scrollSongPageMore}
							>
								<span className="cursor-pointer font-bold min-w-16">Next</span>
							</button>
						</div>
					)}
				</motion.ul>
			)}
		</>
	)
}

const CoverArtUpdater = ({ songs = [] }) => {
	const { thumbnailCache, setThumbnailCache } = useCacheStore()
	const { files } = useFilesStore()

	const alreadyFetchedArtPaths = useRef([])
	const processingArtPaths = useRef([])
	const thumbnailCacheRef = useRef({})

	const fetchCoverArts = useCallback(
		async (f) => {
			// console.log(f)
			let pathsFortThisThread = f
			while (pathsFortThisThread.length > 0) {
				const i = pathsFortThisThread[0]
				try {
					const art = await albumArtQueryForPath(i)
					if (!thumbnailCacheRef.current[i] && typeof art == "string") {
						const r = {}
						r[i] = art
						// appending new found cover art
						thumbnailCacheRef.current = { ...thumbnailCacheRef.current, ...r }
						// appending to paths to ignore
						alreadyFetchedArtPaths.current = [...alreadyFetchedArtPaths.current, i]
						// removing to paths being processed
						processingArtPaths.current = processingArtPaths.current.filter(
							(e) => e != i
						)
						pathsFortThisThread.splice(0, 1)
					}
				} catch (error) {
					console.log(error)
				}
			}
		},
		[thumbnailCacheRef, alreadyFetchedArtPaths]
	)
	// dynamic cover art
	useEffect(() => {
		if (alreadyFetchedArtPaths.current.length == 0) {
			alreadyFetchedArtPaths.current = Object.keys(thumbnailCache)
		}
		if (Object.keys(thumbnailCacheRef.current) == 0) {
			thumbnailCacheRef.current = { ...thumbnailCache }
		}

		const ignore = [
			...new Set([...processingArtPaths.current, ...alreadyFetchedArtPaths.current])
		]
		const f = [...new Set([...songs, ...files.map((e) => e.path)])].filter(
			(e) => !ignore.includes(e)
		)
		processingArtPaths.current = [...new Set([...processingArtPaths.current, ...f])]
		fetchCoverArts(f)
	}, [songs, files])

	// cache auto refresh
	useEffect(() => {
		const cacheUpdate = setInterval(() => {
			const paths = Object.keys(thumbnailCache)
			// console.log(paths)
			const diff = alreadyFetchedArtPaths.current.filter((e) => !paths.includes(e))
			if (diff.length > 0) {
				console.log("applying new cached covers")
				// console.log(diff)
				setThumbnailCache(thumbnailCacheRef.current)
			} else {
				console.log("nothing to update")
			}
		}, 5000)
		return () => {
			clearInterval(cacheUpdate)
		}
	}, [thumbnailCacheRef, thumbnailCache])

	return <></>
}
