/*
 * Original shader from: https://www.shadertoy.com/view/tllGWH
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define MIN_FLOAT 1e-6
#define MAX_FLOAT 1e6

struct Sphere{vec3 origin;float rad;};
struct Ray{ vec3 origin, dir;};
struct HitRecord{ float t; vec3 p;};

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

mat3 viewMatrix(vec3 eye, vec3 center, vec3 up) {
    vec3 f = normalize(center - eye);
    vec3 s = normalize(cross(f, up));
    vec3 u = cross(s, f);
    return mat3(s, u, -f);
}

bool plane_hit(in vec3 ro, in vec3 rd, in vec3 po, in vec3 pn, out float dist) {
    float denom = dot(pn, rd);
    if (denom > MIN_FLOAT) {
        vec3 p0l0 = po - ro;
        float t = dot(p0l0, pn) / denom;
        if(t >= MIN_FLOAT && t < MAX_FLOAT){
			dist = t;
            return true;
        }
    }
    return false;
}

vec3 hash(vec3 x){
	x = vec3( dot(x,vec3(127.1,311.7, 74.7)),
			  dot(x,vec3(269.5,183.3,246.1)),
			  dot(x,vec3(113.5,271.9,124.6)));

	return fract(sin(x)*43758.5453123);
}

bool sphere_hit(const in Sphere sphere, const in Ray inray, float t_min, float t_max, inout HitRecord rec) {
    vec3 oc = inray.origin - sphere.origin;
    float a = dot(inray.dir, inray.dir);
    float b = dot(oc, inray.dir);
    float c = dot(oc, oc) - sphere.rad*sphere.rad;
    float discriminant = b*b - a*c;
    if (discriminant > 0.) {
        float temp = (-b - sqrt(discriminant))/a;
        if (temp < t_max && temp > t_min) {
            rec.t = temp;
            rec.p = inray.origin + inray.dir * rec.t;
            return true;
        }
    }
    return false;
}

float noise( in vec3 p ){
    vec3 i = floor( p );
    vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

#define MAX_MARCHING_STEPS 128

float map(vec3 p){
   mat3 rot = rotateY(p.y + iTime);
   vec3 mp = p * 4. - vec3(0., 1., 0.) * iTime;
   return distance(noise(mp * rot), 0.);
}

float march(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        float dist = map(eye + depth * marchingDirection);
        if (dist < MIN_FLOAT) {
            return depth;
        }
        depth += dist * .5;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}

#define CLR_B vec3(91., 22., 71.)/255.
#define CLR_U vec3(255., 196., 0.)/255.
void mainImage(out vec4 fragColor, in vec2 fragCoord){
	vec3 color = vec3(0.);
    float a = (iResolution.x - iMouse.x) * .05;
    vec3 eye = vec3(7.5 * sin(a), 1., 7.5 * cos(a));
    vec3 viewDir = rayDirection(45., iResolution.xy, fragCoord);
    vec3 worldDir = viewMatrix(eye, vec3(0., -.25, 0.), vec3(0., 1., 0.)) * viewDir;
	
    float baseDist;
    if(plane_hit(eye, worldDir, vec3(0., -1., 0.), vec3(0., -1., 0.), baseDist)){
    	vec3 p = eye + worldDir * baseDist;
        float f = mod(floor(p.z) + floor(p.x), 2.);
        color = .1 + f * vec3(.1);
    }else{
    	baseDist = MAX_FLOAT;
    }
    
    Ray camRay = Ray(eye, worldDir);
    HitRecord rec;
    rec.t = 0.;
    rec.p = vec3(0.);
    if(sphere_hit(Sphere(vec3(0.), 1.00001), camRay, MIN_FLOAT, MAX_FLOAT, rec)){
		vec3 sp;
        float t=rec.t, layers=0., d, aD;
        float aa = 1.0/min(iResolution.y,iResolution.x);
        float thD = .3*sqrt(aa);
        for(int i=0; i<MAX_MARCHING_STEPS; i++)	{
            if(layers>25. || t>15.) break;
            sp = eye + worldDir * t;
            thD = .025 * length(sp);
            d = map(sp);
            aD = (thD-d)/thD;
            if(aD>0.) { 
                color += mix(mix(CLR_B, CLR_U, smoothstep(-1., 1., sp.y)), vec3(0.), pow(smoothstep(.001, .01, d), .5))
                       * (aD*aD*(3. - 2.*aD)/(t*t*2.25) * 7.); 
                layers++;
            }
            t += d; 
        }
    }
    fragColor = vec4(color, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
