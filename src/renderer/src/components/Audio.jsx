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
