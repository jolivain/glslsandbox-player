/*
 * Original shader from: https://www.shadertoy.com/view/lt3fWj
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
#define PI (acos(-1.))

vec2 rotate(vec2 a, float b)
{
    float c = cos(b);
    float s = sin(b);
    return vec2(
        a.x * c - a.y * s,
        a.x * s + a.y * c
    );
}

// http://mercury.sexy/hg_sdf/
// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
    float angle = 2.*PI/repetitions;
    float a = atan(p.y, p.x) + angle/2.;
    float r = length(p);
    float c = floor(a/angle);
    a = mod(a,angle) - angle/2.;
    p = vec2(cos(a), sin(a))*r;
    // For an odd number of repetitions, fix cell index of the cell in -x direction
    // (cell index would be e.g. -5 and 5 in the two halves of the cell):
    if (abs(c) >= (repetitions/2.)) c = abs(c);
    return c;
}

float sdSphere(vec3 p, vec3 c, float r)
{
    return length(p-c)-r;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdTriPrism( vec3 p, vec2 h )
{
    vec3 q = abs(p);
    return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

vec2 scene(vec3 p)
{
    float floorPlane = p.y + 1.;

    vec3 rp = p;
    pModPolar(rp.xz, 12.);
    float sphere = length(rp*vec3(.9,1,1)-vec3(.3,0,0))-1.;

    sphere = abs(sphere+.05)-.05;

    vec3 mirrorP = p;
    mirrorP.z = -abs(mirrorP.z);

    // round eyes
    vec3 mp = p;
    mp.x = abs(mp.x);
    float eye = sdSphere(mp, vec3(.3,.4,-1.2), .17);
    sphere = max(sphere, -eye);

    // curved mouth
    float mouth1 = sdSphere(p, vec3(0,.6,-1), 1.);
    float mouth2 = sdSphere(p, vec3(0,1.3,-1), 1.35);
    sphere = max(sphere, -max(mouth1, -mouth2));

    // angular eyes
    sphere = max(sphere, -sdTriPrism(mp*vec3(1,-1,1)+vec3(-.25,.35,-1.), vec2(.2,1.1)));

    // both noses
    sphere = max(sphere, -sdTriPrism(mirrorP-vec3(0,.22,-1.), vec2(.1,1.1)));

    // angular mouth
    sphere = max(sphere, -sdTriPrism(mp*vec3(1,-1,1)+vec3(-.37,-.03,-1.), vec2(.16,1.1)));
    sphere = max(sphere, -sdTriPrism(mp*vec3(1,-1,1)+vec3(-.2,-.04,-1.), vec2(.18,1.1)));
    sphere = max(sphere, -sdTriPrism(mp*vec3(1,-1,1)+vec3(0,-.05,-1.), vec2(.2,1.1)));


    floorPlane = -sdBox(p-vec3(0,1,0), vec3(6,2.5,6));

    float stem = dot(vec4(rp,1),vec4(1,.1,0,-.2));
    stem = max(stem, p.y-1.3);
    stem = max(stem, -p.y+.95);

    return vec2(
        min(floorPlane,min(sphere,stem)),
        floorPlane < sphere 
        ? 0
        : sphere < stem
        ? 1
        : 2
    );
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy - .5;
    uv.x *= iResolution.x / iResolution.y;

    vec3 cam = vec3(0,0,-5);
    vec3 dir = normalize(vec3(uv,1));

    cam.yz = rotate(cam.yz, .3+sin(iTime*.1)*.1);
    dir.yz = rotate(dir.yz, .3+sin(iTime*.1)*.1);

    cam.xz = rotate(cam.xz, iTime*.4);
    dir.xz = rotate(dir.xz, iTime*.4);

    float t = 0.;
    for(int i=0;i<100;++i)
    {
        float k = scene(cam+dir*t).x;
        t += k;
        if (k<.001) break;
    }
    vec3 h = cam+dir*t;
    vec2 o = vec2(0.001,0);
    vec3 n = normalize(vec3(
        scene(h+o.xyy).x-scene(h-o.xyy).x,
        scene(h+o.yxy).x-scene(h-o.yxy).x,
        scene(h+o.yyx).x-scene(h-o.yyx).x
    ));
    vec2 mat = scene(h);

    vec3 candlePos = sin(iTime*vec3(
        18.1,
        15.6,
        14.7
    ))*.01;

    if (mat.x > 1.)
    {
        // sky
        out_color = vec4(0,0,0,1);
    }
    else if (mat.y == 0.)
    {
        // floor
        float fakeLight = clamp(1.-length(h)*.12,0.,1.);
        vec4 color = vec4(.2,0,.3,0);
        vec3 fh = fract(h*.5+.501)-.5;
        float checker = fh.x*fh.y*fh.z;
        out_color = color*float(checker>0.) * fakeLight;
    }
    else if (mat.y == 1. || mat.y == 2.)
    {
        vec3 fakeN = n;
        fakeN.xz = rotate(fakeN.xz, -iTime*.4);
        // pumpkin
        vec4 albedo = mat.y == 1. ? vec4(1,.5,0,0) : vec4(.1,.3,.1,1);
        out_color = albedo * (fakeN.x*.5+.5);
        out_color += pow(dot(fakeN,normalize(vec3(1,1,-1)))*.5+.5,20.)*.2;
    }

    out_color = clamp(out_color, 0.,1.);

    bool occluded = false;
    vec3 lightCheckDir = normalize(candlePos-h);
    t=0.;
    h += n *.01;
    h *= .995;
    float lowestK = 1e9;
    for(int i=0;i<32;++i)
    {
        if (occluded)
            break;
        float k = scene(h+lightCheckDir*t).x;
        t += k;
        lowestK = min(k,lowestK);
        if (k<0.001)
            occluded=true;
        else if (t > distance(candlePos, h))
            break;
    }

    if(!occluded)
        out_color += vec4(1,.9,.1,1) * .3 * smoothstep(0.,.02,lowestK);

    //out_color = vec4(n*.5+.5,0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
