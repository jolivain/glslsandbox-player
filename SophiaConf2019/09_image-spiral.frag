#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D  texture0;

const float kPi = 3.14159;
const float k2Pi = kPi * 2.0;
const float kRadius = 0.3;
const float kA = kRadius / kPi;
const float kTexYScale = 0.6;
const float kSpeed = 0.8;

float arclength(float a, float theta) {
	float d = theta * sqrt(abs(1.0 - theta * theta));
	return 0.5 * a * (d + log(d));
}

vec2 spiral(vec2 uv) {
	float ang = atan(uv.y, uv.x);
	float turn = (length(uv) / kRadius - ang / k2Pi);
	ang += ceil(turn) * k2Pi;
	float d = arclength(kA, ang) - time * kSpeed;
	return vec2(d * kTexYScale, fract(turn));
}

vec4 calc(vec2 p) {
    vec2 uv = (2.0 * p - resolution.xy) / resolution.yy;
    vec2 s = spiral(uv);
    vec2 texuv = fract(s);
    vec4 col = texture2D(texture0, texuv);
    return col;
}

void main(void) {
    gl_FragColor = calc(gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
