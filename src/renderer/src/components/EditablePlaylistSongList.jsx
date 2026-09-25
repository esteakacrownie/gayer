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

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { usePlayerStore } from "../stores/usePlayerStore"
import PlaylistRenamer from "./PlaylistRenamer"
import SongElement from "./SongElement"
import { Reorder } from "motion/react"
import { IoChevronBack } from "react-icons/io5"
import usePlaylistUtils from "../hooks/usePlaylistsUtils"
import { useLibraryStore } from "../stores/useLibraryStore"
import { getFolderName, getSongName, toSearchString } from "../utils"
import { motion } from "motion/react"

export default function EditablePlaylistSongList() {
	const { playlists, setPlaylists } = usePlaylistsStore()

	const { selectedPlaylist, setSelectedPlaylist } = usePlayerStore()

	const { search } = useLibraryStore()

	const { getPlaylistFromId } = usePlaylistUtils()

	const [selectedPlaylistReorderSongs, setSelectedPlaylistReorderSongs] = useState([]) // only for temp reordering

	const filteredSelectedPlaylistsSongs = useMemo(() => {
		return selectedPlaylistReorderSongs.filter((n) =>
			toSearchString(`${getFolderName(n)} - ${getSongName(n)}`).includes(
				toSearchString(search)
			)
		)
	}, [selectedPlaylistReorderSongs, search])

	const updateSelectedPlaylistSongsOrder = useCallback(() => {
		const elt = { ...getPlaylistFromId(selectedPlaylist) }
		elt.songs = selectedPlaylistReorderSongs
		let index = 0
		const p = playlists.filter((e, idx) => {
			const res = e.id != selectedPlaylist
			if (res) {
				index = idx
			}
			return res
		})
		p.splice(index, 0, elt)
		setPlaylists(p)
	}, [playlists, setPlaylists, selectedPlaylist, selectedPlaylistReorderSongs, getPlaylistFromId])

	useEffect(() => {
		const action = async () => {
			setSelectedPlaylistReorderSongs(getPlaylistFromId(selectedPlaylist).songs)
		}
		action()
	}, [selectedPlaylist, playlists])

	return (
		<>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row justify-start gap-2">
					<motion.div
						className="bg-slate-800 hover:bg-slate-700 rounded-lg h-10 aspect-square flex flex-col justify-center items-center border border-slate-400 cursor-pointer transition ease-out duration-200"
						onClick={() => setSelectedPlaylist("")}
						initial={{
							scale: 1.0
						}}
						animate={{
							scale: 1.0
						}}
						whileTap={{
							scale: 0.8
						}}
						transition={{
							duration: 0.025,
							ease: "easeOut"
						}}
					>
						<IoChevronBack size={20} />
					</motion.div>
					<div className="w-full flex flex-col text-center justify-center">
						<PlaylistRenamer />
						<p className="font-bold text-xs line-clamp-1 mr-12">
							{selectedPlaylistReorderSongs.length > 0 &&
								selectedPlaylistReorderSongs.length}
							&nbsp;
							{selectedPlaylistReorderSongs.length > 0 && "item(s)"}
						</p>
					</div>
				</div>
				{search ? (
					<div className="flex flex-col gap-2 relative">
						{filteredSelectedPlaylistsSongs.map((elt) => (
							<SongElement key={elt} song={elt} showDelete={false} />
						))}
					</div>
				) : (
					<Reorder.Group
						values={selectedPlaylistReorderSongs}
						onReorder={setSelectedPlaylistReorderSongs}
						className="flex flex-col gap-2 relative"
					>
						{filteredSelectedPlaylistsSongs.map((elt) => (
							<Reorder.Item
								onDragEnd={updateSelectedPlaylistSongsOrder}
								key={elt}
								value={elt}
								transition={{
									duration: 0.2
								}}
							>
								<SongElement
									key={elt}
									song={elt}
									isGrabbable={true}
									showDelete={false}
								/>
							</Reorder.Item>
						))}
					</Reorder.Group>
				)}
			</div>
		</>
	)
}
