#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec2 mul(vec2 x, vec2 y) {
	return vec2(x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]);
}

vec2 conj(vec2 x) {
    return vec2(x[0], -x[1]);
}

float norm(vec2 x) {
    return x[0] * x[0] + x[1] * x[1];
}

vec2 inv(vec2 x) {
	return conj(x) / norm(x);
}

vec2 div(vec2 x, vec2 y) {
	return mul(x, inv(y));
}


// https://gist.github.com/eieio/4109795
vec4 hsv_to_rgb(float h, float s, float v, float a)
{
	float c = v * s;
	h = mod((h * 6.0), 6.0);
	float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
	vec4 color;
	if (0.0 <= h && h < 1.0) color = vec4(c, x, 0.0, a);
	else if (1.0 <= h && h < 2.0) color = vec4(x, c, 0.0, a);
	else if (2.0 <= h && h < 3.0) color = vec4(0.0, c, x, a);
	else if (3.0 <= h && h < 4.0) color = vec4(0.0, x, c, a);
	else if (4.0 <= h && h < 5.0) color = vec4(x, 0.0, c, a);
	else if (5.0 <= h && h < 6.0) color = vec4(c, 0.0, x, a);
	else color = vec4(0.0, 0.0, 0.0, a);
	color.rgb += v - c;
	return color;
}

vec4 checker(vec2 x) {
	float d = mod(floor(x[0]) + floor(x[1]), 2.0);
	return hsv_to_rgb(min(abs(x[0]) * 0.1 + 0.85, 1.0) + 0.6, 1.0, 0.5 + 0.5 * d, 1.0);
}

void main(void){
	vec2 m = 5.0 * vec2(mouse.x * 2.0 - 1.0, mouse.y * 2.0 - 1.0);
	//vec2 m = vec2(0, 1);
	vec2 p = 5.0 * (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
	p = div(mul(p, m), p-vec2(1, 0));
	gl_FragColor = checker(p);
}
