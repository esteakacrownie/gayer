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

import appDirs from "appdirsjs"
import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from "electron"
import { basename, dirname, extname, join } from "node:path"
import { readFile, writeFile, stat, readdir, mkdir, unlink, rm, copyFile } from "node:fs/promises"
import { existsSync, readFileSync, createWriteStream } from "node:fs"
import { Readable } from "node:stream"
import { pipeline } from "node:stream/promises"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import { windowStateKeeper } from "./stateKeeper"
import YTMusic from "ytmusic-api"
import { YtDlp, helpers } from "ytdlp-nodejs"

// global references
const appName = "com.integraxseras.Gayer"
const dirs = appDirs({ appName })
let token = ""
if (existsSync(join(process.resourcesPath, "updates/TOKEN"))) {
	token = readFileSync(join(process.resourcesPath, "updates/TOKEN"), { encoding: "utf8" })
} else {
	if (existsSync("updates/TOKEN")) {
		token = readFileSync("updates/TOKEN", { encoding: "utf8" })
	}
}
const bearer = "Bearer " + token
const IMG_EXTS = ["jpg", "JPG", "jpeg", "JPEG", "webp", "WEBP", "gif", "GIF", "PNG", "png"]
const ALLOWED_CHARS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789"
let appWindow = null
let YTM_INITIALIZED = false
let YTDLP_READY = false
let ytdlpBinaryPath = ""
let ffmpegBinaryName = "ffmpeg"
let latestFetchedRemoteVersion = -1
let latestFetchedRemoteNotes = ""
const ytmusic = new YTMusic()
const MAX_YTDLP_INSTANCES = 4
let ytdlpInstancesCount = 0

// utils
const randomStr = (length, chars) => {
	let res = ""
	while (res.length < length) {
		res += chars[Math.min(Math.round(Math.random() * (chars.length - 1)))]
	}
	return res
}

const download = async (url, path) => {
	const response = await fetch(url)

	if (!response.ok) {
		throw new Error(`Download failed: ${response.status}`)
	}

	await mkdir(dirname(path), { recursive: true })
	if (!existsSync(path)) await pipeline(Readable.fromWeb(response.body), createWriteStream(path))
}

const downloadMissingCovers = async (data) => {
	const coversDir = await initCoversDir()
	const queue = []
	const checkedIDs = []
	// filter non-existing covers
	for (let img of Object.values(data)) {
		if (img != "#" && img.trim() && !checkedIDs.includes(basename(img, ".png"))) {
			queue.push({
				url: img,
				path: join(coversDir, `${basename(img, ".png")}.png`)
			})
			checkedIDs.push(basename(img, ".png"))
		}
	}
	// launch downloads
	for (let elt of queue) {
		try {
			const res = imageExists(elt.path)
			if (!res) await download(elt.url, elt.path)
		} catch (error) {
			console.log(error)
		}
	}
}

const generateLyricsData = async () => {
	// generate index.json from .lrc files
	try {
		let index = {}
		const lyricsDir = join(dirs.data, "lyrics")
		await mkdir(lyricsDir, { recursive: true })
		for (let path of await readdir(lyricsDir)) {
			if (path.endsWith(".lrc")) {
				index[basename(path, ".lrc")] = JSON.parse(
					readFileSync(join(lyricsDir, path), { encoding: "utf-8" })
				)
			}
		}
		await writeFile(join(lyricsDir, "index.json"), JSON.stringify(index), { encoding: "utf-8" })
		return true
	} catch (error) {
		console.log(error)
		return false
	}
}

const imageExists = (img, replacement = false) => {
	if (!img) return
	const coversDir = join(dirs.data, "covers", replacement ? "replacements" : "")
	for (let ext of IMG_EXTS) {
		if (existsSync(join(coversDir, `${basename(img, `.${ext}`)}.${ext}`))) {
			return { ext }
		}
	}
	return false
}

const trackHasReplacementCover = async (track) => {
	if (!track) return false
	let replacements = {}
	const coversDir = await initCoversDir()
	try {
		if (existsSync(join(coversDir, "replacements.json"))) {
			replacements =
				JSON.parse(
					readFileSync(join(coversDir, "replacements.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	if (replacements[track] && imageExists(replacements[track], true)) {
		return replacements[track]
	}
	return false
}

const trackHasCachedCover = async (track) => {
	if (!track) return false
	let remote = {}
	const coversDir = await initCoversDir()
	try {
		if (existsSync(join(coversDir, "remote.json"))) {
			remote =
				JSON.parse(
					readFileSync(join(coversDir, "remote.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	const ext = imageExists(remote[track]).ext ?? ""
	if (remote[track] && ext) {
		return join("/", join(coversDir, basename(remote[track], `.${ext}`) + `.${ext}`))
	}
	return false
}

const initCoversReplacementDir = async () => {
	const coversReplacementDir = join(dirs.data, "covers/replacements")
	await mkdir(coversReplacementDir, { recursive: true })
	return coversReplacementDir
}

const initCoversDir = async () => {
	const coversDir = join(dirs.data, "covers")
	await mkdir(coversDir, { recursive: true })
	return coversDir
}

const startupCoversProcessing = async () => {
	// check if covers/remote.json exists
	// check if cache.json exists
	// remote = {...cache, ...remote}
	// save remote to remote.json
	// generate index.json from remote,
	// replacing the urls by the path to cover if it exists
	// else add cover to the download queue
	// start download queue
	let cache = {}
	let remote = {}
	let replacements = {}
	let disabled = []
	const coversDir = await initCoversDir()
	try {
		if (existsSync(join(dirs.data, "cache.json"))) {
			cache =
				JSON.parse(
					readFileSync(join(dirs.data, "cache.json"), {
						encoding: "utf8"
					})
				).thumbnailCache ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	try {
		if (existsSync(join(coversDir, "remote.json"))) {
			remote =
				JSON.parse(
					readFileSync(join(coversDir, "remote.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	try {
		if (existsSync(join(coversDir, "replacements.json"))) {
			replacements =
				JSON.parse(
					readFileSync(join(coversDir, "replacements.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	try {
		if (existsSync(join(coversDir, "disabled.json"))) {
			disabled =
				JSON.parse(
					readFileSync(join(coversDir, "disabled.json"), {
						encoding: "utf8"
					})
				) ?? []
		}
	} catch (error) {
		console.log(error)
	}
	remote = { ...cache, ...remote }
	const filtered = {}
	for (let elt of Object.keys(remote)) {
		if (remote[elt].startsWith("https://")) {
			filtered[elt] = remote[elt]
		} else {
			if (remote[elt] == "#") {
				disabled.push(elt)
			}
		}
	}
	remote = { ...filtered }
	const nullEntries = {}
	disabled.map((e) => {
		nullEntries[e] = "#"
	})
	let index = { ...remote }
	const missing = {}
	// replacing remote links with local paths when applicable
	for (let elt of Object.keys(remote)) {
		const img = remote[elt]
		const res = imageExists(img)
		if (res) {
			index[elt] =
				"file://" + join("/", join(coversDir, `${basename(img, `.${res.ext}`)}.${res.ext}`))
		} else {
			missing[elt] = remote[elt]
		}
	}
	// cleaning replacements by getting rid of the non-existent images entries
	for (let i of Object.keys(replacements)) {
		if (!imageExists(replacements[i], true)) {
			delete replacements[i]
		}
	}
	await writeFile(join(coversDir, "replacements.json"), JSON.stringify(replacements), {
		encoding: "utf-8"
	})
	// applying custom replacements and null entries
	index = { ...index, ...replacements, ...nullEntries }
	for (let i of Object.keys(index)) {
		if (index[i] != "#" && !index[i].startsWith("file://")) {
			index[i] = "file://" + join("/", index[i])
		}
	}
	await writeFile(join(coversDir, "disabled.json"), JSON.stringify(disabled), {
		encoding: "utf-8"
	})
	await writeFile(join(coversDir, "remote.json"), JSON.stringify(remote), { encoding: "utf-8" })
	await writeFile(join(coversDir, "index.json"), JSON.stringify(index), { encoding: "utf-8" })
	downloadMissingCovers(missing)
}

const startupPlaylistProcessing = async () => {
	// check if playlists.json exists
	// extract playlists.json to playlists/ID.pl (if file does not already exist), and add entries to display.json (new Set())
	// check if display.json exists
	// generate index.json, based on files, only if ids are in display or if display is null
	const playlistsDir = join(dirs.data, "playlists")
	await mkdir(playlistsDir, { recursive: true })
	let playlists = []
	let display = null
	try {
		if (existsSync(join(dirs.data, "playlists.json"))) {
			playlists =
				JSON.parse(readFileSync(join(dirs.data, "playlists.json"), { encoding: "utf8" })) ??
				[]
		}
	} catch (error) {
		console.log(error)
	}
	try {
		if (existsSync(join(playlistsDir, "display.json"))) {
			display =
				JSON.parse(
					readFileSync(join(playlistsDir, "display.json"), { encoding: "utf8" })
				) ?? null
		}
	} catch (error) {
		console.log(error)
	}
	for (let p of playlists) {
		if (!existsSync(join(playlistsDir, `${p.id}.pl`))) {
			if (display) display.push(p.id)
			await writeFile(join(playlistsDir, `${p.id}.pl`), JSON.stringify(p), {
				encoding: "utf-8"
			})
		}
	}
	if (display) display = [...new Set([...display])]
	const index = []
	if (display && Array.isArray(display)) {
		for (let p of display) {
			if (existsSync(join(playlistsDir, `${p}.pl`))) {
				const elt = {
					...JSON.parse(
						readFileSync(join(playlistsDir, `${p}.pl`), { encoding: "utf-8" })
					)
				}
				elt.id = p
				index.push(elt)
			}
		}
	} else {
		for (let p of await readdir(playlistsDir)) {
			try {
				const pid = basename(p, ".pl")
				if (p.endsWith(".pl")) {
					const elt = {
						...JSON.parse(readFileSync(join(playlistsDir, p), { encoding: "utf-8" }))
					}
					elt.id = pid
					index.push(elt)
				}
			} catch (error) {
				console.log(error)
			}
		}
	}
	await writeFile(join(playlistsDir, "index.json"), JSON.stringify(index), { encoding: "utf8" })
}

const startupLyricsProcessing = async () => {
	// check if cache.json exists
	// extract it to individual files for each entry (if file does not already exist) as songName.lrc {data}
	// generate index.json from existing files
	let cache = {}
	const lyricsDir = join(dirs.data, "lyrics")
	await mkdir(lyricsDir, { recursive: true })
	try {
		if (existsSync(join(dirs.data, "cache.json"))) {
			cache =
				JSON.parse(
					readFileSync(join(dirs.data, "cache.json"), {
						encoding: "utf8"
					})
				).lyricsCache ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	for (let elt of Object.keys(cache)) {
		if (!existsSync(join(lyricsDir, `${elt}.lrc`))) {
			await writeFile(join(lyricsDir, `${elt}.lrc`), JSON.stringify(cache[elt]), {
				encoding: "utf-8"
			})
		}
	}
	generateLyricsData()
}

const handleLyricsUpdate = async (lyricsData) => {
	// check if lyrics directory exists
	// check if index.json exists
	// compare them and write files that differ
	const lyricsDir = join(dirs.data, "lyrics")
	await mkdir(lyricsDir, { recursive: true })
	let prev = {}
	try {
		if (existsSync(join(lyricsDir, "index.json"))) {
			prev =
				JSON.parse(
					readFileSync(join(lyricsDir, "index.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	for (let song of Object.keys(lyricsData)) {
		if (!existsSync(join(lyricsDir, `${song}.lrc`))) {
			await writeFile(join(lyricsDir, `${song}.lrc`), JSON.stringify(lyricsData[song]), {
				encoding: "utf8"
			})
		} else {
			if (!prev[song] || JSON.stringify(prev[song]) != JSON.stringify(lyricsData[song])) {
				await writeFile(join(lyricsDir, `${song}.lrc`), JSON.stringify(lyricsData[song]), {
					encoding: "utf8"
				})
			}
		}
	}
	return await generateLyricsData()
}

const handleCoversUpdate = async (coversData) => {
	// filter coverData : only keep url sources
	// remote = {...remote, ...filtered}
	// overwrite remote.json
	// for each value of filtered covers, if v != "#" and file does not exist : add to download queue
	// start download queue
	const coversDir = await initCoversDir()
	let prev = {}
	let disabled = []
	try {
		if (existsSync(join(coversDir, "remote.json"))) {
			prev =
				JSON.parse(
					readFileSync(join(coversDir, "remote.json"), {
						encoding: "utf8"
					})
				) ?? {}
		}
	} catch (error) {
		console.log(error)
	}
	try {
		if (existsSync(join(coversDir, "disabled.json"))) {
			disabled =
				JSON.parse(
					readFileSync(join(coversDir, "disabled.json"), {
						encoding: "utf8"
					})
				) ?? []
		}
	} catch (error) {
		console.log(error)
	}
	const filtered = {} // remote urls to save
	for (let elt of Object.keys(coversData)) {
		if (coversData[elt] == "#") {
			disabled.push(elt)
		} else {
			// un-disable entries that contain data
			disabled = disabled.filter((e) => e != elt)
			if (coversData[elt].startsWith("https://")) {
				filtered[elt] = coversData[elt]
			}
		}
	}
	prev = { ...prev, ...filtered }
	// strip null entries in remote, since disabled are listed in disabled.json
	for (let i of Object.keys(prev)) {
		if (prev[i] == "#") {
			delete prev[i]
		}
	}
	disabled = [...new Set([...disabled])]
	await writeFile(join(coversDir, "disabled.json"), JSON.stringify(disabled), {
		encoding: "utf8"
	})
	await writeFile(join(coversDir, "remote.json"), JSON.stringify(prev), {
		encoding: "utf8"
	})
	downloadMissingCovers(filtered)
	return true
}

const handlePlaylistsUpdate = async (playlistsData) => {
	// overwrite display.json => playlistsData.map((e) => e.id)
	// for each playlist element, write to file .pl
	const playlistsDir = join(dirs.data, "playlists")
	await mkdir(playlistsDir, { recursive: true })
	await writeFile(
		join(playlistsDir, "display.json"),
		JSON.stringify(playlistsData.map((e) => e.id)),
		{ encoding: "utf-8" }
	)
	for (let p of playlistsData) {
		await writeFile(join(playlistsDir, `${p.id}.pl`), JSON.stringify(p), { encoding: "utf-8" })
	}
}

const handleReplacementCoverForTrack = async (track, path) => {
	// check if image exists
	// check if covers/replacements/index.json keys have image path and if so, use the existing one
	// else :
	// generate unused ID that is not in the covers/replacements/index.json values
	// copy image as covers/replacements/ID.${ext}
	// add track: replacementPath to the covers/replacements/index.json
	// clean replacements : remove unused replacement images, remove replacement entries where replacement image does not exist
	if (!path) return
	const ext = existsSync(path) ? extname(path) : ""
	const coversDir = await initCoversDir()
	const replacementsDir = await initCoversReplacementDir()
	if (ext) {
		let index = {} // original: ID in replacements folder
		let replacements = {}
		try {
			if (existsSync(join(replacementsDir, "index.json"))) {
				index =
					JSON.parse(
						readFileSync(join(replacementsDir, "index.json"), {
							encoding: "utf8"
						})
					) ?? {}
			}
		} catch (error) {
			console.log(error)
		}
		try {
			if (existsSync(join(coversDir, "replacements.json"))) {
				replacements =
					JSON.parse(
						readFileSync(join(coversDir, "replacements.json"), {
							encoding: "utf8"
						})
					) ?? {}
			}
		} catch (error) {
			console.log(error)
		}
		let res
		if (index[path] && imageExists(index[path], true)) {
			res = index[path]
		} else {
			const vals = Object.values(index)
			res = randomStr(32, ALLOWED_CHARS)
			while (vals.includes(res)) {
				res = randomStr(32, ALLOWED_CHARS)
			}
			index[path] = res
		}
		const replacementPath = join(replacementsDir, `${basename(res, ext)}${ext}`)
		replacements[track] = replacementPath
		await copyFile(path, replacementPath)
		for (let i of Object.keys(index)) {
			if (!imageExists(index[i], true)) {
				delete index[i]
			}
		}
		for (let i of Object.keys(replacements)) {
			if (!existsSync(replacements[i])) {
				delete replacements[i]
			}
		}
		await writeFile(join(coversDir, "replacements.json"), JSON.stringify(replacements), {
			encoding: "utf-8"
		})
		await writeFile(join(replacementsDir, "index.json"), JSON.stringify(index), {
			encoding: "utf-8"
		})
		return replacementPath
	}
	return false
}

const handleRemoveReplacementCoverForTrack = async (track) => {}

const getRemoteInfo = async () => {
	try {
		const res = await (
			await fetch("https://api.github.com/repos/esteakacrownie/gayer/releases/latest", {
				method: "GET",
				withCredentials: true,
				credentials: "include",
				headers: {
					Authorization: bearer,
					"Content-Type": "application/json"
				}
			})
		).json()
		return res
	} catch (err) {
		console.log(err)
		return false
	}
}

const getVersion = () => {
	return process.env.npm_package_version || app.getVersion()
}

const isVersionNewer = (codeNameString) => {
	try {
		const current = parseInt((getVersion() || "0.0.0").replaceAll(/[a-zA-Z-.]*/g, ""))
		const remote = parseInt((codeNameString || "-1").replaceAll(/[a-zA-Z-.]*/g, ""))
		// console.log(current)
		// console.log(remote)
		// only return true once per new verion detected
		if (remote > current && remote > latestFetchedRemoteVersion) {
			return true
		}
		return false
	} catch {
		return false
	}
}

const checkForUpdates = async (window) => {
	console.log("checking for gayer updates...")
	const info = await getRemoteInfo()
	// console.log(info)
	const newer = isVersionNewer(info.name)
	if (info && newer) {
		latestFetchedRemoteVersion = info.name
		latestFetchedRemoteNotes = info.body
		console.log("gayer update available : " + info.name)
		window.webContents.send("update_available", { version: info.name, notes: info.body })
	} else if (info && !newer) {
		console.log("gayer is up to date : " + getVersion())
	}
}

const tryYTDLPInit = async () => {
	try {
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
		} catch {
			missing_ffmpeg = true
		}

		if (missing_ffmpeg) {
			await helpers.downloadFFmpeg(join(dirs.data, "modules", "ffmpeg"))
		}

		for (let f of await readdir(join(dirs.data, "modules", "ffmpeg"))) {
			if (f.toLocaleLowerCase().includes("ffmpeg")) {
				ffmpegBinaryName = f
			}
		}
		return true
	} catch {
		return false
	}
}

const tryYTMInit = async () => {
	try {
		let attempt = await ytmusic.initialize()
		return attempt
	} catch {
		return false
	}
}

const delay = (t) => {
	return new Promise((res) => setTimeout(res, t))
}

const YtdlpAwaiter = async () => {
	while (ytdlpInstancesCount >= MAX_YTDLP_INSTANCES) {
		console.log("yt-dlp instances: " + ytdlpInstancesCount)
		await delay(1500)
	}
}

const removeYTDownloader = () => {
	// ytdlpInstancesCount -= 1
	ytdlpInstancesCount = Math.max(0, ytdlpInstancesCount - 1)
}

const createYTDownloader = () => {
	ytdlpInstancesCount += 1
	// console.log(ytdlpInstancesCount)
	return new YtDlp({
		binaryPath: ytdlpBinaryPath,
		ffmpegPath: join(dirs.data, "modules", "ffmpeg", ffmpegBinaryName)
	})
}

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

// background processes
const startUpdatePolling = (window) => {
	checkForUpdates(window)
	setInterval(() => checkForUpdates(window), 30000)
}

const initYTMusic = async () => {
	let attempt = await tryYTMInit()
	while (!attempt) {
		console.log("Couldn't init YTMusic API. Retrying...")
		await delay(2000)
		attempt = await tryYTMInit()
	}
}

const initYTModules = async () => {
	let attempt = await tryYTDLPInit()
	while (!attempt) {
		console.log("Couldn't init yt-dlp modules. Retrying...")
		await delay(2000)
		attempt = await tryYTDLPInit()
	}
}

// protocol for handling local files playback
protocol.registerSchemesAsPrivileged([
	{
		scheme: "file",
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
		scheme: "https",
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

// setup and build app window
async function createWindow() {
	const mainWindowStateKeeper = await windowStateKeeper("gayer")

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		name: "gayer",
		x: mainWindowStateKeeper.x,
		// y: mainWindowStateKeeper.y, do not attempt to recover y position because of potential titlebar heigh offset miscalculated
		width: mainWindowStateKeeper.width,
		height: mainWindowStateKeeper.height,
		minWidth: 592,
		minHeight: 592,
		show: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: join(__dirname, "../preload/index.js"),
			sandbox: false,
			webSecurity: false
			// allowRunningInsecureContent: true,
		}
	})

	// updates
	startUpdatePolling(mainWindow)
	// requirements for youtube features
	initYTModules()
		.then(() => (YTDLP_READY = true))
		.then(() => mainWindow.webContents.send("ytdlp_ready", true))
	initYTMusic()
		.then(() => (YTM_INITIALIZED = true))
		.then(() => mainWindow.webContents.send("ytm_initialized", true))

	// Track window state
	mainWindowStateKeeper.track(mainWindow)

	// mainWindow.removeMenu()

	mainWindow.on("ready-to-show", () => {
		mainWindow.show()
	})

	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: "deny" }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
	} else {
		mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
	}

	return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	// Set app user model id for windows
	electronApp.setAppUserModelId("com.integraxseras.Gayer")

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on("browser-window-created", (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	// main process calls from renderer
	ipcMain.handle("version", async () => {
		try {
			return getVersion()
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("update_available", async () => {
		try {
			if (latestFetchedRemoteVersion != -1) {
				return { version: latestFetchedRemoteVersion, notes: latestFetchedRemoteNotes }
			}
			return false
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle("read_configfile", async (event, args) => {
		try {
			return await readFile(join(dirs.data, args.path), {
				encoding: "utf8"
			})
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("read_file", async (event, args) => {
		try {
			return await readFile(args.path, {
				encoding: "utf8"
			})
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("writeConfigFile", async (event, args) => {
		try {
			await mkdir(dirs.data, { recursive: true })
			return await writeFile(join(dirs.data, args.path), args.content, { encoding: "utf8" })
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("replace_cover", async (event, args) => {
		try {
			return await handleReplacementCoverForTrack(args.track, args.path)
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle("remove_replacement_cover", async (event, args) => {
		try {
			return await handleRemoveReplacementCoverForTrack(args.track)
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle("update_lyrics", async (event, args) => {
		return handleLyricsUpdate(args.lyricsData)
	})
	ipcMain.handle("update_covers", async (event, args) => {
		return handleCoversUpdate(args.coversData)
	})
	ipcMain.handle("update_playlists", async (event, args) => {
		return handlePlaylistsUpdate(args.playlistsData)
	})
	ipcMain.handle("ls_sorted", async (event, args) => {
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
	ipcMain.handle("sort_created", async (event, args) => {
		try {
			return await sortedFileList(args.files, "")
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("is_dir", async (event, args) => {
		try {
			return (await stat(args.path)).isDirectory()
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("ls", async (event, args) => {
		try {
			if (!existsSync(args.path)) return false
			const files = (await readdir(args.path)).map((elt) => join(args.path, elt))
			return files
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("ls_dirs", async (event, args) => {
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
	ipcMain.handle("open_folder", async () => {
		try {
			const folder = await dialog.showOpenDialog({
				title: "Select a directory",
				properties: ["openDirectory"]
			})
			return folder.filePaths[0]
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("open_file", async () => {
		try {
			const file = await dialog.showOpenDialog({
				title: "Select a file",
				properties: ["openFile"]
			})
			return file.filePaths[0]
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("open_image", async () => {
		try {
			const file = await dialog.showOpenDialog({
				title: "Select an image",
				filters: [
					{
						name: "Images",
						extensions: IMG_EXTS
					}
				],
				properties: ["openFile"]
			})
			return file.filePaths[0]
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("get_local_cover", async (event, args) => {
		try {
			const rep = await trackHasReplacementCover(args.track)
			const cached = await trackHasCachedCover(args.track)
			const res = rep || cached || ""
			return res
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle("file_exists", async (event, args) => {
		try {
			const exists = existsSync(args.path)
			return exists
		} catch (error) {
			console.log(error)
			return false
		}
	})
	ipcMain.handle("get_files_exist", async (event, args) => {
		try {
			const result = {}
			for (let p of args.paths) {
				result[p] = existsSync(p)
			}
			return result
		} catch (error) {
			console.log(error)
			return {}
		}
	})
	ipcMain.handle("get_dirs_exist", async (event, args) => {
		try {
			const result = {}
			for (let p of args.paths) {
				result[p] = existsSync(p) && (await stat(p)).isDirectory()
			}
			return result
		} catch (error) {
			console.log(error)
			return {}
		}
	})
	ipcMain.handle("delete_file", async (event, args) => {
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
	ipcMain.handle("delete_dir", async (event, args) => {
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
	ipcMain.handle("get_songs_exist", async (event, args) => {
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
			return {}
		}
	})
	ipcMain.handle("get_album_exists", async (event, args) => {
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
	ipcMain.handle("get_args", async () => {
		try {
			return process.argv
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("ytm_search", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.search(args.query)
			return results
		} catch (error) {
			console.log(error)
			return []
		}
	})
	ipcMain.handle("ytm_songs", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchSongs(args.query)
			return results
		} catch (error) {
			console.log(error)
			return []
		}
	})
	ipcMain.handle("ytm_albums", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchAlbums(args.query)
			return results
		} catch (error) {
			console.log(error)
			return []
		}
	})
	ipcMain.handle("get_album", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return {}
			}
			const result = await ytmusic.getAlbum(args.id)
			return result
		} catch (error) {
			console.log(error)
			return {}
		}
	})
	ipcMain.handle("get_album_songs", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const result = await ytmusic.getAlbum(args.id)
			return result.songs || []
		} catch (error) {
			console.log(error)
			return []
		}
	})
	ipcMain.handle("ytm_artists", async (event, args) => {
		try {
			if (!YTM_INITIALIZED) {
				return []
			}
			const results = await ytmusic.searchArtists(args.query)
			return results
		} catch (error) {
			console.log(error)
			return []
		}
	})
	ipcMain.handle("download_from_url", async (event, args) => {
		try {
			if (!YTDLP_READY) {
				return false
			}
			await YtdlpAwaiter()
			let processingElt = {}
			// args : url, destination, artist
			const res = await createYTDownloader().downloadAsync(args.url, {
				format: { filter: "audioonly", quality: "0", type: "mp3" },
				output: join(
					args.destination,
					"%(artists.0,channel)s/%(track,title)s - %(artists.0,channel)s.mp3"
				),
				rawArgs: args.browserCookies ? ["--cookies-from-browser", args.browserCookies] : [],
				onProgress: (p) => {
					if (appWindow) {
						if (p.status === "finished") {
							appWindow.webContents.send("url_audio_complete", processingElt)
						} else if (p.status === "downloading") {
							if (processingElt.filepath != p.filename.replace("webm", "mp3")) {
								processingElt.filepath = p.filename.replace("webm", "mp3")
								appWindow.webContents.send("url_audio_started", processingElt)
							}
						}
					}
					console.log(`${p.percentage_str}`)
				},
				beforeDownload: (info) => {
					processingElt = info
				}
			})
			removeYTDownloader()
			return res.filePaths
		} catch (error) {
			console.log(error)
			removeYTDownloader()
			return false
		}
	})
	ipcMain.handle("download_playlist_from_url", async (event, args) => {
		try {
			if (!YTDLP_READY) {
				return false
			}
			await YtdlpAwaiter()
			let processingElt = {}
			// args : url, destination, artist
			const res = await createYTDownloader().downloadAsync(args.url, {
				format: { filter: "audioonly", quality: "0", type: "mp3" },
				output: join(
					args.destination,
					"%(playlist)s%(playlist_channel& - |)s%(playlist_channel|)s/%(album,playlist)s%(album& - |)s%(album_artists.0,artists.0|)s/%(track,title)s - %(artists.0,channel)s.mp3"
				),
				rawArgs: args.browserCookies ? ["--cookies-from-browser", args.browserCookies] : [],
				onProgress: (p) => {
					if (appWindow) {
						if (p.status === "finished") {
							appWindow.webContents.send("url_audio_complete", processingElt)
						} else if (p.status === "downloading") {
							if (processingElt.filepath != p.filename.replace("webm", "mp3")) {
								processingElt.filepath = p.filename.replace("webm", "mp3")
								appWindow.webContents.send("url_audio_started", processingElt)
							}
						}
					}
					console.log(`${p.percentage_str}`)
				},
				beforeDownload: (info) => {
					processingElt = info
				}
			})
			removeYTDownloader()
			return res.filePaths
			// return res.filePaths
		} catch (error) {
			console.log(error)
			removeYTDownloader()
			return false
		}
	})
	ipcMain.handle("download_song", async (event, args) => {
		try {
			if (!YTDLP_READY) {
				return false
			}
			await YtdlpAwaiter()
			// args : url, path
			await createYTDownloader().downloadAsync("https://youtube.com/watch?v=" + args.url, {
				format: { filter: "audioonly", quality: "0", type: "mp3" },
				output: args.path,
				rawArgs: args.browserCookies ? ["--cookies-from-browser", args.browserCookies] : [],
				onProgress: (p) => console.log(`${p.percentage_str}`)
			})
			removeYTDownloader()
			return true
		} catch (error) {
			console.log(error)
			console.log("https://youtube.com/watch?v=" + args.url)
			removeYTDownloader()
			return false
		}
	})
	ipcMain.handle("open_yt_login", async () => {
		try {
			return shell.openExternal(
				"https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue"
			)
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("open_updates_page", async () => {
		try {
			return shell.openExternal("https://github.com/esteakacrownie/gayer/releases/latest")
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle("is_ytdlp_ready", async () => {
		return YTDLP_READY
	})

	startupCoversProcessing()
		.then(startupLyricsProcessing)
		.then(startupPlaylistProcessing)
		.then(createWindow)
		.then((w) => (appWindow = w))

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})
