/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react"
import LyricsLine from "./LyricsLine"
import { motion } from "motion/react"

export default function LyricsDisplay({ lyrics, lyricsRef, fullScreen, offset = 0 }) {
	const [manualScrolled, setManualScrolled] = useState(false)
	const [currentLine, setCurrentLine] = useState(-1)
	const containerRef = useRef(null)
	const playAnimationRef = useRef(null)

	const seekTo = useCallback(
		(t) => {
			if (lyricsRef.current?.source) {
				lyricsRef.current.source.currentTime = t
			}
		},
		[lyricsRef]
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
		<motion.div
			style={{
				gap: fullScreen ? "48px" : "24px"
			}}
			ref={containerRef}
			className="py-36 gap-6 flex flex-col text-center items-center justify-start w-full h-full overflow-y-scroll"
		>
			{lyrics.length > 0 && (
				<LyricsLine
					key={-1}
					autoScroll={!manualScrolled}
					highlighted={currentLine == -1}
					fullScreen={fullScreen}
					words=""
					containerRef={containerRef}
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
			{lyrics.length > 0 && (
				<LyricsLine
					key={lyrics.length}
					autoScroll={!manualScrolled}
					highlighted={currentLine == lyrics.length}
					fullScreen={fullScreen}
					words=""
					containerRef={containerRef}
				/>
			)}
		</motion.div>
	)
}
