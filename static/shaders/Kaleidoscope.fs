/*{
	"DESCRIPTION": "Kaleidoscope mirror effect",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Kaleidoscope"
	],
	"INPUTS": [
		{
			"NAME": "inputImage",
			"TYPE": "image"
		},
		{
			"NAME": "segments",
			"TYPE": "float",
			"DEFAULT": 6.0,
			"MIN": 2.0,
			"MAX": 24.0
		},
		{
			"NAME": "angle",
			"TYPE": "float",
			"DEFAULT": 0.0,
			"MIN": 0.0,
			"MAX": 6.28318530718
		}
	]
}*/

#define PI 3.14159265359

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy - 0.5;
	float r = length(uv);
	float a = atan(uv.y, uv.x) + angle;
	
	float segmentAngle = 2.0 * PI / segments;
	a = mod(a, segmentAngle);
	a = abs(a - segmentAngle / 2.0);
	
	vec2 newUV = vec2(cos(a), sin(a)) * r + 0.5;
	vec4 color = IMG_NORM_PIXEL(inputImage, newUV);
	gl_FragColor = color;
}
