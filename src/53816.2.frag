#ifdef GL_ES
precision mediump float;
#endif

// Meh.
// author: https://www.shadertoy.com/user/zackpudil/sort=newest
// inspired by evvvvil_

uniform float time;
uniform vec2 resolution;

vec3 hash(vec3 p){ 
    float n = sin(dot(p, vec3(7, 157, 113)));    
    return fract(vec3(2097152, 262144, 32768)*n); 
}	

mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	
	return mat2(c, s, -s, c);
}

float box(vec3 p, vec3 b) {
	vec3 q = abs(p) - b;
	return max(max(q.x, q.y), q.z);
}

vec2 shape(vec3 p, float a) {
	vec2 s = vec2(length(abs(p) - vec3(2, 0, 0)) - 0.4, 1.0);
	vec2 f = vec2(box(p, vec3(2, 0.4+a, 0.4)), 2.0);

	return s.x < f.x ? s : f;
}

float glow = 0.0;
vec2 de(vec3 p) {
	p.y = abs(p.y - 3.0) - 11.0;
	
	vec4 q = vec4(p*0.1, 1);
	vec4 sq = q;
	
	for(int i = 0; i < 7; i++) {
		q.xyz = abs(q.xyz) - vec3(1.6, 0.0, 0.8);
		q.xz *= rot(0.785*2.0 + float(i)*0.785);
		q *= 1.4;
		
		if(i == 2) {
			q.xyz = abs(q.xyz) - vec3(1.5, 2.5, 2.5);
			q.xy *= rot(0.785*3.0);
		}
		
		sq = q;
		sq.xz += 1.2;
	}
	
	q.y = abs(q.y) - 4.0;
	sq.y = abs(sq.y) - 4.0;
	
	vec2 t = shape(q.xyz, 0.0)/vec2(q.w*0.1, 1);
	glow += 0.1/(0.1 + pow(abs(length(abs(q.xyz) - vec3(2, 0, 0)) - 0.4), 2.0));
	vec2 h = shape(sq.xyz, 4.0)/vec2(sq.w*0.1, 1);
	
	sq.x -= 2.0;
	
	h.x = max(h.x, -box(abs(sq.xyz) - vec3(0, 2, 0), vec3(1.1)));
	
	return  t.x < h.x ? t : h;
}

void main( void ) {
	vec2 uv = (gl_FragCoord.xy - 0.5*resolution)/resolution.y;
	
	vec3 col = vec3(0);
	
	float at = 0.3*time;
	
	vec3 ro = vec3(30.0*sin(at), 8.6, -3.0*cos(at));
	vec3 ww = normalize(vec3(30.0*cos(at), 20.0*sin(2.0*at), 30.0*sin(at))-ro);
	vec3 uu = normalize(cross(vec3(0, 1, 0), ww));
	vec3 vv = normalize(cross(ww, uu));
	vec3 rd = normalize(mat3(uu, vv, ww)*vec3(uv, 1.0));
	
	float t = 0.0, m = -1.0, mx = 60.0;
	for(int i = 0; i < 200; i++) {
		vec2 d = de(ro + rd*t);
		if(d.x < 0.001 || t >= mx) break;
		t += d.x*0.5;
		m = d.y;
	}
	
	vec3 ld = normalize(vec3(1, 1, -1));
	vec2 h = vec2(0.001, 0.0);
	
	if(t < mx) {
		vec3 p = ro + rd*t;
		vec3 n = normalize(vec3(
			de(p + h.xyy).x - de(p - h.xyy).x,
			de(p + h.yxy).x - de(p - h.yxy).x,
			de(p + h.yyx).x - de(p - h.yyx).x));
		
		float aot = t/50.0;
		float spo = 10.0;
		
		float ao = exp(-pow(max(0.0, 1.0 - de(p + n*aot).x/aot), 2.0));		
		float sp = pow(max(0.0, dot(reflect(-ld, n), -rd)), spo);
		float spg = sp*sp;
	
		float fr = pow(dot(rd, n) + 1.0, 6.0);
		
		col = vec3(0.7, 0.9, 1.0)*spg + vec3(0.1, 0.2, 0.3)*fr;
		col *= ao;
	}
	
	col += 0.06*vec3(1.0 + 0.05*glow, 0.01*glow, 0)*glow*glow;
	col = mix(col, vec3(0), 1.0 - exp(-0.1*t));
	
	col = 1.0 - exp(-0.1*col);
	gl_FragColor = vec4(pow(abs(col), vec3(0.45)), 1);
}
