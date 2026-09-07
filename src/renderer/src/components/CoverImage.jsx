import { cn } from '@sglara/cn'
import { usePlayerStore } from '../stores/usePlayerStore'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useCacheStore } from '../stores/useCacheStore'

export default function CoverImage({ song }) {
	const { powerSavingMode } = useSettingsStore()
	const { thumbnailCache } = useCacheStore()
	const { currentTrack } = usePlayerStore()

	return (
		<div className="overflow-clip w-full h-full -z-10 absolute top-0 left-0 rounded-md flex flex-row justify-start items-center">
			<img
				className={cn(
					'w-full object-cover scale-105 brightness-50 transition ease-out duration-200 pointer-events-none',
					thumbnailCache[song] ? (currentTrack == song ? 'opacity-50' : 'opacity-70') : 'opacity-0',
					powerSavingMode ? '' : 'blur-[2px]'
				)}
				src={thumbnailCache[song] ?? '#'}
				alt=""
			/>
		</div>
	)
}
