import { describe, it, expect, beforeEach } from 'vitest';
import { historyStore } from './historyStore';
import { get } from 'svelte/store';

describe('historyStore', () => {
	describe('basic store operations', () => {
		it('should initialize with the provided value', () => {
			const store = historyStore({ count: 0 });
			expect(get(store)).toEqual({ count: 0 });
		});

		it('should update value using set', () => {
			const store = historyStore({ count: 0 });
			store.set({ count: 5 });
			expect(get(store)).toEqual({ count: 5 });
		});

		it('should update value using update function', () => {
			const store = historyStore({ count: 0 });
			store.update((s) => ({ count: s.count + 1 }));
			expect(get(store)).toEqual({ count: 1 });
		});

		it('should be subscribable', () => {
			const store = historyStore({ count: 0 });
			let receivedValue: any;

			const unsubscribe = store.subscribe((value) => {
				receivedValue = value;
			});

			expect(receivedValue).toEqual({ count: 0 });

			store.set({ count: 10 });
			expect(receivedValue).toEqual({ count: 10 });

			unsubscribe();
		});
	});

	describe('undo functionality', () => {
		it('should undo a single change', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			expect(get(store)).toEqual({ count: 1 });

			store.undo();
			expect(get(store)).toEqual({ count: 0 });
		});

		it('should undo multiple changes', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.set({ count: 3 });

			store.undo();
			expect(get(store)).toEqual({ count: 2 });

			store.undo();
			expect(get(store)).toEqual({ count: 1 });

			store.undo();
			expect(get(store)).toEqual({ count: 0 });
		});

		it('should not go below initial state', () => {
			const store = historyStore({ count: 0 });

			store.undo();
			expect(get(store)).toEqual({ count: 0 });

			store.undo();
			expect(get(store)).toEqual({ count: 0 });
		});

		it('should report canUndo correctly', () => {
			const store = historyStore({ count: 0 });

			expect(store.canUndo()).toBe(false);

			store.set({ count: 1 });
			expect(store.canUndo()).toBe(true);

			store.undo();
			expect(store.canUndo()).toBe(false);
		});

		it('should work with update function', () => {
			const store = historyStore({ count: 0 });

			store.update((s) => ({ count: s.count + 1 }));
			store.update((s) => ({ count: s.count + 1 }));

			expect(get(store)).toEqual({ count: 2 });

			store.undo();
			expect(get(store)).toEqual({ count: 1 });
		});
	});

	describe('redo functionality', () => {
		it('should redo a single undone change', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.undo();
			expect(get(store)).toEqual({ count: 0 });

			store.redo();
			expect(get(store)).toEqual({ count: 1 });
		});

		it('should redo multiple undone changes', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.set({ count: 3 });

			store.undo();
			store.undo();
			store.undo();
			expect(get(store)).toEqual({ count: 0 });

			store.redo();
			expect(get(store)).toEqual({ count: 1 });

			store.redo();
			expect(get(store)).toEqual({ count: 2 });

			store.redo();
			expect(get(store)).toEqual({ count: 3 });
		});

		it('should not go beyond latest state', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.undo();
			store.redo();

			expect(get(store)).toEqual({ count: 1 });

			store.redo();
			expect(get(store)).toEqual({ count: 1 });
		});

		it('should report canRedo correctly', () => {
			const store = historyStore({ count: 0 });

			expect(store.canRedo()).toBe(false);

			store.set({ count: 1 });
			expect(store.canRedo()).toBe(false);

			store.undo();
			expect(store.canRedo()).toBe(true);

			store.redo();
			expect(store.canRedo()).toBe(false);
		});
	});

	describe('history branching', () => {
		it('should clear forward history when making a new change after undo', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.set({ count: 3 });

			store.undo();
			store.undo();
			expect(get(store)).toEqual({ count: 1 });

			// New change should clear forward history
			store.set({ count: 99 });
			expect(get(store)).toEqual({ count: 99 });

			// Should not be able to redo to old future (count: 2)
			store.redo();
			expect(get(store)).toEqual({ count: 99 });

			// But can undo to previous state (count: 1)
			store.undo();
			expect(get(store)).toEqual({ count: 1 });
		});

		it('should clear forward history when using update after undo', () => {
			const store = historyStore({ count: 0 });

			store.update((s) => ({ count: s.count + 1 }));
			store.update((s) => ({ count: s.count + 1 }));
			store.undo();

			store.update((s) => ({ count: s.count + 10 }));
			expect(get(store)).toEqual({ count: 11 });

			store.redo();
			expect(get(store)).toEqual({ count: 11 }); // No redo available
		});
	});

	describe('history limits', () => {
		it('should respect maxHistory limit', () => {
			const store = historyStore({ count: 0 }, 3);

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.set({ count: 3 });
			store.set({ count: 4 });

			// Should only be able to undo 2 times (current + 2 history)
			store.undo();
			expect(get(store)).toEqual({ count: 3 });

			store.undo();
			expect(get(store)).toEqual({ count: 2 });

			store.undo();
			expect(get(store)).toEqual({ count: 2 }); // Can't go further back

			expect(store.canUndo()).toBe(false);
		});

		it('should maintain correct state after hitting history limit', () => {
			const store = historyStore({ count: 0 }, 5);

			// Add 10 states (exceeds limit of 5)
			for (let i = 1; i <= 10; i++) {
				store.set({ count: i });
			}

			expect(get(store)).toEqual({ count: 10 });

			// Should be able to undo 4 times (5 states - 1 current)
			for (let i = 0; i < 4; i++) {
				expect(store.canUndo()).toBe(true);
				store.undo();
			}

			// Should be at count: 6 (10, 9, 8, 7, 6)
			expect(get(store)).toEqual({ count: 6 });
			expect(store.canUndo()).toBe(false);
		});
	});

	describe('clearHistory', () => {
		it('should clear all history', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.set({ count: 3 });

			store.clearHistory();

			expect(get(store)).toEqual({ count: 3 }); // Current value preserved
			expect(store.canUndo()).toBe(false);
			expect(store.canRedo()).toBe(false);
		});

		it('should reset from any position in history', () => {
			const store = historyStore({ count: 0 });

			store.set({ count: 1 });
			store.set({ count: 2 });
			store.undo();

			expect(get(store)).toEqual({ count: 1 });

			store.clearHistory();

			expect(get(store)).toEqual({ count: 1 });
			expect(store.canUndo()).toBe(false);
			expect(store.canRedo()).toBe(false);
		});
	});

	describe('immutability', () => {
		it('should create independent copies of state', () => {
			const initialState = { items: [1, 2, 3] };
			const store = historyStore(initialState);

			// Modify the original object
			initialState.items.push(4);

			// Store's initial value was cloned, so it should not be affected
			expect(get(store)).toEqual({ items: [1, 2, 3] });
		});

		it('should not share references between history states', () => {
			const store = historyStore({ items: [1, 2, 3] });

			store.set({ items: [1, 2, 3, 4] });

			const current = get(store);
			current.items.push(999);

			store.undo();
			expect(get(store)).toEqual({ items: [1, 2, 3] });

			store.redo();
			expect(get(store)).toEqual({ items: [1, 2, 3, 4] }); // Not affected by mutation
		});
	});

	describe('complex state objects', () => {
		it('should handle nested objects', () => {
			const store = historyStore({
				user: { name: 'Alice', age: 30 },
				settings: { theme: 'dark' }
			});

			store.update((s) => ({
				...s,
				user: { ...s.user, age: 31 }
			}));

			expect(get(store).user.age).toBe(31);

			store.undo();
			expect(get(store).user.age).toBe(30);
		});

		it('should handle arrays of objects', () => {
			interface Task {
				id: number;
				text: string;
			}

			const store = historyStore<{ tasks: Task[] }>({
				tasks: [
					{ id: 1, text: 'Task 1' },
					{ id: 2, text: 'Task 2' }
				]
			});

			store.update((s) => ({
				tasks: [...s.tasks, { id: 3, text: 'Task 3' }]
			}));

			expect(get(store).tasks).toHaveLength(3);

			store.undo();
			expect(get(store).tasks).toHaveLength(2);
		});
	});

	describe('undo/redo workflow scenarios', () => {
		it('should handle typical editing workflow', () => {
			const store = historyStore({ text: '' });

			// User types
			store.set({ text: 'H' });
			store.set({ text: 'He' });
			store.set({ text: 'Hel' });
			store.set({ text: 'Hell' });
			store.set({ text: 'Hello' });

			// User undoes twice
			store.undo();
			store.undo();
			expect(get(store)).toEqual({ text: 'Hel' });

			// User continues typing
			store.set({ text: 'Help' });

			// Can't redo to "Hello" anymore
			store.redo();
			expect(get(store)).toEqual({ text: 'Help' });

			// Can undo to "Hel"
			store.undo();
			expect(get(store)).toEqual({ text: 'Hel' });
		});

		it('should handle multiple undo/redo cycles', () => {
			const store = historyStore({ value: 0 });

			store.set({ value: 1 });
			store.set({ value: 2 });

			store.undo();
			store.redo();
			store.undo();
			store.redo();

			expect(get(store)).toEqual({ value: 2 });
			expect(store.canRedo()).toBe(false);
		});
	});
});
