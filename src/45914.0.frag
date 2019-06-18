#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
	float intensity = 0.0001;
	for (float i = 0.; i < 55.; i++) {
		float angle = i/55. * 2. * 3.14159;
		vec2 xy = vec2(0.065 * cos(angle), 0.065 * sin(angle));
		xy += gl_FragCoord.xy/resolution.y-.5;
		xy.x += -.5;
		intensity += pow(1000000., (0.76 - length(xy) * 14.) * (1. + 0.3 * fract(-i / 55. - time))) / 8000.;
	}
	gl_FragColor = vec4(clamp(intensity * vec3(0.1, 0.1, 0.1), vec3(0.), vec3(1.)), 1.);
}
