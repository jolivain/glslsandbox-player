#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;

float  iGlobalTime = 0.;

#define ITEMAX 75

float QuadSphere(vec3 p, vec3 pos, vec3 size, float radius) {
	return length(max(abs(p - pos), 0.0) - size) - radius;
}

vec2 rot(vec2 p, float r) {
	float c = cos(r), s = sin(r);
	return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

float map(vec3 p) {
	float t = 1000.;
	vec3 pos   = vec3(0.0, 0.0, 0.0);
	float gt = iGlobalTime;
	vec3 scale = vec3(0.2 + sin(gt) * 0.1, 0.1, 0.1);
	for(int i = 0 ; i < 3; i++) {
		vec3 r = mod(p, 1.0) - 0.5;
		r.xy = rot(r.xy, gt * 0.7);
		r.yz = rot(r.yz, gt);
		t = min(t, QuadSphere(r, pos, scale, 0.05));
		pos   = pos.yzx;
		scale = scale.yzx;
	}
	return t;
}

void main( void ) {
	iGlobalTime = 1.65*time;
	float gt = iGlobalTime;
	float d  = 0.0, dt = 0.0, ite = 0.0;
	vec2 uv  = -1.0 + 2.0 * ( gl_FragCoord.xy / resolution );
	vec3 dir = normalize(vec3(uv * vec2(resolution.x/resolution.y, 1.0), 1.0));
	vec3 pos = vec3(0,gt,gt).zxy * 0.2;
	dir.xy   = rot(dir.xy, gt * 0.1);
	dir.yz   = rot(dir.yz, gt * 0.1);

	for(int i = 0 ; i < ITEMAX; i++) {
		dt = map(pos + dir * d);
		if(dt < .001) break;
		d += dt;
		ite++;
	}

	vec3 col = vec3(d * 0.05);
	if(dt < 0.001) {
		float  www = pow(1.0 - (ite / float(ITEMAX)), 10.0);
		col += www * (vec3(0,1,3).zyx * 0.5);
	}
	gl_FragColor = vec4(sqrt(col) + dir * 0.03, 1.0);
}
