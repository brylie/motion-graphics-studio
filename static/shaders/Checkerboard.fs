/*{
	"DESCRIPTION": "Generates a checkerboard pattern",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Generator"
	],
	"INPUTS": [
		{
			"NAME": "size",
			"TYPE": "float",
			"DEFAULT": 8.0,
			"MIN": 1.0,
			"MAX": 64.0
		},
		{
			"NAME": "color1",
			"TYPE": "color",
			"DEFAULT": [1.0, 1.0, 1.0, 1.0]
		},
		{
			"NAME": "color2",
			"TYPE": "color",
			"DEFAULT": [0.0, 0.0, 0.0, 1.0]
		}
	]
}*/

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
	vec2 pos = floor(uv * size);
	float pattern = mod(pos.x + pos.y, 2.0);
	vec4 color = mix(color1, color2, pattern);
	gl_FragColor = color;
}
