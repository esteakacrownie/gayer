/* eslint-disable react/prop-types */
import { cn } from "@sglara/cn"
import { useCallback, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { IoMusicalNote } from "react-icons/io5"

export default function LyricsLine({
	highlighted,
	words,
	autoScroll,
	fullScreen,
	containerRef,
	startTimeMs,
	seekFn
}) {
	const scrollRef = useRef(null)

	const handleClick = useCallback(() => {
		console.log(startTimeMs)
		if (seekFn && startTimeMs !== undefined) {
			seekFn(startTimeMs * 0.001 + 0.005)
		}
	}, [startTimeMs, seekFn])

	const applyScrollToSelf = useCallback(() => {
		if (highlighted && autoScroll && containerRef.current && scrollRef.current) {
			containerRef.current.scrollTo({
				top:
					scrollRef.current.offsetTop -
					containerRef.current.getBoundingClientRect().height /
						(fullScreen ? 2.75 : 4.5 - (words == "" ? 0.5 : 0.0)),
				behavior: "smooth"
			})
		}
	}, [autoScroll, highlighted, fullScreen, words, containerRef])

	// scroll to self
	useEffect(() => {
		applyScrollToSelf()
		window.addEventListener("resize", applyScrollToSelf)
		return () => {
			window.removeEventListener("resize", applyScrollToSelf)
		}
	}, [applyScrollToSelf])

	return (
		<motion.div
			ref={scrollRef}
			onClick={handleClick}
			className={cn(
				"font-bold text-2xl md:text-3xl text-shadow-[0_0_10px_rgb(255,255,255,0.25)] transition duration-200 ease-out cursor-pointer",
				highlighted ? "opacity-100" : "opacity-30",
				fullScreen && "lg:text-4xl lg:my-2 xl:text-5xl xl:my-4 2xl:text-6xl 2xl:my-10"
			)}
			initial={{
				scale: 0.8
			}}
			animate={{
				scale: highlighted ? 1 : 0.95
			}}
			transition={{
				type: "spring",
				bounce: 3,
				mass: 0.5,
				stiffness: 200
				// ease: "easeOut"
			}}
		>
			{words.trim() ? (
				words
			) : (
				<div
					className={cn(
						"scale-40 -my-5 md:scale-46",
						fullScreen &&
							"relative scale-40 -my-5 md:scale-46 md:-my-6 lg:scale-55 lg:-my-6 xl:scale-70 xl:-my-3 2xl:scale-80 2xl:-my-1",
						highlighted ? "animate-bounce" : ""
					)}
				>
					<IoMusicalNote
						className={cn(
							"absolute opacity-0 blur-md transition ease-out duration-500",
							highlighted && "opacity-50"
						)}
						size={64}
					/>
					<IoMusicalNote size={64} />
				</div>
			)}
		</motion.div>
	)
}
