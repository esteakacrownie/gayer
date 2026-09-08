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
import { readFile, writeFile, stat, readdir } from 'fs/promises'
import { windowStateKeeper } from "./stateKeeper"

const appName = 'com.integraxseras.Gayer'

const dirs = appDirs({ appName })


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
		// ...(process.platform === 'linux' ? {} : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			webSecurity: false,
			allowRunningInsecureContent: true,
		}
	})

	// Track window state
	mainWindowStateKeeper.track(mainWindow);


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

const sortedFileList = async (files, base) => {
	const res = []
	for (let file of files) {
		const elt = {}
		const path = join(base, file)
		elt[path] = { mtimeMs: (await stat(path)).mtimeMs, atimeMs: (await stat(path)).atimeMs }
		res.push(elt)
	}
	return res
}

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
	ipcMain.handle('readConfigFile', async (event, args) => {
		try {
			return await readFile(join(dirs.data, args.path), {
				encoding: 'utf8'
			})
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('writeConfigFile', async (event, args) => {
		try {
			return await writeFile(join(dirs.data, args.path), args.content, { encoding: 'utf8' })
		} catch (error) {
			console.log(error)
			return error
		}
	})
	ipcMain.handle('ls_sorted', async (event, args) => {
		try {
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
	ipcMain.handle('get_args', async (event, args) => {
		try {
			return process.argv
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
