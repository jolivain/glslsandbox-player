// by @aa_debdeb (https://twitter.com/aa_debdeb)

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float sphere(vec3 p, float r) {
	return length(p) - r;
}

float box(vec3 p, vec3 s) {
	vec3 q = abs(p) - s;
	return length(max(q, 0.0)) - min(max(q.x, max(q.y, q.z)), 0.0);
}

vec3 repeatXZ(vec3 p, vec2 s) {
	p.xz = mod(p.xz, s) - 0.5 * s;
	return p;
}

vec3 divXZ(vec3 p, vec2 s) {
	p.xz = p.xz / s;
	return p;
}

vec4 map(vec3 p) {
	vec3 q = repeatXZ(p, vec2(1.0));
	vec3 idx = floor(divXZ(p, vec2(1.0)));
	float d = length(idx.xz);
	if (sin(d * 0.5 - time * 3.0)  < 0.0) {
		return vec4(vec3(0.8, 0.2, 0.2), sphere(q, 0.25));	
	} else {
		return vec4(vec3(0.2, 0.2, 0.8), box(q, vec3(0.25)));
	}
}

vec3 normal(vec3 p) {
	float d = 0.01;
	return normalize(vec3(
		map(p + vec3(d, 0.0, 0.0)).w - map(p - vec3(d, 0.0, 0.0)).w,
		map(p + vec3(0.0, d, 0.0)).w - map(p - vec3(0.0, d, 0.0)).w,
		map(p + vec3(0.0, 0.0, d)).w - map(p - vec3(0.0, 0.0, d)).w
	));
}

vec3 LightDir = normalize(vec3(1.0, 2.0, 1.0));
vec3 LightColor = vec3(1.2, 1.2, 1.0);
vec3 ambientColor = vec3(0.1);

float fog(float d, float start, float end) {
	return min(max(0.0, (end - d) / (end - start)), 1.0);
}

vec3 raymarch(vec3 ro, vec3 rd) {
	vec3 p = ro;
	float d = 0.0;
	for (int i = 0; i < 64; i++) {
		vec4 res = map(p);
		float t = res.w * 0.5;
		p += t * rd;
		d += t;
		if (t < 0.01) {
			vec3 n = normal(p);
			vec3 c = res.rgb * LightColor * max(0.0, dot(n, LightDir)) + ambientColor;
			float f = fog(d, 20.0, 40.0);
			return f * c + (1.0 - f) * vec3(1.0);
		}
	}
	return vec3(1.0);
}


void main( void ) {
	vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
	
	vec2 m = (2.0 * mouse - 1.0) * 5.0;
	
	vec3 ro = vec3(m.x, 10.0 - m.y, 5.0);
	vec3 ta = vec3(0.0);
	vec3 z = normalize(ta - ro);
	vec3 x = normalize(cross(z, vec3(0.0, 1.0, 0.0)));
	vec3 y = normalize(cross(x, z));
	
	vec3 rd = normalize(x * st.x + y * st.y + z * 1.5);
	
	vec3 c = raymarch(ro, rd);
	
	gl_FragColor = vec4(c, 1.0);
}
