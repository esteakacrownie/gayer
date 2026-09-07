import { cn } from "@sglara/cn"
import { useSettingsStore } from "../stores/useSettingsStore"
import { BsLightningChargeFill } from "react-icons/bs"
import { HiSparkles } from "react-icons/hi2"

export default function PowerSavingButton() {
	const { powerSavingMode, setPowerSavingMode } = useSettingsStore()

	return (
		<button
			className="flex flex-row gap-1 justify-center items-center bg-slate-800 rounded-full border border-slate-400 py-1 px-2 transition ease-out duration-200 hover:bg-slate-700 cursor-pointer overflow-clip relative"
			onClick={() => {
				setPowerSavingMode(!powerSavingMode)
			}}
		>
			{powerSavingMode ? (
				<>
					<BsLightningChargeFill size={16} />
					<span>Performance</span>
				</>
			) : (
				<>
					<HiSparkles size={16} />
					<span>Appearance</span>
				</>
			)}
			<div
				className={cn(
					"absolute w-full h-full top-0 left-0 mix-blend-multiply transition ease-out duration-200",
					powerSavingMode ? "bg-yellow-100" : "bg-pink-200",
				)}
			/>
		</button>
	)
}
