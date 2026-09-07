import { contextBridge, webUtils } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
	getFilePaths(files) {
		const res = []
		files.map((elt) => {
			const path = webUtils.getPathForFile(elt)
			res.push(path)
			console.log(path)
		})
		return res
		// Do something with the path, e.g., send it over IPC to the main process.
		// It's best not to expose the full file path to the web content if possible.
	}
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('api', api)
	} catch (error) {
		console.error(error)
	}
} else {
	window.electron = electronAPI
	window.api = api
}