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

import appDirs from 'appdirsjs'
import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFile, writeFile, stat, readdir, mkdir, unlink, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { windowStateKeeper } from "./stateKeeper"
import YTMusic from "ytmusic-api"
import { YtDlp, helpers } from 'ytdlp-nodejs'

// global references
const appName = 'com.integraxseras.Gayer'

const dirs = appDirs({ appName })

let YTM_INITIALIZED = false
let YTDLP_READY = false
let ytdlpBinaryPath = ""
let ffmpegBinaryName = "ffmpeg"
const ytmusic = new YTMusic()

const initYTModules = async () => {

	let ytdlp = new YtDlp()

	// update binary
	const result = await ytdlp.updateYtDlpAsync({ outDir: join(dirs.data, "modules", "ytdlp") })
	ytdlpBinaryPath = result.binaryPath
	let missing_ffmpeg = false

	try {
		const ffmpeg_modules_contents = await readdir(join(dirs.data, "modules", "ffmpeg"))
		// console.log(ffmpeg_modules_contents)
		let has_ffmpeg = false
		let has_ffprobe = false
		for (let f of ffmpeg_modules_contents) {
			if (f.toLocaleLowerCase().includes("ffmpeg")) {
				has_ffmpeg = true
			}
			if (f.toLocaleLowerCase().includes("ffprobe")) {
				has_ffprobe = true
			}
		}
		if (!has_ffmpeg || !has_ffprobe) {
			missing_ffmpeg = true
		}
	} catch (error) {
		missing_ffmpeg = true
	}

	if (missing_ffmpeg) {
		const test = await helpers.downloadFFmpeg(join(dirs.data, "modules", "ffmpeg"))
	}

	for (let f of (await readdir(join(dirs.data, "modules", "ffmpeg")))) {
		if (f.toLocaleLowerCase().includes("ffmpeg")) {
			ffmpegBinaryName = f
		}
	}
}

const createYTDownloader = () => {
	return new YtDlp({
		binaryPath: ytdlpBinaryPath,
		ffmpegPath: join(dirs.data, "modules", "ffmpeg", ffmpegBinaryName)
	})
}

// utils
const sortedFileList = async (files, base) => {
	const res = []
	for (let file of files) {
		const path = join(base, file)
		if (!existsSync(path)) {
			continue
		}
		const elt = {}
		elt[path] = { mtimeMs: (await stat(path)).mtimeMs, atimeMs: (await stat(path)).atimeMs }
		res.push(elt)
	}
	return res
}


// protocol for handling playing local files
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'file',
		privileges: {
			standard: true,
			bypassCSP: true,
			allowServiceWorkers: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true
		}
	},
	{
		scheme: 'https',
		privileges: {
			standard: true,
			bypassCSP: true,
			allowServiceWorkers: true,
			supportFetchAPI: true,
			corsEnabled: true,
			stream: true
		}
	}
])


// requirements for youtube features
initYTModules().then(() => YTDLP_READY = true)
ytmusic.initialize().then(() => YTM_INITIALIZED = true)


// setup and build app window
async function createWindow() {

	const mainWindowStateKeeper = await windowStateKeeper('gayer');

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		name: "gayer",
		x: mainWindowStateKeeper.x,
		y: mainWindowStateKeeper.y,
		width: mainWindowStateKeeper.width,
		height: mainWindowStateKeeper.height,
		minWidth: 432,
		minHeight: 432,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			webSecurity: false,
			// allowRunningInsecureContent: true,
		}
	})

	// Track window state
	mainWindowStateKeeper.track(mainWindow)

	// mainWindow.removeMenu()

	mainWindow.on('ready-to-show', () => {
		mainWindow.show()
	})

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId('com.electron')

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	// main process calls from renderer
	ipcMain.handle('read_configfile', async (event, args) => {
		try {
			return await readFile(join(dirs.data, args.path), {
				encoding: 'utf8'
			})
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('read_file', async (event, args) => {
		try {
			return await readFile(args.path, {
				encoding: 'utf8'
			})
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('writeConfigFile', async (event, args) => {
		try {
			await mkdir(dirs.data, { recursive: true })
			return await writeFile(join(dirs.data, args.path), args.content, { encoding: 'utf8' })
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ls_sorted', async (event, args) => {
		try {
			if (!existsSync(args.path)) {
				return []
			}
			const files = await readdir(args.path)
			return await sortedFileList(files, args.path)
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('sort_created', async (event, args) => {
		try {
			return await sortedFileList(args.files, "")
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('is_dir', async (event, args) => {
		try {
			return (await stat(args.path)).isDirectory()
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ls', async (event, args) => {
		try {
			const files = (await readdir(args.path)).map((elt) => join(args.path, elt))
			return files
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ls_dirs', async (event, args) => {
		try {
			const files = (await readdir(args.path)).map((elt) => join(args.path, elt))
			const res = []
			for (let file of files) {
				const is_dir = (await stat(file)).isDirectory()
				if (is_dir) {
					res.push(file)
				}
			}
			return res
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('open_folder', async (event, args) => {
		try {
			const folder = await dialog.showOpenDialog({ title: "Select a directory", properties: ["openDirectory"] })
			return folder.filePaths[0]
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('open_file', async (event, args) => {
		try {
			const file = await dialog.showOpenDialog({ title: "Select a file", properties: ["openFile"] })
			return file.filePaths[0]
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('file_exists', async (event, args) => {
		try {
			const exists = existsSync(args.path)
			return exists
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('delete_file', async (event, args) => {
		try {
			const exists = existsSync(args.path)
			if (exists) {
				await unlink(args.path)
				return true
			}
			return false
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('delete_dir', async (event, args) => {
		try {
			const exists = existsSync(args.path)
			if (exists) {
				await rm(args.path, { recursive: true, force: true })
				return true
			}
			return false
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('get_songs_exist', async (event, args) => {
		try {
			const result = {}
			for (let song of Object.keys(args.songs)) {
				const s = existsSync(args.songs[song])
				result[song] = s
				//(!s && console.log(args.songs[song]))
			}
			return result
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('get_album_exists', async (event, args) => {
		try {
			for (let s of args.songs) {
				if (!existsSync(s)) {
					// console.log(s)
					return false
				}
			}
			return true
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('get_args', async (event, args) => {
		try {
			return process.argv
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ytm_search', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.search(args.query)
			return results
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ytm_songs', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchSongs(args.query)
			return results
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ytm_albums', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchAlbums(args.query)
			return results
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('get_album', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return {}
			}
			const result = await ytmusic.getAlbum(args.id)
			return result
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('get_album_songs', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const result = await ytmusic.getAlbum(args.id)
			return result.songs || []
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ytm_artists', async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchArtists(args.query)
			return results
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('download_album', async (event, args) => {
		try {
			if (!YTDLP_READY) {
				return false
			}
			// args : url, destination, artist
			await createYTDownloader()
				.downloadAsync("https://www.youtube.com/playlist?list=" + args.url, {
					format: { filter: 'audioonly', quality: "0", type: "mp3" },
					output: join(args.destination, `%(title)s - ${args.artist}.mp3`),
					rawArgs: args.browserCookies ? ["--cookies-from-browser", args.browserCookies] : [],
					onProgress: (p) => console.log(`${p.percentage_str}`),
				})
			return true
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle('download_song', async (event, args) => {
		try {
			if (!YTDLP_READY) {
				return false
			}
			// args : url, path
			await createYTDownloader()
				.downloadAsync("https://youtube.com/watch?v=" + args.url, {
					format: { filter: 'audioonly', quality: "0", type: "mp3" },
					output: args.path,
					rawArgs: args.browserCookies ? ["--cookies-from-browser", args.browserCookies] : [],
					onProgress: (p) => console.log(`${p.percentage_str}`),
				})
			return true
		} catch (error) {
			console.log(error)
			console.log("https://youtube.com/watch?v=" + args.url)
			return false
		}
	})
	ipcMain.handle('open_yt_login', async (event, args) => {
		try {
			return shell.openExternal("https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue")
		} catch (error) {
			console.log(error)
			return error
		}
	})

	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
