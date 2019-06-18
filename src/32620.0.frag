// Extra changes by @xprogram

precision mediump float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Please refer to: http://glslsandbox.com/e#32601.0
// It explains how to use this...
#define PICK_RADIUS 0.25
#define PICK_EFFECT vec3(1, 0, 0)

float hash(vec2 n) {
	float p = dot(n, vec2(171, 311));
	return fract(sin(p)*43758.4545);
}

float len(vec3 p, float l) {
	p = pow(abs(p), vec3(l));
	return pow(p.x + p.y + p.z, 1.0/l);
}

float dBuilding1(vec3 p) {
	p.y -= 4.0;
	p.y = smoothstep(-0.5, 1.0, p.y);
	p.xz = -abs(p.xz) - p.y + .5;
	return len(p, 1.0) - 1.0;
}

float dBuilding2(vec3 p) {
	p.y += 1.5;
	p.y = exp(0.2*p.y*p.y - 5.0);
	return len(p, 1.0) - 1.5 + 0.07*cos(13.0*p.x);
}

float dBuilding3(vec3 p) {
	p.y -= 3.5;
	float s = p.y;
	p.y = exp(p.y - 1.0);
	p.xz = -abs(p.xz) + 0.4*cos(1.5*s) + 0.3;
	return len(p, 10.0) - 0.5;
}

float dBuilding4(vec3 p) {
	p.y -= 2.0;
	p.y = smoothstep(-0.5, 2.0, p.y);
	return len(p, 1.0) - 1.0 + 0.5*cos(4.0*length(p.xz)) + sin(p.y);
}

float scene(vec3 p) {
	float c = hash(cos(2.0*floor((p.xz + 2.0)/4.0)));
	p.xz = mod(p.xz + 2.0, 4.0) - 2.0;
	
	if(c >= 0.0 && c < 0.25) {
		return dBuilding1(p);
	} else if(c >= 0.25 && c < 0.5) {
		return dBuilding2(p);
	} else if(c >= 0.5 && c < 0.75) {
		return dBuilding3(p);
	}
	
	return dBuilding4(p);
}

float map(vec3 p) {
	
	float s = scene(p);
	float g = p.y + 1.0;
	
	return min(s, g);
}

float march(vec3 ro, vec3 rd) {
	float t = 0.0;
	
	for(int i = 0; i < 100; i++) {
		float h = map(ro + rd*t);
		if(abs(h) < 0.0001 || t >= 40.0) break;
		t += h*0.25;
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

float ao(vec3 p, vec3 n) {
	float s = 0.01;
	float t = s;
	
	float o = 0.0;
	float w = 1.0;
	for(int i = 0; i < 5; i++) {
		float h = map(p + n*t);
		
		o += (t - h)*w;
		w *= 0.95;
		
		t += s;
	}
	
	return 1.0 - clamp(o, 0.0, 1.0);
}

mat3 camera(vec3 eye, vec3 lat) {
	vec3 ww = normalize(lat - eye);
	vec3 vv = normalize(cross(vec3(0, 1, 0), ww));
	vec3 uu = normalize(cross(ww, vv));
	
	return mat3(vv, uu, ww);
}

void main( void ) {
	vec2 uv = -1.0 + 2.0*(gl_FragCoord.xy/resolution);
	uv.x *= resolution.x/resolution.y;

	vec2 cursor = mouse*2.0-1.0;
	cursor.x *= resolution.x/resolution.y;
	
	vec3 col = vec3(0);
	
	vec3 ro = 10.0*vec3(cos(time), 4.0/5.0, -sin(time));
	vec3 rd = camera(ro, vec3(0))*normalize(vec3(uv, 1.97));
	vec3 md = camera(ro, vec3(0))*normalize(vec3(cursor, 1.97));
	
	float i = march(ro, rd);
	float n = march(ro, md);
	if(i < 40.0) {
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		vec3 ref = reflect(rd, nor);
		
		vec3 lig = normalize(vec3(0.7, -0.8, 0.6));
		vec3 bli = vec3(lig.x, -lig.y, lig.z);
		
		float amb = 0.5 + 0.5*nor.y;
		float dif = clamp(dot(lig, nor), 0.0, 1.0);
		float bac = clamp(0.2 + 0.8*dot(bli, nor), 0.0, 1.0);
		float spe = pow(clamp(dot(ref, lig), 0.0, 1.0), 64.0);
		float fre = pow(clamp(1.0 + dot(rd, nor), 0.0, 1.0), 2.0);
		
		float occ = ao(pos, nor);
		
		col  = 0.2*amb*vec3(1);
		col += 0.7*dif*vec3(1);
		col += 0.1*bac*vec3(1);
		
		col += 0.4*spe*vec3(1)*dif;
		col += 0.2*fre*vec3(1);
		
		col *= occ;
	}

	if(n < 40.0 && distance(ro + rd * i, ro + md * n) < PICK_RADIUS){
		col = PICK_EFFECT;
	}
	
	col = pow(col, vec3(.454545));
	
	gl_FragColor = vec4(col, 1);
}
