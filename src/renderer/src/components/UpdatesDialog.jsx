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

import { useEffect, useState } from "react"
import { updatesDetails } from "../utils"
import { MdNotificationImportant } from "react-icons/md"

export default function UpdatesDialog() {
	const [open, setOpen] = useState(false)
	const [content, setContent] = useState({
		version: "-1",
		notes: "No notes"
	})

	const handleShow = () => {
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
	}

	const handleGetNew = () => {
		setOpen(false)
		updatesDetails()
	}

	const handleUpdate = (c) => {
		// console.log(c)
		if (!c) return
		setOpen(true)
		setContent({ version: c.version || "-1", notes: c.notes || "No notes" })
	}

	useEffect(() => {
		window.electron.ipcRenderer.invoke("update_available", {}).then((v) => handleUpdate(v))
		const unsub = window.electron.ipcRenderer.on("update_available", (event, v) =>
			handleUpdate(v)
		)
		return () => {
			unsub()
		}
	}, [])

	if (!open) {
		if (content.version != "-1") {
			return (
				<div
					title="Update available. Click to show"
					onClick={handleShow}
					className="rounded-full animate-pulse z-20 fixed top-2 right-2 bg-linear-60 from-purple-500 to-pink-700 from-[-50%] to-150% border-2 border-pink-300 shadow-pink-400/30 shadow-[0_0_3px_3px] cursor-pointer transition ease-out duration-150 hover:scale-115"
				>
					<MdNotificationImportant className="m-0.5 text-pink-200" size={16} />
				</div>
			)
		} else {
			return
		}
	}

	return (
		<div className="fixed z-50 top-0 left-0 w-screen h-screen mx-auto p-8 backdrop-blur-sm backdrop-brightness-75 flex flex-col justify-center items-center">
			<div className="px-8 max-h-fit flex flex-col w-full h-full justify-start gap-4 max-w-200 mx-auto">
				<div className="p-4 flex flex-col gap-2 justify-start items-center w-full  h-full from-slate-950 to-pink-700 from-[-25%] to-150% bg-linear-180 rounded-2xl border-2 border-pink-300 shadow-pink-400/40 shadow-[0_0_7px_7px]">
					<div className="relative w-full flex flex-col items-center gap-4 overflow-y-scroll">
						<h1 className="w-full text-center font-bold text-lg">
							Update Available : {content.version}
						</h1>
						<div className="h-full w-full flex flex-col justify-start items-center overflow-y-scroll">
							<p className="whitespace-pre-wrap">{content.notes}</p>
						</div>
						<div className="w-full max-w-80 flex flex-row gap-2 justify-between">
							<button
								onClick={handleClose}
								className="py-2 px-3 rounded-lg bg-slate-700 border-2 border-slate-300 hover:bg-slate-600 transition ease-out duration-200 cursor-pointer"
							>
								I&apos;ll check later :3
							</button>
							<button
								onClick={handleGetNew}
								className="py-2 px-3 font-bold rounded-lg bg-pink-700 border-2 border-pink-300 hover:bg-pink-600 transition ease-out duration-200 cursor-pointer"
							>
								Gimme now ! &gt;:3
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
