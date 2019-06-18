// original shader https://www.shadertoy.com/view/lttfDH
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

// replace shadertoy uniforms with glslsandbox
#define R resolution
#define T time

// toggle for psychedelic madness
#define ENABLE_COLOR_CYCLE 1

// FabriceNeyret2 
#define hue(v)  (.5 + cos(6.3 * (v) + vec4(0, 23, 21, 0)))

int id = -1;

mat2 rotate(float a) {
	float c = cos(a),
		s = sin(a);
	return mat2(c, s, -s, c);
}

float random(in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.1);
}

float noise(vec2 p) {
	vec2 i = ceil(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3. - 2. * f);
   	float a = random(i);
    float b = random(i + vec2(1., 0.));
    float c = random(i + vec2(0., 1.));
    float d = random(i + vec2(1., 1.));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(in vec2 p) { 
	float s = .0;
	float m = .0;
	float a = .5;	
	for(int i = 0; i < 8; i++) {
		s += a * noise(p);
		m += a;
		a *= .5;
		p *= 2.;
	}
	return s / m;
}

vec3 renderFractal(vec2 uv) {

    vec3 color = vec3(0.);
    vec2 p = uv;
	
    // per channel iters
    float t = T;
    for (int c = 0; c < 3; c++) {
    
        t += .1; // time offset per channel
        
		float l = 0.;
        float s = 1.;
        for (int i = 0; i < 8; i++) {
            // from Kali's fractal iteration
            p = abs(p) / dot(p, p);
            p -= s;
            p *= rotate(t * .5);
            s *= .8;
            l += (s  * .08) / length(p);
        }
        color[c] += l;
    
    }

	return color;

}

float map(vec3 p) {
	
    float m = 1000.;
    
    vec3 q = p;
    float k = fbm(q.xz + fbm(q.xz + T *2.));
   	
    q.y += .1;
    float d = dot(q, vec3(0., 1., 0.)) + k;
	d = min(5. - d, d);
    if (d < m) { 
        m = d;
        id = 1;
    }
    
    q = p;
    q.xz = mod(q.xz + 2., 4.) - 2.;
    d = min(d, length(q.xz) - .5);
    if (d < m) { 
        m = d;
        id = 2;
    }
    
    return m;
}

vec3 render(vec3 ro, vec3 rd) {

    vec3 col = vec3(0.);
	vec3 p;
    
	float t = 0.;
	for (int i = 0; i < 256; i++) {
		p = ro + rd * t;
		float d = map(p);
		if (d < .001 || t > 50.) break;
		t += .5 * d;
#if ENABLE_COLOR_CYCLE 
        col += .02 * hue(d * .5 + T * .4).rgb;
#else
        col += .02 * hue(d).rgb;
#endif
	}
	
    vec3 tex =  renderFractal(fract(.1 * p.xz) - .5);
    if (id == 1) col += tex / (1. + t * t * .5);
    if (id == 2) col += abs(.1 / sin(10. * p.y + T)) * vec3(0., 1., 1.);
    
	return col;

}

void mainImage(out vec4 O, vec2 I) {

    vec2 uv = (2. * I - R)
        / R.y;
	vec3 col = vec3(0.);
	
	vec3 ro = vec3(2., 1., T * 2.);
	vec3 rd = vec3(uv, 1.);
	
    vec3 pc = render(ro, rd);
    
    O = vec4(pc, 1.);
}

void main() {
	mainImage(gl_FragColor, gl_FragCoord.xy);
}

