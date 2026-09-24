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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { IoMdCheckmark, IoMdClose, IoMdDownload } from "react-icons/io"
import { TbLoader2, TbNetwork, TbNetworkOff } from "react-icons/tb"
import PowerSavingButton from "./PowerSavingButton"
import { getFolderName, getSongName, ytLogin } from "../utils"
import { motion } from "motion/react"
import { IoLogoChrome, IoLogoFirefox, IoMusicalNotes, IoWarningOutline } from "react-icons/io5"
import { GiCompactDisc, GiSpermWhale } from "react-icons/gi"
import { usePlayerStore } from "../stores/usePlayerStore"
import { MdCheckCircleOutline, MdErrorOutline } from "react-icons/md"
import { useLibraryStore } from "../stores/useLibraryStore"
import { toSanitized } from "../sanitize-filename"
import { FaBrave, FaLink, FaOpera, FaSafari } from "react-icons/fa6"
import { RiEdgeNewFill } from "react-icons/ri"
import { SiVivaldi } from "react-icons/si"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { useHotkeys } from "react-hotkeys-hook"

export default function DownloadTab() {
	const {
		tab,
		setTab,
		libraryLocations,
		downloadLocation,
		setDownloadLocation,
		forceRefreshLocationsTracker,
		setForceRefreshLocationsTracker,
		setLibraryFilter,
		setPlaylistsFolded,
		setAlbumsFolded,
		ytCookiesEnabled,
		setYtCookiesEnabled,
		ytCookiesBrowser,
		setYtCookiesBrowser,
		showYtCookiesHint,
		setShowYtCookiesHint
	} = useSettingsStore()
	const { setSearch: setLibrarySearch } = useLibraryStore()
	const { currentTrack, setNextAction, setCurrentTrack } = usePlayerStore()
	const { createPlaylist } = usePlaylistUtils()
	const searchRequestCount = useRef(0)
	const [ytdlpReady, setYtdlpReady] = useState(false)
	const [urlDownloadStatus, setUrlDownloadStatus] = useState("idle") // idle, downloading, success, failed
	const [urlDownloadedSongs, setUrlDownloadedSongs] = useState([])
	const [urlDownloadedPlaylists, setUrlDownloadedPlaylists] = useState([])
	const [urlSongExistsDb, setUrlSongExistsDb] = useState({})
	const [urlPlaylistExistsDb, setUrlPlaylistExistsDb] = useState({})
	const [search, setSearch] = useState("")
	const [isFetching, setIsFetching] = useState(false)
	const [searchSongsResults, setSearchSongsResults] = useState([])
	const [searchAlbumsResults, setSearchAlbumsResults] = useState([])
	const [hiddenAlbumsResults, setHiddenAlbumsResults] = useState([])
	const [mergedAlbumsResults, setMergedAlbumsResults] = useState([])
	// const [searchArtistsResults, setSearchArtistsResults] = useState([])
	const [queuedSongsDownload, setQueuedSongsDownload] = useState([])
	const [queuedSongsFailed, setQueuedSongsFailed] = useState([])
	const [queuedSongsComplete, setQueuedSongsComplete] = useState([])
	const [queuedAlbumsDownload, setQueuedAlbumsDownload] = useState([])
	const [queuedAlbumsFailed, setQueuedAlbumsFailed] = useState([])
	const [queuedAlbumsComplete, setQueuedAlbumsComplete] = useState([])
	const [queuedSongsDelete, setQueuedSongsDelete] = useState([])
	const [queuedAlbumsDelete, setQueuedAlbumsDelete] = useState([])
	const [songExistsDb, setSongExistsDb] = useState({})
	const [albumExistsDb, setAlbumExistsDb] = useState({})
	const [linkEnabled, setLinkEnabled] = useState(false)
	const [filter, setFilter] = useState("songs")

	const clearSearch = () => {
		setSearch("")
	}

	const showSongInLibrary = useCallback(
		(name) => {
			setLibraryFilter("songs")
			setTab("library")
			setLibrarySearch(name)
		},
		[setLibraryFilter, setLibrarySearch, setTab]
	)

	const showAlbumInLibrary = useCallback(
		(name) => {
			setLibraryFilter("playlists")
			setPlaylistsFolded(false)
			setAlbumsFolded(false)
			setTab("library")
			setLibrarySearch(name)
		},
		[setAlbumsFolded, setLibraryFilter, setLibrarySearch, setPlaylistsFolded, setTab]
	)

	const guideToLibraryLocations = () => {
		setTab("library")
		setLibraryFilter("locations")
	}

	const computedSongPath = useCallback(
		(songElt) => {
			let path = ""
			try {
				if (songElt.album?.name && songElt.artist?.name) {
					path +=
						toSanitized(
							`${songElt.album.name} - ${songElt.artist.name}`
								.replaceAll("/", " - ")
								.replaceAll("\\", " - ")
						) + "/"
				}
				if (songElt.artist.name) {
					path += toSanitized(
						`${songElt.name} - ${songElt.artist?.name}`
							.replaceAll("/", " - ")
							.replaceAll("\\", " - ")
					)
				} else {
					path += toSanitized(songElt.name.replaceAll("/", " - ").replaceAll("\\", " - "))
				}
			} catch (error) {
				console.error(error)
				// console.log(songElt)
				return
			}
			return downloadLocation + "/" + path + ".mp3"
		},
		[downloadLocation]
	)

	const computedAlbumFolder = useCallback(
		(albElt) => {
			let path = ""
			try {
				if (albElt.name && albElt.artist?.name) {
					path +=
						toSanitized(
							`${albElt.name} - ${albElt.artist.name}`
								.replaceAll("/", " - ")
								.replaceAll("\\", " - ")
						) + "/"
				}
			} catch (error) {
				console.error(error)
				// console.log(albElt)
				return
			}
			return downloadLocation + "/" + path
		},
		[downloadLocation]
	)

	const getAlbumExists = useCallback(
		async (albElt) => {
			const albSongs = albElt.songs
				? albElt.songs
				: await window.electron.ipcRenderer.invoke("get_album_songs", {
						id: albElt.albumId
					})
			// console.log(albElt.name)
			// console.log(albSongs)
			const exists = await window.electron.ipcRenderer.invoke("get_album_exists", {
				songs: (albSongs || []).map((e) => computedSongPath(e))
			})
			return exists
		},
		[computedSongPath]
	)

	const updateOneSongExists = useCallback(
		async (songElt) => {
			const path = computedSongPath(songElt)
			const exists = await window.electron.ipcRenderer.invoke("file_exists", { path: path })
			const updated = {}
			updated[songElt.videoId] = exists
			setSongExistsDb((p) => ({ ...p, ...updated }))
			return exists
		},
		[computedSongPath]
	)

	const updateOneAlbumExists = useCallback(
		async (albElt) => {
			const exists = await getAlbumExists(albElt)
			const updated = {}
			updated[albElt.albumId] = exists
			setAlbumExistsDb((p) => ({ ...p, ...updated }))
			return exists
		},
		[getAlbumExists]
	)

	const downloadSong = useCallback(
		async (songElt) => {
			if (!downloadLocation || !songElt.name) return
			setQueuedSongsDownload((p) => [...new Set([...p, songElt.videoId])])
			const path = computedSongPath(songElt)
			const result = await window.electron.ipcRenderer.invoke("download_song", {
				url: songElt.videoId,
				path: path,
				browserCookies: ytCookiesEnabled ? ytCookiesBrowser : ""
			})
			const exists = await updateOneSongExists(songElt)
			setQueuedSongsDownload((p) => p.filter((e) => e != songElt.videoId))
			if (result && exists) {
				setQueuedSongsComplete((p) => {
					if (p.map((e) => e.videoId).includes(songElt.videoId)) {
						return p
					}
					return [...p, songElt]
				})
				setQueuedSongsFailed((p) => p.filter((e) => e.videoId != songElt.videoId))
				setForceRefreshLocationsTracker((p) => p + 1)
			} else {
				setQueuedSongsFailed((p) => {
					if (p.map((e) => e.videoId).includes(songElt.videoId)) {
						return p
					}
					return [...p, songElt]
				})
				setQueuedSongsComplete((p) => p.filter((e) => e.videoId != songElt.videoId))
			}
		},
		[
			downloadLocation,
			setForceRefreshLocationsTracker,
			ytCookiesEnabled,
			ytCookiesBrowser,
			computedSongPath,
			updateOneSongExists
		]
	)

	const downloadAlbum = useCallback(
		async (albElt) => {
			if (!downloadLocation || !albElt.name) return
			setQueuedAlbumsDownload((p) => [...new Set([...p, albElt.albumId])])

			const { songs } = await window.electron.ipcRenderer.invoke("get_album", {
				id: albElt.albumId
			})
			setQueuedSongsDownload((p) => [...new Set([...p, ...songs.map((e) => e.videoId)])])
			for (let songElt of songs || []) {
				// console.log(songElt.name)
				await downloadSong(songElt)
			}

			const exists = await updateOneAlbumExists({ ...albElt, songs })
			setQueuedAlbumsDownload((p) => p.filter((e) => e != albElt.albumId))
			if (exists) {
				setQueuedAlbumsComplete((p) => {
					if (p.map((e) => e.albumId).includes(albElt.albumId)) {
						return p
					}
					return [...p, albElt]
				})
				setQueuedAlbumsFailed((p) => p.filter((e) => e.albumId != albElt.albumId))
				setForceRefreshLocationsTracker((p) => p + 1)
			} else {
				setQueuedAlbumsFailed((p) => {
					if (p.map((e) => e.albumId).includes(albElt.albumId)) {
						return p
					}
					return [...p, albElt]
				})
				setQueuedAlbumsComplete((p) => p.filter((e) => e.albumId != albElt.albumId))
			}
		},
		[downloadLocation, setForceRefreshLocationsTracker, downloadSong, updateOneAlbumExists]
	)

	const fetchSongsResults = async (q, i) => {
		const res = await window.electron.ipcRenderer.invoke("ytm_songs", { query: q })
		await refreshSongExistsDb(res)
		if (i == searchRequestCount.current) {
			setSearchSongsResults(res)
		}
	}

	const fetchAlbumsResults = async (q, i) => {
		const res = await window.electron.ipcRenderer.invoke("ytm_albums", { query: q })
		refreshAlbumExistsDb(res)
		// console.log(res)
		if (i == searchRequestCount.current) {
			setSearchAlbumsResults(res)
		}
	}

	const fetchHiddenAlbums = async (songList, i) => {
		const albums = []
		songList.map((e) => {
			if (e.album?.albumId && !albums.includes(e.album.albumId)) {
				albums.push(e.album.albumId)
			}
		})
		const albumElts = []
		for (let alb of albums) {
			const elt = await window.electron.ipcRenderer.invoke("get_album", { id: alb })
			albumElts.push(elt)
		}
		if (i == searchRequestCount.current) {
			setHiddenAlbumsResults(albumElts)
		}
	}

	const refreshSongExistsDb = async (songElts) => {
		const songs = {}
		for (let e of songElts) {
			if (Object.keys(songs).includes(e.videoId)) {
				continue
			}
			songs[e.videoId] = computedSongPath(e)
		}
		const songsExist = await window.electron.ipcRenderer.invoke("get_songs_exist", {
			songs: songs
		})
		setSongExistsDb((p) => ({ ...p, ...songsExist }))
	}

	const refreshAlbumExistsDb = async (albElts) => {
		const albums = []
		for (let elt of albElts) {
			if (albums.includes(elt.albumId)) {
				continue
			}
			albums.push(elt.albumId)
			const album = {}
			album[elt.albumId] = await getAlbumExists(elt)
			setAlbumExistsDb((p) => ({ ...p, ...album }))
		}
	}

	const refreshUrlSongExistsDb = async (paths) => {
		const res = await window.electron.ipcRenderer.invoke("get_files_exist", {
			paths: [...new Set(paths)]
		})
		setUrlSongExistsDb((p) => ({ ...p, ...res }))
	}

	const refreshUrlPlaylistExistsDb = async (paths) => {
		const res = await window.electron.ipcRenderer.invoke("get_dirs_exist", {
			paths: [...new Set(paths.map((e) => `${downloadLocation}/${e}`))]
		})
		setUrlPlaylistExistsDb((p) => ({ ...p, ...res }))
	}

	const deleteSong = useCallback(
		async (songElt) => {
			if (!downloadLocation || !songElt.name) return
			setQueuedSongsDelete((p) => [...new Set([...p, songElt.videoId])])
			const path = computedSongPath(songElt)
			const result = await window.electron.ipcRenderer.invoke("delete_file", { path: path })
			await updateOneSongExists(songElt)
			setQueuedSongsDelete((p) => p.filter((e) => e != songElt.videoId))
			if (result) {
				setForceRefreshLocationsTracker((p) => p + 1)
				// console.log(path)
				// console.log(queue)
				setQueuedSongsFailed((p) => p.filter((e) => e.videoId != songElt.videoId))
				setQueuedSongsComplete((p) => p.filter((e) => e.videoId != songElt.videoId))
				// setHistory([...history.filter((e) => e != path)])
				// setQueue([...queue.filter((e) => e != path)])
				if (currentTrack == path) {
					setNextAction("setNext")
					setCurrentTrack("")
				}
			}
		},
		[
			setQueuedSongsComplete,
			setQueuedSongsFailed,
			downloadLocation,
			currentTrack,
			computedSongPath,
			setCurrentTrack,
			setForceRefreshLocationsTracker,
			setNextAction,
			updateOneSongExists
		]
	)

	const deleteAlbum = useCallback(
		async (albElt) => {
			if (!downloadLocation || !albElt.name) return
			setQueuedAlbumsDelete((p) => [...new Set([...p, albElt.albumId])])
			const path = computedAlbumFolder(albElt)
			const { songs } = await window.electron.ipcRenderer.invoke("get_album", {
				id: albElt.albumId
			})
			setQueuedAlbumsDelete((p) => p.filter((e) => e != albElt.albumId))

			for (let songElt of songs) {
				await deleteSong(songElt)
			}

			const result = await window.electron.ipcRenderer.invoke("delete_dir", { path: path })
			await updateOneAlbumExists(albElt)
			if (result) {
				setForceRefreshLocationsTracker((p) => p + 1)
				// console.log(path)
				// console.log(queue)
				setQueuedAlbumsFailed((p) => p.filter((e) => e.albumId != albElt.albumId))
				setQueuedAlbumsComplete((p) => p.filter((e) => e.albumId != albElt.albumId))
				// setHistory([...history.filter((e) => !e.includes(path))])
				// setQueue([...queue.filter((e) => !e.includes(path))])
				// if (currentTrack.includes(path)) {
				//     setNextAction("setNext")
				//     setCurrentTrack("")
				// }
			}
		},
		[
			downloadLocation,
			deleteSong,
			computedAlbumFolder,
			setForceRefreshLocationsTracker,
			updateOneAlbumExists
		]
	)

	const handleDownloadFromLink = useCallback(async () => {
		if (!downloadLocation || urlDownloadStatus == "downloading" || search.length < 8) return

		setUrlDownloadStatus("downloading")
		const isPlaylist = search.includes("?list=") || search.includes("&list=")
		let result = false

		if (isPlaylist) {
			result = await window.electron.ipcRenderer.invoke("download_playlist_from_url", {
				url: search,
				destination: downloadLocation,
				browserCookies: ytCookiesEnabled ? ytCookiesBrowser : ""
			})
		} else {
			result = await window.electron.ipcRenderer.invoke("download_from_url", {
				url: search,
				destination: downloadLocation,
				browserCookies: ytCookiesEnabled ? ytCookiesBrowser : ""
			})
		}

		if (result) {
			setUrlDownloadStatus("success")
			if (isPlaylist) {
				createPlaylist(getFolderName(result[0], 1), result, search)
				setUrlDownloadedPlaylists((p) => [...new Set([...p, getFolderName(result[0], 1)])])
				setUrlDownloadedSongs((p) => [...new Set([...p, ...result])])
			} else {
				setUrlDownloadedSongs((p) => [...new Set([...p, ...result])])
			}
			setSearch((p) => {
				if (p == search) {
					return ""
				} else {
					return p
				}
			})
		} else {
			setUrlDownloadStatus("failed")
		}

		setForceRefreshLocationsTracker((p) => p + 1)
	}, [
		search,
		setSearch,
		downloadLocation,
		ytCookiesBrowser,
		ytCookiesEnabled,
		urlDownloadStatus,
		setForceRefreshLocationsTracker,
		createPlaylist
	])

	const SongEntry = useCallback(
		(e) => {
			return (
				<div
					title={`${e.name} - ${e.artist.name}`}
					onClick={() => {
						if (songExistsDb[e.videoId])
							showSongInLibrary(getSongName(computedSongPath(e)))
					}}
					className={cn(
						"flex flex-row items-center justify-between w-full h-10 rounded-lg overflow-clip bg-pink-500/15 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200",
						songExistsDb[e.videoId] &&
							"cursor-pointer bg-pink-600/25 hover:bg-pink-600/35"
					)}
				>
					<div className="flex flex-row items-center gap-2">
						<img
							className="h-10 min-w-10 rounded-lg pointer-events-none"
							src={e.thumbnails[0]?.url || "#"}
						/>
						<span className="line-clamp-1">{`${e.name} - ${e.artist.name}`}</span>
						{e.album?.name && (
							<span
								title={e.album.name}
								className="line-clamp-1 text-xs opacity-50 font-bold"
							>
								{e.album.name}
							</span>
						)}
					</div>
					{queuedSongsDownload.includes(e.videoId) ? (
						<>
							<div
								title="Downloading..."
								className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200"
							>
								<TbLoader2 className="animate-spin" size={20} />
							</div>
						</>
					) : (
						<>
							{songExistsDb[e.videoId] ? (
								<motion.div
									title="Downloaded. Click to remove song"
									className={cn(
										"bg-green-900 hover:bg-red-800 hover:border-red-100 hover:text-red-100 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 text-green-300 transition ease-out duration-200 group/check",
										queuedSongsDelete.includes(e.videoId)
											? ""
											: "cursor-pointer"
									)}
									onClick={(event) => {
										event.preventDefault()
										event.stopPropagation()
										deleteSong(e)
									}}
									initial={{
										scale: 1.0
									}}
									animate={{
										scale: 1.0
									}}
									whileTap={{
										scale: queuedSongsDelete.includes(e.videoId) ? 1.0 : 0.8
									}}
									transition={{
										duration: 0.025,
										ease: "easeOut"
									}}
								>
									<IoMdCheckmark
										className="transition ease-out duration-200 group-hover/check:scale-0"
										size={20}
									/>
									<IoMdClose
										className="absolute transition ease-out duration-200 scale-0 group-hover/check:scale-100"
										size={22}
									/>
								</motion.div>
							) : (
								<motion.div
									title="Download"
									className={cn(
										"bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200",
										!downloadLocation ? "contrast-80" : "cursor-pointer"
									)}
									onClick={(event) => {
										event.stopPropagation()
										downloadSong(e)
									}}
									initial={{
										scale: 1.0
									}}
									animate={{
										scale: 1.0
									}}
									whileTap={{
										scale: downloadLocation ? 0.8 : 1.0
									}}
									transition={{
										duration: 0.025,
										ease: "easeOut"
									}}
								>
									<IoMdDownload size={20} />
								</motion.div>
							)}
						</>
					)}
				</div>
			)
		},
		[
			downloadLocation,
			queuedSongsDelete,
			songExistsDb,
			queuedSongsDownload,
			deleteSong,
			downloadSong,
			computedSongPath,
			showSongInLibrary
		]
	)

	const AlbumEntry = useCallback(
		(e) => {
			return (
				<div
					title={`${e.name} - ${e.artist.name}`}
					onClick={() => {
						if (albumExistsDb[e.albumId])
							showAlbumInLibrary(getFolderName(computedAlbumFolder(e)))
					}}
					className={cn(
						"flex flex-row items-center justify-between w-full h-10 rounded-lg overflow-clip bg-pink-500/15 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200",
						albumExistsDb[e.albumId] &&
							"cursor-pointer bg-pink-600/25 hover:bg-pink-600/35"
					)}
				>
					<div className="flex flex-row items-center gap-2">
						<img
							className="h-10 min-w-10 rounded-lg pointer-events-none"
							src={e.thumbnails[0]?.url || "#"}
						/>
						<span className="line-clamp-1">{`${e.name} - ${e.artist.name}`}</span>
						{e.year && (
							<span className="line-clamp-1 text-xs opacity-50 font-bold min-w-max">
								{e.year}
							</span>
						)}
					</div>
					{albumExistsDb[e.albumId] !== undefined && (
						<motion.div
							initial={{
								scale: 0.0
							}}
							animate={{
								scale: 1.0
							}}
							transition={{
								duration: 0.25,
								ease: "easeOut"
							}}
						>
							{queuedAlbumsDownload.includes(e.albumId) ? (
								<>
									<div
										title="Downloading..."
										className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200"
									>
										<TbLoader2 className="animate-spin" size={20} />
									</div>
								</>
							) : (
								<>
									{albumExistsDb[e.albumId] ? (
										<motion.div
											title="Downloaded. Click to remove album"
											className={cn(
												"bg-green-900 hover:bg-red-800 hover:border-red-100 hover:text-red-100 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 text-green-300 transition ease-out duration-200 group/check",
												queuedAlbumsDelete.includes(e.albumId)
													? ""
													: "cursor-pointer"
											)}
											onClick={(event) => {
												event.preventDefault()
												event.stopPropagation()
												deleteAlbum(e)
											}}
											initial={{
												scale: 1.0
											}}
											animate={{
												scale: 1.0
											}}
											whileTap={{
												scale: queuedAlbumsDelete.includes(e.albumId)
													? 1.0
													: 0.8
											}}
											transition={{
												duration: 0.025,
												ease: "easeOut"
											}}
										>
											<IoMdCheckmark
												className="transition ease-out duration-200 group-hover/check:scale-0"
												size={20}
											/>
											<IoMdClose
												className="absolute transition ease-out duration-200 scale-0 group-hover/check:scale-100"
												size={22}
											/>
										</motion.div>
									) : (
										<motion.div
											title="Download"
											className={cn(
												"bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200",
												!downloadLocation ? "contrast-80" : "cursor-pointer"
											)}
											onClick={(event) => {
												event.stopPropagation()
												downloadAlbum(e)
											}}
											initial={{
												scale: 1.0
											}}
											animate={{
												scale: 1.0
											}}
											whileTap={{
												scale: downloadLocation ? 0.8 : 1.0
											}}
											transition={{
												duration: 0.025,
												ease: "easeOut"
											}}
										>
											<IoMdDownload size={20} />
										</motion.div>
									)}
								</>
							)}
						</motion.div>
					)}
				</div>
			)
		},
		[
			downloadLocation,
			queuedAlbumsDelete,
			albumExistsDb,
			queuedAlbumsDownload,
			deleteAlbum,
			downloadAlbum,
			computedAlbumFolder,
			showAlbumInLibrary
		]
	)

	const URLSongEntry = useCallback(
		(e) => {
			return (
				<div
					title={getSongName(e)}
					onClick={() => showSongInLibrary(getSongName(e))}
					className={cn(
						"flex flex-row items-center justify-between w-full h-10 px-3 rounded-lg overflow-clip bg-pink-600/25 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200 cursor-pointer hover:bg-pink-600/35"
					)}
				>
					<div className="flex flex-row items-center gap-2">
						<span className="line-clamp-1">{getSongName(e)}</span>
					</div>
				</div>
			)
		},
		[showSongInLibrary]
	)

	const URLAlbumEntry = useCallback(
		(e) => {
			return (
				<div
					title={e}
					onClick={() => showAlbumInLibrary(e)}
					className={cn(
						"flex flex-row items-center justify-between w-full h-10 px-3 rounded-lg overflow-clip bg-pink-600/25 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200 cursor-pointer hover:bg-pink-600/35"
					)}
				>
					<div className="flex flex-row items-center gap-2">
						<span className="line-clamp-1">{e}</span>
					</div>
				</div>
			)
		},
		[showAlbumInLibrary]
	)

	const downloadingLabel = useMemo(() => {
		if (queuedSongsDownload.length > 0) {
			return `Downloading ${queuedSongsDownload.length} song(s)`
		}
		return ""
	}, [queuedSongsDownload])

	const failedLabel = useMemo(() => {
		if (queuedSongsFailed.length > 0 && !(queuedAlbumsFailed.length > 0)) {
			return `${queuedSongsFailed.length} song(s) failed`
		} else if (!(queuedSongsFailed.length > 0) && queuedAlbumsFailed.length > 0) {
			return `${queuedAlbumsFailed.length} album(s) failed`
		} else if (queuedSongsFailed.length > 0 && queuedAlbumsFailed.length > 0) {
			return `${queuedSongsFailed.length} song(s), ${queuedAlbumsFailed.length} album(s) failed`
		}
		return ""
	}, [queuedSongsFailed, queuedAlbumsFailed])

	const completeLabel = useMemo(() => {
		const songs = queuedSongsComplete.length + urlDownloadedSongs.length
		const albums = queuedAlbumsComplete.length + urlDownloadedPlaylists.length
		if (songs && !albums) {
			return `${songs} song(s) downloaded`
		} else if (!songs && albums) {
			return `${albums} album(s) downloaded`
		} else if (songs && albums) {
			return `${songs} song(s), ${albums} album(s) downloaded`
		}
		return ""
	}, [queuedSongsComplete, queuedAlbumsComplete, urlDownloadedSongs, urlDownloadedPlaylists])

	const urlDownloadLabel = useMemo(() => {
		switch (urlDownloadStatus) {
			case "idle":
				return "Ready to start downloading."
			case "downloading":
				return "Downloading content..."
			case "success":
				return "Downloads completed successfully."
			case "failed":
				return "An error occured. Double check your link, and activate cookies if necessary."
			default:
				return ""
		}
	}, [urlDownloadStatus])

	const browserCookiesIcon = useMemo(() => {
		switch (ytCookiesBrowser) {
			case "chrome":
			case "chromium":
				return <IoLogoChrome size={15} />
			case "firefox":
				return <IoLogoFirefox size={15} />
			case "edge":
				return <RiEdgeNewFill size={15} />
			case "brave":
				return <FaBrave size={15} />
			case "opera":
				return <FaOpera size={15} />
			case "safari":
				return <FaSafari size={15} />
			case "vivaldi":
				return <SiVivaldi size={15} />
			case "whale":
				return <GiSpermWhale size={15} />
			default:
				return <TbNetwork size={16} />
		}
	}, [ytCookiesBrowser])

	const browserSelector = useMemo(() => {
		return (
			<button className="flex flex-row -hue-rotate-30 saturate-150 group relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700">
				<div className="relative z-10 pointer-events-none">{browserCookiesIcon}</div>
				<select
					className="bg-slate-800 rounded-full h-7 outline-none group-hover:bg-slate-700 transition ease-out duration-200 cursor-pointer pl-5 -ml-5 py-1 -my-1"
					title="Select browser to use YouTube cookies from"
					value={ytCookiesBrowser}
					onChange={(e) => setYtCookiesBrowser(e.target.value)}
				>
					<option value="" hidden>
						Select Browser
					</option>
					<option value="chrome">Chrome</option>
					<option value="chromium">Chromium</option>
					<option value="firefox">Firefox</option>
					<option value="edge">Edge</option>
					<option value="brave">Brave</option>
					<option value="opera">Opera</option>
					<option value="safari">Safari</option>
					<option value="vivaldi">Vivaldi</option>
					<option value="whale">Whale</option>
				</select>
			</button>
		)
	}, [browserCookiesIcon, ytCookiesBrowser, setYtCookiesBrowser])

	const urlSongsOnDisk = useMemo(() => {
		const res = []
		Object.keys(urlSongExistsDb).map((e) => {
			if (urlSongExistsDb[e] === true) {
				res.push(e)
			}
		})
		return res
	}, [urlSongExistsDb])

	const urlPlaylistsOnDisk = useMemo(() => {
		const res = []
		Object.keys(urlPlaylistExistsDb).map((e) => {
			if (urlPlaylistExistsDb[e] === true) {
				res.push(e)
			}
		})
		return res
	}, [urlPlaylistExistsDb])

	// refresh locations when new items get downloaded or removed
	useEffect(() => {
		refreshSongExistsDb(
			searchSongsResults.concat(queuedSongsComplete).concat(queuedSongsFailed)
		)
		refreshAlbumExistsDb(
			mergedAlbumsResults.concat(queuedAlbumsComplete).concat(queuedAlbumsFailed)
		)
		refreshUrlSongExistsDb(urlDownloadedSongs)
		refreshUrlPlaylistExistsDb(urlDownloadedPlaylists)
	}, [libraryLocations, forceRefreshLocationsTracker])

	// requests
	useEffect(() => {
		searchRequestCount.current += 1
		if (!search || search.length < 3 || linkEnabled) {
			setIsFetching(false)
			setSearchSongsResults([])
			setSearchAlbumsResults([])
			setHiddenAlbumsResults([])
			// setSearchArtistsResults([])
		} else {
			const update = (search) => {
				setIsFetching(true)
				fetchSongsResults(search, searchRequestCount.current)
				fetchAlbumsResults(search, searchRequestCount.current)
			}
			const t = setTimeout(() => {
				update(search)
			}, 500)
			return () => {
				clearTimeout(t)
			}
		}
	}, [search, linkEnabled])

	// auto switch to link mode
	useEffect(() => {
		if (search.startsWith("https://")) {
			setLinkEnabled(true)
		}
	}, [search])

	// process unlisted albums
	useEffect(() => {
		fetchHiddenAlbums(searchSongsResults, searchRequestCount.current)
	}, [searchSongsResults])

	// merge unlisted albums with regular albums list
	useEffect(() => {
		const result = [...hiddenAlbumsResults]
		const IDs = result.map((e) => e.albumId)
		// console.log(IDs)
		for (let elt of searchAlbumsResults) {
			if (!IDs.includes(elt.albumId)) {
				IDs.push(elt.albumId)
				result.push(elt)
			}
		}
		// console.log(result)
		refreshAlbumExistsDb(result)
		setMergedAlbumsResults(result)
	}, [hiddenAlbumsResults, searchAlbumsResults])

	// disable loading request icon after merging
	useEffect(() => {
		setIsFetching(false)
	}, [hiddenAlbumsResults])

	// disable UI until ytdlp is ready
	useEffect(() => {
		window.electron.ipcRenderer.invoke("is_ytdlp_ready", {}).then((e) => setYtdlpReady(e))
		window.electron.ipcRenderer.on("ytdlp_ready", (v) => {
			setYtdlpReady(v)
		})
		return () => {
			window.electron.ipcRenderer.on("ytdlp_ready", () => {})
		}
	}, [])

	const inputField = useRef(null)
	useHotkeys("ctrl+t", (e) => {
		e.preventDefault()
		if (inputField.current) {
			inputField.current.focus()
		}
	})
	useHotkeys(
		"escape",
		(e) => {
			e.preventDefault()
			if (inputField.current) {
				inputField.current.blur()
			}
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+backspace",
		() => {
			if (inputField.current && inputField.current.hasFocus()) {
				inputField.current.value = ""
			}
		},
		{ enableOnFormTags: true }
	)

	if (tab != "download") return

	if (!ytdlpReady)
		return (
			<div className="w-full h-full flex flex-col justify-center text-center">
				Loading Download modules...
			</div>
		)

	return (
		<>
			{/* Main toolbar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<select
					title="Select download location from registered Library locations"
					className={cn(
						"flex flex-row relative outline-none h-7.5 gap-1 justify-center text-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
						downloadLocation
							? ""
							: "bg-red-950 border-red-200 text-red-200 hover:bg-red-900"
					)}
					value={downloadLocation || ""}
					onChange={(e) => setDownloadLocation(e.target.value)}
					// onClick={(e) => { if (!downloadLocation && libraryLocations.length == 0) { e.preventDefault(); guideToLibraryLocations() } }}
					onFocus={(e) => {
						if (!downloadLocation && libraryLocations.length == 0) {
							e.preventDefault()
							guideToLibraryLocations()
						}
					}}
				>
					{!downloadLocation && (
						<option value="" hidden>
							{libraryLocations.length == 0
								? "Add a location to your library first"
								: "Choose location"}
						</option>
					)}
					{!libraryLocations.includes(downloadLocation) && downloadLocation && (
						<option value={downloadLocation} title={downloadLocation}>
							{getFolderName(downloadLocation)}
						</option>
					)}
					{libraryLocations.map((e, i) => (
						<option key={i} title={e} value={e}>
							{getFolderName(e)}
						</option>
					))}
				</select>
				<button
					className="flex flex-row relative -hue-rotate-30 saturate-150 outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					title={
						ytCookiesEnabled
							? "Login to YouTube in you chosen browser, then tell Gayer which one you are using."
							: "Enabling cookies might help if your downloads fail."
					}
					onClick={() => setYtCookiesEnabled(!ytCookiesEnabled)}
				>
					{ytCookiesEnabled ? <TbNetwork size={16} /> : <TbNetworkOff size={16} />}
					<span>Cookies {ytCookiesEnabled ? "On" : "Off"}</span>
				</button>
				{ytCookiesEnabled && <>{browserSelector}</>}
				{(queuedAlbumsDownload.length > 0 ||
					queuedSongsDownload.length > 0 ||
					urlDownloadStatus == "downloading") && (
					<>
						<button
							title={downloadingLabel}
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700"
						>
							<div className="animate-spin">
								<TbLoader2 size={16} />
							</div>
							<span>Downloading...</span>
						</button>
					</>
				)}
				{(queuedSongsComplete.length > 0 ||
					queuedAlbumsComplete.length > 0 ||
					urlDownloadedSongs.length > 0 ||
					urlDownloadedPlaylists.length > 0) && (
					<>
						<button
							title={completeLabel}
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={() => setFilter("downloaded")}
						>
							<MdCheckCircleOutline size={18} />
							<span>
								{`${queuedSongsComplete.length + queuedAlbumsComplete.length + urlDownloadedSongs.length + urlDownloadedPlaylists.length} item(s) downloaded`}
							</span>
							<div className="absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply bg-green-300 outline-2 outline-green-300 transition ease-out duration-200" />
						</button>
					</>
				)}
				{(queuedSongsFailed.length > 0 || queuedAlbumsFailed.length > 0) && (
					<>
						<button
							title={failedLabel}
							className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
							onClick={() => setFilter("failed")}
						>
							<MdErrorOutline size={18} />
							<span>
								{`${queuedSongsFailed.length + queuedAlbumsFailed.length} item(s) failed`}
							</span>
							<div className="absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply bg-red-300 outline-2 outline-red-300 transition ease-out duration-200" />
						</button>
					</>
				)}
				<PowerSavingButton />
			</div>
			{/* Search bar */}
			<div className="flex flex-row items-center gap-1">
				<div className="relative w-full flex flex-row">
					<input
						ref={inputField}
						className={cn(
							"outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pl-9 pr-14 transition ease-out duration-200",
							"focus:shadow-pink-400/40",
							linkEnabled && "pr-8"
						)}
						autoFocus
						type="text"
						spellCheck={false}
						placeholder={
							linkEnabled
								? "Paste link from YouTube (Ctrl/Cmd+V)"
								: "Search for artists, songs, albums..."
						}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (linkEnabled && e.key == "Enter") {
								handleDownloadFromLink()
							}
						}}
					/>
					<button
						title={linkEnabled ? "Click to search instead" : "Download from link"}
						className={cn(
							"absolute left-0 top-0 outline-none h-10 translate-y-0.5 translate-x-0.5 py-2 px-1.5 rounded-md cursor-pointer active:scale-80 transition ease-out duration-200",
							linkEnabled ? "bg-pink-700 hover:bg-pink-600" : "hover:bg-pink-200/25"
						)}
						onClick={() => setLinkEnabled(!linkEnabled)}
					>
						<FaLink size={20} />
					</button>
					<TbLoader2
						className={cn(
							"animate-spin absolute right-8 pointer-events-none h-full transition ease-out duration-200",
							isFetching ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
						)}
						size={20}
					/>
					<button
						className="absolute right-0 top-0 outline-none h-full p-2 cursor-pointer hover:scale-125 active:scale-95 transition ease-out duration-200"
						onClick={clearSearch}
					>
						<IoMdClose size={20} />
					</button>
				</div>
				{linkEnabled && (
					<motion.div
						title="Download from entered link"
						className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
						onClick={handleDownloadFromLink}
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
						<IoMdDownload size={20} />
					</motion.div>
				)}
			</div>
			{/* Filter bar */}
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						filter == "songs" && "brightness-105"
					)}
					onClick={() => {
						setFilter("songs")
					}}
				>
					<IoMusicalNotes size={14} />
					<span>Songs</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full  top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							filter == "songs" && "bg-pink-300 outline-2 outline-pink-300"
						)}
					/>
				</button>
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						filter == "albums" && "brightness-105"
					)}
					onClick={() => {
						setFilter("albums")
					}}
				>
					<GiCompactDisc size={14} />
					<span>Albums</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							filter == "albums" && "bg-pink-300 outline-2 outline-pink-300"
						)}
					/>
				</button>
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						filter == "downloaded" && "brightness-105"
					)}
					onClick={() => {
						setFilter("downloaded")
					}}
				>
					<MdCheckCircleOutline size={18} />
					<span>Downloaded</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							filter == "downloaded" && "bg-green-300 outline-2 outline-green-300"
						)}
					/>
				</button>
				<button
					className={cn(
						"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
						filter == "failed" && "brightness-105"
					)}
					onClick={() => {
						setFilter("failed")
					}}
				>
					<MdErrorOutline size={18} />
					<span>Failed</span>
					<div
						className={cn(
							"absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
							filter == "failed" && "bg-red-300 outline-2 outline-red-300"
						)}
					/>
				</button>
			</div>
			{/* Content */}
			{linkEnabled ? (
				<div className="flex flex-col gap-4">
					{/* Url download feedback */}
					{["songs", "albums"].includes(filter) && (
						<>
							<div
								className={cn(
									"flex flex-row gap-2 items-center w-full p-2 px-3 rounded-lg border-2 transition ease-out duration-200",
									["idle", "downloading"].includes(urlDownloadStatus) &&
										"bg-slate-800 border-slate-600",
									urlDownloadStatus == "success" &&
										"bg-green-900/75 border-green-700/75",
									urlDownloadStatus == "failed" &&
										"bg-red-900/75 border-red-700/75"
								)}
							>
								{urlDownloadLabel}
								{urlDownloadStatus == "downloading" && (
									<TbLoader2 className="animate-spin" size={20} />
								)}
							</div>
						</>
					)}
					{["downloaded", "albums"].includes(filter) && urlPlaylistsOnDisk.length > 0 && (
						<motion.ul className="flex flex-col gap-2">
							<motion.li
								layout
								key="urlDownloadedPlaylistsLabel"
								className="font-bold"
							>
								Playlists downloaded from link
							</motion.li>
							{urlPlaylistsOnDisk.map((e) => (
								<motion.li layout key={getFolderName(e)}>
									{URLAlbumEntry(getFolderName(e))}
								</motion.li>
							))}
						</motion.ul>
					)}
					{["songs", "downloaded"].includes(filter) && urlSongsOnDisk.length > 0 && (
						<motion.ul className="flex flex-col gap-2">
							<motion.li layout key="?urlDownloadedSongsLabel" className="font-bold">
								Audio downloaded from link
							</motion.li>
							{urlSongsOnDisk.map((e) => (
								<motion.li layout key={e}>
									{URLSongEntry(e)}
								</motion.li>
							))}
						</motion.ul>
					)}
				</div>
			) : (
				<>
					{filter == "downloaded" && urlPlaylistsOnDisk.length > 0 && (
						<motion.ul className="flex flex-col gap-2">
							<motion.li
								layout
								key="urlDownloadedPlaylistsLabel"
								className="font-bold"
							>
								Playlists downloaded from link
							</motion.li>
							{urlPlaylistsOnDisk.map((e) => (
								<motion.li layout key={getFolderName(e)}>
									{URLAlbumEntry(getFolderName(e))}
								</motion.li>
							))}
						</motion.ul>
					)}
					{filter == "downloaded" && urlSongsOnDisk.length > 0 && (
						<motion.ul className="flex flex-col gap-2">
							<motion.li layout key="?urlDownloadedSongsLabel" className="font-bold">
								Audio downloaded from link
							</motion.li>
							{urlSongsOnDisk.map((e) => (
								<motion.li layout key={e}>
									{URLSongEntry(e)}
								</motion.li>
							))}
						</motion.ul>
					)}
				</>
			)}
			<motion.ul className={cn("flex flex-col gap-2", filter != "songs" && "hidden")}>
				{searchSongsResults.map((e) => (
					<motion.li layout key={e.videoId}>
						{SongEntry(e)}
					</motion.li>
				))}
			</motion.ul>
			<motion.ul className={cn("flex flex-col gap-2", filter != "albums" && "hidden")}>
				{mergedAlbumsResults.map((e) => (
					<motion.li layout key={e.albumId}>
						{AlbumEntry(e)}
					</motion.li>
				))}
			</motion.ul>
			<div
				className={
					filter == "downloaded" && queuedAlbumsComplete.length > 0 ? "" : "hidden"
				}
			>
				<motion.ul className="flex flex-col gap-2">
					<motion.li layout key="?DownloadedAlbumsLabel" className="font-bold">
						Albums
					</motion.li>
					{queuedAlbumsComplete.map((e) => (
						<motion.li layout key={e.albumId}>
							{AlbumEntry(e)}
						</motion.li>
					))}
				</motion.ul>
			</div>
			<div
				className={filter == "downloaded" && queuedSongsComplete.length > 0 ? "" : "hidden"}
			>
				<motion.ul className="flex flex-col gap-2">
					<motion.li layout key="?DownloadedSongsLabel" className="font-bold">
						Songs
					</motion.li>
					{queuedSongsComplete.map((e) => (
						<motion.li layout key={e.videoId}>
							{SongEntry(e)}
						</motion.li>
					))}
				</motion.ul>
			</div>
			{filter == "failed" && (
				<>
					{(queuedSongsFailed.length > 0 || queuedAlbumsFailed > 0) && (
						<>
							{ytCookiesEnabled ? (
								<>
									{showYtCookiesHint ? (
										<div className="rounded-xl p-2 bg-amber-950 border-2 border-amber-300">
											<p className="font-bold mb-2 flex flex-row items-center gap-2">
												Cookies Setup
												<span
													className="text-amber-300 flex flex-row items-center gap-0.5 max-w-fit text-xs font-normal cursor-pointer"
													onClick={() => {
														setShowYtCookiesHint(false)
													}}
												>
													<MdErrorOutline
														className="text-amber-300 inline"
														size={16}
													/>
													Hide hint
												</span>
											</p>
											<div className="flex flex-col gap-1">
												<p className="font-bold">
													1.&nbsp;
													<span
														className="text-amber-300 font-bold cursor-pointer"
														onClick={() => {
															ytLogin()
														}}
													>
														Login to YouTube
													</span>
													&nbsp;in your web browser
												</p>
												<p className="font-bold">
													2. Select the browser you used to login
													<span className="font-normal -translate-y-0.5">
														{browserSelector}
													</span>
													<span className="font-normal text-sm items-center inline-block my-1">
														<MdErrorOutline
															className="text-amber-300 inline"
															size={16}
														/>
														&nbsp;If the browser you used is not listed,
														login to Youtube using one of the supported
														browsers
													</span>
												</p>
											</div>
											<p className="py-4">You're all set !</p>
											<div className="font-bold flex flex-row items-center pb-2 gap-2">
												<div className="rounded-lg p-1 bg-amber-900 border-2 border-amber-300">
													<IoWarningOutline size={20} />
												</div>
												Important !
											</div>
											<p>
												Disable cookies when possible (i.e. when your
												downloads succeed without it), as downloading at a
												very high rate using cookies might flag your YouTube
												account as a bot, and lead to temporary or permanent
												ban.
											</p>
										</div>
									) : (
										<div>
											<span
												className="text-amber-300 flex flex-row items-center gap-0.5 max-w-fit text-xs font-normal cursor-pointer -my-1"
												onClick={() => {
													setShowYtCookiesHint(true)
												}}
											>
												<MdErrorOutline
													className="text-amber-300 inline"
													size={16}
												/>
												Show hint
											</span>
										</div>
									)}
								</>
							) : (
								<div className="rounded-xl p-2 bg-amber-950 border-2 border-amber-300">
									<span>
										If your downloads keep failing, you might want to&nbsp;
										<span
											className="text-amber-300 font-bold cursor-pointer"
											onClick={() => setYtCookiesEnabled(true)}
										>
											enable cookies
										</span>
									</span>
								</div>
							)}
						</>
					)}
				</>
			)}
			<div className={filter == "failed" && queuedAlbumsFailed.length > 0 ? "" : "hidden"}>
				<motion.ul className="flex flex-col gap-2">
					<motion.li layout key="?DownloadedAlbumsLabel" className="font-bold">
						Albums
					</motion.li>
					{queuedAlbumsFailed.map((e) => (
						<motion.li layout key={e.albumId}>
							{AlbumEntry(e)}
						</motion.li>
					))}
				</motion.ul>
			</div>
			<div className={filter == "failed" && queuedSongsFailed.length > 0 ? "" : "hidden"}>
				<motion.ul className="flex flex-col gap-2">
					<motion.li layout key="?DownloadedSongsLabel" className="font-bold">
						Songs
					</motion.li>
					{queuedSongsFailed.map((e) => (
						<motion.li layout key={e.videoId}>
							{SongEntry(e)}
						</motion.li>
					))}
				</motion.ul>
			</div>
		</>
	)
}
