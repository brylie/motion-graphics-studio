import type { ISFMetadata, ParsedISF } from './types';

/**
 * Parse ISF shader file content
 * Extracts JSON metadata from comment block and separates shader code
 */
export function parseISF(source: string, filename: string): ParsedISF | null {
	try {
		// Extract JSON metadata from /*{...}*/ comment block
		const jsonMatch = source.match(/\/\*\s*(\{[\s\S]*?\})\s*\*\//);
		
		if (!jsonMatch) {
			console.error('No ISF metadata found in shader:', filename);
			return null;
		}

		const metadataJSON = jsonMatch[1];
		const metadata: ISFMetadata = JSON.parse(metadataJSON);

		// Validate required fields (only CATEGORIES is mandatory)
		if (!Array.isArray(metadata.CATEGORIES)) {
			console.error('Invalid ISF metadata:', filename);
			return null;
		}

		// Set default ISFVSN if not present
		if (!metadata.ISFVSN) {
			metadata.ISFVSN = '2';
		}

		// Extract shader code (everything after the metadata comment)
		const fragmentShader = source.substring(jsonMatch.index! + jsonMatch[0].length).trim();

		return {
			metadata,
			fragmentShader,
			filename
		};
	} catch (error) {
		console.error('Error parsing ISF shader:', filename, error);
		return null;
	}
}

/**
 * Load ISF shader from URL
 */
export async function loadISFFromURL(url: string): Promise<ParsedISF | null> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const source = await response.text();
		const filename = url.split('/').pop() || 'unknown.fs';
		return parseISF(source, filename);
	} catch (error) {
		console.error('Error loading ISF shader from URL:', url, error);
		return null;
	}
}

/**
 * Get default value for an input based on its type
 */
export function getDefaultValue(input: ISFMetadata['INPUTS'][0]): any {
	if (input.DEFAULT !== undefined) {
		return input.DEFAULT;
	}

	switch (input.TYPE) {
		case 'float':
		case 'long':
			return input.MIN !== undefined ? input.MIN : 0;
		case 'bool':
		case 'event':
			return false;
		case 'color':
			return [1, 1, 1, 1];
		case 'point2D':
			return [0.5, 0.5];
		case 'image':
		case 'audio':
		case 'audioFFT':
			return null;
		default:
			return null;
	}
}

/**
 * Check if shader requires an input image
 */
export function requiresInputImage(metadata: ISFMetadata): boolean {
	return metadata.INPUTS.some(input => input.TYPE === 'image');
}

/**
 * Check if shader is a generator (doesn't require input)
 */
export function isGenerator(metadata: ISFMetadata): boolean {
	return metadata.CATEGORIES.includes('Generator') || !requiresInputImage(metadata);
}

/**
 * Get all shaders from a directory
 */
export async function loadShadersFromDirectory(baseURL: string): Promise<ParsedISF[]> {
	try {
		// List of shader files to load
		const shaderFiles = [
			'Plasma.fs',
			'Checkerboard.fs',
			'Ripples.fs',
			'Kaleidoscope.fs',
			'Pixellate.fs',
			'ColorShift.fs',
			'SolidColor.fs',
			'Image.fs'
		];

		const loadPromises = shaderFiles.map(file => 
			loadISFFromURL(`${baseURL}/${file}`)
		);

		const results = await Promise.all(loadPromises);
		return results.filter((shader): shader is ParsedISF => shader !== null);
	} catch (error) {
		console.error('Error loading shaders from directory:', error);
		return [];
	}
}
