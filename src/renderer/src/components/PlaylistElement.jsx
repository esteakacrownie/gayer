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
import { GiCompactDisc } from "react-icons/gi";
import usePlayerControls from "../hooks/usePlayerControls"
import { usePlayerStore } from "../stores/usePlayerStore"
import { getFolderName, getSortedFilesAt, shuffleArray } from "../utils"
import { FaPlay, FaStepForward } from "react-icons/fa"
import { MdPlaylistAdd } from "react-icons/md"
import CoverImage from "./CoverImage"
import { motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function PlaylistElement({
	playlist,
	isPlaylist = false,
	isGrabbable = false,
	showPlayNext = true,
	showAddToQueue = true,
}) {
	const { autoplay, setAutoplay, queue, setQueue, setNextAction, currentTrack } = usePlayerStore()

	const { shufflePlay } = useSettingsStore()

	const { playSongs, playBatchNext } = usePlayerControls()

	const [showOptions, setShowOptions] = useState(false)

	const [songs, setSongs] = useState([])

	const fetchSongs = useCallback(async () => {
		const { songs: res } = await getSortedFilesAt(playlist)
		if (res) setSongs(res)
	}, [playlist])

	useEffect(() => {
		fetchSongs()
	}, [playlist])

	const handlePlay = useCallback(() => {
		// console.log(p)
		setAutoplay(true)
		playSongs(songs)
	}, [songs])

	const handlePlayNext = useCallback(() => {
		if (!songs) return
		setAutoplay(true)
		playBatchNext(songs)
	}, [songs])

	const handleAddToQueue = useCallback(() => {
		if (!songs) return
		setQueue([...new Set([...queue, ...(shufflePlay ? shuffleArray(songs) : songs)])])
		if (autoplay && !currentTrack) {
			setNextAction("setNext")
		}
	}, [songs, shufflePlay, autoplay, setNextAction, queue, setQueue, currentTrack])

	return (
		<motion.div
			className={cn(
				"relative flex flex-row overflow-clip jutify-start items-center rounded-lg bg-linear-90 font-bold text-white/75 from-slate-800 to-slate-700 transition ease-out duration-200 select-none brightness-110 hover:brightness-150 border-2 border-slate-400/50",
				isGrabbable ? "cursor-grab" : "cursor-pointer",
			)}
		>
			<div className="absolute top-0 right-0 brightness-125 text-pink-400/50 bg-slate-900/75 outline-2 outline-pink-400/50 rounded-bl-lg">
				<GiCompactDisc className="m-0.5" size={20} />
			</div>
			<motion.div
				layout
				transition={{
					duration: 0.2,
				}}
				onHoverStart={() => setShowOptions(true)}
				onHoverEnd={() => setShowOptions(false)}
				className={cn(
					"flex flex-row bg-slate-400/25 overflow-clip rounded-lg",
					showOptions ? "" : "max-w-12",
				)}
			>
				<motion.div
					className="hover:bg-pink-500/45 rounded-lg flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
					onClick={(e) => {
						e.stopPropagation()
						handlePlay()
						setShowOptions(false)
					}}
				>
					<FaPlay size={16} />
				</motion.div>
				{showOptions && (
					<>
						{showPlayNext && (
							<motion.div
								className="hover:bg-pink-500/45 rounded-lg flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation()
									handlePlayNext()
									setShowOptions(false)
								}}
							>
								<FaStepForward size={16} />
							</motion.div>
						)}
						{showAddToQueue && (
							<motion.div
								className="hover:bg-pink-500/45 rounded-lg flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation()
									handleAddToQueue()
									setShowOptions(false)
								}}
							>
								<MdPlaylistAdd size={20} />
							</motion.div>
						)}
					</>
				)}
			</motion.div>
			<CoverImage song={songs[0] ?? null} />
			<motion.p
				layout
				transition={{
					duration: 0.2,
				}}
				className="ml-2 line-clamp-1 text-shadow-lg text-shadow-black/75"
			>
				{isPlaylist ? playlist : getFolderName(playlist)}
			</motion.p>
		</motion.div>
	)
}
