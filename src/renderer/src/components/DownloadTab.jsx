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
import { useCallback, useEffect, useState } from "react"
import { IoMdCheckmark, IoMdClose, IoMdDownload } from "react-icons/io"
import { TbLoader2 } from "react-icons/tb";
import PowerSavingButton from "./PowerSavingButton"
import { getFolderName } from "../utils"
import { motion } from "motion/react"

export default function DownloadTab() {

    const { tab, libraryLocations, downloadLocation, setDownloadLocation, forceRefreshLocationsTracker, setForceRefreshLocationsTracker } = useSettingsStore()
    const [search, setSearch] = useState("")
    const [searchSongsResults, setSearchSongsResults] = useState([])
    const [searchAlbumsResults, setSearchAlbumsResults] = useState([])
    const [searchArtistsResults, setSearchArtistsResults] = useState([])
    const [queuedSongsDownload, setQueuedSongsDownload] = useState([])
    const [queuedSongsDelete, setQueuedSongsDelete] = useState([])
    const [songExistsDb, setSongExistsDb] = useState({})
    const [filter, setFilter] = useState("songs")

    const clearSearch = () => {
        setSearch("")
    }

    const computedSongPath = useCallback(async (songElt) => {
        let path = downloadLocation
        try {
            path += "/"
            if (songElt.album?.name && songElt.artist?.name) {
                path += `${songElt.album.name} - ${songElt.artist.name}/`
            }
            if (songElt.artist.name) {
                path += `${songElt.name} - ${songElt.artist?.name}`
            } else {
                path += songElt.name
            }
        } catch (error) {
            console.error(error)
            console.log(songElt)
            return
        }
        return path + ".mp3"
    }, [downloadLocation])

    const downloadSong = useCallback(async (songElt) => {
        if (!downloadLocation || !songElt.name) return
        setQueuedSongsDownload((p) => ([...new Set([...p, songElt.videoId])]))
        const path = await computedSongPath(songElt)
        const result = await window.electron.ipcRenderer.invoke("download_song", { url: songElt.videoId, path: path })
        const exists = await window.electron.ipcRenderer.invoke("file_exists", { path: path })
        const updated = {}
        updated[songElt.videoId] = exists
        setSongExistsDb((p) => ({ ...p, ...updated }))
        setQueuedSongsDownload((p) => p.filter((e) => e != songElt.videoId))
        if (result) {
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
        }
    }, [downloadLocation, forceRefreshLocationsTracker, setForceRefreshLocationsTracker])

    const deleteSong = useCallback(async (songElt) => {
        if (!downloadLocation || !songElt.name) return
        setQueuedSongsDelete((p) => ([...new Set([...p, songElt.videoId])]))
        const path = await computedSongPath(songElt)
        const result = await window.electron.ipcRenderer.invoke("delete_song", { path: path })
        const exists = await window.electron.ipcRenderer.invoke("file_exists", { path: path })
        const updated = {}
        updated[songElt.videoId] = exists
        setSongExistsDb((p) => ({ ...p, ...updated }))
        setQueuedSongsDownload((p) => p.filter((e) => e != songElt.videoId))
        if (result) {
            setForceRefreshLocationsTracker(forceRefreshLocationsTracker + 1)
        }
    }, [queuedSongsDelete, downloadLocation])

    const fetchSongsResults = async (q) => {
        const res = await window.electron.ipcRenderer.invoke("ytm_songs", { query: q })
        await refreshExistsDb(res)
        setSearchSongsResults(res)
    }

    const fetchAlbumsResults = async (q) => {

    }

    const fetchArtistsResults = async (q) => {

    }

    const refreshExistsDb = async (res) => {
        const songs = {}
        for (let e of res) {
            songs[e.videoId] = await computedSongPath(e)
        }
        const exst = await window.electron.ipcRenderer.invoke("get_songs_exist", { songs: songs })
        setSongExistsDb((p) => ({ ...p, ...exst }))
    }

    useEffect(() => {
        refreshExistsDb(searchSongsResults)
    }, [libraryLocations, forceRefreshLocationsTracker])

    useEffect(() => {
        if (!search || search.length < 3) {
            setSearchSongsResults([])
            setSearchAlbumsResults([])
            setSearchArtistsResults([])
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
    }, [search])

    if (tab != "download") return

    return (
        <>{/* Main toolbar */}
            <div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
                <select
                    title="Select download location from registered Library locations"
                    className={cn("flex flex-row relative outline-none h-full gap-1 justify-center text-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer",
                        downloadLocation ? "" : "bg-red-950 border-red-200 text-red-200 hover:bg-red-900"
                    )}
                    value={downloadLocation || ""}
                    onChange={(e) => setDownloadLocation(e.target.value)}
                >
                    {!downloadLocation && (
                        <option value="" hidden>{libraryLocations.length == 0 ? "Add a location in your library first" : "Choose location"}</option>
                    )}
                    {!libraryLocations.includes(downloadLocation) && downloadLocation && (
                        <option value={downloadLocation} title={downloadLocation}>{getFolderName(downloadLocation)}</option>
                    )}
                    {libraryLocations.map((e, i) => (
                        <option key={i} title={e} value={e}>{getFolderName(e)}</option>
                    ))}
                </select>
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
            {/* Content */}
            {filter == "songs" && (
                <div className="flex flex-col gap-2">
                    {searchSongsResults.map((e, i) => (
                        <div
                            key={i}
                            title={`${e.name} - ${e.artist.name}`}
                            // onClick={() => console.log(e)}
                            className="flex flex-row items-center justify-between w-full h-10 rounded-lg overflow-clip bg-pink-500/15 hover:bg-pink-500/25 relative gap-2 transition ease-out duration-200"
                        >
                            <div className="flex flex-row items-center gap-2">
                                <img className="h-10 min-w-10 rounded-lg" src={e.thumbnails[0].url} />
                                <span className="line-clamp-1">{`${e.name} - ${e.artist.name}`}</span>
                            </div>
                            {queuedSongsDownload.includes(e.videoId) ? (
                                <>
                                    <div
                                        className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 transition ease-out duration-200"
                                    >
                                        <TbLoader2 className="animate-spin" size={20} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    {songExistsDb[e.videoId] ? (
                                        <motion.div
                                            className={cn("bg-green-900 hover:bg-green-800 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 text-green-300 transition ease-out duration-200",
                                                queuedSongsDelete.includes(e.videoId) ? "" : "cursor-pointer"
                                            )}
                                            onClick={(event) => { event.preventDefault(); deleteSong(e) }}
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
                                            <IoMdCheckmark size={20} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
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
                    ))}
                </div>
            )}
        </>
    )
}