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

import { detectParser } from "@braccato/parsers"
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { FaPlay, FaPause, FaStepForward, FaStepBackward } from "react-icons/fa"
import {
	IoMdVolumeHigh,
	IoMdVolumeLow,
	IoMdVolumeMute,
	IoMdShuffle,
	IoMdAddCircleOutline
} from "react-icons/io"
import { MdFullscreen, MdFullscreenExit, MdInfoOutline, MdLoop, MdLyrics } from "react-icons/md"
import { AnimatePresence, motion } from "motion/react"
import { delay, getSongName } from "../utils"
import { usePlayerStore } from "../stores/usePlayerStore"
import usePlayerControls from "../hooks/usePlayerControls"
import { cn } from "@sglara/cn"
import { useSettingsStore } from "../stores/useSettingsStore"
import TimeLine from "./TimeLine"
import { useHotkeys } from "react-hotkeys-hook"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { LiaExchangeAltSolid } from "react-icons/lia"
import LyricsDisplay from "./LyricsDisplay"
import { RxTimer } from "react-icons/rx"
import { useCoversStore } from "../stores/useCoversStore"
import { useLyricsStore } from "../stores/useLyricsStore"

export default function Player() {
	const {
		isPlaying,
		currentTrack,
		setHistory,
		nextAction,
		setNextAction,
		lyricsPanelOpen,
		setLyricsPanelOpen
	} = usePlayerStore()

	const {
		setVolume: setUiVolume,
		volume: uiVolume,
		powerSavingMode,
		shufflePlay,
		setShufflePlay,
		loopMode,
		setLoopMode,
		showLyricsPanel,
		setShowLyricsPanel
	} = useSettingsStore()

	const { thumbnailCache } = useCoversStore()
	const { lyricsCache, setLyricsCache } = useLyricsStore()

	const { setSelectedSongPath } = usePlaylistsStore()

	const { nextSong, previousSong, pause, resume, resetPlay } = usePlayerControls()

	const [coverArt, setCoverArt] = useState("#")

	const getVolumeLabel = (v) => {
		return v > 0 ? (v > 0.5 ? "high" : "low") : "mute"
	}

	const setVolumeClamped = useCallback(
		(v) => {
			setUiVolume(Math.min(Math.max(v, 0.0), 1.0))
		},
		[setUiVolume]
	)

	const volumeUp = useCallback(() => {
		setVolumeClamped(uiVolume + 0.05)
	}, [uiVolume, setVolumeClamped])

	const volumeDown = useCallback(() => {
		setVolumeClamped(uiVolume - 0.05)
	}, [uiVolume, setVolumeClamped])

	const togglePlay = useCallback(() => {
		if (isPlaying) {
			pause()
		} else {
			resume()
		}
	}, [isPlaying, pause, resume])

	const handleAddToPlaylist = useCallback(() => {
		if (!currentTrack) return
		setSelectedSongPath(currentTrack)
	}, [currentTrack, setSelectedSongPath])

	const handleLoopMode = useCallback(() => {
		// console.log(loopMode)
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
	}, [loopMode, setLoopMode])

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
		const action = async () => {
			if (!currentTrack) {
				setCoverArt("#")
			} else {
				if (Object.keys(thumbnailCache).includes(currentTrack)) {
					setCoverArt(thumbnailCache[currentTrack])
				} else {
					setCoverArt("#")
					// albumArtQueryForPath(currentTrack)
					// 	.then((i) => {
					// 		setCoverArt(i)
					// 		const updated = { ...thumbnailCache }
					// 		updated[currentTrack] = i
					// 		setThumbnailCache(updated)
					// 		// console.log(i)
					// 	})
					// 	.catch(() => {
					// 		setCoverArt("#")
					// 	})
				}
			}
		}
		action()
	}, [currentTrack, thumbnailCache])

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
		if (
			thumbnailCache[currentTrack] == "#" ||
			!thumbnailCache[currentTrack] ||
			!thumbnailCache[currentTrack].trim()
		) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: getSongName(currentTrack),
				artwork: [
					{
						src: "#",
						sizes: "1024x1024",
						type: "image/png"
					}
				]
			})
		} else {
			fetch(thumbnailCache[currentTrack])
				.then((res) => res.blob())
				.then((b) => {
					const url = URL.createObjectURL(b)
					console.log(b)
					navigator.mediaSession.metadata = new MediaMetadata({
						title: getSongName(currentTrack),
						artwork: [
							{
								src: url,
								sizes: "1024x1024",
								type: "image/png"
							}
						]
					})
				})
		}
	}, [currentTrack, thumbnailCache])

	const volumeWheelHandler = useCallback(
		(event) => {
			if (volumeSliderRef.current && volumeSliderRef.current.contains(event.target)) {
				event.preventDefault()
				event.stopPropagation()
				// console.log(event)
				setVolumeClamped(uiVolume + 0.05 * -Math.sign(event.deltaY))
			}
		},
		[uiVolume, setVolumeClamped]
	)

	const volumeSliderRef = useRef(null)
	useEffect(() => {
		document.addEventListener("wheel", volumeWheelHandler, { passive: false })
		return () => {
			document.removeEventListener("wheel", volumeWheelHandler, { passive: false })
		}
	}, [volumeSliderRef, volumeWheelHandler])

	// lyrics logic
	const lyricsRef = useRef({ source: null })
	const [lyricsFullscreen, setLyricsFullscreen] = useState(false)
	const [currentLyrics, setCurrentLyrics] = useState("")
	const addTrackToLyricsCache = useCallback(
		(path, lyrics, id, info, delay) => {
			const t = {}
			t[path] = { id, lyrics, info, delay }
			setLyricsCache({
				...lyricsCache,
				...t
			})
		},
		[lyricsCache, setLyricsCache]
	)
	const [isFetchingNewLyrics, setIsFetchingNewLyrics] = useState(false)
	const [fetchedLyricsInfo, setFetchedLyricsInfo] = useState("")
	const [lyricsDelay, setLyricsDelay] = useState(0)
	// fetch and cache next source for current track
	const handleChangeLyricsSource = useCallback(() => {
		if (isFetchingNewLyrics) return
		if (lyricsCache[getSongName(currentTrack)]) {
			const id = lyricsCache[getSongName(currentTrack)].id
			setIsFetchingNewLyrics(true)
			fetch(`https://lrclib.net/api/search?q=${encodeURI(getSongName(currentTrack))}`)
				.then((r) => {
					// console.log(r)
					return r.json()
				})
				.then((d) => {
					if (Array.isArray(d) && d.length > 0) {
						const sources = d.filter((e) => e.syncedLyrics)
						let idx = 0
						for (let elt of sources) {
							if (elt.id == id) {
								break
							}
							idx += 1
						}
						const data =
							idx > 0 ? [...sources.slice(idx), ...sources.slice(0, idx)] : sources
						for (let elt of data.filter((e) => e.id != id)) {
							setLyricsPanelOpen(true)
							const sourceIdx = sources
								.map((e, i) => ({ ...e, idx: i }))
								.filter((e) => e.id == elt.id)[0].idx
							const info = `Source ${sourceIdx + 1} of ${sources.length}`
							addTrackToLyricsCache(
								getSongName(currentTrack),
								elt.syncedLyrics,
								elt.id,
								info,
								0
							)
							// console.log(`source changed from ${id} to ${elt.id}`)
							break
						}
					}
					setIsFetchingNewLyrics(false)
					return undefined
				})
				.catch(() => {
					delay(3000).then(() => setIsFetchingNewLyrics(false))
				})
		}
	}, [
		addTrackToLyricsCache,
		currentTrack,
		setLyricsPanelOpen,
		lyricsCache,
		isFetchingNewLyrics,
		setIsFetchingNewLyrics
	])
	const handleChangeLyricsDelay = useCallback(
		(inc) => {
			if (!currentTrack || !lyricsCache[getSongName(currentTrack)]) return
			const cachedElt = lyricsCache[getSongName(currentTrack)]
			const newDelay = inc == 0 ? 0 : lyricsDelay + inc
			setLyricsDelay(newDelay)
			addTrackToLyricsCache(
				getSongName(currentTrack),
				cachedElt.lyrics,
				cachedElt.id,
				cachedElt.info,
				newDelay
			)
		},
		[currentTrack, lyricsDelay, setLyricsDelay, addTrackToLyricsCache, lyricsCache]
	)
	// return promise resolving in fetched lyrics (get first source available, cache and return it)
	const fetchLyrics = useCallback(
		(track) => {
			return fetch(`https://lrclib.net/api/search?q=${encodeURI(getSongName(track))}`)
				.then((r) => {
					if (!r.ok) return Promise.reject(new Error("Couldn't fetch lyrics"))
					// console.log(r)
					return r.json()
				})
				.then((d) => {
					if (Array.isArray(d)) {
						const sources = d.filter((e) => e.syncedLyrics)
						if (sources.length > 0) {
							const elt = sources[0]
							setLyricsPanelOpen(true)
							const info = `Source 1 of ${sources.length}`
							setFetchedLyricsInfo(info)
							addTrackToLyricsCache(
								getSongName(track),
								elt.syncedLyrics,
								elt.id,
								info,
								0
							)
							return elt.syncedLyrics
						}
					}
					return undefined
				})
		},
		[addTrackToLyricsCache, setLyricsPanelOpen]
	)
	// set lyrics when cache gets updated
	useEffect(() => {
		// console.log(lyricsCache)
		const action = async () => {
			if (lyricsCache[getSongName(currentTrack)]) {
				const { lyrics: text, info, delay } = lyricsCache[getSongName(currentTrack)]
				setCurrentLyrics(detectParser(text).parse(text))
				setLyricsDelay(delay)
				setFetchedLyricsInfo(info)
			}
		}
		action()
	}, [lyricsCache])
	// set or fetch lyrics when currentTrack changes
	useEffect(() => {
		const action = async () => {
			setFetchedLyricsInfo("")
			setLyricsDelay(0)
			if (currentTrack) {
				if (lyricsCache[getSongName(currentTrack)]) {
					const { lyrics: text, info, delay } = lyricsCache[getSongName(currentTrack)]
					if (info) setFetchedLyricsInfo(info)
					if (delay) setLyricsDelay(delay)
					setCurrentLyrics(detectParser(text).parse(text))
					setLyricsPanelOpen(true)
				} else {
					setCurrentLyrics("")
					setLyricsPanelOpen(false)
					let success = false
					while (!success) {
						try {
							await fetchLyrics(currentTrack)
							success = true
						} catch {
							await delay(3000)
						}
					}
				}
			} else {
				setCurrentLyrics("")
				setLyricsPanelOpen(false)
			}
		}
		action()
	}, [currentTrack])

	useHotkeys("space", (e) => {
		e.preventDefault()
		togglePlay()
	})
	useHotkeys(
		"ctrl+space",
		(e) => {
			e.preventDefault()
			togglePlay()
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		["ctrl+right", "ctrl+n"],
		(e) => {
			e.preventDefault()
			setNextAction("setNext")
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		["ctrl+left", "ctrl+p"],
		(e) => {
			e.preventDefault()
			setNextAction("setPrevious")
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+up",
		(e) => {
			e.preventDefault()
			volumeUp()
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+down",
		(e) => {
			e.preventDefault()
			volumeDown()
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+l",
		(e) => {
			e.preventDefault()
			handleLoopMode()
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+s",
		(e) => {
			e.preventDefault()
			setShufflePlay(!shufflePlay)
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+k",
		(e) => {
			e.preventDefault()
			handleAddToPlaylist()
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+e",
		(e) => {
			e.preventDefault()
			if (showLyricsPanel) {
				setLyricsFullscreen(!lyricsFullscreen)
			}
		},
		{ enableOnFormTags: true }
	)
	useHotkeys(
		"ctrl+h",
		(e) => {
			e.preventDefault()
			setShowLyricsPanel(!showLyricsPanel)
		},
		{ enableOnFormTags: true }
	)

	return (
		<div className="flex flex-col justify-center gap-4 fixed z-10 bottom-0 p-4 w-full">
			<div className="relative">
				<div className="overflow-clip w-full h-full absolute top-0 left-0 rounded-2xl flex flex-row justify-start items-center">
					<AnimatePresence mode="popLayout">
						<motion.img
							key={coverArt}
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.3 }}
							exit={{ opacity: 0 }}
							className={cn(
								"w-full h-full object-cover scale-105 pointer-events-none",
								coverArt != "#" ? "" : "hidden",
								powerSavingMode ? "" : "blur-[2px]"
							)}
							src={coverArt ?? "#"}
							alt=""
						/>
					</AnimatePresence>
				</div>
				<div className="flex flex-col justify-center w-full h-full bg-linear-180 from-slate-950 to-pink-800 outline-2 outline-pink-300/80 from-[-75%] to-150% shadow-pink-400/40 shadow-[0_0_7px_7px] rounded-2xl overflow-clip gap-4 p-4">
					{showLyricsPanel && currentTrack && (
						<div className="relative flex flex-col w-screen justify-center items-center overflow-y-clip -m-4 pr-4 bg-linear-180 from-black/40 via-65% via-black/25 to-transparent">
							<div className="absolute z-10 top-4 left-4 flex flex-col gap-2">
								<motion.div
									className="relative pointer-events-none flex flex-row gap-2 overflow-x-clip"
									initial={{
										width: "40px"
									}}
									animate={{
										witdh: "40px"
									}}
									transition={{
										duration: 0.1,
										ease: "easeOut"
									}}
									whileHover={{
										width: fetchedLyricsInfo ? "auto" : "40px"
									}}
								>
									<motion.button
										title="Change lyrics source (press if lyrics are incorrect or not in sync)"
										className={cn(
											"relative outline-none hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
											isFetchingNewLyrics && "animate-pulse"
										)}
										onClick={handleChangeLyricsSource}
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
										<LiaExchangeAltSolid
											className={isFetchingNewLyrics && "animate-spin"}
											size={20}
										/>
									</motion.button>
									<div className="line-clamp-1 min-w-max flex flex-row relative outline-none gap-1 justify-center items-center bg-pink-800 rounded-full border border-pink-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700">
										<MdInfoOutline size={16} />
										<span>{fetchedLyricsInfo}</span>
									</div>
								</motion.div>
								<motion.div
									className="relative flex flex-row gap-2 overflow-x-clip"
									initial={{
										width: "40px"
									}}
									animate={{
										witdh: "40px"
									}}
									transition={{
										duration: 0.1,
										ease: "easeOut"
									}}
									whileHover={{
										width: "auto"
									}}
								>
									<motion.button
										title="Reset lyrics delay"
										className="relative outline-none hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
										onClick={() => handleChangeLyricsDelay(0)}
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
										<RxTimer size={20} />
									</motion.button>
									<motion.button
										title="Increase lyrics delay"
										className="relative outline-none bg-pink-900/95 hover:bg-pink-700/95 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
										onClick={() => handleChangeLyricsDelay(-0.2)}
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
										<RxTimer
											size={20}
											className="translate-y-0.5 -translate-x-0.5 scale-85"
										/>
										<span className="absolute text-md font-bold top-0.5 right-1.5">
											+
										</span>
									</motion.button>
									<motion.button
										title="Decrease lyrics delay"
										className="relative outline-none bg-pink-900/95 hover:bg-pink-700/95 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
										onClick={() => handleChangeLyricsDelay(0.2)}
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
										<RxTimer
											size={20}
											className="translate-y-0.5 -translate-x-0.5 scale-85"
										/>
										<span className="absolute text-xl font-bold -top-0.5 right-1.75">
											-
										</span>
									</motion.button>
									<div className="line-clamp-1 min-w-max flex flex-row relative outline-none gap-1 justify-center items-center bg-pink-800 rounded-full border border-pink-400 py-1 px-2 transition ease-out duration-200 hover:bg-pink-700">
										<MdInfoOutline size={16} />
										<span>{`${lyricsDelay && lyricsDelay < 0 ? "+" : ""}${lyricsDelay ? Math.round(-lyricsDelay * 10) / 10 : 0}s`}</span>
									</div>
								</motion.div>
							</div>
							<div className="absolute top-4 right-12">
								<motion.button
									title={`${lyricsFullscreen ? "Shrink" : "Expand"} lyrics panel [Ctrl+E]`}
									className="relative outline-none hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
									onClick={() => setLyricsFullscreen(!lyricsFullscreen)}
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
									{lyricsFullscreen ? (
										<MdFullscreenExit className="scale-125" size={20} />
									) : (
										<MdFullscreen className="scale-125" size={20} />
									)}
								</motion.button>
							</div>
							<div
								className={cn(
									"flex flex-col -m-10 h-60",
									lyricsFullscreen && "h-[calc(100vh-46px)]"
								)}
							>
								{lyricsPanelOpen ? (
									<LyricsDisplay
										lyrics={currentLyrics}
										lyricsRef={lyricsRef}
										fullScreen={lyricsFullscreen}
										offset={lyricsDelay ?? 0}
									/>
								) : (
									<div className="w-full h-full flex flex-col items-center justify-center">
										<p className="animate-pulse font-bold text-3xl">
											Fetching lyrics...
										</p>
									</div>
								)}
							</div>
						</div>
					)}
					{/* <div>
						{JSON.stringify(history.map((elt) => getSongName(elt)))}
					</div>
					<div>{currentTrack}</div>
					<div>
						{JSON.stringify(queue.map((elt) => getSongName(elt)))}
					</div> */}
					<div className="flex flex-row justify-center gap-4 relative">
						<div className="flex flex-row justify-center gap-2">
							<motion.button
								title="Previous song [Ctrl+Left/P]"
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={() => setNextAction("setPrevious")}
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
								<FaStepBackward size={20} />
							</motion.button>
							<motion.button
								title="Toggle play/pause [(Ctrl+)Spacebar]"
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={togglePlay}
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
								{!isPlaying ? <FaPlay size={20} /> : <FaPause size={20} />}
							</motion.button>
							<motion.button
								title="Next song [Ctrl+Right/N]"
								className="hover:bg-pink-400/30 outline-none p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={() => setNextAction("setNext")}
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
								<FaStepForward size={20} />
							</motion.button>
						</div>
						<div className="flex flex-row gap-2 justify-start items-center absolute w-full left-0 top-0 pointer-events-none">
							<motion.button
								title="Toggle shuffling [Ctrl+S]"
								className={cn(
									"hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
									shufflePlay && "bg-pink-400/50 outline-2 outline-pink-300"
								)}
								onClick={() => setShufflePlay(!shufflePlay)}
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
								<IoMdShuffle size={20} />
							</motion.button>
							<motion.button
								title="Toggle loop modes [Ctrl+L]"
								className={cn(
									"relative hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
									loopMode != "off" && "bg-pink-400/50 outline-2 outline-pink-300"
								)}
								onClick={handleLoopMode}
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
								<MdLoop className="-scale-x-100" size={20} />
								{loopMode == "current" && (
									<span className="absolute right-2 text-xs bottom-4.5 font-bold">
										1
									</span>
								)}
							</motion.button>
							<motion.button
								title="Toggle Lyrics [Ctrl+H]"
								className={cn(
									"relative hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer",
									showLyricsPanel && "bg-pink-400/50 outline-2 outline-pink-300"
								)}
								onClick={() => setShowLyricsPanel(!showLyricsPanel)}
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
								<MdLyrics size={20} />
							</motion.button>
							<motion.button
								title="Add to playlist [Ctrl+K]"
								className="hover:bg-pink-400/30 pointer-events-auto p-2 rounded-lg transition ease-out duration-200 cursor-pointer"
								onClick={handleAddToPlaylist}
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
								<IoMdAddCircleOutline size={20} />
							</motion.button>
						</div>
						<div className="flex flex-row justify-end items-center absolute w-full right-0 top-1.75 pointer-events-none">
							{volumeIcon}
							<div className="bg-pink-800/10 flex flex-row outline-2 outline-pink-300 shadow-pink-500/70 shadow-[0_0_5px_5px] justify-center items-center px-1 rounded-2xl min-w-16 w-[25%] max-w-50">
								<input
									title="Manage volume [Scroll/Ctrl+Up/Down]"
									ref={volumeSliderRef}
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
					<TimeLine lyricsRef={lyricsRef} />
				</div>
			</div>
		</div>
	)
}
