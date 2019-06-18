/*
 * Original shader from: https://www.shadertoy.com/view/4lVXDR
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

// --------[ Original ShaderToy begins here ]---------- //
/*

Just a test ray tracing a sphere with a twist.

--
Zavie

*/

#define MAX_BOUNCES 3
float gamma = 2.2;

// ---8<----------------------------------------------------------------------
// Material

struct Material
{
    vec3 c;		// diffuse color
    vec3 f0;	// specular color (colored)
};

// ---8<----------------------------------------------------------------------
// Geometry

#define PI acos(-1.)
float hash(float x) { return fract(sin(x) * 43758.5453); }
float hash(vec2 v){ return fract(sin(dot(v.xy ,vec2(12.9898,78.233))) * 43758.5453); }

struct Ray
{
    vec3 o;		// origin
    vec3 d;		// direction
};

struct Hit
{
    float t;	// solution to p=o+t*d
    vec3 n;		// normal
    Material m;	// material
};
const Hit noHit = Hit(1e10, vec3(0.), Material(vec3(-1.), vec3(-1.)));

struct Plane
{
    float d;	// solution to dot(n,p)+d=0
    vec3 n;		// normal
    Material m;	// material
};

struct Sphere
{
	float r;	// radius
    vec3 p;		// center position
    Material m;	// material
};

Hit intersectPlane(Plane p, Ray r)
{
    float dotnd = dot(p.n, r.d);
    if (dotnd > 0.) return noHit;

    float t = -(dot(r.o, p.n) + p.d) / dotnd;
    return Hit(t, p.n, p.m);
}

float surfaceHash(vec2 p, float freq)
{
    float h = 0.;
    float sum = 0.;
    for (int i = 0; i < 5; ++i)
    {
        h = 2. * h + hash(floor(freq * p));
        sum = 2. * sum + 1.;
        freq *= 2.;
    }
    
    return h / sum;
}

Hit intersectHashedSphere(Sphere s, Ray r)
{
	vec3 op = s.p - r.o;
    float b = dot(op, r.d);
    float det = b * b - dot(op, op) + s.r * s.r;
    if (det < 0.) return noHit;

    det = sqrt(det);
    float t1 = b - det;
    float t2 = b + det;

    float t = t1;
    vec3 p = r.o + t * r.d;
    vec3 n = (r.o + t*r.d - s.p) / s.r;
    
    // Reject intersection solution based on random magic.
    if (t < 0. || surfaceHash(p.xy + vec2(0., -iTime), 3.) < 0.5)
    {
        t = t2;
        p = r.o + t * r.d;
        n = -(r.o + t*r.d - s.p) / s.r;
    }
    if (t < 0. || surfaceHash(p.xy + vec2(0., -iTime), 3.) < 0.5)
    {
        return noHit;
    }

    return Hit(t, n, s.m);
}

vec3 randomVector(float seed)
{
    float r2 = hash(seed);
    float phi = 2. * PI * hash(seed + r2);
    float sina = sqrt(r2);
    float cosa = sqrt(1. - r2);

	return vec3(cos(phi) * sina, cosa, sin(phi) * sina);
}

bool compare(inout Hit a, Hit b)
{
    if (b.m.f0.r >= 0. && b.t < a.t)
    {
        a = b;
        return true;
    }
    return false;
}

Hit intersectScene(Ray r)
{
    vec3 axis1 = randomVector(floor(iTime));
    vec3 axis2 = randomVector(floor(iTime+1.));
    vec3 axis = normalize(mix(axis1, axis2, fract(iTime)));
    float translation = 4.*abs(2.*fract(iTime/8.)-1.) - 2.;

    Material weirdMat = Material(0.05 * vec3(0., 0.05, 1.), 0.1 * vec3(1.1, 0.08, 0.01));
    Sphere s = Sphere(1.6, vec3(0., 1.6, 0.), weirdMat);
    Plane p  = Plane(0., vec3(0., 1., 0.), Material(vec3(0.05), vec3(0.02)));

    Hit hit = noHit;
    compare(hit, intersectPlane(p, r));
    compare(hit, intersectHashedSphere(s, r));
    return hit;
}

// ---8<----------------------------------------------------------------------
// Light

struct DirectionalLight
{
    vec3 d;		// Direction
    vec3 c;		// Color
};

DirectionalLight sunLight = DirectionalLight(normalize(vec3(1., .5, .5)), vec3(1e3));
vec3 skyColor(vec3 d)
{
    float transition = pow(smoothstep(0.02, .5, d.y), 0.4);

    vec3 sky = 2e2*mix(vec3(0.52, 0.77, 1), vec3(0.12, 0.43, 1), transition);
    vec3 sun = sunLight.c * pow(abs(dot(d, sunLight.d)), 5000.);
    return sky + sun;
}

float pow5(float x) { return x * x * x * x * x; }

// Schlick approximation
vec3 fresnel(vec3 h, vec3 v, vec3 f0)
{
    return pow5(1. - clamp(dot(h, v), 0., 1.)) * (1. - f0) + f0;
}

float epsilon = 4e-4;

vec3 accountForDirectionalLight(vec3 p, vec3 n, DirectionalLight l)
{
    if (intersectScene(Ray(p + epsilon * l.d, l.d)).m.f0.r < 0.)
    {
        return clamp(dot(n, l.d), 0., 1.) * l.c;
    }
	return vec3(0.);
}

vec3 radiance(Ray r)
{
    vec3 accum = vec3(0.);
    vec3 attenuation = vec3(1.);

    for (int i = 0; i <= MAX_BOUNCES; ++i)
    {
        Hit hit = intersectScene(r);

        if (hit.m.f0.r >= 0.)
        {
            vec3 f = fresnel(hit.n, -r.d, hit.m.f0);

            vec3 hitPos = r.o + hit.t * r.d;

            // Diffuse
            vec3 incoming = vec3(0.);
            incoming += accountForDirectionalLight(hitPos, hit.n, sunLight);

            accum += (1. - f) * attenuation * hit.m.c * incoming;

            // Specular: next bounce
            attenuation *= f;
            vec3 d = reflect(r.d, hit.n);
            r = Ray(r.o + hit.t * r.d + epsilon * d, d);
        }
        else
        {
            accum += attenuation * skyColor(r.d);
            break;
        }
    }
    return accum;
}

// ---8<----------------------------------------------------------------------
// Tone mapping

// See: http://filmicgames.com/archives/75
vec3 Uncharted2ToneMapping(vec3 color)
{
	float A = 0.15;
	float B = 0.50;
	float C = 0.10;
	float D = 0.20;
	float E = 0.02;
	float F = 0.30;
	float W = 11.2;
	float exposure = 0.012;
	color *= exposure;
	color = ((color * (A * color + C * B) + D * E) / (color * (A * color + B) + D * F)) - E / F;
	float white = ((W * (A * W + C * B) + D * E) / (W * (A * W + B) + D * F)) - E / F;
	color /= white;
	color = pow(color, vec3(1. / gamma));
	return color;
}

// ---8<----------------------------------------------------------------------
// Scene

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = 2. * fragCoord.xy / iResolution.xy - 1.;

    float o1 = 0.25;
    float o2 = 0.75;
    vec2 msaa[4];
    msaa[0] = vec2( o1,  o2);
    msaa[1] = vec2( o2, -o1);
    msaa[2] = vec2(-o1, -o2);
    msaa[3] = vec2(-o2,  o1);

    vec3 color = vec3(0.);
    for (int i = 0; i < 4; ++i)
    {
        vec3 p0 = vec3(0., 1.1, 4.);
        vec3 p = p0;
        vec3 offset = vec3(msaa[i] / iResolution.y, 0.);
        vec3 d = normalize(vec3(iResolution.x/iResolution.y * uv.x, uv.y, -1.5) + offset);
        Ray r = Ray(p, d);
        color += radiance(r) / 4.;
    }

	fragColor = vec4(Uncharted2ToneMapping(color),1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
