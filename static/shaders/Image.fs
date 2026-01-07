/*{
  "DESCRIPTION": "Displays an image with optional scaling and positioning",
  "CREDIT": "ISF Timeline Sequencer",
  "ISFVSN": "2",
  "CATEGORIES": ["Generator"],
  "INPUTS": [
    {
      "NAME": "inputImage",
      "TYPE": "image"
    },
    {
      "NAME": "scale",
      "TYPE": "float",
      "DEFAULT": 1.0,
      "MIN": 0.1,
      "MAX": 5.0
    },
    {
      "NAME": "position",
      "TYPE": "vec2",
      "DEFAULT": [0.5, 0.5],
      "MIN": [0.0, 0.0],
      "MAX": [1.0, 1.0]
    },
    {
      "NAME": "rotation",
      "TYPE": "float",
      "DEFAULT": 0.0,
      "MIN": 0.0,
      "MAX": 360.0
    },
    {
      "NAME": "opacity",
      "TYPE": "float",
      "DEFAULT": 1.0,
      "MIN": 0.0,
      "MAX": 1.0
    }
  ]
}*/

#version 300 es
precision highp float;

uniform vec3 RENDERSIZE;
uniform sampler2D inputImage;
uniform float scale;
uniform vec2 position;
uniform float rotation;
uniform float opacity;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / RENDERSIZE.xy;
  
  // Center coordinates
  vec2 centered = uv - position;
  
  // Apply rotation
  float angle = radians(rotation);
  float cosA = cos(angle);
  float sinA = sin(angle);
  vec2 rotated = vec2(
    centered.x * cosA - centered.y * sinA,
    centered.x * sinA + centered.y * cosA
  );
  
  // Apply scale
  rotated = rotated / scale;
  
  // Recenter
  vec2 texCoord = rotated + vec2(0.5, 0.5);
  
  // Sample texture
  if (texCoord.x < 0.0 || texCoord.x > 1.0 || texCoord.y < 0.0 || texCoord.y > 1.0) {
    fragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    vec4 color = IMG_NORM_PIXEL(inputImage, texCoord);
    fragColor = vec4(color.rgb, color.a * opacity);
  }
}
