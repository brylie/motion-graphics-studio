import type { Timeline, Clip } from '$lib/timeline/types';
import { ISFRenderer } from '$lib/isf/renderer';
import type { ParsedISF } from '$lib/isf/types';
import { getActiveClips, getParameterValue } from '$lib/timeline/types';

const BLIT_VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 vTexCoord;

void main() {
	vTexCoord = position * 0.5 + 0.5;
	gl_Position = vec4(position, 0.0, 1.0);
}`;

const BLIT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vTexCoord;
out vec4 fragColor;
uniform sampler2D uTexture;

void main() {
	fragColor = texture(uTexture, vTexCoord);
}`;

export class CompositionRenderer {
	private canvas: HTMLCanvasElement;
	private gl: WebGL2RenderingContext;
	private renderers: Map<string, ISFRenderer> = new Map();
	private framebuffers: WebGLFramebuffer[] = [];
	private textures: WebGLTexture[] = [];
	private width: number;
	private height: number;
	private blitProgram: WebGLProgram | null = null;
	private blitVAO: WebGLVertexArrayObject | null = null;

	constructor(canvas: HTMLCanvasElement, width: number = 1920, height: number = 1080) {
		this.canvas = canvas;
		this.width = width;
		this.height = height;

		// Initialize WebGL2 context
		const gl = canvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: true,
			preserveDrawingBuffer: true
		});

		if (!gl) {
			throw new Error('WebGL2 not supported');
		}

		this.gl = gl;
		canvas.width = width;
		canvas.height = height;

		// Create framebuffers for compositing
		this.createFramebuffers(2);
		
		// Initialize blit shader for final output
		this.initBlitShader();
	}

	private initBlitShader() {
		const { gl } = this;
		
		// Compile shaders
		const vertShader = gl.createShader(gl.VERTEX_SHADER);
		const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
		if (!vertShader || !fragShader) return;
		
		gl.shaderSource(vertShader, BLIT_VERTEX_SHADER);
		gl.compileShader(vertShader);
		
		gl.shaderSource(fragShader, BLIT_FRAGMENT_SHADER);
		gl.compileShader(fragShader);
		
		// Link program
		const program = gl.createProgram();
		if (!program) return;
		
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);
		
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Blit shader link error:', gl.getProgramInfoLog(program));
			return;
		}
		
		this.blitProgram = program;
		
		// Create VAO for fullscreen quad
		const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		
		this.blitVAO = gl.createVertexArray();
		gl.bindVertexArray(this.blitVAO);
		const posLoc = gl.getAttribLocation(program, 'position');
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
		gl.bindVertexArray(null);
	}


	private createFramebuffers(count: number) {
		for (let i = 0; i < count; i++) {
			const framebuffer = this.gl.createFramebuffer();
			const texture = this.gl.createTexture();

			if (!framebuffer || !texture) {
				throw new Error('Failed to create framebuffer or texture');
			}

			this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
			this.gl.texImage2D(
				this.gl.TEXTURE_2D,
				0,
				this.gl.RGBA,
				this.width,
				this.height,
				0,
				this.gl.RGBA,
				this.gl.UNSIGNED_BYTE,
				null
			);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
			this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
			this.gl.framebufferTexture2D(
				this.gl.FRAMEBUFFER,
				this.gl.COLOR_ATTACHMENT0,
				this.gl.TEXTURE_2D,
				texture,
				0
			);

			const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
			if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
				throw new Error('Framebuffer not complete');
			}

			this.framebuffers.push(framebuffer);
			this.textures.push(texture);
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	/**
	 * Load a shader into the renderer pool
	 */
	async loadShader(shaderId: string, shader: ParsedISF) {
		if (this.renderers.has(shaderId)) {
			return;
		}

		const renderer = new ISFRenderer(this.canvas);
		renderer.setRenderSize(this.width, this.height);
		await renderer.loadShader(shader);
		this.renderers.set(shaderId, renderer);
	}

	/**
	 * Get or create a renderer for a shader
	 */
	private getRenderer(shaderId: string): ISFRenderer | null {
		return this.renderers.get(shaderId) || null;
	}

	/**
	 * Render a single clip to a framebuffer
	 */
	private renderClip(
		clip: Clip,
		time: number,
		inputTexture: WebGLTexture | null,
		outputFramebuffer: WebGLFramebuffer | null
	): boolean {
		const renderer = this.getRenderer(clip.shaderId);
		if (!renderer) {
			console.warn(`Renderer not found for shader: ${clip.shaderId}`);
			return false;
		}

		// Set input texture if available (for effect shaders that support inputImage)
		// Note: Most generator shaders don't use inputImage, so they'll ignore this
		if (inputTexture) {
			renderer.setInputTexture('inputImage', inputTexture);
		}

		// Update shader parameters with current values (including automation)
		for (const [paramName, paramValue] of Object.entries(clip.parameters)) {
			const currentValue = getParameterValue(clip, paramName, time);
			renderer.setParameter(paramName, currentValue);
		}

		// Update alpha parameter
		const alpha = getParameterValue(clip, 'alpha', time);
		renderer.setParameter('alpha', alpha);

		// Calculate local time for the clip
		const localTime = time - clip.startTime;
		
		// Update renderer time
		renderer.setTime(localTime);

		// Render to framebuffer
		renderer.render(outputFramebuffer);

		return true;
	}

	/**
	 * Render the entire timeline composition at a given time
	 */
	render(timeline: Timeline, time: number) {
		// Clear the canvas
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.width, this.height);
		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Enable blending for compositing
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		let currentFBIndex = 0;
		let hasContent = false;

		// Process tracks from bottom to top
		for (let trackIndex = timeline.tracks.length - 1; trackIndex >= 0; trackIndex--) {
			const track = timeline.tracks[trackIndex];

			// Skip muted tracks or solo tracks when others are soloed
			const hasSolo = timeline.tracks.some(t => t.solo);
			if (track.muted || (hasSolo && !track.solo)) {
				continue;
			}

			// Get active clips for this track
		const activeClips = getActiveClips(track, time);

			for (const clip of activeClips) {
				const inputTexture = hasContent ? this.textures[currentFBIndex] : null;
				const outputFBIndex = (currentFBIndex + 1) % 2;
				const outputFramebuffer = this.framebuffers[outputFBIndex];

				// Clear output framebuffer
				this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, outputFramebuffer);
				this.gl.clearColor(0, 0, 0, 0);
				this.gl.clear(this.gl.COLOR_BUFFER_BIT);

				// Render clip
				const rendered = this.renderClip(clip, time, inputTexture, outputFramebuffer);

				if (rendered) {
					currentFBIndex = outputFBIndex;
					hasContent = true;
				}
			}
		}

		// Copy final result to canvas
		if (hasContent && this.blitProgram && this.blitVAO) {
			const finalTexture = this.textures[currentFBIndex];
			
			// Unbind framebuffer to draw to canvas
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
			this.gl.viewport(0, 0, this.width, this.height);
			
			// Use blit shader
			this.gl.useProgram(this.blitProgram);
			
			// Bind the final texture
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, finalTexture);
			this.gl.uniform1i(this.gl.getUniformLocation(this.blitProgram, 'uTexture'), 0);
			
			// Draw fullscreen quad
			this.gl.bindVertexArray(this.blitVAO);
			this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
			this.gl.bindVertexArray(null);
		}

		this.gl.disable(this.gl.BLEND);
	}

	/**
	 * Resize the composition output
	 */
	resize(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.canvas.width = width;
		this.canvas.height = height;

		// Recreate framebuffers with new size
		this.destroyFramebuffers();
		this.createFramebuffers(2);
	}

	/**
	 * Destroy framebuffers
	 */
	private destroyFramebuffers() {
		for (const fb of this.framebuffers) {
			this.gl.deleteFramebuffer(fb);
		}
		for (const tex of this.textures) {
			this.gl.deleteTexture(tex);
		}
		this.framebuffers = [];
		this.textures = [];
	}

	/**
	 * Clean up resources
	 */
	destroy() {
		this.destroyFramebuffers();
		
		for (const renderer of this.renderers.values()) {
			renderer.destroy();
		}
		this.renderers.clear();
	}
}
