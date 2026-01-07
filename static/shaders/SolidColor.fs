/*{
	"DESCRIPTION": "Simple solid color generator",
	"CREDIT": "VIDVOX",
	"ISFVSN": "2",
	"CATEGORIES": [
		"Generator"
	],
	"INPUTS": [
		{
			"NAME": "fillColor",
			"TYPE": "color",
			"DEFAULT": [1.0, 0.0, 0.0, 1.0]
		}
	]
}*/

void main() {
	gl_FragColor = fillColor;
}
