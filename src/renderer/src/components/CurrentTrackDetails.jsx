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
import { IoIosFolderOpen } from "react-icons/io"
import { useCallback } from "react"

export default function CurrentTrackDetails() {
	const { currentTrack } = usePlayerStore()
	const { thumbnailCache, setThumbnailTracksOverride } = useCoversStore()
	const { showLyricsPanel } = useSettingsStore()
	const { showSongInLibrary, showAlbumInLibrary } = useLibraryUtils()

	const handleReplaceCover = useCallback(async () => {
		const img = await window.electron.ipcRenderer.invoke("open_image", {})
		if (!img) return
		let res = await window.electron.ipcRenderer.invoke("replace_cover", {
			track: currentTrack,
			path: img
		})
		if (!res.startsWith("file://")) {
			if (res.startsWith("/")) {
				res = res.slice(1)
			}
			res = `file:///${res}`
		}
		if (res) {
			setThumbnailTracksOverride([currentTrack], res)
		}
	}, [currentTrack, setThumbnailTracksOverride])

	if (!(currentTrack && currentTrack.trim())) return
	return (
		<>
			<div className="w-80"></div>
			<div
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
								<div className="relative rounded-xl select-none pointer-events-auto group/cover">
									<div className="flex flex-row justify-center aspect-square">
										<div className="relative flex flex-row w-full">
											<img
												className="scale-95 w-full object-cover rounded-xl select-none pointer-events-none group-hover/cover:brightness-55 transition ease-out duration-200"
												src={thumbnailCache[currentTrack] ?? "#"}
											/>
											<motion.div
												title="Replace this cover artwork for all songs and playlists"
												className="absolute top-4 right-4 opacity-0 group-hover/cover:opacity-100 hover:text-white hover:bg-pink-400/50 hover:opacity-100 rounded-lg h-10 aspect-square flex flex-col justify-center items-center cursor-pointer transition ease-out duration-200"
												onClick={handleReplaceCover}
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
