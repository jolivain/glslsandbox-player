/*
 * Original shader from: https://www.shadertoy.com/view/XsXGDH
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
const vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
// sad robot
// @simesgreen

const int maxSteps = 64;
const float hitThreshold = 0.001;
const int shadowSteps = 64;
const float PI = 3.14159;

// CSG operations
float _union(float a, float b)
{
    return min(a, b);
}

float intersect(float a, float b)
{
    return max(a, b);
}

float difference(float a, float b)
{
    return max(a, -b);
}

// transforms
vec3 rotateX(vec3 p, float a)
{
    float sa = sin(a);
    float ca = cos(a);
    return vec3(p.x, ca*p.y - sa*p.z, sa*p.y + ca*p.z);
}

vec3 rotateY(vec3 p, float a)
{
    float sa = sin(a);
    float ca = cos(a);
    return vec3(ca*p.x + sa*p.z, p.y, -sa*p.x + ca*p.z);
}

vec3 rotateZ(vec3 p, float a)
{
    float sa = sin(a);
    float ca = cos(a);
    return vec3(ca*p.x - sa*p.y, sa*p.x + ca*p.y, p.z);
}

mat3 rotationMat(vec3 v, float angle)
{
	float c = cos(angle);
	float s = sin(angle);
	
	return mat3(c + (1.0 - c) * v.x * v.x, (1.0 - c) * v.x * v.y - s * v.z, (1.0 - c) * v.x * v.z + s * v.y,
		(1.0 - c) * v.x * v.y + s * v.z, c + (1.0 - c) * v.y * v.y, (1.0 - c) * v.y * v.z - s * v.x,
		(1.0 - c) * v.x * v.z - s * v.y, (1.0 - c) * v.y * v.z + s * v.x, c + (1.0 - c) * v.z * v.z
		);
}

// based on gluLookAt
mat4 lookAt(vec3 eye, vec3 center, vec3 up)
{
	vec3 z = normalize(eye - center);
	vec3 y = up;
	vec3 x = cross(y, z);
	y = cross(z, x);
	x = normalize(x);
	y = normalize(y);
	mat4 rm = mat4(x.x, y.x, z.x, 0.0,	// 1st column
		   		   x.y, y.y, z.y, 0.0,
		           x.z, y.z, z.z, 0.0,
				   0.0, 0.0, 0.0, 1.0);
	mat4 tm = mat4(1.0);
	tm[3] = vec4(-eye, 1.0);
	return rm * tm;
		   
}

// primitive functions
// these all return the distance to the surface from a given point

  // n must be normalized
float sdPlane( vec3 p, vec4 n )
{
  return dot(p,n.xyz) + n.w;
}

float sdBox( vec3 p, vec3 b )
{
  vec3  di = abs(p) - b;
  float mc = max(di.x, max(di.y, di.z));
  return min(mc,length(max(di,0.0)));
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

// 1d noise
float noise( float p )
{
    float i = floor( p );
    float f = fract( p );
	float u = f*f*(3.0-2.0*f);
    return mix( hash( i ), hash( i + 1.0 ), u);
}

vec3 target = vec3(0.0);
mat4 headMat = mat4(0.);

// distance to scene
float scene(vec3 p)
{		
	float t = iTime*1.5;
	
    float d;	
    d = sdPlane(p, vec4(0, 1, 0, 1)); 

	p.y -= cos(t*2.0)*0.1;	// bounce
	//p.x += sin(t)*0.1;
	
	// head
	vec3 hp = p - vec3(0.0, 4.0, 0.0);
	// rotate head
	hp = (vec4(hp, 1.0)*headMat).xyz;

	d = _union(d, sdBox(hp, vec3(1.5, 1.0, 1.0)));

	// eyes
	vec3 eyeScale = vec3(1.0);
	//eyeScale.y *= 1.0 - pow(noise(t*10.0), 10.0);	// blink
	eyeScale.y *= 1.0 - smoothstep(0.8, 1.0, noise(t*5.0));	// blink
	d = difference(d, sphere((hp - vec3(0.6, 0.2, 1.0))/eyeScale, 0.15));
	d = difference(d, sphere((hp - vec3(-0.6, 0.2, 1.0))/eyeScale, 0.15));
	
	// mouth
	if (iMouse.z > 0.0) {
		// surprised mouth
		d = difference(d, sdBox(hp - vec3(0.0, -0.4, 1.0), vec3(0.2, 0.1, 0.1)));		
	} else {
		d = difference(d, sdBox(hp - vec3(0.0, -0.4, 1.0), vec3(0.25, 0.05, 0.1)));				
	}

	// body
	vec3 bp = p;
	bp = rotateY(bp, -target.x*0.05);
	d = _union(d, sdBox(bp - vec3(0.0, 2.0, 0.0), vec3(0.8, 1.0, 0.5)));

	// arms
	//const float arz = -0.1;
	float arz = -noise(t*0.3);
	vec3 a1 = rotateZ(rotateX(bp- vec3(1.2, 2.0+0.7, 0.0), sin(t)*0.75), arz) + vec3(0, 1.0, 0);
	vec3 a2 = rotateZ(rotateX(bp- vec3(-1.2, 2.0+0.7, 0.0), sin(t+PI)*0.75), -arz) + vec3(0, 1.0, 0);
	d = _union(d, sdBox(a1, vec3(0.25, 1.0, 0.25)));
	d = _union(d, sdBox(a2, vec3(0.25, 1.0, 0.25)));

	// legs
	vec3 l1 = rotateX(p - vec3(0.5, 1.2, 0.0), -sin(t)*0.5) + vec3(0.0, 1.2, 0.0);
	vec3 l2 = rotateX(p - vec3(-0.5, 1.2, 0.0), -sin(t+PI)*0.5) + vec3(0.0, 1.2, 0.0);
	d = _union(d, sdBox(l1, vec3(0.3, 1.0, 0.5)));
	d = _union(d, sdBox(l2, vec3(0.3, 1.0, 0.5)));
	
    return d;
}

// calculate scene normal
vec3 sceneNormal(in vec3 pos )
{
    float eps = 0.0001;
    vec3 n;
    float d = scene(pos);
    n.x = scene( vec3(pos.x+eps, pos.y, pos.z) ) - d;
    n.y = scene( vec3(pos.x, pos.y+eps, pos.z) ) - d;
    n.z = scene( vec3(pos.x, pos.y, pos.z+eps) ) - d;
    return normalize(n);
}

// ambient occlusion approximation
float ambientOcclusion(vec3 p, vec3 n)
{
    const int steps = 4;
    const float delta = 0.5;

    float a = 0.0;
    float weight = 1.0;
    for(int i=1; i<=steps; i++) {
        float d = (float(i) / float(steps)) * delta; 
        a += weight*(d - scene(p + n*d));
        weight *= 0.5;
    }
    return clamp(1.0 - a, 0.0, 1.0);
}

// http://iquilezles.org/www/articles/rmshadows/rmshadows.htm
float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k)
{
    float dt = (maxt - mint) / float(shadowSteps);
    float t = mint;
	t += hash(ro.z*574854.0 + ro.y*517.0 + ro.x)*0.1;
    float res = 1.0;
    for( int i=0; i<shadowSteps; i++ )
    {
        float h = scene(ro + rd*t);
		if (h < hitThreshold) return 0.0;	// hit
        res = min(res, k*h/t);
        //t += h;
		t += dt;
    }
    return clamp(res, 0.0, 1.0);
}


// trace ray using sphere tracing
vec3 trace(vec3 ro, vec3 rd, out bool hit)
{
    hit = false;
    vec3 pos = ro;
    vec3 hitPos = ro;

    for(int i=0; i<maxSteps; i++)
    {
		if (!hit) {
			float d = scene(pos);
			if (abs(d) < hitThreshold) {
				hit = true;
				hitPos = pos;
			}
			pos += d*rd;
		}
    }
    return pos;
}

// lighting
vec3 shade(vec3 pos, vec3 n, vec3 eyePos)
{
	//vec3 color = vec3(0.5);
	//const vec3 lightDir = vec3(0.577, 0.577, 0.577);
    //vec3 v = normalize(eyePos - pos);
    //vec3 h = normalize(v + lightDir);
    //float diff = dot(n, lightDir);
    //diff = max(0.0, diff);
    //diff = 0.5+0.5*diff;
	
    float ao = ambientOcclusion(pos, n);
	//vec3 c = diff*ao*color;
	
	// skylight
	vec3 sky = mix(vec3(0.3, 0.2, 0.0), vec3(0.6, 0.8, 1.0), n.y*0.5+0.5);
	vec3 c = sky*0.5*ao;
	
	// point light
	const vec3 lightPos = vec3(5.0, 5.0, 5.0);
	const vec3 lightColor = vec3(0.5, 0.5, 0.1);
	
	vec3 l = lightPos - pos;
	float dist = length(l);
	l /= dist;
	float diff = max(0.0, dot(n, l));
	//diff *= 50.0 / (dist*dist);	// attenutation
	
#if 1
	float maxt = dist;
    float shadow = softShadow( pos, l, 0.1, maxt, 5.0 );
	diff *= shadow;
#endif
	
	c += diff*lightColor;
	
//	return vec3(ao);
//	return n*0.5+0.5;
	return c;
}

vec3 background(vec3 rd)
{
	return mix(vec3(0.3, 0.2, 0.0), vec3(0.6, 0.8, 1.0), rd.y*0.5+0.5);
    //return vec3(0.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 pixel = (fragCoord.xy / iResolution.xy)*2.0-1.0;

    // compute ray origin and direction
    float asp = iResolution.x / iResolution.y;
    vec3 rd = normalize(vec3(asp*pixel.x, pixel.y, -2.0));
    vec3 ro = vec3(0.0, 2.0, 8.0);

	vec2 mouse = iMouse.xy / iResolution.xy;
	float roty = 0.0; // sin(iTime*0.2);
	float rotx = 0.0;
	/*
	if (iMouse.z > 0.0) {
		rotx = -(mouse.y-0.5)*3.0;
		roty = -(mouse.x-0.5)*6.0;
	}
	*/
	
    rd = rotateX(rd, rotx);
    ro = rotateX(ro, rotx);
		
    rd = rotateY(rd, roty);
    ro = rotateY(ro, roty);

	if (iMouse.z > 0.0) {
		// look at mouse
		target = vec3(mouse*10.0-5.0, -10.0);
		target.x *= asp;
	} else {
		target = vec3(noise(iTime*0.5)*10.0-5.0, noise(iTime*0.5+250673.0)*8.0-4.0, -10.0);
	}
	headMat = lookAt(vec3(0.0, 0.0, 0.0), target, vec3(0.0, 1.0, 0.0));	
		
    // trace ray
    bool hit;
    vec3 pos = trace(ro, rd, hit);

    vec3 rgb;
    if(hit) {
        // calc normal
        vec3 n = sceneNormal(pos);
        // shade
        rgb = shade(pos, n, ro);

     } else {
        rgb = background(rd);
     }
	
    fragColor=vec4(rgb, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
