/*{
	"DESCRIPTION": "RGB color shift effect",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Color Effect"
	],
	"INPUTS": [
		{
			"NAME": "inputImage",
			"TYPE": "image"
		},
		{
			"NAME": "shift",
			"TYPE": "float",
			"DEFAULT": 0.01,
			"MIN": 0.0,
			"MAX": 0.1
		}
	]
}*/

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
	
	float r = IMG_NORM_PIXEL(inputImage, uv + vec2(shift, 0.0)).r;
	float g = IMG_NORM_PIXEL(inputImage, uv).g;
	float b = IMG_NORM_PIXEL(inputImage, uv - vec2(shift, 0.0)).b;
	
	gl_FragColor = vec4(r, g, b, 1.0);
}
