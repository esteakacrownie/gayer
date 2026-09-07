import { useCallback } from 'react'
import { usePlayerStore } from '../stores/usePlayerStore'
import { isMusicFile, shuffleArray, uiVolume2Volume } from '../utils'
import { useSettingsStore } from '../stores/useSettingsStore'

export default function usePlayerControls() {
	const {
		currentTrack,
		setCurrentTrack,
		queue,
		autoplay,
		setQueue,
		history,
		setHistory,
		setNextAction,
		setIsPlaying
	} = usePlayerStore()

	const { shufflePlay, loopMode, volume } = useSettingsStore()

	const nextSong = useCallback(
		(manageNextAction = true) => {
			const current = currentTrack
			const next = queue[0]
			if (loopMode == 'current') {
				if (current) {
					setNextAction('playCurrent')
				} else {
					if (next) {
						setCurrentTrack(next)
						setQueue([...new Set(queue.slice(1))])
						setNextAction('playCurrent')
					}
				}
			} else {
				if (current) {
					setHistory([current, ...history])
				}
				if (loopMode == 'queue') {
					if (next) {
						setCurrentTrack(next)
						if (current) {
							if (shufflePlay) {
								setQueue(shuffleArray([...new Set([...queue.slice(1), current])]))
							} else {
								setQueue([...new Set([...queue.slice(1), current])])
							}
						} else {
							if (shufflePlay) {
								setQueue(shuffleArray([...new Set(queue.slice(1))]))
							} else {
								setQueue([...new Set(queue.slice(1))])
							}
						}
						setNextAction('playCurrent')
					} else {
						if (current) {
							setNextAction('playCurrent')
						}
					}
				} else {
					if (shufflePlay) {
						setQueue([...new Set(shuffleArray(queue.slice(1)))])
					} else {
						setQueue([...new Set(queue.slice(1))])
					}
					if (queue.length == 0 || !next) {
						setCurrentTrack('')
					} else {
						setCurrentTrack(next)
						if (autoplay && manageNextAction) setNextAction('playCurrent')
					}
				}
			}
		},
		[
			history,
			setHistory,
			queue,
			setQueue,
			currentTrack,
			setCurrentTrack,
			autoplay,
			shufflePlay,
			loopMode
		]
	)

	const previousSong = useCallback(() => {
		const current = currentTrack
		const prev = history[0]
		if (loopMode == 'current') {
			if (current) {
				setNextAction('playCurrent')
			} else {
				if (prev) {
					setCurrentTrack(prev)
					setHistory(history.slice(1))
					setNextAction('playCurrent')
				}
			}
		} else if (loopMode == 'queue') {
			if (prev && queue.includes(prev)) {
				// can go back if history is not empty AND previous song is part of the looped queue,
				// aka was in the queue when loop was activated hence is still in the queue somewhere since items are recycled
				setCurrentTrack(prev)
				setHistory(history.slice(1))
				if (current) {
					setQueue([...new Set([current, ...queue.filter((elt) => elt != prev)])])
				} else {
					setQueue([...new Set(queue.filter((elt) => elt != prev))])
				}
				setNextAction('playCurrent')
			} else {
				// looping queue but history is empty : play current from start or do nothing
				if (current) {
					setNextAction('playCurrent')
				}
			}
		} else {
			// behavior with loop off
			if (history.length == 0 || !prev) {
				setHistory(history.slice(1))
			} else {
				if (current) {
					setQueue([...new Set([current, ...queue])])
				}
				setHistory(history.slice(1))
				setCurrentTrack(prev)
				if (autoplay) {
					setNextAction('playCurrent')
				}
			}
		}
	}, [history, setHistory, queue, setQueue, currentTrack, setCurrentTrack, autoplay, loopMode])

	const playSong = useCallback(
		(p, manageNextAction = true) => {
			if (!isMusicFile(p)) return
			if (currentTrack && p != currentTrack) {
				if (loopMode == 'queue') {
					if (shufflePlay) {
						setQueue(shuffleArray([...new Set([...queue, currentTrack])]))
					} else {
						setQueue([...new Set([...queue, currentTrack])])
					}
				}
				setHistory([currentTrack, ...history])
			}
			setCurrentTrack(p)
			if (autoplay && manageNextAction) setIsPlaying(true) //setNextAction('playCurrent')
		},
		[currentTrack, setCurrentTrack, history, setHistory, setIsPlaying, autoplay, shufflePlay, loopMode]
	)

	const playNext = useCallback(
		(p) => {
			if (!isMusicFile(p)) return
			setQueue([...new Set([p, ...queue])])
			setHistory([currentTrack, ...history])
		},
		[queue, setQueue, history, setHistory, currentTrack]
	)

	const playFromQueue = useCallback(
		(idx) => {
			if (idx > queue.length - 1) return
			setHistory(
				(currentTrack ? [currentTrack] : []).concat(queue.slice(0, idx)).reverse().concat(history)
			)
			if (loopMode == 'queue') {
				if (shufflePlay) {
					setQueue(
						shuffleArray([
							...new Set(
								queue
									.slice(idx + 1)
									.concat(currentTrack ? [currentTrack] : [])
									.concat(queue.slice(0, idx))
							)
						])
					)
				} else {
					setQueue([
						...new Set(
							queue
								.slice(idx + 1)
								.concat(currentTrack ? [currentTrack] : [])
								.concat(queue.slice(0, idx))
						)
					])
				}
			} else {
				if (shufflePlay) {
					setQueue(shuffleArray([...new Set(queue.slice(idx + 1))]))
				} else {
					setQueue([...new Set(queue.slice(idx + 1))])
				}
			}
			setCurrentTrack(queue[idx])
			if (autoplay) {
				setNextAction('playCurrent')
			}
		},
		[
			[
				currentTrack,
				setCurrentTrack,
				queue,
				setQueue,
				history,
				setHistory,
				autoplay,
				shufflePlay,
				loopMode
			]
		]
	)

	const pause = useCallback(async () => {
		setIsPlaying(false)
	}, [setIsPlaying])

	const resume = useCallback(async () => {
		if (!currentTrack) {
			if (queue.length < 1) return console.log(`bowomp, ${currentTrack}`)
			else setNextAction('setNext')
		} else {
			setIsPlaying(true)
		}
	}, [currentTrack, queue, setIsPlaying])

	const resetPlay = async (path, manageNextAction = true) => {
		if (!path) return
		await playSong(path, manageNextAction)
		if (manageNextAction) resume()
	}

	return {
		previousSong,
		nextSong,
		playSong,
		playNext,
		playFromQueue,
		pause,
		resume,
		resetPlay
	}
}
