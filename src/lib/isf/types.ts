// ISF (Interactive Shader Format) Type Definitions

export type ISFInputType = 'image' | 'float' | 'color' | 'point2D' | 'bool' | 'long' | 'event' | 'audio' | 'audioFFT';

export interface ISFInput {
	NAME: string;
	TYPE: ISFInputType;
	DEFAULT?: number | number[] | boolean;
	MIN?: number | number[];
	MAX?: number | number[];
	LABEL?: string;
	LABELS?: string[];
	VALUES?: number[];
	IDENTITY?: number;
}

export interface ISFPass {
	TARGET?: string;
	PERSISTENT?: boolean;
	WIDTH?: string;
	HEIGHT?: string;
	FLOAT?: boolean;
}

export interface ISFMetadata {
	DESCRIPTION?: string;
	CREDIT?: string;
	ISFVSN: string;
	CATEGORIES: string[];
	INPUTS: ISFInput[];
	PASSES?: ISFPass[];
	IMPORTED?: { [key: string]: { PATH: string; } };
}

export interface ParsedISF {
	metadata: ISFMetadata;
	fragmentShader: string;
	vertexShader?: string;
	filename: string;
}

export interface CompiledShader {
	program: WebGLProgram;
	uniforms: { [key: string]: WebGLUniformLocation | null };
	attributes: { [key: string]: number };
}

export interface ShaderUniforms {
	TIME: number;
	RENDERSIZE: [number, number];
	PASSINDEX?: number;
	// ISF input parameters
	[key: string]: number | number[] | WebGLTexture | boolean | undefined;
}
