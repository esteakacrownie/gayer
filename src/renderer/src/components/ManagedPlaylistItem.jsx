import { useCallback, useEffect, useState } from "react"
import { usePlayerStore } from "../stores/usePlayerStore"
import { usePlaylistsStore } from "../stores/usePlaylistsStore"
import { MdDelete } from "react-icons/md"
import { cn } from "@sglara/cn"

export default function ManagedPlaylistItem({ pid, pname, plength = 0 }) {

    const { selectedPlaylist, setSelectedPlaylist } =
        usePlayerStore()

    const { playlists, setPlaylists } = usePlaylistsStore()

    const [deletingSelectedPlaylist, setDeletingSelectedPlaylist] = useState(false)

    useEffect(() => {
        if (deletingSelectedPlaylist) {
            const i = setTimeout(() => { setDeletingSelectedPlaylist(false) }, 2000)
            return () => {
                clearTimeout(i)
            }
        }
    }, [deletingSelectedPlaylist])

    const removeSelectedPlaylist = useCallback(() => {
        if (deletingSelectedPlaylist) {
            setPlaylists(playlists.filter((e) => e.id != pid))
            setSelectedPlaylist("")
            setDeletingSelectedPlaylist(false)
        } else {
            setDeletingSelectedPlaylist(true)
        }
    }, [playlists, selectedPlaylist, deletingSelectedPlaylist])

    return (
        <div
            className={cn("relative p-2 gap-2 w-full flex flex-row overflow-clip jutify-start items-center rounded-lg font-bold text-white transition ease-out duration-200 select-none brightness-110 bg-pink-500/10 hover:bg-pink-500/25 cursor-pointer border-2 border-transparent",
                deletingSelectedPlaylist ? "pr-42" : "pr-36"
            )}
        >
            <p className="line-clamp-1">{pname}</p>
            <p className="min-w-max text-xs opacity-75 brightness-90">{`${plength} item(s)`}</p>
            <button
                className="absolute top-0 right-2 my-1 flex flex-row gap-1 text-sm justify-center items-center text-red-300 bg-red-950 rounded-full border border-red-300 py-1 px-2 transition ease-out duration-200 hover:bg-red-900 cursor-pointer"
                onClick={removeSelectedPlaylist}
            >
                <MdDelete size={16} />
                <span>
                    {deletingSelectedPlaylist ? "Confirm deletion ?" : "Delete Playlist"}
                </span>
            </button>
        </div>
    )
}