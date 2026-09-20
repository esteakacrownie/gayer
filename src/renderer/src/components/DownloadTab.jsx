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
import { useCallback, useEffect, useMemo, useState } from "react"
import { IoMdCheckmark, IoMdClose, IoMdDownload } from "react-icons/io"
import { TbLoader2 } from "react-icons/tb";
import PowerSavingButton from "./PowerSavingButton"
import { getFolderName, toAllowedPlaylistName } from "../utils"
import { motion } from "motion/react"
import { IoMusicalNotes, IoPeopleSharp } from "react-icons/io5";
import { GiCompactDisc } from "react-icons/gi";
import { usePlayerStore } from "../stores/usePlayerStore";
import { MdCheckCircleOutline, MdErrorOutline } from "react-icons/md";
import { useLibraryStore } from "../stores/useLibraryStore";
import { toSanitized } from "../sanitize-filename";

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
        setAlbumsFolded
    } = useSettingsStore()
    const { setSearch: setLibrarySearch } = useLibraryStore()
    const { currentTrack, queue, setQueue, history, setHistory, setNextAction, setCurrentTrack } = usePlayerStore()
    const [search, setSearch] = useState("")
    const [searchSongsResults, setSearchSongsResults] = useState([])
    const [searchAlbumsResults, setSearchAlbumsResults] = useState([])
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
    const [filter, setFilter] = useState("songs")

    const clearSearch = () => {
        setSearch("")
    }

    const showSongInLibrary = (name) => {
        setLibraryFilter("songs")
        setTab("library")
        setLibrarySearch(toAllowedPlaylistName(name))
    }

    const showAlbumInLibrary = (name) => {
        setLibraryFilter("playlists")
        setPlaylistsFolded(true)
        setAlbumsFolded(false)
        setTab("library")
        setLibrarySearch(toAllowedPlaylistName(name, " - "))
    }

    const guideToLibraryLocations = () => {
        setTab("library")
        setLibraryFilter("locations")
    }

    const computedSongPath = useCallback((songElt) => {
        let path = ""
        try {
            if (songElt.album?.name && songElt.artist?.name) {
                path += toSanitized(`${songElt.album.name} - ${songElt.artist.name}`.replaceAll("/", " - ").replaceAll("\\", " - ")) + "/"
            }
            if (songElt.artist.name) {
                path += toSanitized(`${songElt.name} - ${songElt.artist?.name}`.replaceAll("/", " - ").replaceAll("\\", " - "))
            } else {
                path += toSanitized(songElt.name.replaceAll("/", " - ").replaceAll("\\", " - "))
            }
        } catch (error) {
            console.error(error)
            console.log(songElt)
            return
        }
        return downloadLocation + "/" + path + ".mp3"
    }, [downloadLocation])

    const computedAlbumFolder = useCallback((albElt) => {
        let path = ""
        try {
            if (albElt.name && albElt.artist?.name) {
                path += toSanitized(`${albElt.name} - ${albElt.artist.name}`.replaceAll("/", " - ").replaceAll("\\", " - ")) + "/"
            }
        } catch (error) {
            console.error(error)
            console.log(albElt)
            return
        }
        return downloadLocation + "/" + path
    }, [downloadLocation])

    const downloadSong = useCallback(async (songElt) => {
        if (!downloadLocation || !songElt.name) return
        setQueuedSongsDownload((p) => ([...new Set([...p, songElt.videoId])]))
        const path = computedSongPath(songElt)
        const result = await window.electron.ipcRenderer.invoke("download_song", { url: songElt.videoId, path: path })
        const exists = await updateOneSongExists(songElt)
        setQueuedSongsDownload((p) => p.filter((e) => e != songElt.videoId))
        if (result && exists) {
            setQueuedSongsComplete((p) => ([...p, songElt]))
            setQueuedSongsFailed((p) => (p.filter((e) => e.videoId != songElt.videoId)))
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
        } else {
            setQueuedSongsFailed((p) => {
                let hasSelf = false
                p.map((e) => {
                    if (e.videoId == songElt.videoId) {
                        hasSelf = true
                    }
                })
                if (!hasSelf) {
                    return [...p, songElt]
                }
                return [...p]
            })
            setQueuedSongsComplete((p) => (p.filter((e) => e.videoId != songElt.videoId)))
        }
    }, [downloadLocation, forceRefreshLocationsTracker, setForceRefreshLocationsTracker])

    const updateOneSongExists = async (songElt) => {
        const path = computedSongPath(songElt)
        const exists = await window.electron.ipcRenderer.invoke("file_exists", { path: path })
        const updated = {}
        updated[songElt.videoId] = exists
        setSongExistsDb((p) => ({ ...p, ...updated }))
        return exists
    }

    const updateOneAlbumExists = async (albElt) => {
        const exists = await getAlbumExists(albElt)
        const updated = {}
        updated[albElt.videoId] = exists
        setAlbumExistsDb((p) => ({ ...p, ...updated }))
        return exists
    }

    const downloadAlbum = useCallback(async (albElt) => {
        if (!downloadLocation || !albElt.name) return
        setQueuedAlbumsDownload((p) => ([...new Set([...p, albElt.playlistId])]))
        const dest = computedAlbumFolder(albElt)
        const result = await window.electron.ipcRenderer.invoke(
            "download_album",
            {
                url: albElt.playlistId, destination: dest, artist: albElt.artist?.name || "Unknown Artist"

            }
        )
        const exists = await updateOneAlbumExists(albElt)
        setQueuedAlbumsDownload((p) => p.filter((e) => e != albElt.playlistId))
        if (result && exists) {
            setQueuedAlbumsComplete((p) => ([...p, albElt]))
            setQueuedAlbumsFailed((p) => (p.filter((e) => e.playlistId != albElt.playlistId)))
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
        } else {
            setQueuedAlbumsFailed((p) => {
                let hasSelf = false
                p.map((e) => {
                    if (e.playlistId == albElt.playlistId) {
                        hasSelf = true
                    }
                })
                if (!hasSelf) {
                    return [...p, albElt]
                }
                return [...p]
            })
            setQueuedAlbumsComplete((p) => (p.filter((e) => e.playlistId != albElt.playlistId)))
        }
    }, [downloadLocation, forceRefreshLocationsTracker, setForceRefreshLocationsTracker])

    const getAlbumExists = async (albElt) => {
        const albSongs = await window.electron.ipcRenderer.invoke("get_album_songs", { id: albElt.albumId })
        const exists = await window.electron.ipcRenderer.invoke("get_album_exists", { songs: (albSongs || []).map((e) => computedSongPath(e)) })
        return exists
    }

    const deleteSong = useCallback(async (songElt) => {
        if (!downloadLocation || !songElt.name) return
        setQueuedSongsDelete((p) => ([...new Set([...p, songElt.videoId])]))
        const path = computedSongPath(songElt)
        const result = await window.electron.ipcRenderer.invoke("delete_file", { path: path })
        await updateOneSongExists(songElt)
        setQueuedSongsDelete((p) => p.filter((e) => e != songElt.videoId))
        if (result) {
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
            // console.log(path)
            // console.log(queue)
            setQueuedSongsFailed((p) => (p.filter((e) => e.videoId != songElt.videoId)))
            setQueuedSongsComplete((p) => (p.filter((e) => e.videoId != songElt.videoId)))
            setHistory([...history.filter((e) => e != path)])
            setQueue([...queue.filter((e) => e != path)])
            if (currentTrack == path) {
                setNextAction("setNext")
                setCurrentTrack("")
            }
        }
    }, [queuedSongsDelete, downloadLocation, forceRefreshLocationsTracker, currentTrack, queue, history])

    const deleteAlbum = useCallback(async (albElt) => {
        if (!downloadLocation || !albElt.name) return
        setQueuedSongsDelete((p) => ([...new Set([...p, albElt.playlistId])]))
        const path = computedAlbumFolder(albElt)
        const result = await window.electron.ipcRenderer.invoke("delete_dir", { path: path })
        const exists = await updateOneAlbumExists(albElt)
        setQueuedSongsDelete((p) => p.filter((e) => e != albElt.playlistId))
        if (result) {
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
            // console.log(path)
            // console.log(queue)
            setQueuedAlbumsFailed((p) => (p.filter((e) => e.playlistId != albElt.playlistId)))
            setQueuedAlbumsComplete((p) => (p.filter((e) => e.playlistId != albElt.playlistId)))
            setHistory([...history.filter((e) => !e.includes(path))])
            setQueue([...queue.filter((e) => !e.includes(path))])
            if (currentTrack.includes(path)) {
                setNextAction("setNext")
                setCurrentTrack("")
            }
        }
    }, [queuedSongsDelete, downloadLocation, forceRefreshLocationsTracker, currentTrack, queue, history])

    const fetchSongsResults = async (q) => {
        const res = await window.electron.ipcRenderer.invoke("ytm_songs", { query: q })
        await refreshSongExistsDb(res)
        setSearchSongsResults(res)
    }

    const fetchAlbumsResults = async (q) => {
        const res = await window.electron.ipcRenderer.invoke("ytm_albums", { query: q })
        refreshAlbumExistsDb(res)
        // console.log(res)
        setSearchAlbumsResults(res)
    }

    const fetchArtistsResults = async (q) => {

    }

    const refreshSongExistsDb = async (songElts) => {
        const songs = {}
        for (let e of songElts) {
            songs[e.videoId] = computedSongPath(e)
        }
        const songExists = await window.electron.ipcRenderer.invoke("get_songs_exist", { songs: songs })
        setSongExistsDb((p) => ({ ...p, ...songExists }))
    }

    const refreshAlbumExistsDb = async (albElts) => {
        for (let e of albElts) {
            const albums = {}
            albums[e.playlistId] = await getAlbumExists(e)
            setAlbumExistsDb((p) => ({ ...p, ...albums }))
        }
    }

    // refresh locations when new items get downloaded or removed
    useEffect(() => {
        refreshSongExistsDb(searchSongsResults)
        refreshAlbumExistsDb(searchAlbumsResults)
    }, [libraryLocations, forceRefreshLocationsTracker])

    // requests
    useEffect(() => {
        if (!search || search.length < 3) {
            setSearchSongsResults([])
            setSearchAlbumsResults([])
            // setSearchArtistsResults([])
        } else {
            const update = (search) => {
                switch (filter) {
                    case "songs":
                        fetchSongsResults(search)
                        break
                    case "albums":
                        fetchAlbumsResults(search)
                        break
                    case "artists":
                        fetchArtistsResults(search)
                        break
                }
            }
            const t = setTimeout(() => {
                update(search)
            }, 500)
            return () => {
                clearTimeout(t)
            }
        }
    }, [search, filter])

    const downloadingLabel = useMemo(() => {
        if ((queuedSongsDownload.length > 0) && !(queuedAlbumsDownload.length > 0)) {
            return `Downloading ${queuedSongsDownload.length} song(s)`
        } else if (!(queuedSongsDownload.length > 0) && (queuedAlbumsDownload.length > 0)) {
            return `Downloading ${queuedAlbumsDownload.length} album(s)`
        } else if (queuedSongsDownload.length > 0 && queuedAlbumsDownload.length > 0) {
            return `Downloading ${queuedSongsDownload.length} song(s), ${queuedAlbumsDownload.length} album(s)`
        }
        return ""
    }, [queuedSongsDownload, queuedSongsDownload])

    const failedLabel = useMemo(() => {
        if ((queuedSongsFailed.length > 0) && !(queuedAlbumsFailed.length > 0)) {
            return `${queuedSongsFailed.length} song(s) failed`
        } else if (!(queuedSongsFailed.length > 0) && (queuedAlbumsFailed.length > 0)) {
            return `${queuedAlbumsFailed.length} album(s) failed`
        } else if (queuedSongsFailed.length > 0 && queuedAlbumsFailed.length > 0) {
            return `${queuedSongsFailed.length} song(s), ${queuedAlbumsFailed.length} album(s) failed`
        }
        return ""
    }, [queuedSongsFailed, queuedAlbumsFailed])

    const completeLabel = useMemo(() => {
        if ((queuedSongsComplete.length > 0) && !(queuedAlbumsComplete.length > 0)) {
            return `${queuedSongsComplete.length} song(s) downloaded`
        } else if (!(queuedSongsComplete.length > 0) && (queuedAlbumsComplete.length > 0)) {
            return `${queuedAlbumsComplete.length} album(s) downloaded`
        } else if (queuedSongsComplete.length > 0 && queuedAlbumsComplete.length > 0) {
            return `${queuedSongsComplete.length} song(s), ${queuedAlbumsComplete.length} album(s) downloaded`
        }
        return ""
    }, [queuedSongsComplete, queuedAlbumsComplete])

    const SongEntry = (e) => {
        return (
            <div
                title={`${e.name} - ${e.artist.name}`}
                onClick={() => { if (songExistsDb[e.videoId]) showSongInLibrary(e.name) }}
                className={cn("flex flex-row items-center justify-between w-full h-10 rounded-lg overflow-clip bg-pink-500/15 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200",
                    songExistsDb[e.videoId] ? "cursor-pointer bg-pink-600/25 hover:bg-pink-600/35" : ""
                )}
            >
                <div className="flex flex-row items-center gap-2">
                    <img className="h-10 min-w-10 rounded-lg pointer-events-none" src={e.thumbnails[0].url} />
                    <span className="line-clamp-1">{`${e.name} - ${e.artist.name}`}</span>
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
                                className={cn("bg-green-900 hover:bg-red-800 hover:border-red-100 hover:text-red-100 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 text-green-300 transition ease-out duration-200 group/check",
                                    queuedSongsDelete.includes(e.videoId) ? "" : "cursor-pointer"
                                )}
                                onClick={(event) => { event.preventDefault(); event.stopPropagation(); deleteSong(e) }}
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
                                <IoMdCheckmark className="transition ease-out duration-200 group-hover/check:scale-0" size={20} />
                                <IoMdClose className="absolute transition ease-out duration-200 scale-0 group-hover/check:scale-100" size={22} />
                            </motion.div>
                        ) : (
                            <motion.div
                                title="Download"
                                className={
                                    cn(
                                        "bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200",
                                        !downloadLocation ? "contrast-80" : "cursor-pointer"
                                    )}
                                onClick={(event) => { event.stopPropagation(); downloadSong(e) }}
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
    }

    const AlbumEntry = (e) => {
        return (
            <div
                title={`${e.name} - ${e.artist.name}`}
                onClick={() => { if (albumExistsDb[e.playlistId]) showAlbumInLibrary(e.name) }}
                className={cn("flex flex-row items-center justify-between w-full h-10 rounded-lg overflow-clip bg-pink-500/15 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200",
                    albumExistsDb[e.playlistId] ? "cursor-pointer bg-pink-400/15 hover:bg-pink-400/25" : ""
                )}
            >
                <div className="flex flex-row items-center gap-2">
                    <img className="h-10 min-w-10 rounded-lg pointer-events-none" src={e.thumbnails[0].url} />
                    <span className="line-clamp-1">{`${e.name} - ${e.artist.name}`}</span>
                </div>
                {albumExistsDb[e.playlistId] !== undefined && (
                    <>
                        {queuedAlbumsDownload.includes(e.playlistId) ? (
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
                                {albumExistsDb[e.playlistId] ? (
                                    <motion.div
                                        title="Downloaded. Click to remove album"
                                        className={cn("bg-green-900 hover:bg-red-800 hover:border-red-100 hover:text-red-100 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 text-green-300 transition ease-out duration-200 group/check",
                                            queuedAlbumsDelete.includes(e.playlistId) ? "" : "cursor-pointer"
                                        )}
                                        onClick={(event) => { event.preventDefault(); event.stopPropagation(); deleteAlbum(e) }}
                                        initial={{
                                            scale: 1.0
                                        }}
                                        animate={{
                                            scale: 1.0
                                        }}
                                        whileTap={{
                                            scale: queuedAlbumsDelete.includes(e.playlistId) ? 1.0 : 0.8
                                        }}
                                        transition={{
                                            duration: 0.025,
                                            ease: "easeOut"
                                        }}
                                    >
                                        <IoMdCheckmark className="transition ease-out duration-200 group-hover/check:scale-0" size={20} />
                                        <IoMdClose className="absolute transition ease-out duration-200 scale-0 group-hover/check:scale-100" size={22} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        title="Download"
                                        className={
                                            cn(
                                                "bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200",
                                                !downloadLocation ? "contrast-80" : "cursor-pointer"
                                            )}
                                        onClick={(event) => { event.stopPropagation(); downloadAlbum(e) }}
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
                    </>
                )}
            </div>
        )
    }

    if (tab != "download") return

    return (
        <>
            {/* Main toolbar */}
            <div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
                <select
                    title="Select download location from registered Library locations"
                    className={cn("flex flex-row relative outline-none h-7.5 gap-1 justify-center text-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
                        downloadLocation ? "" : "bg-red-950 border-red-200 text-red-200 hover:bg-red-900"
                    )}
                    value={downloadLocation || ""}
                    onChange={(e) => setDownloadLocation(e.target.value)}
                    // onClick={(e) => { if (!downloadLocation && libraryLocations.length == 0) { e.preventDefault(); guideToLibraryLocations() } }}
                    onFocus={(e) => { if (!downloadLocation && libraryLocations.length == 0) { e.preventDefault(); guideToLibraryLocations() } }}
                >
                    {!downloadLocation && (
                        <option value="" hidden>{libraryLocations.length == 0 ? "Add a location to your library first" : "Choose location"}</option>
                    )}
                    {!libraryLocations.includes(downloadLocation) && downloadLocation && (
                        <option value={downloadLocation} title={downloadLocation}>{getFolderName(downloadLocation)}</option>
                    )}
                    {libraryLocations.map((e, i) => (
                        <option key={i} title={e} value={e}>{getFolderName(e)}</option>
                    ))}
                </select>
                {(queuedAlbumsDownload.length > 0 || queuedSongsDownload.length > 0) && (
                    <>
                        <div
                            title={downloadingLabel}
                            className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700"
                        >
                            <div className="animate-spin">
                                <TbLoader2 size={16} />
                            </div>
                            <span>
                                Downloading...
                            </span>
                        </div>
                    </>
                )}
                {(queuedSongsComplete.length > 0 || queuedAlbumsComplete.length > 0) && (
                    <>
                        <div
                            title={completeLabel}
                            className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
                            onClick={() => setFilter("downloaded")}
                        >
                            <MdCheckCircleOutline size={18} />
                            <span>
                                {`${queuedSongsComplete.length + queuedAlbumsComplete.length} item(s) downloaded`}
                            </span>
                            <div
                                className="absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply bg-green-300 outline-2 outline-green-300 transition ease-out duration-200"
                            />
                        </div>
                    </>
                )}
                {(queuedSongsFailed.length > 0 || queuedAlbumsFailed.length > 0) && (
                    <>
                        <div
                            title={failedLabel}
                            className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
                            onClick={() => setFilter("failed")}
                        >
                            <MdErrorOutline size={18} />
                            <span>
                                {`${queuedSongsFailed.length + queuedAlbumsFailed.length} item(s) failed`}
                            </span>
                            <div
                                className="absolute w-full h-full rounded-full top-0 left-0 mix-blend-multiply bg-red-300 outline-2 outline-red-300 transition ease-out duration-200"
                            />
                        </div>
                    </>
                )}
                <PowerSavingButton />
            </div>
            {/* Search bar */}
            <div className="relative w-full flex flex-row">
                <input
                    className={cn(
                        "outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pr-8 transition ease-out duration-200",
                        "focus:shadow-pink-400/40",
                    )}
                    type="text"
                    spellCheck={false}
                    placeholder="Search for artists, songs, albums..."
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
                    className={cn("flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
                        filter == "songs" ? "brightness-105" : ""
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
                            filter == "songs"
                                ? "bg-pink-300 outline-2 outline-pink-300"
                                : "",
                        )}
                    />
                </button>
                <button
                    className={cn("flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
                        filter == "albums" ? "brightness-105" : ""
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
                            filter == "albums"
                                ? "bg-pink-300 outline-2 outline-pink-300"
                                : "",
                        )}
                    />
                </button>
                <button
                    className={cn("flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
                        filter == "downloaded" ? "brightness-105" : ""
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
                            filter == "downloaded"
                                ? "bg-green-300 outline-2 outline-green-300"
                                : "",
                        )}
                    />
                </button>
                <button
                    className={cn("flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
                        filter == "failed" ? "brightness-105" : ""
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
                            filter == "failed"
                                ? "bg-red-300 outline-2 outline-red-300"
                                : "",
                        )}
                    />
                </button>
                {/* <button
                    className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]"
                    onClick={() => {
                        setFilter("artists")
                    }}
                >
                    <IoPeopleSharp size={14} />
                    <span>Artists</span>
                    <div
                        className={cn(
                            "absolute w-full h-full rounded-full  top-0 left-0 mix-blend-multiply transition ease-out duration-200",
                            filter == "artists"
                                ? "bg-pink-300 outline-2 outline-pink-300"
                                : "",
                        )}
                    />
                </button> */}
            </div>
            {/* Content */}
            {filter == "songs" && (
                <div className="flex flex-col gap-2">
                    {searchSongsResults.map((e, i) => (
                        <div key={i}>
                            {SongEntry(e)}
                        </div>
                    ))}
                </div>
            )}
            {filter == "albums" && (
                <div className="flex flex-col gap-2">
                    {searchAlbumsResults.map((e, i) => (
                        <div key={i}>
                            {AlbumEntry(e)}
                        </div>
                    ))}
                </div>
            )}
            {filter == "downloaded" && (
                <>
                    <div className="flex flex-col gap-2">
                        {queuedSongsComplete.map((e, i) => (
                            <div key={i}>
                                {SongEntry(e)}
                            </div>
                        ))}
                        {queuedAlbumsComplete.map((e, i) => (
                            <div key={i}>
                                {AlbumEntry(e)}
                            </div>
                        ))}
                    </div>
                </>
            )}
            {filter == "failed" && (
                <>
                    <div className="flex flex-col gap-2">
                        {queuedSongsFailed.map((e, i) => (
                            <div key={i}>
                                {SongEntry(e)}
                            </div>
                        ))}
                        {queuedAlbumsFailed.map((e, i) => (
                            <div key={i}>
                                {AlbumEntry(e)}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    )
}