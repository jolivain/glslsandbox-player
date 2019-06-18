#ifdef GL_ES
precision mediump float;
#endif

#define M_PI 3.1415926535897932384626433832795

uniform float time;
uniform vec2 resolution;

void main( void ) {

	vec3 rgbcolour = vec3(0.);
	vec3 rgbcolour1 = vec3(0.);

	rgbcolour.r = sin ((sqrt(pow(resolution.x / 2.0 - gl_FragCoord.x, 2.0) + pow((resolution.y / 2.0 - gl_FragCoord.y), 2.0)) + time * -16.0)/ 8.0);
	rgbcolour1.r = sin (sqrt(pow((resolution.x / 2.0) + sin(time) * 32.0 - gl_FragCoord.x, 2.0) + pow(((resolution.y / 2.0) + cos(time) * 32.0 - gl_FragCoord.y), 2.0)) + time * -16.0);
	gl_FragColor = (vec4 (rgbcolour+rgbcolour1, 1.0));
}
