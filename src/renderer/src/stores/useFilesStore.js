import { create } from "zustic"

export const useFilesStore = create((set) => ({
	files: [],
	setFiles: (v) => set((state) => ({ files: v })),
}))
