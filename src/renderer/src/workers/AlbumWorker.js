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
