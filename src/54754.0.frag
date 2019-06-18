/*
 * Original shader from: https://www.shadertoy.com/view/tlX3Ds
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


//#define time iTime
const float PI = 3.141592;
const float ITER = 100.;

float stmin (float a, float b, float k, float n)
{
    float st = k/n;
    float u = b-k;
    return min(min(a,b), 0.5*(u+a+abs(mod(u-a+st, 2.*st)-st)));
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float moda (inout vec2 p, float rep)
{
    float per = 2.*PI/rep;
    float a = atan(p.y,p.x);
    float l = length(p);

    float id = floor(a/per);
    a = mod(a, per)-per*0.5;
    p = vec2(cos(a),sin(a))*l;
    return id;
}

void mo (inout vec2 p, vec2 d)
{
    p = abs(p)-d;
    if (p.y > p.x) p = p.yx;
}

mat2 rot (float a)
{return mat2(cos(a),sin(a),-sin(a),cos(a));}

float od (vec3 p, float d)
{return dot(p, normalize(sign(p)))-d;}

float cyl (vec3 p, float r, float h)
{return max(length(p.xy)-r,abs(p.z)-h);}

float box (vec3 p, vec3 c)
{
    vec3 q = abs(p)-c;
    return min(0., max(q.x,max(q.y,q.z))) + length(max(q,0.));
}

float pillars (vec3 p)
{
    p.xz *= rot(sin(p.y+time));
    moda(p.xz, 3.);
    p.x -= 0.8;
    float c = cyl(p.xzy, 0.2, 1e10);
    return c;
}

float platform (vec3 p)
{
    float t1 = PI/4. * (floor(time) + pow(fract(time),5.));
    p.xz *= rot(t1);
    float b = box(p, vec3(1.5,.2,1.5));
    moda(p.xz, 4.);
    p.x -= 2.;
    float o = od(p, 0.3);
    return stmin(b,o, 0.3,3.);
}

float SDF (vec3 p)
{
    float per = 8.;

    p.y += sin(p.z+time*2.);
    p.x += cos(p.z+time*2.);

    p.xy *= rot(p.z*0.2);
    p.z = mod(p.z-per*0.5, per)-per*0.5;
    moda (p.xy, 3.);
    mo (p.xy, vec2(2., 1.5));
    p.x -= 2.;
    float pil = pillars(p);
    float plat = platform(p);
    
    return stmin(pil, plat, 0.3, 4.);
}


vec3 get_cam (vec3 ro, vec3 tar, vec2 uv)
{
    vec3 f = normalize(tar-ro);
    vec3 l = normalize(cross(vec3(0.,1.,0.),f));
    vec3 u = normalize(cross(f,l));
    return normalize(f + l*uv.x + u*uv.y);
}

vec3 palette (float t, vec3 a, vec3 b, vec3 c, vec3 d)
{return a+b*cos(2.*PI*(c*t+d));}


float jaw (vec2 uv)
{
    uv *= 1.2;
    uv += vec2(0.08,0.1);
    return length(max(abs(uv.x),abs(uv.y)-uv.x*0.2));
}

float skull (vec2 uv)
{
    uv += vec2(.115,-.1);
    return length(uv)-0.07;
}

float neck (vec2 uv)
{
    uv += vec2(.2,0.4);
    uv *= rot(-PI/10.);
    uv = abs(uv);
    return length(max(uv.x-uv.y*0.1,uv.y)+0.05);
}

float nose (vec2 uv)
{
    uv += vec2(-0.16,0.05);
    uv *= rot(-PI/5.);
    uv *= vec2(5.,7.0);
    return length(uv)-0.01;
}

float dots_grid (vec2 uv)
{
    uv *= rot(PI/4.);
    float per = 0.08;
    uv = mod(uv, per)-per*0.5;
    return smoothstep(0.022, 0.011,length(uv));
}

float visage (vec2 uv)
{
    float face = smin(nose(uv),smin(neck(uv),smin(skull(uv), jaw(uv),0.1),0.2), 0.2);
    float inface = smoothstep(0.28,0.25,face);
    float outface =  smoothstep(face, 0.29,0.30)*smoothstep(0.3,0.29,face);;
    return clamp((dots_grid(uv)*(1.-outface))+inface,0.,1.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
    uv -= 0.5;
    uv /= vec2(iResolution.y / iResolution.x, 1);

    vec3 ro = vec3(0.001,0.001,-10.-time); vec3 p = ro;
    vec3 tar = vec3(cos(p.z+time*2.), sin(p.z+time*2.),0.);
    vec3 rd = get_cam(ro, tar, uv); 
    float shad = 0.;

    for (float i=0.; i<ITER; i++)
    {
        float d = SDF(p);
        if(d<0.01)
        {
            shad = i/ITER;
            break;
        }
        p += d*rd*0.2;
    }
    
    float t = length(ro-p);
    
    vec3 col = vec3(shad);
    col = mix(col, palette(abs(uv.y-.7), vec3(0.5),vec3(0.5), vec3(0.5), vec3(0.2, 0.5, 0.8)), 1.-exp(-0.002*t*t));
    col *= visage(uv);
    
    fragColor = vec4(pow(col,vec3(0.4545)),1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
