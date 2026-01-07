import type { ISFInput, ShaderUniforms } from './types';

/**
 * Set a uniform value in a WebGL shader program
 */
export function setUniform(
	gl: WebGL2RenderingContext,
	location: WebGLUniformLocation | null,
	value: any,
	type: ISFInput['TYPE']
): void {
	if (!location) return;

	switch (type) {
		case 'float':
			gl.uniform1f(location, value);
			break;
		case 'bool':
		case 'long':
		case 'event':
			gl.uniform1i(location, value ? 1 : 0);
			break;
		case 'point2D':
			if (Array.isArray(value) && value.length >= 2) {
				gl.uniform2f(location, value[0], value[1]);
			}
			break;
		case 'color':
			if (Array.isArray(value)) {
				if (value.length === 3) {
					gl.uniform3f(location, value[0], value[1], value[2]);
				} else if (value.length === 4) {
					gl.uniform4f(location, value[0], value[1], value[2], value[3]);
				}
			}
			break;
		case 'image':
		case 'audio':
		case 'audioFFT':
			// Textures are handled separately
			if (typeof value === 'number') {
				gl.uniform1i(location, value); // Texture unit
			}
			break;
	}
}

/**
 * Set standard ISF uniforms (TIME, RENDERSIZE, etc.)
 */
export function setStandardUniforms(
	gl: WebGL2RenderingContext,
	uniforms: { [key: string]: WebGLUniformLocation | null },
	time: number,
	renderSize: [number, number],
	passIndex?: number
): void {
	if (uniforms.TIME) {
		gl.uniform1f(uniforms.TIME, time);
	}
	
	if (uniforms.RENDERSIZE) {
		gl.uniform3f(uniforms.RENDERSIZE, renderSize[0], renderSize[1], renderSize[0] / renderSize[1]);
	}
	
	if (uniforms.PASSINDEX !== undefined && passIndex !== undefined) {
		gl.uniform1i(uniforms.PASSINDEX, passIndex);
	}
}

/**
 * Create a texture from an image
 */
export function createTextureFromImage(
	gl: WebGL2RenderingContext,
	image: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): WebGLTexture | null {
	const texture = gl.createTexture();
	if (!texture) return null;

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	// Set texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	return texture;
}

/**
 * Create an empty texture for framebuffers
 */
export function createEmptyTexture(
	gl: WebGL2RenderingContext,
	width: number,
	height: number
): WebGLTexture | null {
	const texture = gl.createTexture();
	if (!texture) return null;

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	
	gl.bindTexture(gl.TEXTURE_2D, null);
	
	return texture;
}

/**
 * Update texture with new image data
 */
export function updateTexture(
	gl: WebGL2RenderingContext,
	texture: WebGLTexture,
	image: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): void {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.bindTexture(gl.TEXTURE_2D, null);
}
