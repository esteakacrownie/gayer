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

import { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { getSongName, toMinsSecs, uiVolume2Volume } from '../utils'
import { usePlayerStore } from '../stores/usePlayerStore'
import { cn } from '@sglara/cn'
import { useSettingsStore } from '../stores/useSettingsStore'

export default function TimeLine() {
	const {
		isPlaying,
		setIsPlaying,
		currentTrack,
		queue,
		history,
		autoplay,
		setNextAction
	} = usePlayerStore()

	const { volume, loopMode } = useSettingsStore()

	const [duration, setDuration] = useState(0)

	const sliderRef = useRef(null)
	const progressRef = useRef(null)
	const progressContentRef = useRef(null)
	const audioRef = useRef(null)
	const positionLabel = useRef(null)
	const playAnimationRef = useRef()

	const handleTrackEnded = useCallback(() => {
		if (autoplay) {
			audioRef.current.currentTime = 0
			setIsPlaying(true)
			if ((queue.length == 0 && currentTrack && loopMode != "off") || (loopMode === "current" && currentTrack)) {
				// play same track over
				audioRef.current.play()
			} else {
				setNextAction("setNext")
			}
		}
	}, [currentTrack, autoplay, setIsPlaying, loopMode, queue, audioRef])

	const updateMediasessionTime = useCallback(() => {
		const currentTime = audioRef.current?.currentTime || 0.0
		navigator.mediaSession.setPositionState({
			duration: duration || 0,
			position: Math.min(currentTime || 0, duration || 0),
			playbackRate: 1.0
		})
	}, [audioRef, duration])

	const updateProgressVisuals = useCallback((t) => {
		const p = Math.min(duration, t)
		if (positionLabel.current) {
			positionLabel.current.innerText = toMinsSecs(p)
		}

		const maxWidth = progressRef.current?.getBoundingClientRect().width || 0
		if (progressContentRef.current) {
			progressContentRef.current.style.width = `${parseInt(maxWidth * (p / duration))}px`
		}

		updateMediasessionTime()
	}, [audioRef, progressRef, progressContentRef, positionLabel, duration, updateMediasessionTime])

	const updateAudioData = useCallback(() => {
		setDuration(audioRef.current.duration)
		updateMediasessionTime()
	}, [audioRef, duration, setDuration, updateMediasessionTime])

	const seekPosition = useCallback(
		(t) => {
			if (!audioRef.current) return
			audioRef.current.currentTime = t
			updateProgressVisuals(t)
		},
		[audioRef, duration]
	)

	// animation function
	const repeat = useCallback(() => {
		const currentTime = audioRef.current?.currentTime || 0.0
		updateProgressVisuals(currentTime)

		navigator.mediaSession.setPositionState({
			duration: duration || 0,
			position: Math.min(currentTime || 0, duration || 0),
			playbackRate: 1.0
		})
		navigator.mediaSession.setActionHandler('seekto', (d) => {
			seekPosition(Math.min(Math.max(0, d.seekTime), duration))
			// console.log(d)
		})

		playAnimationRef.current = requestAnimationFrame(repeat)
	}, [audioRef, progressRef, duration, currentTrack, updateProgressVisuals])

	// control animation and audio on play / pause
	useEffect(() => {
		if (isPlaying) {
			if (audioRef.current) {
				audioRef.current.play()
			}
			playAnimationRef.current = requestAnimationFrame(repeat)
		} else {
			audioRef.current?.pause()
			// cancelAnimationFrame(playAnimationRef.current)
		}
	}, [isPlaying, audioRef, repeat])

	// update volume from UI slide and save value
	useEffect(() => {
		if (!audioRef.current) return
		audioRef.current.volume = uiVolume2Volume(volume ?? 0.0)
	}, [volume, audioRef, isPlaying, currentTrack])

	// progressbar, autoplay and file play management
	useEffect(() => {
		if (sliderRef.current) {
			sliderRef.current.value = 0
		}
	}, [queue, history, isPlaying, currentTrack])

	// media session notification basic controls
	useEffect(() => {
		navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
	}, [isPlaying, currentTrack])

	useEffect(() => {
		if (!currentTrack) {
			setDuration(0)
		}
	}, [currentTrack])

	const songName = useMemo(() => getSongName(currentTrack), [currentTrack])

	return (
		<>
			<div className="relative w-full select-none">
				{currentTrack && (
					<audio ref={audioRef} onLoadedMetadata={updateAudioData} onSeeked={updateMediasessionTime} onEnded={handleTrackEnded} src={currentTrack ? `file://${currentTrack}` : null} />
				)}
				<div
					ref={progressRef}
					className="flex flex-row rounded-full overflow-clip bg-pink-950 h-5 outline-2 outline-pink-300 shadow-pink-500/70 shadow-[0_0_5px_5px]"
				>
					<div ref={progressContentRef}
						className="rounded-full from-pink-500 to-pink-700 bg-linear-180 outline-2 outline-pink-500"
					/>
				</div>
				<input
					ref={sliderRef}
					className="w-full h-full absolute top-0 left-0 opacity-0 cursor-pointer"
					type="range"
					defaultValue={0}
					min={0}
					step={0.1}
					max={duration}
					onChange={(e) => seekPosition(e.target.value)}
					id=""
				/>
			</div>
			<div className="flex flex-row gap-2 justify-between w-full font-bold text-sm relative -my-4 px-2 bottom-0 -translate-y-5 pointer-events-none">
				<span ref={positionLabel} className={cn('text-center', songName == '' ? 'opacity-70' : '')}>0:00</span>
				<span
					className={cn(
						'text-center overflow-clip line-clamp-1',
						songName == '' ? 'opacity-70' : ''
					)}
				>
					{songName == '' ? '-' : songName}
				</span>
				<span className={cn('text-center', songName == '' ? 'opacity-70' : '')}>
					{toMinsSecs(duration)}
				</span>
			</div>
		</>
	)
}
