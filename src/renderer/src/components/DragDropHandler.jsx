import { cn } from "@sglara/cn"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePlayerStore } from "../stores/usePlayerStore"
import { handleDropped, shuffleArray } from "../utils"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function DragDropHandler() {
	const [enabled, setEnabled] = useState(false)

	const { queue, setQueue, setAutoplay, currentTrack, setNextAction } =
		usePlayerStore()

	const { shufflePlay } = useSettingsStore()

	const addDropped = useCallback(
		async (event) => {
			setEnabled(false)
			event.preventDefault()
			console.log(JSON.stringify(event.dataTransfer.files[0]))
			let songs = await handleDropped(window.api.getFilePaths(Object.values(event.dataTransfer.files)))
			if (shufflePlay) {
				songs = shuffleArray(songs)
			}
			// console.log(songs)
			// console.log(`queue is ${queue}`)
			if (queue.length == 0 && currentTrack == "") {
				// console.log("hello")
				setAutoplay(true)
				setQueue([...new Set(songs)])
				setNextAction("setNext")
			} else {
				setQueue([...new Set(queue.concat(songs))])
			}
		},
		[queue, setQueue, setAutoplay, currentTrack, setEnabled],
	)

	const counter = useRef(0)


	useEffect(() => {
		const dragEnterFunc = (event) => {
			counter.current += 1
			setEnabled(true)
		}
		const dragLeaveFunc = (event) => {
			counter.current -= 1
			if (counter.current == 0) {
				setEnabled(false)
			}
		}
		const dragOverFunc = (event) => {
			event.preventDefault()
		}
		window.addEventListener("dragenter", dragEnterFunc)
		window.addEventListener("dragleave", dragLeaveFunc)
		window.addEventListener("dragover", dragOverFunc)
		window.addEventListener("drop", addDropped)

		return () => {
			window.removeEventListener("dragenter", dragEnterFunc)
			window.removeEventListener("dragleave", dragLeaveFunc)
			window.removeEventListener("dragover", dragOverFunc)
			window.removeEventListener("drop", addDropped)
		}
	}, [addDropped])

	return (
		<div
			className={cn("fixed z-30 top-0 w-screen h-screen", enabled ? "flex flex-col justify-center items-center" : "hidden pointer-events-none")}
		>
			<div className="w-[80%] max-w-100 max-h-80 p-8 text-center text-lg font-bold rounded-2xl border-2 border-pink-300 shadow-[0_0_10px_10px] shadow-pink-400/40 backdrop-brightness-175 backdrop-contrast-175 bg-pink-800/95">
				Add files to queue
			</div>
		</div >
	)
}
