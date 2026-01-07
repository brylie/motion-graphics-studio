import { writable } from 'svelte/store';
import type { ParsedISF } from '$lib/isf/types';
import { loadShadersFromDirectory } from '$lib/isf/parser';

export interface ShaderLibraryState {
	shaders: ParsedISF[];
	loading: boolean;
	error: string | null;
}

// Shader library store
export const shaderLibrary = writable<ShaderLibraryState>({
	shaders: [],
	loading: false,
	error: null
});

// Shader library actions
export const shaderLibraryActions = {
	/**
	 * Load all shaders from the static directory
	 */
	async loadShaders() {
		shaderLibrary.update(s => ({ ...s, loading: true, error: null }));
		
		try {
			const shaders = await loadShadersFromDirectory('/shaders');
			shaderLibrary.update(s => ({ ...s, shaders, loading: false }));
		} catch (error) {
			console.error('Error loading shaders:', error);
			shaderLibrary.update(s => ({
				...s,
				loading: false,
				error: error instanceof Error ? error.message : 'Failed to load shaders'
			}));
		}
	},

	/**
	 * Get shader by name
	 */
	getShader(name: string): ParsedISF | null {
		let result: ParsedISF | null = null;
		shaderLibrary.subscribe(s => {
			result = s.shaders.find(shader => shader.filename === name) || null;
		})();
		return result;
	}
};
