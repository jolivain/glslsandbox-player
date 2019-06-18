#ifdef GL_ES
precision mediump float;
#endif

// zackpudil, fudging a de coming from evvvvil.

uniform float time;
uniform vec2 resolution;

mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	
	return mat2(c, s, -s, c);
}

float box(vec3 p, vec3 r) {
	vec3 q = abs(p) - r;
	return max(max(q.x, q.y), q.z);
}

float shape(vec3 p, float a) {
	float s = length(abs(p) - vec3(2, 0, 0)) - 0.5;
	float b = box(p, vec3(2, 0.5 + a, 0.5));
	
	return min(s, b);
}

float de(vec3 p) {	
	
	vec4 q = vec4(p*0.1, 1.0);
	vec4 sq = q;
	
	for(int i = 0; i < 7; i++) {
		q.xyz = abs(q.xyz) - vec3(1.7, 0.0, 0.8);
		q.xz *= rot(0.785*2.0 + float(i)*0.785);
		
		q *= 1.4;
		
		sq = q;
		sq.xz += 1.2;
		
	}
	
	q.xyz = abs(q.xyz) - vec3(0, 4, 0);
	float v = shape(q.xyz, 0.0)/(q.w*0.1);
	
	sq.xyz = abs(sq.xyz) - vec3(0, 4, 0);
	float h = shape(sq.xyz, 2.0)/(sq.w*0.1);
	
	
	return min(min(v,h), p.y + 0.5);
}

float trace(vec3 ro, vec3 rd, float mx) {
	float t = 0.0;
	
	for(int i = 0; i < 100; i++) {
		float d = de(ro + rd*t);
		if(d < 0.001 || t >= mx) break;
		t += d;
	}
	
	return t;
}

vec3 lig = normalize(vec3(0.8, 0.7, -0.6));
vec2 grd = vec2(0.001, 0.0);

void main( void ) {
	vec2 uv = (-resolution + 2.0*gl_FragCoord.xy)/resolution.y;
	
	float a = 20.3;
	float y = 10.0;
	float at = time*0.3;
	
	vec3 ro = vec3(a*sin(at), y, -a*cos(at));
	vec3 ww = normalize(-ro);
	vec3 uu = normalize(cross(ww, vec3(0, 1, 0)));
	vec3 vv = normalize(cross(uu, ww));
	vec3 rd = mat3(uu, vv, ww)*normalize(vec3(uv, 1.97));
	
	vec3 col = vec3(0.3, 0.6, 0.9);
	
	float t = trace(ro, rd, 50.0);
	if(t < 50.0) {
		
		vec3 p = ro + rd*t;
		vec3 n = normalize(vec3(
			de(p + grd.xyy) - de(p - grd.xyy),
			de(p + grd.yxy) - de(p - grd.yxy),
			de(p + grd.yyx) - de(p - grd.yyx)));
		
		float sha = step(10.0, trace(p+n*0.001, lig, 10.0));
		
		float occ = 0.0, s = 0.005, w = 1.0;
		for(int i = 0; i < 15; i++) {
			float d = de(p + n*s);
			occ += (s - d)*w;
			w *= 0.98;
			s += s/float(i + 1);
		}
		occ = clamp(1.0 - occ, 0.0, 1.0);
		
		col += 0.25*occ;
		col += vec3(1.97, 1.2, 0.8)*clamp(dot(lig, n), 0.0, 1.0)*sha*occ;
		col += 0.25*clamp(dot(-lig, n), 0.0, 1.0)*occ;
		col += vec3(2.11, 1.34, 0.34)*pow(clamp(dot(reflect(lig, n), rd), 0.0, 1.0), 32.0)*(0.3 + 0.7*sha)*occ;
	}
	
	col = mix(col, vec3(0), 1.0 - exp(-0.05*t));
	
	col = 1.0 - exp(-0.9*col);
	col = pow(abs(col), vec3(1.0/2.2));
	
	gl_FragColor = vec4(col, 1);
}
