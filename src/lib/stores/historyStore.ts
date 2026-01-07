import { writable, type Readable } from 'svelte/store';

/**
 * A store that extends Svelte's writable store with undo/redo functionality.
 * Maintains a history of states and allows time-travel debugging.
 */
export interface HistoryStore<T> extends Readable<T> {
	set: (value: T) => void;
	update: (fn: (value: T) => T) => void;
	undo: () => void;
	redo: () => void;
	canUndo: () => boolean;
	canRedo: () => boolean;
	clearHistory: () => void;
}

/**
 * Creates a writable store with undo/redo capabilities.
 * 
 * @param initialValue - The initial state
 * @param maxHistory - Maximum number of states to keep in history (default: 50)
 * @returns A store with time-travel debugging capabilities
 * 
 * @example
 * ```typescript
 * const store = historyStore({ count: 0 });
 * store.update(s => ({ count: s.count + 1 }));
 * store.undo(); // Reverts to { count: 0 }
 * store.redo(); // Goes back to { count: 1 }
 * ```
 */
export function historyStore<T>(initialValue: T, maxHistory = 50): HistoryStore<T> {
	let currentIndex = 0;
	let history: T[] = [structuredClone(initialValue)];
	let isApplyingHistory = false; // Prevent history recording during undo/redo

	const { subscribe, set, update } = writable(structuredClone(initialValue));

	function saveToHistory(value: T): void {
		if (isApplyingHistory) return;

		// Truncate forward history when making a new change
		history = history.slice(0, currentIndex + 1);

		// Add new state to history
		history.push(structuredClone(value));

		// Maintain max history limit
		if (history.length > maxHistory) {
			history.shift();
		} else {
			currentIndex++;
		}
	}

	return {
		subscribe,

		set(value: T) {
			saveToHistory(value);
			set(value);
		},

		update(fn: (value: T) => T) {
			let newValue: T;
			update((current) => {
				newValue = fn(current);
				saveToHistory(newValue);
				return newValue;
			});
		},

		undo() {
			if (currentIndex > 0) {
				currentIndex--;
				isApplyingHistory = true;
				const previousState = structuredClone(history[currentIndex]);
				set(previousState);
				isApplyingHistory = false;
			}
		},

		redo() {
			if (currentIndex < history.length - 1) {
				currentIndex++;
				isApplyingHistory = true;
				const nextState = structuredClone(history[currentIndex]);
				set(nextState);
				isApplyingHistory = false;
			}
		},

		canUndo: () => currentIndex > 0,

		canRedo: () => currentIndex < history.length - 1,

		clearHistory() {
			let currentValue: T;
			update((current) => {
				currentValue = current;
				return current;
			});
			history = [structuredClone(currentValue!)];
			currentIndex = 0;
		}
	};
}
