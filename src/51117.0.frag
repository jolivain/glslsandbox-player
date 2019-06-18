/*
 * Original shader from: https://www.shadertoy.com/view/3dlGz4
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define EPSILON 0.001
#define FARCLIP 100.0
#define NEARCLIP 0.001
#define MATERIAL_NONE -1.0
#define MATERIAL_BODY 0.0
#define MATERIAL_FLOOR 1.0
#define MATERIAL_ARMS 2.0
#define MATERIAL_BUTTON 3.0
#define MATERIAL_NOSE 4.0

const vec3 kLightDir = vec3(0.268683, 0.228427, -0.127168);

vec2 opUnion(in vec2 a, in vec2 b)
{
    return a.x < b.x ? a : b;
}

float sdSphere(vec3 p, float r)
{
    return length(p) - r;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

vec2 mapBody(in vec3 p)
{
    p.y *= 1.2;
    float bottom = sdSphere(p + vec3(0.0, 0.0, 0.0), 0.8);
    float middle = sdSphere(p + vec3(0.0, -0.99, 0.0), 0.65);
    float head = sdSphere(p + vec3(0.0, -1.8, 0.0), 0.4);
    
    return vec2(min(middle, min(bottom, head)), MATERIAL_BODY);
}

vec2 mapArms(in vec3 p)
{
    p.y -= sin(iTime * 4.0) * 0.33;
    p.y += sin(p.x * 1.1 + iTime * 4.0) * 0.3;
    float arm = sdBox(p + vec3(0.0, -0.99, 0.0), vec3(1.4, 0.02, 0.02)) - 0.04;

    return vec2(arm, MATERIAL_ARMS);
}

vec2 mapButtons(in vec3 p)
{
    float b0 = sdSphere(p + vec3(0.0, -0.4, 0.6), 0.1);
    float b1 = sdSphere(p + vec3(0.0, -0.9, 0.59), 0.1);
    float b2 = sdSphere(p + vec3(0.0, -1.15, 0.45), 0.1);
    
    float e0 = sdSphere(p + vec3(0.25, -1.55, 0.28), 0.05);
    float e1 = sdSphere(p + vec3(-0.25, -1.55, 0.28), 0.05);
    
    return vec2(min(e1, min(e0, min(b0, min(b1, b2)))), MATERIAL_BUTTON);
}

vec2 mapScene(vec3 p)
{
    p.y *= 1.0 + sin(iTime * 4.0 + p.x * 0.25 + p.z * 0.25) * 0.1;
    vec3 rep = vec3(4.0, 0.0, 4.0);
    p = mod(p, rep) - 0.5 * rep;
     
    vec2 scene = vec2(0.0, -1.0);
    vec2 body = mapBody(p);
    vec2 arms = mapArms(p);
    vec2 buttons = mapButtons(p);
    vec2 flr = vec2(p.y + 0.28, MATERIAL_FLOOR);

    vec3 size = vec3(0.05, 0.1 * sin(p.z * 10.0), 0.4); 
    vec2 nose = vec2(sdBox(p + vec3(0.0, -1.5, 0.3), size) - 0.05, MATERIAL_NOSE);
    
    scene = opUnion(body, flr);
    scene = opUnion(scene, arms);
    scene = opUnion(scene, buttons);
    scene = opUnion(scene, nose);
    
    return scene;
}

vec2 rayMarch(in vec3 ro, in vec3 rd)
{
    float t = 0.0;
    for (int i = 0; i < 400; ++i)
    {
        vec2 r =  mapScene(ro + rd * t);
        if (r.x < EPSILON)
        {
            return vec2(t,r.y);
        }
        t += r.x * 0.7;
        if (t > FARCLIP) break;
    }
    return vec2(FARCLIP, -1.0);
}

void opRotate(inout vec2 p, float r)
{
    float c = cos(r);
    float s = sin(r);
    float vx = p.x * c - p.y * s;
    float vy = p.x * s + p.y * c;
    p.x = vx;
    p.y = vy;
}

vec3 opNormal(vec3 p)
{
    float d = mapScene(p).x;
    vec2 e = vec2(0.0, EPSILON);
    vec3 n = d - vec3(
        mapScene(p - e.yxx).x,
        mapScene(p - e.xyx).x,
        mapScene(p - e.xxy).x
    );
    return normalize(n);
}

vec3 baseShade(in vec3 ro, in vec3 rd, in vec2 ray)
{
    vec3 color = vec3(1.0, 0.0, 1.0);
    
    if (ray.y == MATERIAL_BODY)
    {
        color = vec3(1.0, 1.0, 1.0);
    }
    else if (ray.y == MATERIAL_FLOOR)
    {
        color = vec3(0.9, 0.9, 1.0);
    }
    else if (ray.y == MATERIAL_ARMS)
    {
        color = vec3(0.55, 0.32, 0.19);
    }
    else if (ray.y == MATERIAL_BUTTON)
    {
        color = vec3(0.0, 0.0, 0.0);
    }
    else if (ray.y == MATERIAL_NOSE)
    {
        color = vec3(1.0, 0.37, 0.2);
    }
    
    vec3 p = ro + rd * ray.x;
    vec3 n = opNormal(p);
    float diff = max(0.0, dot(n, normalize(kLightDir)));
    
    vec2 shadowRay = rayMarch(p + n * 0.001, normalize(kLightDir));
    if (shadowRay.x < FARCLIP)
    {
        color *= vec3(0.5, 0.5, 0.9);
    }
    
    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 color = vec3(1.0);
    vec2 uv = (fragCoord.xy / iResolution.xy - 0.5) * vec2(iResolution.x / iResolution.y, 1.0);    
    vec3 ro = vec3(0.0, 3.0, -5.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    opRotate(ro.yz, 0.3);
    opRotate(rd.yz, 0.3);
    
    float rx = (iMouse.x / iResolution.x * 2.0 - 1.0) * 3.15 * 2.0;
    opRotate(ro.xz, rx);
    opRotate(rd.xz, rx);
    
    vec2 r = rayMarch(ro, rd);
        
    if (r.x < FARCLIP)
    {
        color = baseShade(ro, rd, r);
    }
    
    color += 1.0 - pow((1.0 - (r.x / FARCLIP)), sqrt(0.1));
    
    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
 
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
