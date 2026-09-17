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
import { IoMdCloudDownload } from "react-icons/io";
import { useSettingsStore } from "../stores/useSettingsStore"

export default function Tabs() {
	const { tab, setTab } = useSettingsStore()

	const getTabIcon = (t) => {
		let res = <></>
		switch (t) {
			case "download":
				res = <IoMdCloudDownload size={24} />
				break;
			case "library":
				res = <MdLibraryMusic size={24} />
				break;
			case "queue":
				res = <FaListUl size={20} />
				break;
			case "filesystem":
				res = <MdLibraryAdd size={24} />
				break;
			default:
				break;
		}
		return res
	}

	return (
		<div className="fixed w-full top-0 flex flex-col justify-center bg-black/70 backdrop-blur-2xl border-b-2 border-pink-300/50">
			<ul className="w-full flex flex-row bg-purple-950/35 -my-px">
				{["download", "library", "queue", "filesystem"].map((e, i) => (
					<li className="w-full bg-pink-700/20" key={i} onClick={() => setTab(e)}>
						<Tab tabName={e} tab={tab} icon={getTabIcon(e)} />
					</li>
				))}
			</ul>
		</div>
	)
}

function Tab({ tab, tabName, icon }) {
	return (
		<div
			className={cn(
				"w-full flex flex-col gap-1 border-b-2 border-transparent items-center font-bold text-center select-none cursor-pointer -hue-rotate-15 p-2 transition ease-out duration-350 via-10% bg-linear-0 to-transparent to-110%",
				tab == tabName
					? "border-pink-200 from-pink-500/70 via-pink-500/40"
					: "hover:from-pink-400/15 hover:border-pink-300/15",
			)}
		>
			<div className="h-6 flex flex-row justify-center items-center">
				{icon}
			</div>
			<span className="w-full text-xs">{tabName[0].toUpperCase() + tabName.slice(1)}</span>
		</div>
	)
}