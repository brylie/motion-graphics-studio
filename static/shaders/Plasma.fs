/*{
	"DESCRIPTION": "Generates an animated plasma effect",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Generator"
	],
	"INPUTS": [
		{
			"NAME": "speed",
			"TYPE": "float",
			"DEFAULT": 1.0,
			"MIN": 0.0,
			"MAX": 4.0
		},
		{
			"NAME": "scale",
			"TYPE": "float",
			"DEFAULT": 1.0,
			"MIN": 0.1,
			"MAX": 5.0
		},
		{
			"NAME": "color1",
			"TYPE": "color",
			"DEFAULT": [1.0, 0.0, 0.5, 1.0]
		},
		{
			"NAME": "color2",
			"TYPE": "color",
			"DEFAULT": [0.0, 0.5, 1.0, 1.0]
		}
	]
}*/

void main() {
	vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
	float t = TIME * speed;
	
	float v = 0.0;
	v += sin((uv.x + t) * scale * 10.0);
	v += sin((uv.y + t) * scale * 10.0);
	v += sin((uv.x + uv.y + t) * scale * 10.0);
	v += sin(length(uv - 0.5) * scale * 20.0 + t);
	v /= 4.0;
	v = (v + 1.0) / 2.0;
	
	vec4 color = mix(color1, color2, v);
	gl_FragColor = color;
}
