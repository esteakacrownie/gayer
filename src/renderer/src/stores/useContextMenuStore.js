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

import { create } from "zustic"

export const useContextMenuStore = create((set) => ({
	title: "",
	contextX: 0,
	contextY: 0,
	visible: false,
	entries: [], // [{ text:"Text", title:"Text", callback: () => {}, styles: "text-red-500..." }]
	setContextMenu: (x, y, entries, title) =>
		set((state) => {
			return {
				title: title,
				contextX: x,
				contextY: y,
				visible: true,
				entries: entries
			}
		}),
	hideContextMenu: () => set((state) => ({ visible: false }))
}))
