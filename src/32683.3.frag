#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define PI 3.14159

float hash(float n) {
	return fract(sin(n)*43758.5435);
}

float noise(vec3 x) {
	vec3 p = floor(x);
	vec3 f = fract(x);
	
	f = f*f*(3.0 - 2.0*f);
	float n = p.x + p.y*57.0 + p.z*113.0;
	
	return mix(
		mix(
			mix(hash(n + 000.0), hash(n + 001.0), f.x),
			mix(hash(n + 057.0), hash(n + 058.0), f.x),
			f.y),
		mix(
			mix(hash(n + 113.0), hash(n + 114.0), f.x),
			mix(hash(n + 170.0), hash(n + 171.0), f.x),
			f.y),
		f.z);
}

float map(vec3 p) {
	p.z += time*0.5;
	float n = abs(dot(cos(p*PI), sin(p.yzx*PI)));
	return .45 - n*.33 + 0.02*smoothstep(0.7, 1.0, noise(10.0*p)) + 0.01*noise(40.0*p);
}

float march(vec3 ro, vec3 rd) {
	float t = 0.0;
	
	for(int i = 0; i < 100; i++) {
		float h = map(ro + rd*t);
		if(abs(h) < 0.001 || t >= 10.0) break;
		t += h*0.5;
	}
	
	return t;
}

vec3 normal(vec3 p) {
	vec2 h = vec2(0.001, 0.0);
	vec3 n = vec3(
		map(p + h.xyy) - map(p - h.xyy),
		map(p + h.yxy) - map(p - h.yxy),
		map(p + h.yyx) - map(p - h.yyx)
	);
	return normalize(n);
}

float shadow(vec3 p, vec3 l) {
	float res = 1.0;
	float t = 0.002;
	
	for(int i = 0; i < 100; i++) {
		float h = map(p + l*t);
		if(abs(h) < 0.0 || t >= 7.0) break;
		t += h;
		res = min(res, 16.0*h/t);
	}
	
	return clamp(res, 0.0, 1.0);
}

mat3 camera(vec3 eye, vec3 lat) {
	vec3 ww = normalize(lat - eye);
	vec3 uu = normalize(cross(vec3(0, 1, 0), ww));
	vec3 vv = normalize(cross(ww, uu));
	
	return mat3(uu, vv, ww);
}

void main( void ) {
	vec2 uv = -1.0 + 2.0*(gl_FragCoord.xy/resolution);
	uv.x *= resolution.x/resolution.y;
	vec2 mo = -1.5 + 3.0*mouse;
	
	vec3 col = vec3(0);
	
	vec3 ro = vec3(0, 0, -3);
	vec3 rd = camera(ro, vec3(4.0*mo.x, 2.0*mo.y, 0.0))*normalize(vec3(uv, 1.97));
	
	float i = march(ro, rd);
	
	if(i < 10.0) {
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		vec3 ref = reflect(rd, nor);
		
		vec3 lig = normalize(vec3(0.8, 0.7, -0.6));
		vec3 bli = -lig;
		
		float amb = 0.5 + 0.5*nor.y;
		float dif = clamp(dot(lig, nor), 0.0, 1.0);
		float bac = clamp(dot(bli, nor), 0.0, 1.0);
		float spe = pow(clamp(dot(ref, lig), 0.0, 1.0), 8.0);
		float fre = pow(clamp(1.0 + dot(rd, nor), 0.0, 1.0), 2.0);
		
		float sha = shadow(pos, lig);
		
		col  = 0.2*amb*vec3(1);
		col += 1.2*dif*vec3(1)*sha;
		col += 0.15*bac*vec3(1);
		
		vec3 mat = vec3(0.4, 0.7, 0.3);
		pos.z += time*0.5;
		float f = smoothstep(0.7, 1.0, noise(10.0*pos));
		mat = mix(mat, vec3(1.0, 0.2, 0.2), smoothstep(0.0, 1.0, 100.0*f));
		col *= mat;
		
		col += 0.2*spe*vec3(1)*dif*sha;
		col += 0.2*fre*vec3(1);
	}
	
	col = mix(col, vec3(0.9, 1.0, 0.9), 1.0 - exp(-i*0.5));
	
	gl_FragColor = vec4(col, 1);
}
