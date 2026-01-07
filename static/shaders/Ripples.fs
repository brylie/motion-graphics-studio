/*{
	"DESCRIPTION": "Animated ripple effect",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Distortion"
	],
	"INPUTS": [
		{
			"NAME": "inputImage",
			"TYPE": "image"
		},
		{
			"NAME": "amplitude",
			"TYPE": "float",
			"DEFAULT": 0.05,
			"MIN": 0.0,
			"MAX": 0.2
		},
		{
			"NAME": "frequency",
			"TYPE": "float",
			"DEFAULT": 10.0,
			"MIN": 1.0,
			"MAX": 50.0
		},
		{
			"NAME": "speed",
			"TYPE": "float",
			"DEFAULT": 1.0,
			"MIN": 0.0,
			"MAX": 4.0
		},
		{
			"NAME": "center",
			"TYPE": "point2D",
			"DEFAULT": [0.5, 0.5],
			"MIN": [0.0, 0.0],
			"MAX": [1.0, 1.0]
		}
	]
}*/

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
	vec2 toCenter = uv - center;
	float dist = length(toCenter);
	float ripple = sin(dist * frequency - TIME * speed) * amplitude;
	vec2 displaced = uv + normalize(toCenter) * ripple;
	
	vec4 color = IMG_NORM_PIXEL(inputImage, displaced);
	gl_FragColor = color;
}
