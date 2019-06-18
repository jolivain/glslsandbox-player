/*
 * Original shader from: https://www.shadertoy.com/view/XtyyRW
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)
#define textureLod(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define saturate(x) clamp(x, 0.0, 1.0)

vec3 Debug(float t)
{
    vec3 c = vec3(0.478, 0.500, 0.500);
    c += .5 * cos(6.28318 * (vec3(0.688, 0.748, 0.748) * t + vec3(0.318, 0.588, 0.908)));
    return clamp(c, vec3(0.0), vec3(1.0));
}

struct Intersection
{
    float totalDistance;
    float sdf;
    int materialID;
};

struct Ray
{
	vec3 origin;
    vec3 direction;
};

Ray GetCamera(vec2 uv, float zoom, float time)
{
    vec3 target = vec3(0.0, 1.5, 0.0);
    vec3 p = vec3(-5.0, 2.0, 25.0) + vec3(cos(time), 0.0, sin(time)) * .1;
        
    vec3 forward = normalize(target - p);
    vec3 left = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = normalize(cross(forward, left));

    Ray ray;   
    ray.origin = p;
    ray.direction = normalize(forward - left * uv.x * zoom - up * uv.y * zoom);        
    return ray;
}

// A minion shader.
// This was my first raymarched scene for a proc class I took some time ago.
// I never had the time to finish it, so here it is... clunky, unoptimized, etc. 
// No time for fanciness, I wanted to take it out of my system. Also removed the environment.

#define MAX_STEPS 50
#define MAX_STEPS_F float(MAX_STEPS)

#define MAX_DISTANCE 70.0
#define MIN_DISTANCE 1.0
#define EPSILON .01
#define EPSILON_NORMAL .01

#define MATERIAL_MINION 	1
#define MATERIAL_PANTS 		2
#define MATERIAL_PLASTIC 	3
#define MATERIAL_EYE		4
#define MATERIAL_METAL		5

// https://github.com/stackgl/glsl-smooth-min
float smin(float a, float b, float k) 
{
  float res = exp(-k * a) + exp(-k * b);
  return -log(res) / k;
}

// All sdf functions from iq
vec2 opU(vec2 d1, vec2 d2 )
{
    return d1.x < d2.x ? d1 : d2;
}

float sdSphere( vec3 p, float r )
{
	return length(p) - r;
}

float udBox(vec3 p, vec3 b)
{
	return length(max(abs(p) - b, 0.0));
}

float sdPlane( vec3 p)
{
	return p.y;
}

float sdCappedCylinder( vec3 p, vec2 h)
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float pow8(float x)
{
	x *= x; // xˆ2
	x *= x; // xˆ4
	return x * x;
}

float length8(vec2 v)
{
	return pow(pow8(v.x) + pow8(v.y), .125);
}

float sdTorus82( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length8(q)-t.y;
}

float sdTorus( vec3 p)
{
  vec2 q = vec2(length(p.xz)-1.0,p.y);
  return length(q) - .2;
}

float sdHexPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x);
}

float udRoundBox( vec3 p, vec3 b, float r )
{
	return length(max(abs(p) - b, 0.0)) - r;
}

float sdCappedCone( in vec3 p)
{
	p.y -= .25;
    vec2 q = vec2( length(p.xz), p.y );
    vec2 v = vec2(0.5773502691896258, -0.5773502691896258);
    vec2 w = v - q;
    vec2 vv = vec2( dot(v,v), v.x*v.x );
    vec2 qv = vec2( dot(v,w), v.x*w.x );
    vec2 d = max(qv,0.0) * qv / vv;
    return sqrt(max(dot(w,w) - max(d.x,d.y), .000000001) ) * sign(max(q.y*v.x-q.x*v.y,w.y));
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}

float sdEllipsoid( in vec3 p, in vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float opUnion( float d1, float d2 )
{
    return min(d1, d2);
}

vec3 opCheapBend( vec3 p, float magnitude)
{
    float c = cos(magnitude * p.y);
    float s = sin(magnitude * p.y);
    mat2  m = mat2(c, -s, s, c);
    vec3 q = vec3( m * p.xy, p.z);
    return q;
}

float Pants(vec3 point)
{
    // Mirror
    point.x = abs(point.x);
    vec3 blendOffset = vec3(0.0, 1.5, 0.0);
	vec3 bendedPoint = opCheapBend(point - blendOffset, .15) + blendOffset;
	
    float radius = 1.25;    
	float base = sdCapsule(point, vec3(0.0, .5, .0), vec3(0.0, 2.8, 0.0), radius);
	float hand1 = sdCapsule(bendedPoint, vec3(1.15, 1.25, 0.0), vec3(1.8, .65, 0.0), .135);	
    
    float handBase = sdSphere(point - vec3(1., 0.1, 0.35), .3);
    handBase = min(handBase, sdSphere(point - vec3(.85, 0.1, 0.5), .35));
    
    // Important for straps
    base = smin(base, hand1, 5.0);	
    base = smin(base, handBase, 10.0);
    
    float baseLow = max(base, sdPlane(point - vec3(.0, .2 + abs(point.x*point.x) * -.2, .0)));
    float baseHigh = max(base, udBox(point - vec3(0., 0.3, 0.0), vec3(.8, .4, 2.0)));
    
	float foot = sdCapsule(point, vec3(0.45, -1.0, 0.0), vec3(0.35, 0.5, 0.0), .2);  
    float dist = min(baseHigh, baseLow);
    
    // Smooth with itself
    dist = smin(dist, dist, 30.0);
    
    // Smooth with feet
    dist = smin(dist, foot, 10.0);
    
    vec3 strapOffset = vec3(1.5, .0, 0.0);
    float strap = sdSphere(point - strapOffset, 1.55);
    strap = max(strap, -sdSphere(point - strapOffset, 1.35));
    strap = max(strap, base);
    strap = max(strap, -baseHigh);
    
    return min(dist, strap);
}

float Glass(vec3 point)
{
   vec3 glassPoint = point - vec3(0.0, 2.5, 1.15);	
   glassPoint.z *= 1.6;
   return sdSphere(glassPoint + vec3(0.0, 0.0, .25), .55);	
}

float Metal(vec3 point)
{    
	vec3 glassPoint = point - vec3(0.0, 2.5, 1.23);	
	float glassBase = sdTorus82(glassPoint.xzy, vec2(.5, .1));
    
    
    // Mirror
    point.x = abs(point.x);
    point -= vec3(.6, 0.0, 1.075);
	float detail = sdCapsule(point, vec3(0.0, 2.35, .0), vec3(0.0, 2.65, 0.0), .05);

    return min(glassBase, detail);
}

float HandsPantsBelt(vec3 point)
{
    // Mirror
    point.x = abs(point.x);
	
    float handBase = sdSphere(point - vec3(1., 0.1, 0.35), .3);
    handBase = min(handBase, sdSphere(point - vec3(.85, 0.05, 0.5), .35));
    
    // Boot
    float boot = sdEllipsoid(opCheapBend(point, -.05) - vec3(.5, -1.1, .5), vec3(.35, .25, .3));        
    boot = max(boot, -sdPlane(point - vec3(0.0, -1.1, 0.0)));
    
    // Belt
    float radius = 1.2 * step(abs(point.y - 2.5), .175) * (1.0 + abs(sin((point.y - 2.5) * 2.14) * .1));
	float base = sdCapsule(point, vec3(0.0, .5, .0), vec3(0.0, 3.0, 0.0), radius);
    
    return min(base, min(boot, handBase));
}

float Body(vec3 point)
{
    vec3 original = point;
    
    // Mirror
    point.x = abs(point.x);
	
    vec3 blendOffset = vec3(0.0, 1.5, 0.0);
	vec3 bendedPoint = opCheapBend(point - blendOffset, .15) + blendOffset;
	
    float radius = 1.15;
	float base = sdCapsule(point, vec3(0.0, .5, .0), vec3(0.0, 2.8, 0.0), radius);
	float hand = sdCapsule(bendedPoint, vec3(1.15, 1.25, 0.0), vec3(1.7, .65, 0.0), .135);	    
    hand = smin(hand, sdCapsule(bendedPoint, vec3(1.7, .62, 0.0), vec3(1.25, .2, .5), .11), 20.0);
	
	float dist = smin(base, hand, 12.0);	
    
    original.y -= -pow(original.x, 2.0) * .35;
    
	float mouth = sdEllipsoid(opCheapBend(original, .25) - vec3(.8, 1.2, 1.5), vec3(.5, .06, .9));
	dist = max(dist, -mouth);
	return dist;
}

void evaluateSceneSDF(vec3 point, out float minDistance, out float hitMaterial)
{	
	hitMaterial = 0.0;
	minDistance = MAX_DISTANCE;
    
    vec2 d = vec2(Body(point), MATERIAL_MINION);    
    d = opU(d, vec2(HandsPantsBelt(point), MATERIAL_PLASTIC));
  	d = opU(d, vec2(Pants(point), MATERIAL_PANTS));
    d = opU(d, vec2(Metal(point), MATERIAL_METAL));
    d = opU(d, vec2(Glass(point), MATERIAL_EYE));
    
    minDistance = d.x;
    hitMaterial = d.y;
}

float sdf(vec3 p)
{
    float material = 0.0;
    float d = MAX_DISTANCE;
    evaluateSceneSDF(p, d, material);
    return d;
}

// iq and Paul Malin, tetrahedron (http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm)
vec3 sdfNormal(vec3 p, float epsilon)
{
    float h = epsilon; // or some other value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*sdf(p + k.xyy*h) + 
                      k.yyx*sdf(p + k.yyx*h) + 
                      k.yxy*sdf(p + k.yxy*h) + 
                      k.xxx*sdf(p + k.xxx*h) );
}

#define AO_ITERATIONS 7
#define AO_DELTA .12
#define AO_DECAY .9
#define AO_INTENSITY .07

float ambientOcclusion(vec3 point, vec3 normal)
{
	float ao = 0.0;
	float delta = AO_DELTA;
	float decay = 1.0;

	for(int i = 0; i < AO_ITERATIONS; i++)
	{
		float d = float(i) * delta;
		decay *= AO_DECAY;
		ao += (d - sdf(point + normal * d)) / decay;
	}

	return clamp(1.0 - ao * AO_INTENSITY, 0.0, 1.0);
}

vec3 GetBaseColor(vec3 pos, int material)
{
	vec3 baseColor = vec3(.99, .85, .25);
    
    if(material == MATERIAL_PLASTIC)
    {
     	baseColor *= .1;   
    }
    else if(material == MATERIAL_PANTS)
    {
		baseColor = vec3(.25, .5, .7) * smoothstep(-1.3, .15, pos.y);
    }
    else if(material == MATERIAL_METAL)
    {
		baseColor = vec3((3.1 - pos.y * .92) * .8);
    }
    else if(material == MATERIAL_EYE)
    {
        vec2 eyeDispl = textureLod(iChannel1, vec2(iTime * .01), 0.0).rg;
        pos.xy += pow(eyeDispl, vec2(3.0)) * .05;
        
        pos.y += smoothstep(0.999, 1.0, sin(iTime));
        
        float eyeHeight = 2.45;
        float cut = smoothstep(eyeHeight, eyeHeight + .01, pos.y);        
        float eyeMask = smoothstep(.15, .2, length(pos - vec3(0.0, 2.45, 1.3)));
        
        // Eehhh too late for an actual eye
        vec3 eyeColor = mix(vec3(0.2, .1, .0), vec3(1.0), eyeMask);        
        eyeColor += smoothstep(.09, .08, length(pos - vec3(0.05, 2.45, 1.3)));
        
		baseColor = mix(eyeColor, baseColor, cut);
    }
    
    return baseColor;
}

vec3 GetEnvColor(vec3 pos, int material)
{
	vec3 baseColor =  vec3(1.6, .8, .8);
    
    if(material == MATERIAL_PLASTIC)
    {
     	baseColor = vec3(1.0, .9, .9) * .6;
    }
    else if(material == MATERIAL_PANTS)
    {
		baseColor = vec3(.25, .5, .7);
    }
    else if(material == MATERIAL_METAL)
    {
		baseColor = vec3(1.0);
    }
    
    return baseColor;
}

vec3 GetSpecularColor(vec3 pos, int material)
{
	vec3 baseColor = vec3(.4, .7, .9);
    
    if(material == MATERIAL_PLASTIC)
    {
     	baseColor = vec3(.4, .7, .9) * .55;
    }
    
    return baseColor;
}


vec3 Render(Ray ray, Intersection isect, vec2 uv)
{
    vec3 pos = ray.origin + ray.direction * isect.totalDistance;
    
    if(isect.totalDistance < MAX_DISTANCE)
    {
        float mat = 0.0;
        float dist = MAX_DISTANCE;
        evaluateSceneSDF(pos, dist, mat);
        
        int material = int(mat);
        
        vec3 normal = sdfNormal(pos, EPSILON_NORMAL);
        
		float lightIntensity = 1.5;
        vec3 lightPosition = vec3(2., 10.0, 10.2);
		vec3 lightDirection = normalize(lightPosition - pos);
                
		float diffuse = max(0.0, dot(normal, lightDirection));
		float sss = saturate((sdf(pos + normal * .1 + lightDirection * .1) ) / .175);
		sss = smoothstep(0.0, 1.0, sss);
        
		vec3 H = normalize(lightDirection - ray.direction);
		float specular = pow(abs(dot(H, normal)), 10.0);

		float facingRatio = pow(1.0 - max(0.0, dot(normal, -ray.direction)), 2.5) * mix(.3, 1.1, sss);

		vec3 baseColor = GetBaseColor(pos, material);
		vec3 envColor = GetEnvColor(pos, material);
		vec3 coreColor = pow(baseColor, vec3(3.0));
		vec3 specularColor = GetSpecularColor(pos, material);
		vec3 ambient = envColor * envColor * .05 + coreColor * .1;
        
        vec3 resultColor = mix(baseColor*baseColor, coreColor*coreColor, saturate(1.0 - sss)) * (sss + diffuse * .2) * .5 * lightIntensity;
        resultColor += specularColor * (specular * .3) + envColor * envColor * facingRatio;
        resultColor += ambient * ambient * 3.0;
        
        if(material == MATERIAL_METAL)
			resultColor += texture(iChannel0, reflect(ray.direction, normal)).rgb;        

        return pow(resultColor, vec3(.45454));
    }
    
    // Cast to floor
    pos = ray.origin + ray.direction * (-(ray.origin.y + 1.05) / ray.direction.y);
    float ao = saturate(length(pos.xz) / 6.);
    ao = smoothstep(-.2, 1.0, ao) * .35 + .65;
    
    // Contact occlusion, bend direction towards reflection
    ao *= ambientOcclusion(pos, reflect(ray.direction, vec3(0.0, 1.0, 0.0)));
    
    float vignette = 1.0 - pow(length(uv) / 10., 2.0);
    return vec3(.15, .175, .2) * vignette * vignette * 6.5 * ao;
}

Intersection Raymarch(Ray ray)
{    
    Intersection outData;
    outData.sdf = 0.0;
    outData.totalDistance = MIN_DISTANCE;
        
	for(int j = 0; j < MAX_STEPS; ++j)
	{
        vec3 p = ray.origin + ray.direction * outData.totalDistance;
		outData.sdf = sdf(p);
		outData.totalDistance += outData.sdf;

		if(outData.sdf < EPSILON || outData.totalDistance > MAX_DISTANCE)
            break;
	}
    
    return outData;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (-iResolution.xy + (fragCoord*2.0)) / iResolution.y;    
    fragColor = vec4(0.0);
    
    if(abs(uv.y) > .75)
        return;    
    
    Ray ray = GetCamera(uv, .18, iTime);
    Intersection isect = Raymarch(ray);
    vec3 color = Render(ray, isect, uv);
	fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
