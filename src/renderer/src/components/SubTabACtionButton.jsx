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

import { cn } from "@sglara/cn"

export default function SubTabActionButton({
	text = "",
	onClick,
	iconChild,
	highlightCondition = false,
	highlightColor = "pink"
}) {
	return (
		<button
			className={cn(
				"flex flex-row relative outline-none gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer  shadow-purple-400/35 shadow-[0_0_3px_3px]",
				highlightCondition && "brightness-105"
			)}
			onClick={onClick}
		>
			{iconChild}
			<span>{text}</span>
			<div
				className={cn(
					"absolute w-full h-full rounded-full  top-0 left-0 mix-blend-multiply transition ease-out duration-200",
					highlightCondition
						? `bg-${highlightColor}-300 outline-2 outline-${highlightColor}-300`
						: ""
				)}
			/>
		</button>
	)
}
