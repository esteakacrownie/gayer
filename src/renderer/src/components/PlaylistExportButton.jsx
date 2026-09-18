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

import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import { IoMdDownload } from "react-icons/io"
import { useCallback } from "react"
import { downloadTextFile, generateM3U8 } from "../utils"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"

export default function PlaylistExportButton() {

    const { playlists } = usePlaylistsStore()
    const { selectedPlaylist } =
        usePlayerStore()
    const { getPlaylistFromId } = usePlaylistUtils()

    const exportPlaylist = useCallback(() => {
        if (!selectedPlaylist || selectedPlaylist == "*") return
        const p = { ...getPlaylistFromId(selectedPlaylist) }
        downloadTextFile(`${p.name || "My Playlist"}.m3u8`, generateM3U8(p))
    }, [playlists, selectedPlaylist])

    return (
        <button
            className="flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer overflow-clip"
            onClick={exportPlaylist}
        >
            <IoMdDownload size={16} />
            <span>Export</span>
        </button>
    )
}