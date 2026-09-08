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

import { useEffect, useMemo, useState, useCallback } from "react"
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa"
import { IoMdVolumeHigh, IoMdVolumeLow, IoMdVolumeMute, IoMdShuffle } from "react-icons/io"
import { MdLoop } from "react-icons/md"
import { AnimatePresence, motion } from "motion/react"
import { getSongName } from "../utils"
import { usePlayerStore } from "../stores/usePlayerStore"
import usePlayerControls from "../hooks/usePlayerControls"
import { cn } from "@sglara/cn"
import { useSettingsStore } from "../stores/useSettingsStore"
import albumArt from "album-art"
import AlbumWorker from "../workers/AlbumWorker"
import { useFilesStore } from "../stores/useFilesStore"
import TimeLine from "./TimeLine"
import { useCacheStore } from "../stores/useCacheStore"
import { useHotkeys } from "react-hotkeys-hook"

export default function Player() {

	const { isPlaying, currentTrack, setHistory, queue, nextAction, setNextAction } = usePlayerStore()

	const {
		setVolume: setUiVolume,
		volume: uiVolume,
		powerSavingMode,
		shufflePlay,
		setShufflePlay,
		loopMode,
		setLoopMode
	} = useSettingsStore()

	const { thumbnailCache, setThumbnailCache } = useCacheStore()

	const { files } = useFilesStore()

	const { nextSong, previousSong, pause, resume, resetPlay } = usePlayerControls()

	const [coverArt, setCoverArt] = useState("#")

	const getVolumeLabel = (v) => {
		return v > 0 ? (v > 0.5 ? "high" : "low") : "mute"
	}

	const setVolumeClamped = useCallback((v) => {
		setUiVolume(Math.min(Math.max(v, 0.0), 1.0))
	}, [setUiVolume])

	const volumeUp = useCallback(() => {
		setVolumeClamped(uiVolume + 0.05)
	}, [uiVolume, setUiVolume])

	const volumeDown = useCallback(() => {
		setVolumeClamped(uiVolume - 0.05)
	}, [uiVolume, setUiVolume])

	const fetchCoverArts = useCallback(
		async (f) => {
			try {
				// console.log("fetching arts !")
				const arts = await AlbumWorker(f)
				// console.log(arts)
				const r = {}
				Object.keys(arts).map((elt) => {
					if (!thumbnailCache[elt] && typeof arts[elt] == "string") {
						r[elt] = arts[elt]
					}
				})
				setThumbnailCache({ ...thumbnailCache, ...r })
			} catch (error) {
				console.log(error)
			}
		},
		[thumbnailCache, setThumbnailCache]
	)

	const togglePlay = useCallback(() => {
		if (isPlaying) {
			pause()
		} else {
			resume()
		}
	}, [isPlaying])

	const handleLoopMode = useCallback(() => {
		console.log(loopMode)
		switch (loopMode) {
			case "queue":
				setLoopMode("current")
				break
			case "current":
				setLoopMode("off")
				break
			case "off":
				setLoopMode("queue")
				break
		}
	}, [loopMode])

	const volumeIcon = useMemo(() => {
		switch (getVolumeLabel(uiVolume)) {
			case "low":
				return <IoMdVolumeLow size={24} />
			case "high":
				return <IoMdVolumeHigh size={24} />
			default:
				return <IoMdVolumeMute size={24} />
		}
	}, [uiVolume])

	// dynamic cover art
	useEffect(() => {
		if (!currentTrack) {
			setCoverArt("#")
		} else {
			const splits = currentTrack.split("/")
			const album = splits[splits.length - 2]
			if (Object.keys(thumbnailCache).includes(currentTrack)) {
				setCoverArt(thumbnailCache[currentTrack])
			} else {
				albumArt("", {
					album: `${album} ${getSongName(currentTrack)}`,
					size: "medium"
				})
					.then((i) => {
						setCoverArt(i)
						const updated = { ...thumbnailCache }
						updated[currentTrack] = i
						setThumbnailCache(updated)
						// console.log(i)
					})
					.catch(() => {
						setCoverArt("#")
					})
			}
		}
	}, [currentTrack])

	useEffect(() => {
		const q = queue.concat(files.map((elt) => elt.path))
		if (q.length > 0) {
			const f = []
			q.map((elt) => {
				if (!thumbnailCache[elt]) {
					f.push(elt)
				}
			})
			fetchCoverArts(f)
		}
	}, [queue, files, coverArt])

	// action manager
	useEffect(() => {
		// console.log(`next action : ${nextAction}`)
		switch (nextAction) {
			case "setPrevious":
				previousSong()
				return
			case "setNext":
				setNextAction("")
				nextSong()
				return
			case "playCurrent":
				if (!currentTrack) return
				resetPlay(currentTrack)
				setNextAction("")
				return
			case "playArgCurrent":
				if (!currentTrack) return
				resetPlay(currentTrack)
				return
			case "setArgQueue":
				nextSong(false)
				setNextAction("clearArgHistory")
				return
			case "clearArgHistory":
				setHistory([])
				setNextAction("playArgCurrent")
				return
			case "clearHistory":
				setHistory([])
				setNextAction("playCurrent")
				return
			default:
				return
		}
	}, [nextAction])

	// bind system notification handlers
	useEffect(() => {
		navigator.mediaSession.setActionHandler("play", resume)
		navigator.mediaSession.setActionHandler("pause", pause)
		navigator.mediaSession.setActionHandler("previoustrack", () => setNextAction("setPrevious"))
		navigator.mediaSession.setActionHandler("nexttrack", () => setNextAction("setNext"))
	}, [pause, resume, setNextAction])

	// system media metadata
	useEffect(() => {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: getSongName(currentTrack),
			artwork: [
				{
					src: thumbnailCache[currentTrack] ?? "#",
					sizes: "512x512",
					type: "image/png"
				}
			]
		})
	}, [currentTrack, thumbnailCache])

	useHotkeys("space", (e) => { e.preventDefault(); togglePlay() })
	useHotkeys(["ctrl+right", "ctrl+n"], (e) => { e.preventDefault(); setNextAction("setNext") })
	useHotkeys(["ctrl+left", "ctrl+p"], (e) => { e.preventDefault(); setNextAction("setPrevious") })
	useHotkeys("ctrl+up", (e) => { e.preventDefault(); volumeUp() })
	useHotkeys("ctrl+down", (e) => { e.preventDefault(); volumeDown() })
	useHotkeys("ctrl+l", (e) => { e.preventDefault(); handleLoopMode() })
	useHotkeys("ctrl+s", (e) => { e.preventDefault(); setShufflePlay(!shufflePlay) })

	return (
		<div className="flex flex-col justify-center gap-4 fixed bottom-0 p-4 w-full ">
			<div className="relative">
				<div className="overflow-clip w-full h-full absolute top-0 left-0 rounded-2xl flex flex-row justify-start items-center">
					<AnimatePresence mode="popLayout">
						<motion.img
							key={coverArt}
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.3 }}
							exit={{ opacity: 0 }}
							className={cn(
								"w-full object-cover scale-105 pointer-events-none",
								coverArt != "#" ? "" : "hidden",
								powerSavingMode ? "" : "blur-[2px]"
							)}
							src={coverArt ?? "#"}
							alt=""
						/>
					</AnimatePresence>
				</div>
				<div className="flex flex-col justify-center w-full h-full bg-linear-180 from-slate-950 to-pink-800 outline-2 outline-pink-300/80 from-[-75%] to-150% shadow-pink-400/40 shadow-[0_0_7px_7px] rounded-2xl overflow-clip gap-4 p-4">
					{/* <div>
						{JSON.stringify(history.map((elt) => getSongName(elt)))}
					</div>
					<div>{currentTrack}</div>
					<div>
						{JSON.stringify(queue.map((elt) => getSongName(elt)))}
					</div> */}
					<div className="flex flex-row justify-center gap-4 relative">
						<div className="flex flex-row justify-center gap-2">
							<button
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={() => setNextAction("setPrevious")}
							>
								<FaStepBackward size={20} />
							</button>
							<button
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={togglePlay}
							>
								{!isPlaying ? <FaPlay size={20} /> : <FaPause size={20} />}
							</button>
							<button
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={() => setNextAction("setNext")}
							>
								<FaStepForward size={20} />
							</button>
						</div>
						<div className="flex flex-row gap-2 justify-start items-center absolute w-full left-0 top-0 pointer-events-none">
							<button
								className={cn(
									"hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
									shufflePlay ? "bg-pink-400/50 outline-2 outline-pink-300" : ""
								)}
								onClick={() => setShufflePlay(!shufflePlay)}
							>
								<IoMdShuffle size={20} />
							</button>
							<button
								className={cn(
									"relative hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
									loopMode != "off" ? "bg-pink-400/50 outline-2 outline-pink-300" : ""
								)}
								onClick={handleLoopMode}
							>
								<MdLoop className="-scale-x-100" size={20} />
								{loopMode == "current" && (
									<span className="absolute right-2 text-xs bottom-4.5 font-bold">1</span>
								)}
							</button>
						</div>
						<div className="flex flex-row justify-end items-center absolute w-full right-0 top-1.75 pointer-events-none">
							{volumeIcon}
							<div className="bg-pink-800/10 flex flex-row outline-2 outline-pink-300 shadow-pink-500/70 shadow-[0_0_5px_5px] justify-center items-center px-1 rounded-2xl min-w-16 w-[16%] max-w-50">
								<input
									className="accent-pink-500 w-full outline-none pointer-events-auto cursor-pointer"
									type="range"
									min={0}
									step={0.025}
									max={1.0}
									value={uiVolume}
									onChange={(e) => setVolumeClamped(e.target.value)}
								/>
							</div>
						</div>
					</div>
					<TimeLine />
				</div>
			</div>
		</div>
	)
}
