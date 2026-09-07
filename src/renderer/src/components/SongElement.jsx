import { cn } from "@sglara/cn"
import usePlayerControls from "../hooks/usePlayerControls"
import { usePlayerStore } from "../stores/usePlayerStore"
import { getSongName, isMusicFile } from "../utils"
import { FaPlay, FaStepForward } from "react-icons/fa"
import { MdAddCircleOutline, MdPlaylistAdd } from "react-icons/md"
import CoverImage from "./CoverImage"
import { motion } from "motion/react"
import { useState } from "react"

export default function SongElement({
	song,
	queueIdx,
	fromQueue = false,
	isGrabbable = false,
	showPlayNext = true,
	showAddToQueue = true,
	showAddToPlaylist = true,
	highlightIfPlaying = true,
}) {
	const { setAutoplay, currentTrack, queue, setQueue } = usePlayerStore()

	const { playSong, playNext, playFromQueue } = usePlayerControls()

	const [showOptions, setShowOptions] = useState(false)

	const setMusic = (p) => {
		// console.log(p)
		setAutoplay(true)
		playSong(p)
	}

	const handlePlayNext = (p) => {
		setAutoplay(true)
		playNext(p)
	}

	const handleAddToQueue = (p) => {
		if (!isMusicFile(p)) return
		setQueue([...new Set([...queue, p])])
	}

	const handleAddToPlaylist = () => {
		//TODO
	}

	return (
		<motion.div
			className={cn(
				"relative flex flex-row jutify-start items-center rounded-lg bg-linear-90 font-bold text-white/75 from-slate-800 to-slate-700 transition ease-out duration-200 select-none brightness-120",
				highlightIfPlaying && currentTrack == song
					? "bg-linear-90 from-pink-950 to-pink-900 brightness-175 border-2 border-pink-400 shadow-pink-500/40 shadow-[0_0_7px_7px]"
					: "brightness-110 hover:brightness-150 border-2 border-slate-400/50 hover:brightness-175",
				isGrabbable ? "cursor-grab" : "cursor-pointer",
			)}
		>
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
						fromQueue && queueIdx
							? playFromQueue(queueIdx)
							: setMusic(song)
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
									handlePlayNext(song)
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
									handleAddToQueue(song)
									setShowOptions(false)
								}}
							>
								<MdPlaylistAdd size={20} />
							</motion.div>
						)}
						{showAddToPlaylist && (
							<motion.div
								className="hover:bg-pink-500/45 rounded-lg flex flex-col justify-center items-center h-10 w-10 max-w-10 transition ease-out duration-200 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation()
									handleAddToPlaylist(song)
									setShowOptions(false)
								}}
							>
								<MdAddCircleOutline size={20} />
							</motion.div>
						)}
					</>
				)}
			</motion.div>
			<CoverImage song={song} />
			<motion.p
				layout
				transition={{
					duration: 0.2,
				}}
				className="ml-2 line-clamp-1 text-shadow-lg text-shadow-black/75"
			>
				{getSongName(song)}
			</motion.p>
		</motion.div>
	)
}
