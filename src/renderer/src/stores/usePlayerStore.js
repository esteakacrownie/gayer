import { create } from "zustic"

export const usePlayerStore = create((set) => ({
	autoplay: true,
	isPlaying: false,
	queue: [],
	history: [],
	currentTrack: "",
	nextAction: "", // "setPrevious", "setNext", "playCurrent"
	setAutoplay: (v) => set((state) => ({ autoplay: v })),
	setIsPlaying: (v) => set((state) => ({ isPlaying: v })),
	setQueue: (v) => set((state) => ({ queue: v })),
	setHistory: (v) => set((state) => ({ history: v })),
	setCurrentTrack: (v) => set((state) => ({ currentTrack: v })),
	setNextAction: (v) => set((state) => ({ nextAction: v })),
}))
