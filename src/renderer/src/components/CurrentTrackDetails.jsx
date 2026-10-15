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
import useLibraryUtils from "../hooks/useLibraryUtils"
import { useCoversStore } from "../stores/useCoversStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import { getFolderName, getSongName } from "../utils"
import { useSettingsStore } from "../stores/useSettingsStore"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useContextMenuStore } from "../stores/useContextMenuStore"
import { MdImage, MdImageNotSupported } from "react-icons/md"

export default function CurrentTrackDetails() {
	const { currentTrack } = usePlayerStore()
	const {
		thumbnailCache,
		setThumbnailCache,
		setThumbnailTracksOverride,
		removeThumbnailEntries
	} = useCoversStore()
	const { showLyricsPanel } = useSettingsStore()
	const { showSongInLibrary, showAlbumInLibrary } = useLibraryUtils()
	const { setContextMenu } = useContextMenuStore()
	const [hasReplacementCover, setHasReplacementCover] = useState(false)

	const handleReplaceCover = useCallback(async () => {
		const img = await window.electron.ipcRenderer.invoke("open_image", {})
		if (!img) return
		let res = await window.electron.ipcRenderer.invoke("replace_cover", {
			track: currentTrack,
			path: img
		})
		if (res) {
			if (!res.startsWith("file://")) {
				if (res.startsWith("/")) {
					res = res.slice(1)
				}
				res = `file:///${res}`
			}
			setThumbnailTracksOverride([currentTrack], res)
		}
	}, [currentTrack, setThumbnailTracksOverride])

	const handleRemoveReplacementCover = useCallback(async () => {
		if (!hasReplacementCover) return
		let res = await window.electron.ipcRenderer.invoke("remove_replacement_cover", {
			track: currentTrack
		})
		if (res) {
			if (!res.startsWith("file://")) {
				if (res.startsWith("/")) {
					res = res.slice(1)
				}
				res = `file:///${res}`
			}
			setThumbnailTracksOverride([currentTrack], res)
		} else {
			removeThumbnailEntries([currentTrack])
		}
	}, [currentTrack, hasReplacementCover, setThumbnailTracksOverride, removeThumbnailEntries])

	const songThumbEnabled = useMemo(() => {
		return !(thumbnailCache[currentTrack] == "#")
	}, [currentTrack, thumbnailCache])

	const handleToggleThumbnail = useCallback(() => {
		if (songThumbEnabled) {
			const updated = {}
			updated[currentTrack] = "#"
			setThumbnailCache({ ...thumbnailCache, ...updated })
		} else {
			const updated = { ...thumbnailCache }
			delete updated[currentTrack]
			setThumbnailCache(updated)
		}
	}, [thumbnailCache, setThumbnailCache, currentTrack, songThumbEnabled])

	const contextEntries = useMemo(() => {
		const res = []

		res.push({
			text: songThumbEnabled ? "Disable cover" : "Enable cover",
			title: songThumbEnabled
				? "Disable cover art fetching for this song"
				: "Enable cover art fetching for this song",
			icon: songThumbEnabled ? <MdImageNotSupported size={20} /> : <MdImage size={20} />,
			callback: handleToggleThumbnail
		})

		res.push({
			text: "Customize cover",
			title: "Replace default cover artwork with a local image",
			icon: <MdImage size={20} />,
			callback: handleReplaceCover
		})
		if (hasReplacementCover) {
			res.push({
				text: "Remove custom cover",
				title: "Fallback to the default fetched cover",
				icon: <MdImageNotSupported size={20} />,
				callback: handleRemoveReplacementCover
			})
		}

		return res
	}, [
		songThumbEnabled,
		handleToggleThumbnail,
		hasReplacementCover,
		handleReplaceCover,
		handleRemoveReplacementCover
	])

	const handleContextMenu = useCallback(
		(e) => {
			if (!currentTrack) return
			setContextMenu(e.clientX, e.clientY, contextEntries, getSongName(currentTrack))
		},
		[contextEntries, currentTrack, setContextMenu]
	)

	useEffect(() => {
		window.electron.ipcRenderer
			.invoke("has_replacement_cover", { track: currentTrack })
			.then((e) => setHasReplacementCover(!!e))
		const unsub = window.electron.ipcRenderer.on("tracks_with_replacement", (e, v) => {
			setHasReplacementCover((v.tracks ?? []).includes(currentTrack))
		})
		return () => {
			unsub()
		}
	}, [currentTrack])

	if (!(currentTrack && currentTrack.trim())) return
	return (
		<>
			<div className="w-80"></div>
			<div
				onContextMenu={handleContextMenu}
				className={cn(
					"mt-1 fixed w-80 h-fit max-h-[calc(100%-232px)] overflow-y-scroll overflow-x-clip bg-pink-400/30 p-4 rounded-2xl flex flex-col justify-start text-center gap-2 bg-linear-180 from-slate-950 to-pink-800 outline-2 outline-pink-300/80 from-[-75%] to-150% shadow-pink-400/40 shadow-[0_0_7px_7px]",
					showLyricsPanel && "max-h-[calc(100%-376px)]"
				)}
			>
				<AnimatePresence mode="popLayout">
					<motion.div
						key={currentTrack}
						layout="preserve-aspect"
						layoutId="currentDetails"
						className="flex flex-col justify-start gap-2"
						initial={{ opacity: 0, scale: 0.975 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.975 }}
						transition={{
							scale: {
								duration: 0.5,
								ease: "easeOut"
							}
						}}
					>
						{thumbnailCache[currentTrack] &&
							thumbnailCache[currentTrack] != "#" &&
							thumbnailCache[currentTrack].trim() && (
								<div className="rounded-xl pointer-events-none">
									<div className="flex flex-row justify-center aspect-square">
										<div className="flex flex-row scale-95 w-full">
											<img
												className="w-full object-cover rounded-xl"
												src={thumbnailCache[currentTrack] ?? "#"}
											/>
										</div>
									</div>
								</div>
							)}
						<div
							onClick={() => showSongInLibrary(getSongName(currentTrack))}
							className="font-bold cursor-pointer max-w-fit mx-auto"
						>
							{getSongName(currentTrack)}
						</div>
						<div
							onClick={() => showAlbumInLibrary(getFolderName(currentTrack))}
							className="font-bold text-xs opacity-70 cursor-pointer max-w-fit mx-auto"
						>
							{getFolderName(currentTrack)}
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</>
	)
}
