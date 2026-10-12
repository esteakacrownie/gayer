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

export default function CurrentTrackDetails() {
	const { currentTrack } = usePlayerStore()
	const { thumbnailCache } = useCoversStore()
	const { showLyricsPanel } = useSettingsStore()
	const { showSongInLibrary, showAlbumInLibrary } = useLibraryUtils()

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
								<img
									className="rounded-xl scale-95 select-none pointer-events-none"
									src={thumbnailCache[currentTrack] ?? "#"}
								/>
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
