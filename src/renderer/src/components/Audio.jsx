import { useEffect, useRef } from "react"
import { usePlayerStore } from "../stores/usePlayerStore"

export default function Audio() {
	const audio = useRef(null)

	const { currentTrack } = usePlayerStore()

	useEffect(() => {
		console.log(currentTrack)
	}, [currentTrack])

	const toggleplay = () => {
		if (audio.current) {
			audio.current.paused ? audio.current.play() : audio.current.pause()
			console.log(audio.current.currentTime)
		}
	}

	const seekForward = () => {
		if (audio.current) {
			audio.current.currentTime = 30
		}
	}

	useEffect(() => {
		if (audio.current) {
			audio.current.volume = 0.1
		}
	}, [audio])

	return (
		<>
			<div onClick={toggleplay} onDoubleClick={seekForward}>
				This is a Component
			</div>
			<audio
				ref={audio}
				src={currentTrack ? `file://${currentTrack}` : null}
			/>
		</>
	)
}
