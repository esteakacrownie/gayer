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
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { useCallback, useEffect, useMemo, useState } from "react"
import { getSongName, isPlaylistFile, parseM3U8, randomStr, toAllowedPlaylistName } from "../utils"
import { IoAdd, IoChevronBack } from "react-icons/io5"
import { IoIosFolderOpen, IoMdClose } from "react-icons/io"
import ManagedPlaylistItem from "./ManagedPlaylistItem"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"

export default function PlaylistDialog() {

    const { selectedSongPath, setSelectedSongPath, playlists, setPlaylists } = usePlaylistsStore()

    const { generateUnusedID } = usePlaylistUtils()

    const [newPlaylistName, setNewPlaylistName] = useState("")

    const playlistsHavingSong = useMemo(() => {
        // console.log(playlists)
        return playlists.filter((e) => e.songs.includes(selectedSongPath)).map((e) => e.id)
    }, [selectedSongPath, playlists])

    const importNewPlaylist = useCallback(async () => {
        const path = await window.electron.ipcRenderer.invoke("open_file", {})
        console.log(path)
        if (!isPlaylistFile(path)) return
        const file = await window.electron.ipcRenderer
            .invoke("read_file", { path })
        const parsed = parseM3U8(file)
        console.log(parsed)
        setPlaylists([...playlists, { ...parsed, id: generateUnusedID() }])
    }, [generateUnusedID, playlists, setPlaylists])

    const createNewPlaylist = useCallback(() => {
        if (!newPlaylistName.trim()) return
        setPlaylists([...playlists, { id: generateUnusedID(), name: newPlaylistName, songs: [] }])
        setNewPlaylistName("")
    }, [generateUnusedID, playlists, setPlaylists, newPlaylistName])

    const handlePlaylistSelected = useCallback((pid) => {
        if (selectedSongPath == "*") return
        if (playlists.filter((e) => e.id == pid)[0].songs.includes(selectedSongPath)) {
            const p = [...playlists]
            let idx = 0
            for (let elt of p) {
                if (elt.id == pid) {
                    break
                }
                idx += 1
            }
            if (idx < p.length) {
                p[idx] = { ...p[idx], songs: [...new Set(p[idx].songs.filter((e) => e != selectedSongPath))] }
            }
            setPlaylists(p)
        } else {
            const p = [...playlists]
            let idx = 0
            for (let elt of p) {
                if (elt.id == pid) {
                    break
                }
                idx += 1
            }
            if (idx < p.length) {
                p[idx] = { ...p[idx], songs: [...new Set([...p[idx].songs, selectedSongPath])] }
            }
            setPlaylists(p)
        }
    }, [playlists, setPlaylists, selectedSongPath])

    useEffect(() => {
        setNewPlaylistName("")
        // console.log(playlists)
    }, [selectedSongPath])

    return (
        <div
            className={cn("fixed z-10 top-0 w-screen h-screen mx-auto pt-18 pb-34", selectedSongPath ? "flex flex-col justify-center items-center" : "hidden pointer-events-none")}
        >
            <div className="px-8 flex flex-col w-full h-full justify-start gap-4 max-w-200 mx-auto">
                <div className="p-4 flex flex-col gap-2 justify-start items-center w-full  h-full from-slate-950 to-pink-700 from-[-25%] to-150% bg-linear-180 rounded-2xl border-2 border-pink-300 shadow-pink-400/40 shadow-[0_0_7px_7px]">
                    <div className="flex flex-row w-full items-center justify-between gap-2">
                        <div
                            className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
                            onClick={() => setSelectedSongPath("")}
                        >
                            <IoChevronBack size={20} />
                        </div>
                        <p className="w-full text-center line-clamp-1">{selectedSongPath == "*" ? "Playlists" : getSongName(selectedSongPath)}</p>
                        <div
                            className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
                            onClick={importNewPlaylist}
                        >
                            <IoIosFolderOpen size={20} />
                        </div>
                    </div>
                    <div className="relative w-full flex flex-row items-center gap-2">
                        <input
                            className={cn(
                                "outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pr-8 transition ease-out duration-200",
                                "focus:shadow-pink-400/40",
                            )}
                            type="text"
                            placeholder=" +  Create new Playlist"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(toAllowedPlaylistName(e.target.value))}
                            onKeyDown={(e) => { if (e.key == "Enter") createNewPlaylist() }}
                        />
                        <button
                            className="absolute right-12 top-0 h-full p-2 cursor-pointer hover:scale-125 transition ease-out duration-200"
                            onClick={() => setNewPlaylistName("")}
                        >
                            <IoMdClose size={20} />
                        </button>
                        <div className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200" onClick={createNewPlaylist}>
                            <IoAdd size={20} />
                        </div>
                    </div>
                    <div className="h-full w-full flex flex-col items-center justify-start gap-2 overflow-y-scroll">
                        {playlists.map((e) => {
                            return selectedSongPath == "*" ? <ManagedPlaylistItem key={e.id} pid={e.id} pname={e.name} plength={e.songs.length} /> :
                                <div
                                    key={e.id}
                                    className={cn(
                                        "relative p-2 gap-2 w-full flex flex-row overflow-clip jutify-start items-center rounded-lg font-bold text-white transition ease-out duration-200 select-none brightness-110 bg-pink-500/10 hover:bg-pink-500/25 cursor-pointer",
                                        playlistsHavingSong.includes(e.id) ? "bg-linear-90 from-pink-950 to-pink-900 brightness-150 hover:brightness-200 border-2 border-pink-400"
                                            : "brightness-110 border-2 border-transparent",
                                    )}
                                    onClick={() => { handlePlaylistSelected(e.id) }}
                                >
                                    <p className="line-clamp-1">{e.name}</p>
                                    <p className="min-w-max line-clamp-1 opacity-75 text-xs brightness-90">{`${e.songs.length} item(s)`}</p>
                                </div>
                        })}
                    </div>
                </div>
            </div>
        </div >
    )
}