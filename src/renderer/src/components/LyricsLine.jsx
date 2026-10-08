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
				"font-bold text-2xl md:text-3xl transition duration-200 ease-out cursor-pointer",
				highlighted ? "opacity-100" : "opacity-30",
				fullScreen && "lg:text-4xl"
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
				<IoMusicalNote
					size={fullScreen ? 32 : 28}
					className={highlighted ? "animate-bounce" : ""}
				/>
			)}
		</motion.div>
	)
}
