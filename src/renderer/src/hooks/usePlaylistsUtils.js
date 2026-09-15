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
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { randomStr } from "../utils"

export default function usePlaylistUtils() {

    const { playlists } = usePlaylistsStore()

    const getPlaylistFromId = useCallback((id) => {
        return playlists.filter((e) => e.id == id)[0] ?? { id: "id", name: "", songs: [] }
    }, [playlists])

    const idInPlaylists = useCallback((id) => {
        return playlists.map((e) => e.id).includes(id)
    }, [playlists])

    const generateUnusedID = useCallback(() => {
        const IDs = playlists.map((e) => e.id)
        const chars = "abcdefghijklmnopqrstuvwxyz".split("")
        let res = randomStr(16, chars)
        while (IDs.includes(res)) {
            res = randomStr(16, chars)
        }
        return res
    }, [playlists])

    return {
        getPlaylistFromId,
        idInPlaylists,
        generateUnusedID
    }
}