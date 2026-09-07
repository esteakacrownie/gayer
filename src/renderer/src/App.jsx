import { useEffect } from "react"
import "./App.css"
import Player from "./components/Player"
import { usePlayerStore } from "./stores/usePlayerStore"
import { handleDropped, shuffleArray } from "./utils"
import DragDropHandler from "./components/DragDropHandler"
import { useSettingsStore } from "./stores/useSettingsStore"
import Tabs from "./components/Tabs"
import FileSystemTab from "./components/FileSystemTab"
import QueueTab from "./components/QueueTab"
import LibraryTab from "./components/LibraryTab"
import { useCacheStore } from "./stores/useCacheStore"

function App() {
	const { setQueue, setAutoplay, setNextAction } = usePlayerStore()
	const { setSettings } = useSettingsStore()
	const { setCache } = useCacheStore()

	useEffect(() => {
		// load settings
		let shufflePlayOnStart = false
		window.electron.ipcRenderer
			.invoke("readConfigFile", { path: "settings.json" })
			.then((d) => {
				const settings = JSON.parse(d)
				// console.log(settings)
				shufflePlayOnStart = settings.shufflePlay ?? false
				setSettings(settings)
			})
			.catch(() => console.log("Couldn't parse settings file"))
		// load cache
		window.electron.ipcRenderer
			.invoke("readConfigFile", { path: "cache.json" })
			.then((d) => setCache(JSON.parse(d)))
			.catch(() => console.log("Couldn't parse cache file"))
		// parse arguments
		// getMatches()
		//   .then((elt) => {
		//     // console.log(elt)
		//     return handleDropped(elt.args.files.value)
		//   })
		//   .then((songs) => {
		//     // const songs = elt.args.files.value.filter((v) => isMusicFile(v))
		//     if (songs && songs.length < 1) return
		//     setAutoplay(true)
		//     setQueue([...new Set(shufflePlayOnStart ? shuffleArray(songs) : songs)])
		//     setNextAction('setArgQueue')
		//   })
		//   .catch((e) => console.log(e))
	}, [])

	return (
		<main className="text-white from-slate-950 to-pink-950 to-150% via-slate-950 via-30% bg-linear-180 flex flex-col justify-start overflow-y-scroll h-screen gap-4 pt-20 select-none">
			<div className="px-8 flex flex-col w-full h-full justify-start gap-4 max-w-200 mx-auto">
				<LibraryTab />
				<QueueTab />
				<FileSystemTab />
				<div className="my-24">&nbsp;</div>
			</div>
			<Tabs />
			<DragDropHandler />
			<Player />
		</main>
	)
}

export default App
