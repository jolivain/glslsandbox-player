/*
 * Original shader from: https://www.shadertoy.com/view/tl2GWm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Code by Flopine
// Thanks to wsmind, leon, XT95, lsdlive, lamogui, Coyhot, Alkama and YX for teaching me
// Thanks LJ for giving me the love of shadercoding :3

// Thanks to the Cookie Collective, which build a cozy and safe environment for me 
// and other to sprout :)  https://twitter.com/CookieDemoparty

const float ITER = 100.;
const float PI = acos(-1.);

//#define time iTime


mat2 rot (float a)
{return mat2 (cos(a),sin(a),-sin(a),cos(a));}

// iq modeling function
float capsule (vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p-a; vec3 ba = b-a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.,1.);
    return length(pa - ba*h) - r+smoothstep(0.1,0.6,abs(h-.5))*0.08;
}

float cutesule (vec3 p, vec3 a, vec3 b, float r1, float r2)
{
    vec3 pa = p-a; vec3 ba = b-a;
    float h = clamp(dot(pa,ba)/dot(ba,ba), 0.,1.);
    return length(pa - ba*h) - mix(r1,r2, h);
}

float body (vec3 p)
{
    return capsule (p, vec3(.65,0.,0.), vec3(-.65,0.,0.),0.5);
}

float neck (vec3 p)
{
    p.x += sin(p.y*2.)*0.2; 
    return cutesule (p-vec3(.9,.3,0.), vec3(0.), vec3(0.5,0.7,0.), 0.3, 0.45); 
}

float face (vec3 p)
{
    return cutesule(p-vec3(1.4,1.,0.), vec3(0.), vec3(.6,-0.3,0.), 0.4,0.25);
}

float legs (vec3 p)
{
    p.z = abs(p.z)-0.5;
    vec3 pp = p;

    p.x += sin (p.y*2.)*0.1;
    float l1 = capsule (p-vec3(.7,-1.3,0.), vec3(0.), vec3(0.,1.,-.2), 0.3);

    p = pp;
    p.x -= sin (p.y*2.)*0.2;
    float l2 = capsule (p-vec3(-.7,-1.4,0.), vec3(0.), vec3(0.,1.2,-.2), 0.28);
    return min(l2,l1);
}

float mane (vec3 p)
{
    p.z = abs(p.z)-0.15;
    p -= vec3(.4,.5,0.);
    p.xy *= rot(-PI/4.);
    p.x += sin(p.y*2.)*0.3; 
    float s1 = length(p-vec3(0.,1.,0.))-0.3;
    float s2 = length(p-vec3(0.,.6,0.))-0.25;
    float s3 = length(p-vec3(0.,.3,0.))-0.2;
    float s4 = length(p-vec3(0.,.05,0.))-0.1;
    return min(min(s4,s2),min(s1, s3));
}

float tail (vec3 p)
{
    p += vec3(1.6,.8,0.);
    p.xy *= rot(-PI/4.);
    p.x += sin(p.y*2.)*0.3; 
    float s1 = length(p-vec3(0.,1.,0.))-0.4;
    float s2 = length(p-vec3(0.,.4,0.))-0.35;
    float s3 = length(p-vec3(0.,.1,0.))-0.3;
    float s4 = length(p-vec3(0.,-0.2,0.))-0.2;

    return min(min(s4,s2),min(s1, s3));
}

float horn (vec3 p)
{
    p.xy -= vec2(1.2);
    p.xy *= rot(-PI/4.);
    return cutesule(p, vec3(0.), vec3(0.,1.,0.), 0.25,0.08);
}

int mat_id;
float SDF (vec3 p)
{
    float per = 5.5;
    p.yz *= rot(mix(PI/10., -PI/10., floor(sin(time*2.)+1.)));
    p.x -= time;
    p.y -= -.3+abs(sin(time*2.));
    p.x = mod(p.x-per*0.5, per)-per*0.5;

    float prim1 = min(min(body(p),legs(p)), min(neck(p),face(p)));
    float prim2 = horn(p);
    float prim3 = min(mane(p),tail(p));

    float d =  min(min(prim1, prim2),prim3);

    if (d == prim1) mat_id =1;
    if (d == prim2) mat_id =2;
    if (d == prim3) mat_id =3;

    return d;
}

vec3 palette (float t, vec3 a, vec3 b, vec3 c, vec3 d)
{return a+b*cos(2.*PI*(c*t+d));}


vec3 getnorm (vec3 p)
{
    vec2 eps = vec2(0.01,0.);
    return normalize(SDF(p) - vec3(SDF(p-eps.xyy),SDF(p-eps.yxy),SDF(p-eps.yyx)));
}

// iq shader: https://www.shadertoy.com/view/lsccR8
float sdfStar5( in vec2 p )
{
    // repeat domain 5x
    const vec2 k1 = vec2(0.809016994375, -0.587785252292); // pi/5
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 2.0*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;

    // draw triangle
    const vec2 k3 = vec2(0.951056516295,  0.309016994375); // pi/10
    return dot( vec2(abs(p.x)-0.3,p.y), k3);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
    uv -= 0.5;
    uv /= vec2(iResolution.y / iResolution.x, 1);

    float per = 3.;
    vec2 uu = mod(uv*10.,per)-per*0.5;
    uu *= rot(sin(time*2.)*0.5);

    vec3 ro = vec3(0.001,0.001,-6.); vec3 p = ro;
    vec3 rd = normalize(vec3(uv,1.));
    vec3 col = clamp(vec3(smoothstep(0.1,0.11,sdfStar5(uu)))+vec3(0.8,0.6,0.8),0.,1.);

    float shad = 0.; bool hit = false;

    for(float i=0.; i<ITER; i++)
    {
        float d = SDF(p);
        if (d<0.001)
        {
            hit = true;
            shad = i/ITER;
            break;
        }
        p+=d*rd*0.7;
    }
    if (hit)
    {
        vec3 n = getnorm(p);
        vec3 l = normalize(vec3(1.,2.,-8.));
        vec3 albedo;
        if (mat_id == 1) albedo = palette(dot(n, -rd),vec3(0.5), vec3(0.5), vec3(0.5), vec3(0.,0.37,0.73));
        if (mat_id == 2) albedo = palette(dot(n, -rd),vec3(0.5), vec3(0.5), vec3(3.), vec3(0.,0.37,0.73));
        if (mat_id == 3) albedo = palette(dot(n, -rd),vec3(0.5), vec3(0.5), vec3(0.9), vec3(0.,0.37,0.73));

        col = albedo + vec3(pow(max(0.,dot(reflect(rd,n), l)), 15.));
        col *= vec3(1.-shad);
    }


    fragColor = vec4(pow(col, vec3(0.4545)),1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
