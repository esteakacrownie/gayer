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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getSongName, isPlaylistFile, parseM3U8, toAllowedPlaylistName } from "../utils"
import { IoAdd, IoChevronBack } from "react-icons/io5"
import { IoIosFolderOpen, IoMdClose } from "react-icons/io"
import { PiPlaylist } from "react-icons/pi"
import ManagedPlaylistItem from "./ManagedPlaylistItem"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { motion } from "motion/react"
import { useClickOutside } from "../hooks/useClickOutside"
import { useHotkeys } from "react-hotkeys-hook"

export default function PlaylistDialog() {
	const { selectedSongPath, setSelectedSongPath, playlists, setPlaylists } = usePlaylistsStore()

	const { generateUnusedID } = usePlaylistUtils()

	const [newPlaylistName, setNewPlaylistName] = useState("")

	const playlistsHavingSong = useMemo(() => {
		// console.log(playlists)
		if (Array.isArray(selectedSongPath)) {
			const res = playlists.filter((e) => {
				for (let elt of e.songs) {
					// console.log(elt)
					if (selectedSongPath.includes(elt)) {
						return true
					}
				}
				return false
			})
			return res.map((e) => e.id)
		} else {
			return playlists.filter((e) => e.songs.includes(selectedSongPath)).map((e) => e.id)
		}
	}, [selectedSongPath, playlists])

	const closeDialogModal = () => {
		setSelectedSongPath("")
	}

	const mainContainer = useRef(null)
	const container = useRef(null)
	useClickOutside(container, closeDialogModal, selectedSongPath !== "", mainContainer)

	const importNewPlaylist = useCallback(async () => {
		const path = await window.electron.ipcRenderer.invoke("open_file", {})
		// console.log(path)
		if (!path || !isPlaylistFile(path)) return
		const file = await window.electron.ipcRenderer.invoke("read_file", { path })
		const parsed = parseM3U8(file)
		// console.log(parsed)
		setPlaylists([...playlists, { ...parsed, id: generateUnusedID() }])
	}, [generateUnusedID, playlists, setPlaylists])

	const { createPlaylist } = usePlaylistUtils()
	const createNewPlaylist = useCallback(() => {
		if (!newPlaylistName.trim()) return
		createPlaylist(newPlaylistName)
		setNewPlaylistName("")
	}, [generateUnusedID, playlists, setPlaylists, newPlaylistName])

	const handlePlaylistSelected = useCallback(
		(pid) => {
			if (selectedSongPath == "*") return

			// handle whether playlist has one of the selected songs
			const hasSelected = () => {
				if (Array.isArray(selectedSongPath)) {
					for (let elt of selectedSongPath) {
						if (playlists.filter((e) => e.id == pid)[0].songs.includes(elt)) {
							return true
						}
					}
					return false
				} else {
					return playlists.filter((e) => e.id == pid)[0].songs.includes(selectedSongPath)
				}
			}

			if (hasSelected()) {
				// remove from playlist
				const p = [...playlists]
				let idx = 0
				// finding playlist's index
				for (let elt of p) {
					if (elt.id == pid) {
						break
					}
					idx += 1
				}
				if (idx < p.length) {
					let songs = []
					if (Array.isArray(selectedSongPath)) {
						// console.log(p[idx].songs.filter((e) => !selectedSongPath.includes(e)))
						songs = [
							...new Set(p[idx].songs.filter((e) => !selectedSongPath.includes(e)))
						]
					} else {
						songs = [...new Set(p[idx].songs.filter((e) => e != selectedSongPath))]
					}
					p[idx] = { ...p[idx], songs }
				}
				setPlaylists(p)
			} else {
				// add to playlist
				const p = [...playlists]
				// finding playlist's index
				let idx = 0
				for (let elt of p) {
					if (elt.id == pid) {
						break
					}
					idx += 1
				}
				if (idx < p.length) {
					let songs = []
					if (Array.isArray(selectedSongPath)) {
						songs = [...new Set([...p[idx].songs, ...selectedSongPath])]
					} else {
						songs = [...new Set([...p[idx].songs, selectedSongPath])]
					}
					p[idx] = { ...p[idx], songs }
				}
				setPlaylists(p)
			}
		},
		[playlists, setPlaylists, selectedSongPath]
	)

	const displaySelectedSong = useMemo(() => {
		if (Array.isArray(selectedSongPath)) {
			if (selectedSongPath.length == 0) return ""
			return (
				<>
					{getSongName(selectedSongPath[0])}&nbsp;
					<span className="font-bold text-sm">
						{selectedSongPath.length > 1 ? ` + ${selectedSongPath.length - 1}` : ""}
					</span>
				</>
			)
		} else {
			return getSongName(selectedSongPath)
		}
	}, [selectedSongPath])

	useEffect(() => {
		setNewPlaylistName("")
		// console.log(playlists)
	}, [selectedSongPath])

	useHotkeys("escape", () => {
		if (selectedSongPath) {
			setSelectedSongPath("")
		}
	})

	if (!selectedSongPath) return

	return (
		<div
			ref={mainContainer}
			className="fixed z-10 top-0 w-screen h-screen mx-auto pt-4 pb-34 backdrop-blur-sm backdrop-brightness-75 flex flex-col justify-center items-center"
		>
			<div
				ref={container}
				className="px-8 flex flex-col w-full h-full justify-start gap-4 max-w-200 mx-auto"
			>
				<div className="p-4 flex flex-col gap-2 justify-start items-center w-full  h-full from-slate-950 to-pink-700 from-[-25%] to-150% bg-linear-180 rounded-2xl border-2 border-pink-300 shadow-pink-400/40 shadow-[0_0_7px_7px]">
					<div className="flex flex-row w-full items-center justify-between gap-2">
						<motion.div
							className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
							onClick={closeDialogModal}
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
						{selectedSongPath == "*" ? (
							<>
								<div className="font-bold flex flex-row justify-center items-center gap-1">
									<PiPlaylist size={30} />
									<p className="w-full text-center line-clamp-1">Playlists</p>
								</div>
							</>
						) : (
							<p className="w-full text-center line-clamp-1">{displaySelectedSong}</p>
						)}
						<motion.div
							className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
							onClick={importNewPlaylist}
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
							<IoIosFolderOpen size={20} />
						</motion.div>
					</div>
					<div className="relative w-full flex flex-row items-center gap-2">
						<input
							className={cn(
								"outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pr-8 transition ease-out duration-200",
								"focus:shadow-pink-400/40"
							)}
							autoFocus
							type="text"
							spellCheck={false}
							placeholder=" +  Create new Playlist"
							value={newPlaylistName}
							onChange={(e) =>
								setNewPlaylistName(toAllowedPlaylistName(e.target.value))
							}
							onKeyDown={(e) => {
								if (e.key == "Enter") {
									createNewPlaylist()
								} else if (e.key == "Escape") {
									e.target.blur()
								}
							}}
						/>
						<button
							className="absolute right-12 top-0 h-full p-2 cursor-pointer hover:scale-125 active:scale-95 transition ease-out duration-200"
							onClick={() => setNewPlaylistName("")}
						>
							<IoMdClose size={20} />
						</button>
						<motion.div
							className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
							onClick={createNewPlaylist}
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
							<IoAdd size={20} />
						</motion.div>
					</div>
					<motion.ul className="h-full w-full flex flex-col items-center justify-start gap-2 overflow-y-scroll">
						{playlists.map((e) => {
							return selectedSongPath == "*" ? (
								<motion.li className="w-full" layout key={e.id}>
									<ManagedPlaylistItem
										pid={e.id}
										pname={e.name}
										plength={e.songs.length}
									/>
								</motion.li>
							) : (
								<motion.li
									layout
									key={e.id}
									className={cn(
										"relative p-2 gap-2 w-full flex flex-row overflow-clip jutify-start items-center rounded-lg font-bold text-white transition ease-out duration-200 select-none brightness-110 bg-pink-500/10 hover:bg-pink-500/25 cursor-pointer",
										playlistsHavingSong.includes(e.id)
											? "bg-linear-90 from-pink-950 to-pink-900 brightness-150 hover:brightness-200 border-2 border-pink-400"
											: "brightness-110 border-2 border-transparent"
									)}
									onClick={() => {
										handlePlaylistSelected(e.id)
									}}
								>
									<p className="line-clamp-1">{e.name}</p>
									<p className="min-w-max line-clamp-1 opacity-75 text-xs brightness-90">{`${e.songs.length} item(s)`}</p>
								</motion.li>
							)
						})}
					</motion.ul>
				</div>
			</div>
		</div>
	)
}
