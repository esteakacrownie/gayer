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

import albumArt from "album-art"

export default async function AlbumWorker(files) {
	const result = {}

	const getSongName = (p) => {
		let splits = p.split("/")
		const filename = splits[splits.length - 1]
		let res = ""
		splits = filename.split(".")
		splits.map((elt, idx) => {
			if (idx + 1 < splits.length) {
				res += elt
			}
		})
		return res
	}

	for (let elt of files) {
		try {
			if (elt) {
				const splits = elt.split("/")
				const album = splits[splits.length - 2]
				result[elt] = await albumArt("", {
					album: `${album} ${getSongName(elt)}`,
					size: "medium",
				})
			}
		} catch (error) {
			result[elt] = error
		}
	}

	return result
}
