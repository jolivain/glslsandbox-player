#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;

// Andrew Caudwell 2014
// @acaudwell

#define MAX_RAY_STEPS 96
#define IFS_ITERATIONS 32

// uncomment to see how it works ...
//#define DEBUG

// enable ray sphere intersection test
#define INTERSECTION_TEST

#define COLOUR vec3(0.55, 1.15, 0.5)

#ifdef DEBUG
vec3 col1 = vec3(1.0, 0.0, 0.0);
vec3 col2 = vec3(0.0, 1.0, 0.0);
vec3 col3 = vec3(0.0, 0.0, 1.0);
vec3 col4 = vec3(1.0, 0.0, 1.0);
vec3 col5 = vec3(0.0, 1.0, 1.0);
#else
vec3 col  = COLOUR;
vec3 col1 = COLOUR;
vec3 col2 = COLOUR;
vec3 col3 = COLOUR;
vec3 col4 = COLOUR;
vec3 col5 = COLOUR;
#endif

mat4 calc_transform(vec3 offset, vec3 axis, float angle, float scale) {

    angle *= radians(1.0);
	
    float c = cos(angle);
    float s = sin(angle);

    vec3 t = (1.0-c) * axis;

    return mat4(
        vec4(c + t.x * axis.x, t.y * axis.x - s * axis.z, t.z * axis.x + s * axis.y, 0.0) * scale,
        vec4(t.x * axis.y + s * axis.z, (c + t.y * axis.y),          t.z * axis.y - s * axis.x, 0.0) * scale,
        vec4(t.x * axis.z - s * axis.y, t.y * axis.z + s * axis.x, c + t.z * axis.z, 0.0) * scale,
        vec4(offset, 1.0)
    );
}

mat4 M = mat4(0.0);

float IFS(vec3 p, float s) {
        
	p /= s;
	
	for(int i=0;i<IFS_ITERATIONS;i++) {
		
		p = abs(p);
		
		// apply transform
		p = (M * vec4(p, 1.0)).xyz;                             
	}
	
	// divide by scale preserve correct distance
	return ((length(p)-1.0) * (pow(1.5, -float(IFS_ITERATIONS))))*s;
}

vec3 dir = vec3(0.0);

bool intersect(vec3 p, float r) {

    float b = 2.0 * dot(dir, p);
    float c = dot(p, p) - r*r;

    float sq = sqrt(b*b - 4.0*c);

    float t1 = (-b + sq) * 0.5;
    float t2 = (-b - sq) * 0.5;

    float near = min(t1, t2);
    float far  = max(t1, t2);

    return near < far && far > 0.0;
}


void combineIFS(vec3 p, float s, vec3 c, inout vec4 o) {

#ifdef INTERSECTION_TEST
    if(intersect(p, s*1.75)) {
#endif
		float d = IFS(p,s);
		if(d<o.x) o = vec4(d,c);
#ifdef INTERSECTION_TEST
	}
#endif
}

#define SF 0.2023

vec3 sp = normalize(vec3(1.0,1.0,-1.0));

vec4 scene(vec3 p) {
	
	vec3 p2 = p - (sp + sp*SF);
	vec3 p3 = p - (sp + sp*SF*2.0 + sp*SF*SF);
	vec3 p4 = p - (sp + sp*SF*2.0 + sp*SF*SF*2.0 + sp*SF*SF*SF);
	vec3 p5 = p - (sp + sp*SF*2.0 + sp*SF*SF*2.0 + sp*SF*SF*SF*2.0 + sp*SF*SF*SF*SF);
	vec3 p6 = p - (sp + sp*SF*2.0 + sp*SF*SF*2.0 + sp*SF*SF*SF*2.0 + sp*SF*SF*SF*SF*2.0 + sp*SF*SF*SF*SF*SF);
	
	vec4 o = vec4(10000.0,vec3(0.0));
	
	combineIFS(p,1.0,             col1, o);
	combineIFS(p2,SF,             col2, o);
	combineIFS(p3,SF*SF,          col3, o);
	combineIFS(p4,SF*SF*SF,       col4, o);
	combineIFS(p5,SF*SF*SF*SF,    col5, o);
	//combine(IFS(p6,SF*SF*SF*SF*SF), vec3(1.0), o);
	
	return o;       
}

void main(void) {

    vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;

	M = calc_transform(vec3(-0.4,-0.4,-0.55),normalize(vec3(1.0, 1.0, 1.0)), 40.0, 1.5);

	dir = normalize(vec3(uv.x, uv.y * (resolution.y/resolution.x), 0.665));
	
	float t = log(1.0 + 2.0*fract(time/19.0)) / log(3.0);
	
	vec3 t1 = sp + sp*SF*2.0 + sp*SF*SF + vec3(-0.05,-0.05,-SF);
	vec3 t2 = sp + sp*SF*2.0 + sp*SF*SF*2.0 + sp*SF*SF*SF + vec3(-0.05*SF,-0.05*SF,-SF*SF);
	
	vec3 cam = t1 + (t2-t1) * t;
	
	float d = 1.0;
	float ray_length = 0.0;
	
	int steps = 0;
	
	vec3 c = vec3(vec3(0.0, 0.55, 1.0)*(pow(length(vec2(uv.x,uv.y*2.0)),0.5)-1.05));
	
	vec4 s = vec4(0.0);
                
	for(int i=0; i<MAX_RAY_STEPS; i++) {
		if(d<0.000025) continue;
		s = scene(cam);
		d = s.x;
		cam += d * dir;
		ray_length += d;
		steps++;
	}

	if(ray_length<1.0) {
		c = s.yzw;
		
		float cost = float(steps)/float(MAX_RAY_STEPS)+t*0.0225;
		
		// cost based shading
		
		c *= pow(1.0 - cost,5.0);
		
		c += pow(1.0 - cost,27.0);
		
		c += 0.08;
	}
                
    gl_FragColor = vec4(c,1.0);
}
