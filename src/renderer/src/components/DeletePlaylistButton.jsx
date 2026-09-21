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

import { useCallback } from "react"
import { usePlayerStore } from "../stores/usePlayerStore"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { MdDelete } from "react-icons/md"
import useConfirm from "../hooks/useConfirmationButton"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function DeletePlaylistButton({ pid }) {

    const { selectedPlaylist, setSelectedPlaylist } = usePlayerStore()

    const { setForceRefreshLocationsTracker } = useSettingsStore()

    const { playlists, setPlaylists } = usePlaylistsStore()

    const { idInPlaylists } = usePlaylistUtils()

    const [deletingSelectedPlaylist, setDeletingSelectedPlaylist] = useConfirm()

    const removeSelectedPlaylist = useCallback(() => {
        if (deletingSelectedPlaylist) {
            setPlaylists(playlists.filter((e) => e.id != pid))
            setSelectedPlaylist("")
            setDeletingSelectedPlaylist(false)
        } else {
            setDeletingSelectedPlaylist(true)
        }
    }, [playlists, selectedPlaylist, deletingSelectedPlaylist])

    const removeSelectedAlbum = useCallback(async () => {
        if (deletingSelectedPlaylist) {
            await window.electron.ipcRenderer.invoke("delete_dir", { path: pid })
            setSelectedPlaylist("")
            setDeletingSelectedPlaylist(false)
            setForceRefreshLocationsTracker((p) => p + 1)
        } else {
            setDeletingSelectedPlaylist(true)
        }
    }, [selectedPlaylist, pid, deletingSelectedPlaylist])

    return (
        <button
            className="-my-1 flex flex-row relative outline-none min-w-max gap-1 text-sm justify-center items-center text-red-300 bg-red-950 rounded-full border border-red-300 py-1 px-2 transition ease-out duration-200 hover:bg-red-900 cursor-pointer"
            onClick={() => idInPlaylists(pid) ? removeSelectedPlaylist() : removeSelectedAlbum()}
        >
            <MdDelete size={16} />
            <span>
                {deletingSelectedPlaylist ? "Confirm deletion ?" : (idInPlaylists(pid) ? "Delete Playlist" : "Delete Album")}
            </span>
        </button>
    )
}