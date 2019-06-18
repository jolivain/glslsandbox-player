#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main() {
	vec2 uv = (2. * gl_FragCoord.xy - resolution) / resolution.y;
	vec3 col = vec3(0.);

	float l = 3. * log(length(uv));
	float a = 2. * atan(uv.x, uv.y);
	float d = abs(cos(time + l + a));
	col += .09 / d;
	col *= .5 + .5 * cos(time + d * 2. + l / 5. + vec3(23, 21, 0));
	
	gl_FragColor = vec4(col, 1.);
}
