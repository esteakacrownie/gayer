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

import { create } from "zustic"

export const usePlayerStore = create((set) => ({
	autoplay: true,
	isPlaying: false,
	queue: [],
	history: [],
	currentTrack: "",
	nextAction: "", // "setPrevious", "setNext", "playCurrent"
	selectedPlaylist: "",
	setAutoplay: (v) => set((state) => ({ autoplay: v })),
	setIsPlaying: (v) => set((state) => ({ isPlaying: v })),
	setQueue: (v) => set((state) => ({ queue: v })),
	setHistory: (v) => set((state) => ({ history: v })),
	setCurrentTrack: (v) => set((state) => ({ currentTrack: v })),
	setNextAction: (v) => set((state) => ({ nextAction: v })),
	setSelectedPlaylist: (v) => set((state) => ({ selectedPlaylist: v })),
}))
