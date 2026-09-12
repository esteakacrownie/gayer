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
import usePlayerControls from "../hooks/usePlayerControls"
import { usePlayerStore } from "../stores/usePlayerStore"
import { getSongName } from "../utils"
import { FaPlay, FaStepForward } from "react-icons/fa"
import { MdAddCircleOutline, MdPlaylistAdd, MdPlaylistRemove } from "react-icons/md"
import { IoMusicalNotes } from "react-icons/io5"
import CoverImage from "./CoverImage"
import { motion } from "motion/react"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"

export default function SongElement({
	song,
	queueIdx = -1,
	fromQueue = false,
	isGrabbable = false,
	showPlayNow = true,
	showPlayNext = true,
	showAddToQueue = true,
	showRemoveFromQueue = false,
	showAddToPlaylist = true,
	highlightIfPlaying = true,
}) {
	const { currentTrack } = usePlayerStore()

	const { setSelectedSongPath } = usePlaylistsStore()

	const { handlePlayNext, handleAddToQueue, handleRemoveFromQueue, playFromQueue, setMusic } = usePlayerControls()

	const handleAddToPlaylist = () => {
		setSelectedSongPath(song)
	}

	return (
		<motion.div
			className={cn(
				"relative flex flex-row overflow-clip jutify-start items-center rounded-lg bg-linear-90 font-bold text-white/75 from-slate-800 to-slate-700 transition ease-out duration-200 select-none",
				highlightIfPlaying && currentTrack == song
					? "bg-linear-90 from-pink-950 to-pink-900 brightness-175 border-2 border-pink-400 shadow-pink-500/40 shadow-[0_0_7px_7px]"
					: "brightness-110 hover:brightness-150 border-2 border-slate-400/50",
				isGrabbable ? "cursor-grab" : "cursor-pointer",
			)}
		>
			<div className="absolute top-0 right-0 brightness-125 text-pink-400/50 bg-slate-900/75 outline-2 outline-pink-400/50 rounded-bl-lg">
				<IoMusicalNotes className="m-0.5 scale-95" size={20} />
			</div>
			<motion.div
				layout
				transition={{
					duration: 0.2,
				}}
				initial={{
					width: "40px"
				}}
				animate={{
					width: "40px"
				}}
				whileHover={{
					width: "auto"
				}}
				className={cn(
					"flex flex-row bg-slate-600/75 overflow-clip rounded-lg",
				)}
			>
				{showPlayNow && (
					<motion.div
						title="Play now"
						className="hover:bg-pink-600/50 rounded-lg aspect-square flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							fromQueue && queueIdx >= 0
								? playFromQueue(queueIdx)
								: setMusic(song)
						}}
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
						<FaPlay size={16} />
					</motion.div>
				)}
				{showPlayNext && (
					<motion.div
						title="Play next"
						className="hover:bg-pink-600/50 rounded-lg aspect-square flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							handlePlayNext(song)
						}}
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
						<FaStepForward size={16} />
					</motion.div>
				)}
				{showAddToQueue && (
					<motion.div
						title="Add to queue"
						className="hover:bg-pink-600/50 rounded-lg aspect-square flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							handleAddToQueue(song)
						}}
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
						<MdPlaylistAdd size={20} />
					</motion.div>
				)}
				{showRemoveFromQueue && (
					<motion.div
						title="Remove from queue"
						className="hover:bg-pink-600/50 rounded-lg aspect-square flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							handleRemoveFromQueue(song)
						}}
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
						<MdPlaylistRemove size={20} />
					</motion.div>
				)}
				{showAddToPlaylist && (
					<motion.div
						title="Add to playlist"
						className="hover:bg-pink-600/50 rounded-lg aspect-square flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
						onClick={(e) => {
							e.stopPropagation()
							handleAddToPlaylist(song)
						}}
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
						<MdAddCircleOutline size={20} />
					</motion.div>
				)}
			</motion.div>
			<CoverImage song={song} />
			<motion.p
				layout
				transition={{
					duration: 0.2,
				}}
				className="ml-2 pr-6 line-clamp-1 text-shadow-lg text-shadow-black/75"
			>
				{getSongName(song)}
			</motion.p>
		</motion.div>
	)
}
