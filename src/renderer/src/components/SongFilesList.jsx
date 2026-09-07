import { useFilesStore } from "../stores/useFilesStore"
import SongElement from "./SongElement"

export default function SongFilesList() {
	const { files } = useFilesStore()

	return (
		<ul className="flex flex-col gap-2">
			{files.map((elt, idx) => (
				<SongElement key={elt.path} song={elt.path} />
			))}
		</ul>
	)
}
