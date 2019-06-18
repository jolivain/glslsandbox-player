#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void fold(inout vec2 p) {
	if(p.x + p.y < 0.0) p.xy = -p.yx;
}

void rotate(inout vec2 p, float a) {
	float s = sin(a);
	float c = cos(a);
	
	p = mat2(c, s, -s, c)*p;
}

float len(vec3 p, float l) {
	p = pow(abs(p), vec3(l));
	return pow(p.x + p.y + p.z, 1.0/l);
}

vec4 orb;

float map(vec3 p) {
	float d = 20.0;
	orb = vec4(1000.0);
	for(int i = 0; i < 10; i++) {
		rotate(p.xz, time*0.3);
		rotate(p.xy, time*0.3);
		rotate(p.zy, time*0.3);
		
		fold(p.xy);
		fold(p.xz);
		fold(p.yz);
		
		p = 2.0*p - 2.0;
		
		d = min(d, (len(p, 10.0))*pow(2.0, -float(i)));
		orb.x = min(orb.x, length(p.xy));
		orb.y = min(orb.y, length(p.zy));
		orb.z = min(orb.z, length(p.xz));
		orb.w = d;
	}
	
	return d - 0.1;
}

float march(vec3 ro, vec3 rd) {
	float t = 0.0;
	for(int i = 0; i < 100; i++) {
		float d = map(ro + rd*t);
		if(d < 0.00001*t || t >= 10.0) break;
		t += d*(0.15 + 0.05*t);
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

void main( void ) {
	vec2 uv = -1.0 + 2.0*(gl_FragCoord.xy/resolution);
	uv.x *= resolution.x/resolution.y;
	
	vec3 col = vec3(0);
	
	vec3 ro = vec3(0, 0, -4);
	vec3 rd = normalize(vec3(uv, 1.97));
	
	float i = march(ro, rd);
	if(i < 10.0) {
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		
		vec3 key = normalize(vec3(0.8, 0.7, -0.6));
		
		col  = 0.2*vec3(1);
		col += 0.7*clamp(dot(key, nor), 0.0, 1.0);
		
		vec3 mat = mix(vec3(1), vec3(1, 0.2, 0.2), orb.x);
		mat = mix(mat, vec3(0.2, 1, 0.2), orb.y);
		mat = mix(mat, vec3(0.2, 0.4, 1), 1.0 - orb.z);
		
		col *= mat*clamp(1.0 - orb.w, 0.0, 1.0);
		
	}
	
	gl_FragColor = vec4(col, 1);
}
