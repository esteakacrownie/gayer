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

import { useCallback, useEffect, useState } from "react"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { IoMdCheckmark } from "react-icons/io"
import { toAllowedPlaylistName } from "../utils"

export default function PlaylistRenamer() {

    const { playlists, setPlaylists } = usePlaylistsStore()
    const { selectedPlaylist } = usePlayerStore()
    const { getPlaylistFromId, idInPlaylists } = usePlaylistUtils()
    const [selectedPlaylistRename, setSelectedPlaylistRename] = useState("")
    const [editingSelectedPlaylistName, setEditingSelectedPlaylistName] = useState(false)

    useEffect(() => {
        setEditingSelectedPlaylistName(false)
        if (selectedPlaylist && idInPlaylists(selectedPlaylist)) {
            setSelectedPlaylistRename(getPlaylistFromId(selectedPlaylist).name)
        } else {
            setSelectedPlaylistRename("")
        }
    }, [selectedPlaylist])

    useEffect(() => {
        if (!editingSelectedPlaylistName) {
            setSelectedPlaylistRename(getPlaylistFromId(selectedPlaylist).name)
        }
    }, [editingSelectedPlaylistName])

    const renameSelectedPlaylist = useCallback(() => {
        if (!idInPlaylists(selectedPlaylist)) return
        let index = 0
        for (let i of playlists) {
            if (i.id == selectedPlaylist) {
                break
            }
            index += 1
        }
        const p = playlists.filter((e) => e.id != selectedPlaylist)
        p.splice(index, 0, { ...getPlaylistFromId(selectedPlaylist), name: selectedPlaylistRename })
        setPlaylists(p)
        setEditingSelectedPlaylistName(false)
    }, [selectedPlaylist, selectedPlaylistRename, playlists, setPlaylists, idInPlaylists, getPlaylistFromId])

    return (
        <>
            {editingSelectedPlaylistName ? (
                <div className="flex flex-row w-full gap-2">
                    <input
                        className="w-full text-lg font-bold text-center border border-slate-400 outline-none rounded-lg bg-slate-800"
                        type="text"
                        autoFocus
                        spellCheck={false}
                        value={selectedPlaylistRename}
                        placeholder="New name for playlist"
                        onChange={(e) => setSelectedPlaylistRename(toAllowedPlaylistName(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key == "Enter") {
                                renameSelectedPlaylist()
                            } else if (e.key == "Escape") {
                                setEditingSelectedPlaylistName(false)
                            }
                        }}
                    />
                    <div className="bg-green-900 hover:bg-green-800 text-green-300 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-green-300 cursor-pointer transition ease-out duration-200" onClick={renameSelectedPlaylist}>
                        <IoMdCheckmark size={20} />
                    </div>
                </div>
            ) : (
                <>
                    <p
                        className="mr-12 font-bold text-lg line-clamp-1 cursor-pointer translate-y-px"
                        onClick={() => setEditingSelectedPlaylistName(true)}>{getPlaylistFromId(selectedPlaylist).name}
                    </p>
                </>
            )}
        </>
    )
}