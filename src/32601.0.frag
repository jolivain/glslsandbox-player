precision mediump float;
const int MARCH_STEPS = 50;

// Very simple anti-aliasing example using a super-sampling method.

// Extra additions:
// - mouse picking (see below)
// - inverted color in mouse pick

// Uncomment the line below to see the difference, and destroy the frame rate.
//#define AA

// Mouse picking radius (how far the effect will go around picked area)
#define PICK_RADIUS 0.5

// Mouse picking effect (the effect when an area is picked)
// Tip: use variable 'col' for pixel color
#define PICK_EFFECT vec3(1) - col

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float anim(float m) {
	float atime = 0.5*time;
	float g = mod(time, 4.0);
	if(g < 1.0) {
		return clamp(fract(atime), 0.0, m);
	} else if(g >= 1.0 && g < 3.0) {
		if(g <= 2.0) return m;
		return clamp(m - fract(atime), 0.0, m);
	} else if(g >= 3.0) {
		return 0.0;
	}
	return 0.0;
}

float dTorus(vec3 p, vec2 t) {
	vec2 h = vec2(length(p.xz) - t.x, p.y);
	return length(h) - t.y;
}

float length8(vec2 p) {
	p = pow(p, vec2(8.0));
	return pow(p.x + p.y, 1.0/8.0);
}

float dBoxTorus(vec3 p, vec2 t) {
	vec2 h = vec2(length8(p.xz) - t.x, p.y);
	return length8(h) - t.y;
}

float map(vec3 p) {
	vec3 q = p;
	vec3 k = p;
	p.y -= pow(dot(p.xz, p.xz), anim(0.35)) - .20;
	k.y -= 0.4;
	float d = mix(dBoxTorus(k, vec2(1.5, 0.35)), dTorus(k, vec2(1.5, 0.35)), 0.0);
	return min(min(length(p) - 1.0, d), q.y + 0.25);
}

float march(vec3 ro, vec3 rd) {
	float t = 0.0;
	
	for(int i = 0; i < MARCH_STEPS; i++) {
		float h = map(ro + rd*t);
		if(abs(h) < 0.001 || t >= 10.0) break;
		t += h;
	}
	
	return t;
}

vec3 normal(vec3 p) {
	vec2 h = vec2(0.001, 0.0);
	
	vec3 n = vec3(
		map(p + h.xyy) - map(p - h.xyy),
		map(p + h.yxy) - map(p - h.yxy),
		map(p + h.yyx) - map(p - h.yyx));
	
	return normalize(n);
}

float shadow(vec3 p, vec3 l) {
	float t = 0.01;
	float res = 1.0;
	
	for(int i = 0; i < 30; i++) {
		float h = map(p + l*t);
		if(abs(h) < 0.0 || t >= 8.0) break;
		t += h;
		res = min(res, 8.0*h/t);
	}
	
	return clamp(res, 0.0, 1.0);
}

mat3 camera(vec3 e, vec3 l) {
	vec3 f = normalize(l - e);
	vec3 r = normalize(cross(vec3(0, 1, 0), f));
	vec3 u = normalize(cross(f, r));
	
	return mat3(r, u, f);
}

vec3 render(vec3 ro, vec2 uv, mat3 c) {
	vec2 cursor = mouse * 2.0 - 1.0;
	cursor.x *= resolution.x / resolution.y;
	vec3 rd = c*normalize(vec3(uv, 1.97));
	vec3 md = c*normalize(vec3(cursor, 1.97));
	
	vec3 col = vec3(.5);
	
	float i = march(ro, rd);
	float m = march(ro, md);
	
	if(i < 10.0) {
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		vec3 lig = normalize(vec3(0.8, 0.7, 0.6));
		vec3 ref = reflect(rd, nor);
		
		float amb = clamp(0.5 + 0.5*nor.y, 0.0, 1.0);
		float dif = clamp(dot(lig, nor), 0.0, 1.0);
		float spe = pow(clamp(dot(ref, lig), 0.0, 1.0), 32.0);
		float fre = pow(clamp(1.0 + dot(rd, nor), 0.0, 1.0), 2.0);
		
		float sha = shadow(pos, normalize(lig));
		
		dif *= sha;
		
		col  = 0.3*amb*vec3(1);
		col += 0.7*dif*vec3(1);
		
		if(pos.y <= -0.2) {
			col *= vec3(1)*mod(floor(pos.x) + floor(pos.z), 2.0);
		} else if(length(pos.xz) <= 1.1) {
			vec3 mat = vec3(0.8, 0.2, 0.2);
			
			float f = smoothstep(0.3, 0.3001, mod(atan(pos.x, pos.z), 0.75));
			mat = mix(mat, vec3(0.7, 0.7, 0.8), 1.0 - f);
			
			col *= mat;
		} else {
			vec3 mat = vec3(0.3, 0.6, 1.0);
			
			float f = smoothstep(0.1, 0.101, mod(length(pos.xz), 0.3));
			mat = mix(mat, vec3(1.0, 1.0, 1.0), 1.0 - f);
			
			col *= mat;
			
		}
		
		col += 1.0*spe*vec3(1.00, 0.97, 0.85)*dif;
		col += 0.3*fre*vec3(1.00, 1.00, 1.00)*amb*amb*sha;
	}

	if(m < 10.0 && distance(ro + rd * i, ro + md * m) < PICK_RADIUS){
		return PICK_EFFECT;
	}
	
	return col;
}

vec3 aa(vec3 ro, vec3 la, vec2 uv) {
	vec2 e = vec2(0.001, 0.0);
	mat3 c = camera(ro, la);
	
	vec3 col = render(ro, uv, c);
	float d = 1.0;
	
	for(int i = 0; i < 3; i++) {
		// increate the size of the sampled grid.
		e.x += 0.0015*float(i);
		
		// sampling the outter grid of the pixel
		// x----x----x
		// |         |
		// |         |
		// x    x    x
		// |         |
		// |         |
		// x----x----x
		vec3 col1 = render(ro, uv + e.xx, c);
		vec3 col2 = render(ro, uv - e.xx, c);
		vec3 col3 = render(ro, uv + e.xy, c);
		vec3 col4 = render(ro, uv - e.xy, c);
		vec3 col5 = render(ro, uv + e.yx, c);
		vec3 col6 = render(ro, uv - e.yx, c);
		vec3 col7 = render(ro, uv - vec2(-e.x, e.x), c);
		
		col += (col1 + col2 + col3 + col4 + col5 + col6 + col7);
		d += 7.0;
	}
	
	return col/d;
}

void main( void ) {
	vec2 uv = (-1.0 + 2.0*(gl_FragCoord.xy/resolution))*vec2(resolution.x/resolution.y, 1.0);
	
	vec3 ro = 3.0*vec3(cos(0.1*time), .85, -sin(0.1*time));
	
	#ifdef AA
	vec3 col = aa(ro, vec3(0), uv);
	#else
	vec3 col = render(ro, uv, camera(ro, vec3(0)));
	#endif
	col = pow(col, vec3(.4545));
	
	gl_FragColor = vec4(col, 1);
}
