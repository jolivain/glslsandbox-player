precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
const float pi = 3.141592653589793;

float sdPlane(in vec3 p) {
	return p.y + 0.4;
}

float sdSphere(in vec3 p, in float r) {
	return length(p) - r;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r ) {
	vec3 pa = p - a, ba = b - a;
	float h = clamp( dot(pa, ba) / dot(ba , ba), 0.0, 1.0 );
    	return length( pa - ba * h ) - r;
}

float motor(float _min, float _max, float time) {
	float t = 0.5 + 0.5 * sin(time);
	return mix(_min, _max, t);
}

vec3 rotate_from_origin(vec3 origin, vec3 target, float r, float angle) {
	return vec3(
		origin.x + r * cos(angle),
		origin.y + r * sin(angle),
		target.z
	);
}

vec3 preserve(vec3 p0, vec3 p1, float len) {
	vec3 v = p1 - p0;
	vec3 u = normalize(v);
	return p0 + len * u;
}

float smin( float a, float b, float k ) {
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}
float map(in vec3 p) {
	float t = time * 5.0;
	float cx = 0.2;
	float cz = 0.1;
	vec3 p0 = vec3(-cx, 0.0, 0.0);
	vec3 p1 = vec3(-cx, -0.2, -cz);
	vec3 p2 = vec3(-cx, -0.4, -cz);
	vec3 p3 = vec3(-cx, 0.2, cz);
	vec3 p4 = vec3(-cx, -0.4, cz);
	
	vec3 p5 = vec3(cx, 0.0, 0.0);
	vec3 p6 = vec3(cx, -0.2, -cz);
	vec3 p7 = vec3(cx, -0.4, -cz);
	vec3 p8 = vec3(cx, 0.2, cz);
	vec3 p9 = vec3(cx, -0.4, cz);
	
	vec3 p10 = vec3(0.0, 0.0, 0.0);
	vec3 p11 = vec3(cx, -0.2, 0.0);
	
	vec3 p12 = vec3(cx * 2.2, 0.2, 0.0);
	vec3 p13 = vec3(cx * 2.4, 0.1, 0.0);
	
	float angle0 = 0.0;
	float angle1 = 0.0;
	p0.y = -motor(-0.05, 0.05, t * 4.0);
	angle0 = -motor(pi * 0.15, pi * 0.65, t * 2.0 - pi * 0.5);
	angle1 = -motor(pi * 0.15, pi * 0.65, t * 2.0 + pi * 0.5);
	p1 = rotate_from_origin(p0, p1, 0.2, angle0); 
	p3 = rotate_from_origin(p0, p3, 0.2, angle1); 
	angle0 += -motor(0.0, pi * 0.5, t * 2.0 + pi);
	angle1 += -motor(0.0, pi * 0.5, t * 2.0 + pi + pi);
	p2 = rotate_from_origin(p1, p2, 0.2, angle0);
	p4 = rotate_from_origin(p3, p4, 0.2, angle1);
	
	p5.y = -motor(-0.05, 0.05, t * 4.0);
	angle0 = -motor(pi * 0.15, pi * 0.65, t * 2.0 - pi * 0.5);
	angle1 = -motor(pi * 0.15, pi * 0.65, t * 2.0 + pi * 0.5);
	p6 = rotate_from_origin(p5, p6, 0.2, angle0); 
	p8 = rotate_from_origin(p5, p8, 0.2, angle1); 
	angle0 += -motor(0.0, pi * 0.5, t * 2.0 + pi);
	angle1 += -motor(0.0, pi * 0.5, t * 2.0 + pi + pi);
	p7 = rotate_from_origin(p6, p7, 0.2, angle0);
	p9 = rotate_from_origin(p8, p9, 0.2, angle1);
	
	p10.y = -motor(-0.02, 0.02, t * 4.0 - pi * 0.5);
	p11 = preserve(p5, p11, -0.25);
	
	p12.y -= motor(-0.02, 0.02, t * 4.0 - pi * 2.0);
	p13.y -= motor(-0.02, 0.02, t * 4.0 - pi * 0.1);
	
	float w = 0.05;
	
	float d = sdPlane(p);
	
	d = min(d, sdCapsule(p, p0, p1, w));
	d = min(d, sdCapsule(p, p1, p2, w));
	d = min(d, sdCapsule(p, p0, p3, w));
	d = min(d, sdCapsule(p, p3, p4, w));
	
	d = min(d, sdCapsule(p, p5, p6, w));
	d = min(d, sdCapsule(p, p6, p7, w));
	d = min(d, sdCapsule(p, p5, p8, w));
	d = min(d, sdCapsule(p, p8, p9, w));
	
	d = min(d, sdCapsule(p, p0, p10, w));
	d = min(d, sdCapsule(p, p10, p5, w));
	
	d = min(d, sdCapsule(p, p12, p11, w));
	d = min(d, sdCapsule(p, p13, p12, w));
	
	d = smin(d, sdCapsule(p, p5, p11, w), 0.1);

    	return d;
}

vec3 calcNormal(in vec3 p) {
	vec3 e = vec3(0.001, 0.0, 0.0);
	vec3 nor = vec3(
		map(p + e.xyy) - map(p - e.xyy),
		map(p + e.yxy) - map(p - e.yxy),
		map(p + e.yyx) - map(p - e.yyx)
	);
	return normalize(nor);
}

float castRay(in vec3 ro, in vec3 rd, in float maxt) {
	float precis = 0.001;
	float h = precis * 2.0;
	float t = 0.0;
	for(int i = 0; i < 60; i++) {
	if(abs(h) < precis || t > maxt) continue;
		h = map(ro + rd * t);
		t += h;
	}
	return t;
}

float softshadow(in vec3 ro, in vec3 rd, in float mint, in float maxt, in float k) {
	float sh = 1.0;
	float t = mint;
	float h = 0.0;
	for(int i = 0; i < 30; i++) {
	if(t > maxt) continue;
		h = map(ro + rd * t);
		sh = min(sh, k * h / t);
		t += h;
	}
	return sh;
}

vec3 render(in vec3 ro, in vec3 rd) {
	vec3 col = vec3(1.0);
	float t = castRay(ro, rd, 20.0);
	vec3 pos = ro + rd * t;
	vec3 nor = calcNormal(pos);
	vec3 lig = normalize(vec3(-0.4, 0.7, 0.5));
	float dif = clamp(dot(lig, nor), 0.0, 1.0);
	float spec = pow(clamp(dot(reflect(rd, nor), lig), 0.0, 1.0), 16.0);
	float sh = softshadow(pos, lig, 0.02, 20.0, 7.0);
	col = col * (dif + spec) * (0.5 + sh * 0.5);
	return col;
}

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 ms = 2.0 * mouse - 1.0;
	vec2 p = uv * 2.0 - 1.0;
	p.x *= resolution.x / resolution.y;
	vec3 ro = vec3(ms.x * 2.0, 2.0 - ms.y, 1.5);
	vec3 ta = vec3(0.0, 0.0, 0.0);
	vec3 cw = normalize(ta - ro);
	vec3 cp = vec3(0.0, 1.0, 0.0);
	vec3 cu = normalize(cross(cw, cp));
	vec3 cv = normalize(cross(cu, cw));
	vec3 rd = normalize(p.x * cu + p.y * cv + 2.5 * cw);
	vec3 col = render(ro, rd);
	
	gl_FragColor = vec4(col, 1.0);
}
