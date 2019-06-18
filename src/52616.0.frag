/*
 * Original shader from: https://www.shadertoy.com/view/WsjGWV
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

// --------[ Original ShaderToy begins here ]---------- //
#define PI    3.1415926535
#define TWOPI 2.*PI
#define HPI   PI/2.
#define QPI   PI/4.

mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float merge(float a, float b, float c)
{
	float k = min(1., max(0., (b-a)/c + .5));
    return ((k*a) + (1.-k)*b) - ((1.-k) * k * .3);
}

float caps(vec3 p, float r, float l)
{
    return length(p-vec3(0., clamp(p.y, -l, l), 0.)) - r;
}

float torus(vec3 p, float r, float w)
{
    return sqrt(pow(length(p.xz)-r, 2.) + pow(p.y, 2.)) - w;
}

float sphere(vec3 p, float r)
{
    return length(p) - r;
}

float map(vec3 p)
{
    float speed = 6.;
    
    float body = caps(vec3(p.x, p.y+sin(iTime*speed)*.2, p.z), 1., .5);
    float legs = caps(vec3(abs(p.x)-.4, p.y+1.5+clamp(cos(iTime*speed+PI), -1., 0.)*.15, p.z), .2, .2);
    float belly = sphere(vec3(p.x, p.y+.6+cos(iTime*speed+PI)*.1, p.z), 1.);
    
    // Arm
    vec3 ap = p;
    ap.x = abs(ap.x);
    ap.xy *= rot(.6+sin(iTime*speed+QPI)*.07);
    float arms = caps(ap-vec3(.7, -.9, 0.), .1, .2);
    
    // Mouth
    float oMouth = torus(p.xzy-vec3(.0, 1., -sin(iTime*speed)*.2), .2, .1);
    float cMouth = caps(p.yxz-vec3(-sin(iTime*speed)*.2, 0., 1.), .1, .15);
    cMouth = min(cMouth, caps(p.yxz-vec3(-sin(iTime*speed)*.2+.1, 0., 1.), .1, .15));
    float mouth = mix(cMouth, oMouth, smoothstep(.9, 1., sin(iTime*speed)));
    
    // Eyes
    float eyes = sphere(vec3(abs(p.x)-.6, p.y-.25+sin(iTime*speed)*.2, p.z-.75), .12-smoothstep(.99, 1., sin(iTime*2.))*.1);
    return min(min(merge(merge(merge(body, legs, .5), belly, .6), arms, .5), mouth), eyes);
	//return flo;
}

float march(vec3 ro, vec3 rd)
{
    float t = 0.;
    for(int i=0; i<128; ++i) {
    	float d = map(ro+rd*t);
        if(d < .001) break;
        if(t > 1000.) return -1.;
        t += d;
    }
    return t;
}

vec3 getNormal(vec3 p)
{
    vec2 eps = vec2(0.001, 0.);
    return normalize(vec3(
    	map(p+eps.xyy) - map(p-eps.xyy),
        map(p+eps.yxy) - map(p-eps.yxy),
        map(p+eps.yyx) - map(p-eps.yyx)
    ));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy - vec2(.5);
    uv.x *= iResolution.x/iResolution.y;

    // Time varying pixel color
    vec3 eye = vec3(0., 0., 5.);
    vec3 dir = normalize(vec3(uv.x, uv.y, -1.));
    float d = march(eye, dir);
    vec3 p = eye+dir*d;
    vec3 col;
    
    if(d < 0.) {
        col = vec3(.01);
    } else {
    	vec3 normal = getNormal(p);
        col = .5*vec3(1., 1., 0.);
    	col += .4 * vec3(.8, .8, 1.) * max(0., dot(normal, vec3(1., 1., 1.)));
        col += .3 * vec3(1., .6, .9) * max(0., dot(normal, vec3(-1., 1., 1.)));
        col *= .4*col + 1.-max(0., dot(normal, vec3(0., 0., 1.)));
        col += .1*pow(col + max(0., dot(normal, vec3(1., 0., 1.))), vec3(2.));
        col = pow(col, vec3(3.));
    }

    // Output to screen
    col *= 1.-length(uv);
    col = sqrt(col);
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
