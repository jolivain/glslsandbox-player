// Alien egg, or some shit.

// Check out my other stuff.
// https://www.shadertoy.com/user/zackpudil/sort=newest

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float form(vec2 p) {

	p = mod(p + 1.0, 2.0) - 1.0;
	for(int i = 0; i < 4; i++) {
		p = abs(p)/clamp(dot(p, p), 0.5, 1.0) - vec2(0.7, 0.5);
	}
	
	return smoothstep(abs(p.x), 0.0, 0.4);
}

float sur(vec3 p, vec3 n) {
	vec3 m = pow(abs(n), vec3(10.0));
	
	float x = form(p.yz);
	float y = form(p.xz);
	float z = form(p.xy);
	
	return (m.x*x + m.y*y + m.z*z)/(m.x + m.y + m.z);
}

vec3 bump(vec3 p, vec3 n) {
	vec2 h = vec2(0.01, 0.0);
	vec3 b = vec3(
		sur(p + h.xyy, n) - sur(p - h.xyy, n),
		sur(p + h.yxy, n) - sur(p - h.yxy, n),
		sur(p + h.yyx, n) - sur(p - h.yyx, n));

	b -= n*dot(b, n);
	return normalize(n + 4.0*b);
}

vec2 rot(vec2 p, float a) {
	float s = sin(a);
	float c = cos(a);
	
	return mat2(c, s, -s, c)*p;
}

float de(vec3 p) {
	vec4 q = vec4(p, 1);
	
	q.xyz -= 1.0;
	
	for(int i = 0; i < 3; i++) {
		q.xyz = abs(q.xyz + 1.0) - 1.0;
		q /= clamp(dot(q.xyz, q.xyz), 0.2, 1.0);
		
		q.xy = rot(q.xy, 0.9);
		q *= 1.4;
	}
	
	float frac = (length(q.xz) - 1.5)/q.w;
	frac = max(length(p*vec3(0.8, 0.8, 1.0) - vec3(0, 0.4, 0)) - 1.4, frac);
	
	return min(frac, p.y + 1.0);
}

float trace(vec3 ro, vec3 rd, float mx) {
	float t = 0.0;
	for(int i = 0; i < 100; i++) {
		float d = de(ro + rd*t);
		if (d < 0.001 || t >= mx) break;
		t += d*0.5;
	}
	return t;
}

vec3 normal(vec3 p) {
	vec2 h = vec2(0.001, 0.0);
	vec3 n = vec3(
		de(p + h.xyy) - de(p - h.xyy),
		de(p + h.yxy) - de(p - h.yxy),
		de(p + h.yyx) - de(p - h.yyx));
	
	return normalize(n);
}

float ao(vec3 pos, vec3 nor) {
	float o = 0.0, s = 0.005;
	for(int i = 0; i < 10; i++) {
		float d = de(pos + nor*s);
		o += (s - d);
		s += s/float(i + 1);
	}
	
	return clamp(1.0 - o, 0.0, 1.0);
}


vec3 render(vec3 ro, vec3 rd) {
	vec3 col = vec3(0.0);
	vec3 lig = normalize(vec3(0.8, 0.7, -0.6));
	
	float t = trace(ro, rd, 10.0);
	if (t < 10.0) {
		vec3 pos = ro + rd*t;
		vec3 nor = normal(pos);
		nor = bump(pos, nor);
		
		vec3 ref = reflect(rd, nor);
		
		float occ = ao(pos, nor);
		
		col = vec3(0.2*occ);;
		if (pos.y > -0.99) {
			col += 3.0*pow(clamp(dot(ref, -rd), 0.0, 1.0), 4.0);
			col += (1.0 - occ)*vec3(0.0, 4.0, 0.0)*abs(sin(time*3.0));
		} else {
			float sha = step(5.0, trace(pos+nor*0.001, lig, 5.0));
			col += 2.0*pow(clamp(dot(ref, lig), 0.0, 1.0), 16.0)*(0.5 + 0.5*sha);
			col += clamp(dot(lig, nor), 0.0, 1.0)*sha;
			col += clamp(dot(-pos, nor), 0.0, 1.0)*vec3(0.0, 0.5, 0.0)*abs(sin(time*3.0))/length(pos);
		}
	}
	
	col = mix(col, vec3(0), 1.0 - exp(-0.7*t));
	
	return col;
}

void main( void ) {
	vec2 p = (-resolution + 2.0*gl_FragCoord.xy)/resolution.y;

	float t = time*0.6;
	vec3 ro = vec3(4.0*sin(t), 0.5 + 0.5*sin(t*0.5), -4.0*cos(t));
	vec3 ww = normalize(-ro);
	vec3 uu = normalize(cross(vec3(0, 1, 0), ww));
	vec3 vv = normalize(cross(ww, uu));
	vec3 rd = normalize(p.x*uu + p.y*vv + 1.97*ww);
	
	vec3 col = render(ro, rd);
	
	col = 1.0 - exp(-0.7*col);
	col = pow(abs(col), vec3(1.0/2.2));
	
	//col = vec3(form(p));
	
	gl_FragColor = vec4(col, 1);
}
