import { cn } from "@sglara/cn"
import { useCallback, useEffect, useState } from "react"
import { usePlayerStore } from "../stores/usePlayerStore"
import { handleDropped, shuffleArray } from "../utils"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function DragDropHandler() {
	const [enabled, setEnabled] = useState(false)

	const { queue, setQueue, setAutoplay, currentTrack, setNextAction } =
		usePlayerStore()

	const { shufflePlay } = useSettingsStore()

	const addDragged = useCallback(
		async (event) => {
			// console.log(`dragdrop queue is ${queue}`)
			if (event.payload.type === "over") {
				setEnabled(true)
				//console.log("User hovering", event.payload.position)
			} else {
				setEnabled(false)
				if (event.payload.type === "drop") {
					// console.log("User dropped", event.payload.paths)
					let songs = await handleDropped(event.payload.paths)
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
				}
			}
		},
		[queue, setQueue, setAutoplay, currentTrack, setEnabled],
	)

	useEffect(() => {
		// const unlisten = getCurrentWebview().onDragDropEvent((event) => {
		// 	addDragged(event)
		// })
		// return () => {
		// 	unlisten.then((unsub) => unsub())
		// }
	}, [addDragged])

	return (
		<div
			className={cn(
				"fixed z-30 top-0 w-screen h-screen pointer-events-none",
				enabled
					? "flex flex-col justify-center items-center"
					: "hidden",
			)}
		>
			<div className="w-[80%] max-w-100 max-h-80 p-8 text-center text-lg font-bold rounded-2xl border-2 border-pink-300 shadow-[0_0_10px_10px] shadow-pink-400/40 backdrop-brightness-175 backdrop-contrast-175 bg-pink-800/95">
				Add files to queue
			</div>
		</div>
	)
}
