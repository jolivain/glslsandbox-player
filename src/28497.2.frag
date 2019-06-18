#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define PI 3.14159265359
#define TWOPI (2.0 * PI)
#define MOUTHCLOSE_FREQ 2.82
#define R 8.0
#define ORIG_Z	2.0*R
#define GRID_Z	ORIG_Z-2.0
#define TIMESCALE 1.0

#define SMOOTHERSTEP01(x_) dot(vec3(10.0,-15.0,6.0), pow(vec3(x_), vec3(3.0,4.0,5.0)))

struct Ray {
	vec3 p;
	vec3 d;
};

   

//	x: pan amount
//	y: perspective amount
// 	z: mouth close amount
vec3 prp = vec3(0.);

bool coll_pacman(in vec3 q) {
	q.z *= 2.5; // bit thinner pacman
	return (dot(q, q) < R * R)
		&& (prp.z <= (abs(q.y) + 1.05) / max(1.0, q.x + 5.0));
}

bool coll_pill(in vec3 q) {
	vec3 pill = q;
	pill.x = floor(2.0 * R * fract(pill.x * (0.5 / R) + time * MOUTHCLOSE_FREQ) - R + 2.0);
	pill += 0.5;
	return (dot(pill, pill) <= 1.0) && (2.0 <= q.x);
}

bool coll_level(in vec3 q) {
	return (abs(abs(q.y) - 1.50 * R) <= 0.8);
}

bool coll(in vec3 p) {
	vec3 q = floor(p + vec3(0.0,0.0,-ORIG_Z));
	return coll_pacman(q) || coll_level(q) || coll_pill(q);
}

bool traverse_step(inout vec3 t, inout float fact, in vec3 div, in Ray ray) {
	// min of components gets the projection factor for the ray to reach cell border
	fact = min(t.x, min(t.y, t.z));
	// calculate next projection to intersection as min of xyz
	t += step(t.xyz, t.yxy) * step(t.xyz, t.zzx) * div;
	// check for collision and get color
	return (coll(ray.p + fact * ray.d));
}

#define STEP() if (traverse_step(t, fact, div, ray)) return fact
#define STEP2() STEP(); STEP()
#define STEP4() STEP2(); STEP2()

float traverse(in Ray ray) {
	vec3 t;
	float fact = 0.0;
	vec3 div = vec3(1.0) / ray.d; // for projection

	if (coll(ray.p)) return 0.0;

	// calculate initial projection to intersection as difference from ray.p to
	// an intersection, which is based from floor(ray.p) and offseted with
	// ceil(ray.d) (which always yields xyz={0,1} when -1<=xyz<=1)
	t = ((floor(ray.p) + ceil(ray.d)) - ray.p) * div;
	ray.p += 1e-4 * ray.d; // slight adjust to get inside cell
	div = abs(div); // following steps are unsigned
	
	STEP4();
	STEP4();
	STEP4();
	
	return R;
}

mat3 lookat_lh(in Ray cam, in vec3 up) {
	vec3 uz = normalize(cam.d - cam.p);
	vec3 ux = normalize(cross(up, uz));
	vec3 uy = cross(uz, ux);
	return mat3(ux,uy,uz);
}

vec3 n_from_d(in vec3 d) {
	vec3 ad = abs(d);
	// get normal as max of xyz and apply sign
	return (sign(d)					// not normalized
			* step(ad.yxy, ad.xyz)
			* step(ad.zzx, ad.xyz)
	);
}

void main() {
	prp = vec3(
		vec2(SMOOTHERSTEP01(0.5 - 0.5 * cos(0.51 * time - 0.125 * PI))),
		0.5 - 0.5 * sin(TWOPI * MOUTHCLOSE_FREQ * time)
	);

	vec2 uv = 2.0 * (gl_FragCoord.xy / resolution.xy) - 1.0;
	uv.x *= resolution.x / resolution.y;
	
	// manual inspection
	 
	
	// setup ray/camera and rotate
	Ray ray = Ray(
		R * mix(vec3(1.0,0.1,0.0), vec3(4.45,0.5,0.0), prp.x),
		R * mix(vec3(1.0,0.1,1.0), vec3(4.00,0.4,1.1), prp.x)
	);
	mat3 rot = lookat_lh(ray, vec3(0.0,1.0,0.0));
	ray.d = normalize(vec3(uv * (1e-4 + 0.4 * prp.y),0.5));
	ray.p += 2.0 * R * (1.0 - prp.y) * vec3(uv,0.0);	
	ray.d = rot * ray.d;
	
	// project ray to grid wall
	float t = (GRID_Z - ray.p.z) / ray.d.z;
	ray.p += t * ray.d;
	
	t = traverse(ray);
	
	// calc shading
	ray.p += (t + 1e-5) * ray.d;		// move slighty inside cell
	vec3 n = n_from_d(fract(ray.p) - 0.5);
	float ldiff = 0.65 - 0.35 * min(0.0, dot(n, ray.d));
	float lfade = max(0.0, 1.0 - (t / (0.80*R)));
	
	// determine color
	vec3 c = vec3(
		vec2(step(abs(ray.p.y), R)),
		float(coll_pill(floor(ray.p + vec3(0.0,0.0,-ORIG_Z))))
	);
	c.b += 1.0 - c.r;

	c *= lfade * ldiff;					// shade
	c += (0.11 + 0.018 * abs(uv.x));	// add greyish bg
	c *= (1.39 - 0.24 * dot(uv,uv));	// darken
	
	gl_FragColor = vec4(c,1.0);
}

