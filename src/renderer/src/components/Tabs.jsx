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
import { FaListUl } from "react-icons/fa"
import { MdLibraryMusic, MdLibraryAdd } from "react-icons/md"
import { useSettingsStore } from "../stores/useSettingsStore"

export default function Tabs() {
	const { tab, setTab } = useSettingsStore()

	return (
		<div className="fixed w-full top-0 flex flex-col justify-center p-4">
			<ul className="w-full flex flex-row gap-2">
				<li
					onClick={() => setTab("library")}
					className={cn(
						"w-full flex flex-row items-center font-bold text-center select-none cursor-pointer -hue-rotate-15 rounded-lg p-2 transition ease-out duration-200 border-2 border-pink-300/80 shadow-[0_0_5px_5px] shadow-pink-400/40",
						tab == "library"
							? "bg-pink-700/90 hover:bg-pink-600/90"
							: "bg-pink-950/90 contrast-125 hover:bg-pink-900 shadow-pink-300/10",
					)}
				>
					<div>
						<MdLibraryMusic size={24} />
					</div>
					<span className="w-full">Library</span>
				</li>
				<li
					onClick={() => setTab("queue")}
					className={cn(
						"w-full flex flex-row items-center font-bold text-center select-none cursor-pointer -hue-rotate-15 rounded-lg p-2 transition ease-out duration-200 border-2 border-pink-300/80 shadow-[0_0_5px_5px] shadow-pink-400/40",
						tab == "queue"
							? "bg-pink-700/90 hover:bg-pink-600/90"
							: "bg-pink-950/90 contrast-125 hover:bg-pink-900 shadow-pink-300/10",
					)}
				>
					<div>
						<FaListUl size={20} />
					</div>
					<span className="w-full">Queue</span>
				</li>
				<li
					onClick={() => setTab("filesystem")}
					className={cn(
						"w-full flex flex-row items-center font-bold text-center select-none cursor-pointer -hue-rotate-15 rounded-lg p-2 transition ease-out duration-200 border-2 border-pink-300/80 shadow-[0_0_5px_5px] shadow-pink-400/40",
						tab == "filesystem"
							? "bg-pink-700/90 hover:bg-pink-600/90"
							: "bg-pink-950/90 contrast-125 hover:bg-pink-900 shadow-pink-300/10",
					)}
				>
					<div>
						<MdLibraryAdd size={24} />
					</div>
					<span className="w-full">FileSystem</span>
				</li>
			</ul>
		</div>
	)
}
