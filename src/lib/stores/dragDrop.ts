import { writable } from 'svelte/store';

export type DragType = 'shader' | 'clip' | null;

export interface DragState {
	isDragging: boolean;
	dragType: DragType;
	sourceData: {
		clipId?: string;
		shaderId?: string;
	};
	duration: number; // Duration in seconds (5.0 for shaders, actual duration for clips)
	previewPosition: {
		trackId: string | null;
		time: number;
		visible: boolean;
	};
}

const initialState: DragState = {
	isDragging: false,
	dragType: null,
	sourceData: {},
	duration: 5.0,
	previewPosition: {
		trackId: null,
		time: 0,
		visible: false
	}
};

function createDragDropStore() {
	const { subscribe, set, update } = writable<DragState>(initialState);

	return {
		subscribe,
		startDrag: (type: 'shader' | 'clip', data: { clipId?: string; shaderId?: string }, duration: number = 5.0) => {
			update(state => ({
				...state,
				isDragging: true,
				dragType: type,
				sourceData: data,
				duration
			}));
		},
		updatePreview: (trackId: string | null, time: number, visible: boolean) => {
			update(state => ({
				...state,
				previewPosition: { trackId, time, visible }
			}));
		},
		endDrag: () => {
			set(initialState);
		},
		reset: () => {
			set(initialState);
		}
	};
}

export const dragDropStore = createDragDropStore();
