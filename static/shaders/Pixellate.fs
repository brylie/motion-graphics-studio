/*{
	"DESCRIPTION": "Pixellate/mosaic effect",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Stylize"
	],
	"INPUTS": [
		{
			"NAME": "inputImage",
			"TYPE": "image"
		},
		{
			"NAME": "pixelSize",
			"TYPE": "float",
			"DEFAULT": 16.0,
			"MIN": 1.0,
			"MAX": 128.0
		}
	]
}*/

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
	vec2 pixelatedUV = floor(uv * RENDERSIZE.xy / pixelSize) * pixelSize / RENDERSIZE.xy;
	pixelatedUV += pixelSize / (2.0 * RENDERSIZE.xy);
	
	vec4 color = IMG_NORM_PIXEL(inputImage, pixelatedUV);
	gl_FragColor = color;
}
