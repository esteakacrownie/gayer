/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react"
import LyricsLine from "./LyricsLine"
import { motion } from "motion/react"
import { cn } from "@sglara/cn"
import { MdSync } from "react-icons/md"

export default function LyricsDisplay({ lyrics, lyricsRef, fullScreen, offset = 0 }) {
	const [manualScrolled, setManualScrolled] = useState(false)
	const [currentLine, setCurrentLine] = useState(-1)
	const containerRef = useRef(null)
	const playAnimationRef = useRef(null)

	const seekTo = useCallback(
		(t) => {
			if (lyricsRef.current?.source) {
				lyricsRef.current.source.currentTime = t - offset
				setManualScrolled(false)
			}
		},
		[lyricsRef, offset]
	)

	// return line that matches time, or last line + 1 if time exceeds all lines
	const calculateCurrentLine = (lyrics, time) => {
		if (time < 0) return -1
		if (lyrics.length == 0 || time < lyrics[0].startTimeMs) return -1
		let idx = 0
		for (let elt of lyrics) {
			if (time >= elt.startTimeMs && time <= elt.startTimeMs + elt.durationMs) {
				return idx
			}
			idx += 1
		}
		return lyrics.length
	}

	const repeat = useCallback(() => {
		if (Array.isArray(lyrics) && lyrics.length > 0) {
			const result = calculateCurrentLine(
				lyrics,
				((lyricsRef.current?.source.currentTime ?? 0) + offset) * 1000
			)
			if (result != currentLine) {
				setCurrentLine(result)
			}
		}

		playAnimationRef.current = requestAnimationFrame(repeat)
	}, [lyrics, lyricsRef, currentLine, setCurrentLine])

	useEffect(() => {
		playAnimationRef.current = requestAnimationFrame(repeat)
		return () => {
			cancelAnimationFrame(playAnimationRef.current)
		}
	}, [lyrics, lyricsRef, repeat, currentLine])

	return (
		<>
			<div className="absolute top-4 pr-4 pointer-events-none w-full h-full flex flex-col items-center">
				<button
					className={cn(
						"z-10 flex flex-row relative outline-none gap-1 justify-center items-center backdrop-blur-sm bg-pink-400/50  hover:bg-pink-400/30 rounded-full border border-pink-300 py-1 px-2 transition ease-out duration-200 pointer-events-auto cursor-pointer",
						manualScrolled ? "translate-y-0" : "-translate-y-20"
					)}
					onClick={() => {
						setManualScrolled(false)
					}}
				>
					<MdSync size={16} />
					<span>Re-sync lyrics</span>
				</button>
			</div>
			<motion.div
				style={{
					gap: fullScreen ? "3em" : "1.5em"
				}}
				ref={containerRef}
				onWheel={() => setManualScrolled(true)}
				className="py-36.5 pl-16 pr-20 flex flex-col text-center items-center justify-start w-screen h-full overflow-y-scroll"
			>
				{lyrics.length > 0 && lyrics[0].words.trim() && (
					<LyricsLine
						key={-1}
						autoScroll={!manualScrolled}
						highlighted={currentLine == -1}
						fullScreen={fullScreen}
						words=""
						containerRef={containerRef}
						startTimeMs={1}
						seekFn={seekTo}
					/>
				)}
				{(lyrics || []).map((e, i) => (
					<LyricsLine
						key={i}
						autoScroll={!manualScrolled}
						highlighted={currentLine == i}
						fullScreen={fullScreen}
						words={e.words}
						containerRef={containerRef}
						startTimeMs={e.startTimeMs}
						seekFn={seekTo}
					/>
				))}
				{lyrics.length > 0 && lyrics[lyrics.length - 1].words.trim() && (
					<LyricsLine
						key={lyrics.length}
						autoScroll={!manualScrolled}
						highlighted={currentLine == lyrics.length}
						fullScreen={fullScreen}
						words=""
						containerRef={containerRef}
						startTimeMs={
							lyrics[lyrics.length - 1].startTimeMs +
							lyrics[lyrics.length - 1].durationMs +
							1
						}
						seekFn={seekTo}
					/>
				)}
			</motion.div>
		</>
	)
}
