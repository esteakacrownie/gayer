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

import DeletePlaylistButton from "./DeletePlaylistButton"

export default function ManagedPlaylistItem({ pid, pname, plength = 0 }) {
	return (
		<div className="relative p-2 gap-2 w-full flex flex-row overflow-clip jutify-start items-center rounded-lg font-bold text-white transition ease-out duration-200 select-none brightness-110 bg-pink-500/10 hover:bg-pink-500/25 border-2 border-transparent">
			<p className="line-clamp-1">{pname}</p>
			<p className="min-w-max text-xs opacity-75 brightness-90">{`${plength} item(s)`}</p>
			<div className="-my-1">
				<DeletePlaylistButton pid={pid} />
			</div>
		</div>
	)
}
