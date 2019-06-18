//-------------------------------------------------------
/*
    Basic Starfield 2 by Iridule
	https://www.shadertoy.com/view/4l3yDB
*/
//-------------------------------------------------------
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define iTime time
#define iResolution resolution

#define OCTAVES 8
#define bg vec3(0., 0., 1.)
#define fg vec3(1., .4, 0.)

float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.74));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
    float k = hash21(p);
    return vec2(k, hash21(p + k));
}


float noise(vec2 p) {
	vec2 i = ceil(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3. - 2. * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1., 0.));
    float c = hash21(i + vec2(0., 1.));
    float d = hash21(i + vec2(1., 1.));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(in vec2 p) {
	float s = .0;
	float m = .0;
	float a = .5;
	for(int i = 0; i < OCTAVES; i++) {
		s += a * noise(p);
		m += a;
		a *= .5;
		p *= 2.;
	}
	return s / m;
}

float circle(vec2 uv, vec2 p, float r) {
    return 1. - smoothstep(r, r + .05, length(uv - p));
}

float layer(vec2 uv, float T) {
    uv *= 4.;
    vec2 iv = floor(uv);
    vec2 gv = fract(uv) - .5;
    vec2 r = hash22(iv) * 25.;
    r = sin(r) * .3;
    float image = 0.;
    image = circle(gv, r, .3 * hash21(iv));
    vec2 k = (r - gv) * 25.;
    float sparkle = 1. / dot(k, k);
    float t = .7 * hash21(iv);
    image = image * sparkle * t;
    return image;
}

mat2 rotate(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

void mainImage(out vec4 O, in vec2 I) {
    float T = iTime;
    vec2  R = iResolution.xy;
    vec2 uv = (2. * I - R) / R.y;
    uv += vec2(1. + 2. * cos(T / 2.), 2. * sin(T / 10.)) * .5;
    uv *= rotate(T / 10.);
    float y = uv.y;
    vec3 grad = mix(.8 * sin(T / 5.) * vec3(.5, .2, 0.), vec3(0.), length(.5 + uv / 2.));
    vec3 color = vec3(0.);
    for (float i = 0.; i < 1.; i += 1. / 5.) {
        mat2 rt = rotate(i * 3.14);
        float z = fract(i + T / 10.);
        float size = mix(5., .1, z);
        vec3 mixed = mix(bg, fg, mix(0., 1., z));
        float fade = smoothstep(0., .5, z);
        fade *= smoothstep(1., .8, z);
        color += (fbm(uv) * .5 * mix(vec3(0., .5, .5), vec3(1., .5, 0.), fade));
        color += mixed * layer(rt * uv * size + i, T) * fade;
        color += grad;
    }
    O = vec4(color, 1.);
}

void main(void) {
	mainImage(gl_FragColor, gl_FragCoord.xy);
}
