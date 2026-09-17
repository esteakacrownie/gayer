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

import { cn } from "@sglara/cn";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import PowerSavingButton from "./PowerSavingButton";

export default function DownloadTab() {

    const { tab } = useSettingsStore()
    const [search, setSearch] = useState()
    const [searchResults, setSearchResults] = useState([])

    const clearSearch = () => {
        setSearch("")
    }



    if (tab != "download") return

    return (
        <>{/* Main toolbar */}
            <div className="flex flex-row flex-wrap gap-2 text-sm jutify-start items-center">
                <PowerSavingButton />
            </div>
            {/* Search bar */}
            <div className="relative w-full flex flex-row">
                <input
                    className={cn(
                        "outline-none w-full bg-pink-950/50 border-2 border-pink-300 shadow-[0_0_5px_5px] not-focus:shadow-transparent rounded-lg p-2 pr-8 transition ease-out duration-200",
                        "focus:shadow-pink-400/40",
                    )}
                    type="text"
                    placeholder="Search for artists, songs, albums..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button
                    className="absolute right-0 top-0 h-full p-2 cursor-pointer hover:scale-125 transition ease-out duration-200"
                    onClick={clearSearch}
                >
                    <IoMdClose size={20} />
                </button>
            </div>
        </>
    )
}