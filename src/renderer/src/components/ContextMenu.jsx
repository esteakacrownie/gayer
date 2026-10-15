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

import { useEffect, useRef } from "react"
import { useContextMenuStore } from "../stores/useContextMenuStore"
import { useClickOutside } from "../hooks/useClickOutside"
import { useHotkeys } from "react-hotkeys-hook"
import { cn } from "@sglara/cn"
import { motion } from "motion/react"

export default function ContextMenu() {
	const { title, contextX, contextY, visible, entries, hideContextMenu } = useContextMenuStore()
	const contextRef = useRef()
	useClickOutside(contextRef, hideContextMenu)
	useHotkeys("escape", hideContextMenu)

	useEffect(() => {
		if (!contextRef.current) return
		contextRef.current.style.display = visible ? "flex" : "none"
		contextRef.current.style.left = `${Math.max(4, Math.min(contextX, window.innerWidth - contextRef.current.getBoundingClientRect().width - 4)) ?? 4}px`
		contextRef.current.style.top = `${Math.max(4, Math.min(contextY, window.innerHeight - 32 * ((entries ?? []).length + 1) - 4)) ?? 4}px`
	}, [contextX, contextY, contextRef, visible, entries])

	return (
		<motion.div
			key={`${visible}${contextX}${contextY}`}
			ref={contextRef}
			initial={{
				height: 0
			}}
			animate={{
				height: visible ? "auto" : 0
			}}
			transition={{
				duration: 0.15,
				ease: "easeOut"
			}}
			onClick={hideContextMenu}
			onContextMenu={hideContextMenu}
			className="absolute z-30 bg-linear-180 max-w-75 overflow-clip from-slate-950 to-pink-800 outline-2 outline-pink-300/80 from-[-75%] to-150% shadow-pink-400/40 shadow-[0_0_7px_7px] rounded-lg flex-col"
		>
			{title && (
				<div className="pb-1 pt-2 px-2">
					<div title={title} className="opacity-50 line-clamp-1 font-bold text-xs">
						{title}
					</div>
				</div>
			)}
			<ul className="flex flex-col">
				{entries.map((e, i) => (
					<li
						key={i}
						title={e.title ?? ""}
						className={cn(
							"py-1 px-2 flex flex-row items-center line-clamp-1 gap-2 transition duration-200 ease-out hover:bg-pink-400/30 cursor-pointer",
							e.styles ?? ""
						)}
						onClick={() => {
							e.callback && e.callback()
						}}
					>
						{e.icon && e.icon}
						<p>{e.text ?? ""}</p>
					</li>
				))}
			</ul>
		</motion.div>
	)
}
