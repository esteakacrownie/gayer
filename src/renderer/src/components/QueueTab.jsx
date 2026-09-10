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

import usePlayerControls from "../hooks/usePlayerControls"
import { usePlayerStore } from "../stores/usePlayerStore"
import { useSettingsStore } from "../stores/useSettingsStore"
import { MdPlaylistRemove, MdInfoOutline } from "react-icons/md"
import { getSongName } from "../utils"
import { Reorder } from "motion/react"
import { useMemo } from "react"
import PowerSavingButton from "./PowerSavingButton"
import SongElement from "./SongElement"

export default function QueueTab() {
	const maxLength = 25
	const { queue, setQueue, currentTrack } = usePlayerStore()
	const { playFromQueue } = usePlayerControls()
	const { powerSavingMode, tab, setTab } = useSettingsStore()

	const clearQueue = () => {
		setQueue([])
	}

	const currentTrackSongName = useMemo(() => {
		return getSongName(currentTrack)
	}, [currentTrack])

	if (tab != "queue") return

	return (
		<>
			<div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
				<button
					className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer"
					onClick={clearQueue}
				>
					<MdPlaylistRemove size={16} />
					<span>Clear queue</span>
				</button>
				<div className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer">
					<MdInfoOutline size={16} />
					<span>{queue.length} item(s) in queue</span>
				</div>
				<PowerSavingButton />
			</div>
			{currentTrack && <SongElement song={currentTrack} />}
			<Reorder.Group
				values={queue}
				onReorder={setQueue}
				className="flex flex-col gap-2 relative -mt-2"
			>
				{(powerSavingMode
					? queue.slice(0, Math.min(queue.length, maxLength))
					: queue
				).map((elt, idx) => (
					<Reorder.Item
						key={elt}
						value={elt}
						transition={{
							duration: 0.2,
						}}
					>
						<SongElement
							song={elt}
							fromQueue={true}
							queueIdx={idx}
							showAddToQueue={false}
							showRemoveFromQueue={true}
							highlightIfPlaying={false}
							isGrabbable
						/>
					</Reorder.Item>
				))}
			</Reorder.Group>
			{powerSavingMode && queue.length - maxLength > 0 && (
				<span className="text-center text-sm font-bold -mt-2 mb-1">
					+ {queue.length - maxLength}
				</span>
			)}
			{queue.length == 0 && !currentTrack && (
				<div className="flex flex-col justify-center items-center p-4 w-full h-full">
					<p className="font-bold text-center">
						Queue is currently empty. To start playing audio,&nbsp;
						<span
							className="text-pink-300 cursor-pointer"
							onClick={() => setTab("library")}
						>
							browse your Library
						</span>
						, drag and drop files or folders, or queue content&nbsp;
						<span
							className="text-pink-300 cursor-pointer"
							onClick={() => setTab("filesystem")}
						>
							from your FileSystem
						</span>
						.
					</p>
				</div>
			)}
		</>
	)
}
