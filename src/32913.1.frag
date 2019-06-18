#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float hash(float n) {
	return fract(sin(n)*43758.5453);
}

float noise(vec3 g) {
	vec3 p = floor(g);
	vec3 f = fract(g);
	
	f = f*f*(3.0 - 2.0*f);
	float n = p.x + p.y*57.0 + p.z*113.0;
	
	float x = mix(hash(n + 0.0), hash(n + 1.0), f.x);
	float y = mix(hash(n + 57.0), hash(n + 58.0), f.x);
	float z = mix(hash(n + 113.0), hash(n + 114.0), f.x);
	float w = mix(hash(n + 170.0), hash(n + 171.0), f.x);
	
	return mix(mix(x, y, f.y), mix(z, w, f.y), f.z);
}

mat3 m3 = mat3( 0.00,  0.80,  0.60,
	       -0.80,  0.36, -0.48,
	       -0.60, -0.48,  0.64);

float fbm(vec3 p) {
	float f = 0.0;
	
	f += 0.5000*noise(p); p *= 2.01*m3;
	f += 0.2500*noise(p); p *= 2.03*m3;
	f += 0.1250*noise(p); p *= 2.07*m3;
	f += 0.0625*noise(p);
	f /= 0.9375;
	
	return f;
}

float map(vec3 p) {
	float g = smoothstep(-1.0, 1.0, p.y)*smoothstep(-1.0, 1.0, -p.y);
	return min(length(p) - 1.0 - 0.8*sin(20.0*p.y*noise(p) + 10.0*time)*g - 0.4*noise(5.0*p)*g - smoothstep(-1.0, 1.0, -p.y), p.y + 1.0);
}

float march(vec3 ro, vec3 rd) {
	float t = 0.0;
	for(int i = 0; i < 200; i++) {
		float d = map(ro + rd*t);
		if(abs(d) < 0.001 || t >= 10.0) break;
		t += d*0.25;
	}
	return t;
}

vec3 normal(vec3 p) {
	vec2 h = vec2(0.01, 0.0);
	vec3 n = vec3(
		map(p + h.xyy) - map(p - h.xyy),
		map(p + h.yxy) - map(p - h.yxy),
		map(p + h.yyx) - map(p - h.yyx)
	);
	return normalize(n);
}

float shadow(vec3 p, vec3 l) {
	float t = 0.002;
	float res = 1.0;
	
	for(int i = 0; i < 200; i++) {
		float d = map(p + l*t);
		t += d*0.5;
		res = min(res, 8.0*d/t);
		if(abs(d) < 0.00 || t >= 7.0) break;
	}
	
	return clamp(res, 0.0, 1.0);
}

float ao(vec3 p, vec3 n) {
	float s = 0.006, t = 0.0;
	float o = 0.0, w = 1.0;
	
	for(int i = 0; i < 14; i++) {
		float d = map(p + n*t);
		o += (t - d)*w;
		w *= 0.90;
		t += s;
	}
	
	return 1.0 - clamp(o, 0.0, 1.0);
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
	vec2 mo = -1.0 + 2.0*mouse;
	
	vec3 col = vec3(0.2, 0.6, 1.0);
	
	vec3 ro = 3.5*vec3(cos(mo.x), 1.0/3.0, -sin(mo.x));
	vec3 rd = normalize(camera(ro, vec3(0))*vec3(uv, 1.97));
	
	float i = march(ro, rd);
	
	if(i < 10.0) {
		vec3 pos = ro + rd*i;
		vec3 nor = normal(pos);
		vec3 ref = reflect(rd, nor);
		vec3 lig = normalize(vec3(0.8, 0.7, -0.6));
		
		float dif = clamp(dot(lig, nor), 0.0, 1.0)*shadow(pos, lig);
		
		col  = 0.2*vec3(1);
		col += 0.7*dif;
		
		if(pos.y < -0.98) {
			col *= vec3(1)*mod(floor(pos.x) + floor(pos.z), 2.0);
		} else {
			col *= mix(vec3(0.2, 1.0, 0.5), vec3(0.2, 0.2, 0.7), 1.0 - fbm(5.0*pos));
		}
		
		col += 0.2*pow(clamp(dot(ref, lig), 0.0, 1.0), 16.0);
		col += 0.3*pow(clamp(1.0 + dot(rd, nor), 0.0, 1.0), 2.0)*(1.0 - (0.5 + 0.5*nor.y));
		
		col *= vec3(ao(pos, nor));
		//col = vec3(shadow(pos, lig));
	}
	
	gl_FragColor = vec4(col, 1);
}
