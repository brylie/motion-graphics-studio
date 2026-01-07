import type { ParsedISF, CompiledShader, ISFInput } from './types';
import { setUniform, setStandardUniforms, createEmptyTexture } from './uniforms';

// Default vertex shader for ISF
const DEFAULT_VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

// ISF-specific GLSL functions that need to be injected
const ISF_GLSL_FUNCTIONS = `
#define IMG_PIXEL(image, pixelCoord) texture(image, (pixelCoord) / vec2(textureSize(image, 0)))
#define IMG_NORM_PIXEL(image, normalizedCoord) texture(image, normalizedCoord)
#define IMG_SIZE(image) vec2(textureSize(image, 0))
`;

/**
 * ISF Shader Renderer
 * Handles compilation, uniform management, and rendering of ISF shaders
 */
export class ISFRenderer {
	private gl: WebGL2RenderingContext;
	private shader: ParsedISF | null = null;
	private compiled: CompiledShader | null = null;
	private vertexBuffer: WebGLBuffer | null = null;
	private vao: WebGLVertexArrayObject | null = null;
	
	// Parameter values
	private parameterValues: { [key: string]: any } = {};
	private inputTextures: Map<string, WebGLTexture> = new Map();
	
	// Framebuffers for multi-pass rendering
	private framebuffers: Map<string, WebGLFramebuffer> = new Map();
	private framebufferTextures: Map<string, WebGLTexture> = new Map();
	
	private time: number = 0;
	private renderSize: [number, number] = [800, 600];

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2', {
			alpha: true,
			premultipliedAlpha: false,
			preserveDrawingBuffer: true
		});
		
		if (!gl) {
			throw new Error('WebGL2 not supported');
		}
		
		this.gl = gl;
		this.initializeGeometry();
	}

	/**
	 * Initialize quad geometry for rendering
	 */
	private initializeGeometry(): void {
		// Full-screen quad
		const vertices = new Float32Array([
			-1, -1,
			 1, -1,
			-1,  1,
			 1,  1
		]);

		this.vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

		// Create VAO (native in WebGL2)
		this.vao = this.gl.createVertexArray();
		if (this.vao) {
			this.gl.bindVertexArray(this.vao);
			this.gl.enableVertexAttribArray(0);
			this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
			this.gl.bindVertexArray(null);
		}
	}

	/**
	 * Get uniform type string for GLSL
	 */
	private getUniformType(type: string): string {
		switch (type) {
			case 'float': return 'float';
			case 'color': return 'vec4';
			case 'point2D':
			case 'vec2': return 'vec2';
			case 'bool':
			case 'long':
			case 'event': return 'int';
			case 'image':
			case 'audio':
			case 'audioFFT': return 'sampler2D';
			default: return 'float';
		}
	}

	/**
	 * Compile a shader
	 */
	private compileShader(source: string, type: number): WebGLShader | null {
		const shader = this.gl.createShader(type);
		if (!shader) return null;

		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
			this.gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	/**
	 * Load and compile an ISF shader
	 */
	loadShader(parsedISF: ParsedISF): boolean {
		this.shader = parsedISF;
		
		// Check if shader already has #version directive
		let shaderCode = parsedISF.fragmentShader;
		const versionMatch = shaderCode.match(/#version\s+\d+\s+es/);
		
		// Extract existing version and shader body
		let existingVersion = '';
		let shaderBody = shaderCode;
		if (versionMatch) {
			existingVersion = versionMatch[0];
			shaderBody = shaderCode.substring(versionMatch.index! + versionMatch[0].length).trim();
		}
		
		// Build fragment shader - order matters in GLSL!
		// 1. Version directive
		let fragmentSource = existingVersion || '#version 300 es';
		fragmentSource += '\n';
		
		// 2. Precision (MUST come before any code)
		fragmentSource += 'precision highp float;\n';
		
		// 3. Out variable (always add, we'll strip from body)
		fragmentSource += 'out vec4 fragColor;\n';
		
		// Strip precision and out declarations from shader body to avoid duplicates
		shaderBody = shaderBody.replace(/precision\s+\w+\s+float\s*;/g, '');
		shaderBody = shaderBody.replace(/out\s+vec4\s+fragColor\s*;/g, '');
		shaderBody = shaderBody.trim();
		
		// 4. Add ISF helper functions
		fragmentSource += ISF_GLSL_FUNCTIONS;
		
		// Add uniforms only if not already declared
		if (!shaderBody.includes('uniform float TIME')) {
			fragmentSource += 'uniform float TIME;\n';
		}
		if (!shaderBody.includes('uniform vec3 RENDERSIZE') && !shaderBody.includes('uniform vec2 RENDERSIZE')) {
			fragmentSource += 'uniform vec3 RENDERSIZE;\n';
		}
		
		// Add uniforms for inputs (only if not already declared)
		for (const input of parsedISF.metadata.INPUTS) {
			const uniformDecl = `uniform ${this.getUniformType(input.TYPE)} ${input.NAME}`;
			if (!shaderBody.includes(uniformDecl)) {
				switch (input.TYPE) {
					case 'float':
						fragmentSource += `uniform float ${input.NAME};\n`;
						break;
					case 'color':
						fragmentSource += `uniform vec4 ${input.NAME};\n`;
						break;
					case 'point2D':
					case 'vec2':
						fragmentSource += `uniform vec2 ${input.NAME};\n`;
						break;
					case 'bool':
					case 'long':
					case 'event':
						fragmentSource += `uniform int ${input.NAME};\n`;
						break;
					case 'image':
					case 'audio':
					case 'audioFFT':
						fragmentSource += `uniform sampler2D ${input.NAME};\n`;
						break;
				}
			}
		}
		
		// Replace gl_FragColor with fragColor for GLSL 300 es
		shaderBody = shaderBody.replace(/gl_FragColor/g, 'fragColor');
		fragmentSource += shaderBody;

		// Compile vertex shader
		const vertexShader = this.compileShader(DEFAULT_VERTEX_SHADER, this.gl.VERTEX_SHADER);
		if (!vertexShader) return false;

		// Compile fragment shader
		const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
		if (!fragmentShader) {
			this.gl.deleteShader(vertexShader);
			return false;
		}

		// Link program
		const program = this.gl.createProgram();
		if (!program) {
			this.gl.deleteShader(vertexShader);
			this.gl.deleteShader(fragmentShader);
			return false;
		}

		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			console.error('Program linking error:', this.gl.getProgramInfoLog(program));
			this.gl.deleteProgram(program);
			this.gl.deleteShader(vertexShader);
			this.gl.deleteShader(fragmentShader);
			return false;
		}

		// Get uniform locations
		const uniforms: { [key: string]: WebGLUniformLocation | null } = {};
		uniforms.TIME = this.gl.getUniformLocation(program, 'TIME');
		uniforms.RENDERSIZE = this.gl.getUniformLocation(program, 'RENDERSIZE');
		
		for (const input of parsedISF.metadata.INPUTS) {
			uniforms[input.NAME] = this.gl.getUniformLocation(program, input.NAME);
		}

		// Get attribute locations
		const attributes: { [key: string]: number } = {};
		attributes.position = this.gl.getAttribLocation(program, 'position');

		this.compiled = { program, uniforms, attributes };
		
		// Initialize parameter values with defaults
		this.resetParameters();
		
		return true;
	}

	/**
	 * Reset all parameters to their default values
	 */
	resetParameters(): void {
		if (!this.shader) return;
		
		this.parameterValues = {};
		for (const input of this.shader.metadata.INPUTS) {
			if (input.DEFAULT !== undefined) {
				this.parameterValues[input.NAME] = input.DEFAULT;
			}
		}
	}

	/**
	 * Set a parameter value
	 */
	setParameter(name: string, value: any): void {
		this.parameterValues[name] = value;
	}

	/**
	 * Set an input texture
	 */
	setInputTexture(name: string, texture: WebGLTexture): void {
		this.inputTextures.set(name, texture);
	}

	/**
	 * Set render size
	 */
	setRenderSize(width: number, height: number): void {
		this.renderSize = [width, height];
	}

	/**
	 * Update time
	 */
	setTime(time: number): void {
		this.time = time;
	}

	/**
	 * Render the shader
	 */
	render(outputFramebuffer: WebGLFramebuffer | null = null): void {
		if (!this.compiled || !this.shader) return;

		const { gl } = this;
		
		// Bind output framebuffer (null = screen)
		gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
		
		// Set viewport
		gl.viewport(0, 0, this.renderSize[0], this.renderSize[1]);
		
		// Clear
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		// Use shader program
		gl.useProgram(this.compiled.program);
		
		// Set standard uniforms
		setStandardUniforms(gl, this.compiled.uniforms, this.time, this.renderSize);
		
		// Set parameter uniforms
		let textureUnit = 0;
		for (const input of this.shader.metadata.INPUTS) {
			const location = this.compiled.uniforms[input.NAME];
			
			if (input.TYPE === 'image' || input.TYPE === 'audio' || input.TYPE === 'audioFFT') {
				// Bind texture
				const texture = this.inputTextures.get(input.NAME);
				if (texture) {
					gl.activeTexture(gl.TEXTURE0 + textureUnit);
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.uniform1i(location, textureUnit);
					textureUnit++;
				}
			} else {
				// Set uniform value
				const value = this.parameterValues[input.NAME];
				if (value !== undefined) {
					setUniform(gl, location, value, input.TYPE);
				}
			}
		}
		
		// Draw
		if (this.vao) {
			gl.bindVertexArray(this.vao);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			gl.bindVertexArray(null);
		}
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		if (this.compiled) {
			this.gl.deleteProgram(this.compiled.program);
			this.compiled = null;
		}
		
		if (this.vertexBuffer) {
			this.gl.deleteBuffer(this.vertexBuffer);
			this.vertexBuffer = null;
		}
		
		if (this.vao) {
			this.gl.deleteVertexArray(this.vao);
			this.vao = null;
		}
		
		// Clean up textures
		for (const texture of this.inputTextures.values()) {
			this.gl.deleteTexture(texture);
		}
		this.inputTextures.clear();
		
		// Clean up framebuffers
		for (const fb of this.framebuffers.values()) {
			this.gl.deleteFramebuffer(fb);
		}
		this.framebuffers.clear();
		
		for (const tex of this.framebufferTextures.values()) {
			this.gl.deleteTexture(tex);
		}
		this.framebufferTextures.clear();
	}
}
