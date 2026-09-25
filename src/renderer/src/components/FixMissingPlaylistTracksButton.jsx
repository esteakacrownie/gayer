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
import { HiSparkles } from "react-icons/hi2"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { usePlayerStore } from "../stores/usePlayerStore"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"

export default function FixMissingPlaylistTracksButton() {
	const { selectedPlaylist } = usePlayerStore()
	const { idInPlaylists, getPlaylistFromId } = usePlaylistUtils()
	const { requestedTracksReplacements, setRequestedTracksReplacements } = usePlaylistsStore()

	const [missingTracks, setMissingTracks] = useState([])
	const playlistIdRef = useRef("")

	const computeMissingTracks = useCallback(
		async (playlistId) => {
			const songs = getPlaylistFromId(playlistId).songs
			const res = await window.electron.ipcRenderer.invoke("get_files_exist", {
				paths: songs
			})
			let missing = []
			for (let s of Object.keys(res)) {
				if (res[s] === false) {
					missing = [...new Set([...missing, s])]
				}
			}
			if (playlistId == playlistIdRef.current) {
				// only set if selected playlist didn't change after missing files processing
				setMissingTracks(missing.filter((e) => !requestedTracksReplacements.includes(e)))
			}
		},
		[getPlaylistFromId, playlistIdRef, requestedTracksReplacements]
	)

	const handleFixMissingTracks = useCallback(() => {
		setRequestedTracksReplacements([
			...new Set([...requestedTracksReplacements, ...missingTracks])
		])
	}, [missingTracks, requestedTracksReplacements, setRequestedTracksReplacements])

	useEffect(() => {
		const action = async () => {
			playlistIdRef.current = selectedPlaylist
			if (!selectedPlaylist || !idInPlaylists(selectedPlaylist)) {
				setMissingTracks([])
			} else {
				computeMissingTracks(selectedPlaylist)
			}
		}
		action()
	}, [selectedPlaylist, requestedTracksReplacements])

	if (missingTracks.length == 0) {
		return <></>
	}

	console.log(missingTracks)

	return (
		<button
			className="flex flex-row gap-1 outline-none justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer overflow-clip relative"
			onClick={handleFixMissingTracks}
		>
			<HiSparkles size={16} />
			<span>Fix {missingTracks.length} missing tracks</span>
			<div
				className={cn(
					"absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200 bg-amber-200"
				)}
			/>
		</button>
	)
}
