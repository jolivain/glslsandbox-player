/*
 * Original shader from: https://www.shadertoy.com/view/XdBSD3
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;

// Protect glslsandbox uniform names
#define time        stemu_time

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Useless Box, fragment shader by movAX13h, Nov. 2014

#define ALIENHAND
#define LID
#define FLOOR
//#define FLOOR2
#define SWITCH
#define THING

#define SHADOW
#define REFLECTION

// --
//#define resolution iResolution
//#define mouse iMouse

#define pi2 6.2831853071795
#define pih 1.5707963267949


float rand(float x)
{
    return fract(sin(x) * 4358.5453123);
}

float rand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5357);
}

float rand(vec3 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5357 * co.z);
}

float sdBox( vec3 p, vec3 b ) 
{	
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float udRoundBox(vec3 p, vec3 b, float r)
{
  return length(max(abs(p)-b,0.0))-r;
}

float sdSegment(vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	
	return length(pa - ba*h) - r;
}

float sdSphere(vec3 p, float r)
{
	return length(p)-r;
}

float sdCappedCylinderZ( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.xy),p.z)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdCappedCylinderY(vec3 p, vec2 h)
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdTorus(vec3 p, vec2 t)
{
	vec2 q = vec2(length(p.xz)-t.x,p.y);
	return length(q)-t.y;
}

vec2 rotate(vec2 p, float a, vec2 offset)
{
    p += offset;
	vec2 r;
	r.x = p.x*cos(a) - p.y*sin(a);
	r.y = p.x*sin(a) + p.y*cos(a);
    r -= offset;
	return r;
}

float opS(float d1, float d2)
{
    return max(-d1,d2);
}

float opI(float d1, float d2)
{
    return max(d1,d2);
}

// polynomial smooth min (k = 0.1); by iq
float smin(float a, float b, float k)
{
    float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
    return mix(b, a, h) - k*h*(1.0-h);
}

float time = 0.0;
vec3 sunPos;
vec3 sun;
float focus;
float far;

struct Hit
{
	float d;
	vec3 color;
	float ref;
	float spec;
};

#define fingerStart(a,b,c) from=vec3(a, b, c)
#define seg(t,r) d=smin(d,sdSegment(p, from, t, r), 0.06); from=t
#define seg2(t,r,s) d=smin(d,sdSegment(p, from, t, r), s); from=t
float alienHand(vec3 p, float cycle)
{
    p.x -= 0.2*cycle;
    p.xy = rotate(p.xy, -0.5+cycle*0.2, vec2(0.0));
	p.z *= 0.8;
    p.y += 0.01*sin(time);
    
    float a1 = sin(3.6*time);
    float a2 = sin(0.7*time+1.333)*a1;
    
    float a1s = 0.02*a1;
    float a2s = 0.05*a2;
    
	vec3 from, to;
	float d = 1.0e6;
	
	// ringfinger
	fingerStart(0.4+0.7*a2s, -0.65+a1s, -0.1);
	seg(vec3(0.6, -0.35+a1s, -0.1), 0.06);
	seg(vec3(1.1, -0.1, -0.1), 0.065);
	seg(vec3(2.0, -0.24, -0.07), 0.08);
	
	// pinky
	fingerStart(0.75+a2s, -0.95+a1s, -0.2);
	seg(vec3(0.85, -0.5+a1s, -0.21), 0.05);
	seg(vec3(1.18, -0.23, -0.18), 0.06);
	seg(vec3(2.0, -0.24, -0.09), 0.07);
	
	// thumb
	fingerStart(1.0, -0.5, 0.26);
	seg(vec3(1.3, -0.2, 0.27), 0.07);
	seg(vec3(1.65, -0.2, 0.18), 0.08);
	seg(vec3(2.0, -0.2, 0.1), 0.09);
	
	// arm
	from = vec3(1.6, -0.2, 0.0);
	seg2(vec3(4.0, -1.2, 0.0), 0.08, 0.3);
	seg(vec3(2.0, -0.3, 0.05), 0.14);

	// pointer
	fingerStart(0.0, 0.5*a1s, 0.0);
	seg(vec3(0.5, 0.08+0.3*a1s, 0.02), 0.06);
	seg(vec3(1.1, -0.03+abs(0.2*a1s), 0.04), 0.07);
	seg(vec3(2.0, -0.2, 0.06), 0.07);
    
	return d;
}    
    
Hit scene(vec3 p)
{
    //p.xz = mod(p.xz, 3.0)-1.5;
    
	vec3 q = p;
    float t = 1.5*time;
	float cycle = max(0.0, sin(t)-0.3);
    
	Hit h = Hit(1.0e6, vec3(0.0,0.1,0.3), 0.1, 0.2);

	// box
	float a = opS(sdBox(p, vec3(0.5, 0.3, 0.14)), sdBox(p, vec3(1.0, 0.5, 0.75)));
	float b = sdBox(p-vec3(-0.8, 0.54, 0.0), vec3(0.8, 0.4, 0.8));
	h.d = opS(b, a);

	// lid
	#ifdef LID
	q = p;
	q.xy = rotate(q.xy, -max(0.004, 0.2*smoothstep(0.0, 0.3, cycle)), vec2(1.0, -0.11));
	
	a = sdBox(q-vec3(-0.501, 0.32, 0.0), vec3(0.5, 0.18, 0.75));
	b = sdBox(q-vec3(-0.401, 0.26, 0.0), vec3(0.46, 0.2, 0.71));
	h.d = min(h.d, opS(b, a));
	#endif
	
	// thing
    #ifdef THING
	q = p;
	q.xy = rotate(q.xy, -abs(1.26*smoothstep(0.3, 0.5, 1.0-cycle)), vec2(-0.1, -0.2));
	
	a = opS(sdCappedCylinderZ(q-vec3(0.1, 0.18, 0.0), vec2(0.4, 0.2)), sdCappedCylinderZ(q-vec3(0.1, 0.18, 0.0), vec2(0.5, 0.08)));
	b = sdBox(q-vec3(0.7, 0.36, 0.0), vec3(0.5));
	h.d = min(h.d, opS(b, a));
	#endif
    
	// switch
    #ifdef SWITCH
	b = sdSegment(p, vec3(0.24, 0.5, 0.0), vec3(0.18+0.14*step(-0.6, sin(t-1.99)), 0.7, 0.0), 0.03);
	b = min(b, sdCappedCylinderY(p-vec3(0.24, 0.42, 0.0), vec2(0.1, 0.1)));
    b = min(b, sdTorus(p-vec3(0.24, 0.525, 0.0), vec2(0.05, 0.018)));
	
	if (b < h.d) 
	{
		h.d = b;
		h.color = vec3(0.1);
		h.spec = 0.7;
		h.ref = 0.3;
	}
	#endif
    
    #ifdef ALIENHAND
    a = alienHand(p-vec3(0.4, 0.71, 0.0), smoothstep(1.0, 0.8, sin(t-4.2)));
    if (a < h.d)
    {
        h.d = a;
        h.color = vec3(0.4);
        h.spec = 0.0;
        h.ref = 0.0;
    }
    #endif
    
    #ifdef FLOOR
    
    #ifdef FLOOR2
    a = dot(p,vec3(0.0, 1.0, 0.0)) + 0.5;
    #else
    a = sdBox(p-vec3(0.0, -0.5, 0.0), vec3(2.0, 0.01, 2.0));
    #endif
    if (a < h.d)
    {
        h.d = a;
        #ifdef FLOOR2
        h.color = vec3(0.5*mod(sin(p.z)-sin(p.x), 0.4)+0.5);
		//h.color = vec3(0.3+0.5*mod(p.z, 0.4));
        #else
        h.color = vec3(0.8);
		#endif
        h.spec = 0.2;
        h.ref = 0.2;
    }
    #endif
    
	return h;
}

vec3 normal(vec3 p)
{
	float c = scene(p).d;
	vec2 h = vec2(0.01, 0.0);
	return normalize(vec3(scene(p + h.xyy).d - c, 
						  scene(p + h.yxy).d - c, 
		                  scene(p + h.yyx).d - c));
}


vec3 colorize(const vec3 col, const float spec, const vec3 n, const vec3 dir, const in vec3 lightPos)
{
	float diffuse = 0.2*max(0.0, dot(n, lightPos));
	vec3 ref = normalize(reflect(dir, n));
	float specular = spec*pow(max(0.0, dot(ref, lightPos)), 3.5);
	return (col + diffuse * vec3(0.9) +	specular * vec3(1.0));
}

vec3 tex3D(vec3 dir)
{
    return texture(iChannel0, dir).bgr;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
{
	time = iTime + 7.0;
	sunPos = vec3(10.0, 15.0, -10.0);
	sun = normalize(sunPos);
	focus = 9.0+2.0*cos(0.35*time);
	far = 30.0;    
    
    vec2 pos = (fragCoord.xy*2.0 - resolution.xy) / resolution.y;
	
	float d = 9.0;
	float t = 1.2*sin(time*0.1+35.0) ;
	vec3 cp = vec3(d*cos(t), 6.0+sin(0.2*time), d*sin(t)); // circle center
    
	if (mouse.x > 10.0)
	{
		vec2 mrel = 3.0*(mouse.xy/resolution.xy-0.5);
		d = 10.0;
        focus = 9.0 + 4.0*mrel.y;
		cp = vec3(d*cos(-mrel.x*pih), 6.0, d*sin(-mrel.x*pih));
	}
	
    vec3 ct = vec3(0.0, 0.1, 0.0);
   	vec3 cd = normalize(ct-cp);
    vec3 cu  = vec3(0.0, 1.0, 0.0);
    vec3 cs = cross(cd, cu);
    vec3 dir = normalize(cs*pos.x + cu*pos.y + cd*focus);	
	
    Hit h;
	vec3 col = vec3(0.16);
	vec3 ray = cp;
	float dist = 0.0;
	
	// raymarch scene
    for(int i=0; i < 60; i++) 
	{
        h = scene(ray);
		
		if(h.d < 0.0001) break;
		
		dist += h.d;
		ray += dir * h.d * 0.8;

        if(dist > far) 
		{ 
			dist = far; 
			break; 
		}
    }

	float m = (1.0 - dist/far);
	vec3 n = normal(ray);
	col = colorize(h.color, h.spec, n, dir, sun)*m;

	if (dist < far)
	{	
		// MIRROR (from obj to reflected normal direction)
		#ifdef REFLECTION
		Hit h2;
		dir = reflect(dir, n);
		vec3 neb = tex3D(dir);
		
		vec3 ray2 = ray + dir*0.008;

		dist = 0.0;
		
		for(int i=0; i < 35; i++) 
		{
			h2 = scene(ray2 + dir*dist);
			dist += h2.d;
			if (h2.d < 0.001) break;
		}

		if (dist > far) col += h.ref*neb;
		else col += h.ref*colorize(h2.color, h2.spec, normal(ray2+dir*dist), dir, sun)*(1.0 - dist/far);
		#endif	
		
		// HARD SHADOW with low number of rm iterations (from obj to sun)
		#ifdef SHADOW
		vec3 ray1 = ray;
		dir = normalize(sunPos - ray1);
		ray1 += n*0.006;
		
		float sunDist = length(sunPos-ray1);
		dist = 0.0;
		
		for(int i=0; i < 35; i++) 
		{
			h = scene(ray1 + dir*dist);
			dist += h.d;
			if (abs(h.d) < 0.001) break;
		}

		col -= 0.2*smoothstep(0.5, -0.3, min(dist, sunDist)/max(0.0001,sunDist));
		#endif
	}
	else col = tex3D(dir);
    
	col = clamp(col, vec3(0.0), vec3(1.0));
	col = pow(col, vec3(2.2, 2.4, 2.5)) * 3.7; // farbton & sttigung
	col = pow(col, vec3(1.0 / 2.2)); // gamma	
	
	fragColor = vec4(col, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
