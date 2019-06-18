/*
 * Original shader from: https://www.shadertoy.com/view/MsyyWG
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
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


#define PI 3.14159265

float smin(float a, float b, float k)
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

float smax(float a, float b, float k)
{
    return smin(a, b, -k);
}

vec3 path(float p)
{
    //return vec3(0);
	return vec3(sin(p*0.15)*cos(p*0.2)*2., 0.,0.);
}


// From Shane: https://www.shadertoy.com/view/lstGRB
float noise(vec3 p)
{
	const vec3 s = vec3(7, 157, 113);
	vec3 ip = floor(p);
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
	p -= ip; 
    p = p*p*(3. - 2.*p);
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z); 
}

float fbm(vec3 p)
{
    return noise(p*4.)+noise(p*8.)*0.5;
}

float map(vec3 p)
{    
    p-=path(p.z);
    float d0=noise(p*1.2+vec3(0,iTime,0))-0.6;
    d0=smax(d0,1.2+sin(p.z*0.1)*0.2-noise(p*3.)*0.3-length(p.xy),1.);
    d0=smin(d0,abs(p.y+1.1),.3);    
    return d0;
}

vec3 get_normal(in vec3 p) 
{
	const vec2 e = vec2(0.005, 0);
	return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy),	map(p + e.yyx) - map(p - e.yyx)));
}

float intersect(vec3 ro, vec3 rd)
{
    float t=0.01;
    float d=map(ro+t*rd);
    for(int i=0;i<96;++i)
    {
        if(abs(d)<0.005||t>100.)
            continue;
        t+=step(d,1.)*d*0.2+d*0.5;
        d=map(ro+t*rd);
    }
    if(t>100.)t=-1.;
    return t;
}

float shadow(vec3 ro, vec3 rd, float dist)
{
    float res=1.0;
    float t=0.05;
    float h;
    
    for(int i=0;i<12;i++)
    {
        if(t>dist*0.9) continue;
        h=map(ro+rd*t);
        res = min(6.0*h/t, res);
        t+=h;
    }
    return max(res, 0.0);
}                                                           

// density from aiekick: https://www.shadertoy.com/view/lljyWm
float density(vec3 p, float ms) 
{
	vec3 n = get_normal(p); 
	return map(p-n*ms)/ms;
}

vec3 tonemap(vec3 x) 
{
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q=fragCoord.xy/iResolution.xy;
    vec2 p=q*2.-1.;
    p.x*=iResolution.x/iResolution.y;
    vec3 ro=vec3(0.,0.,-iTime*2.);
    vec3 ta=ro+vec3(0,0,-1.);
    
    vec3 lp0=ro+vec3(0,-0.4,-1.5);
    
    ro+=path(ro.z);
    ta+=path(ta.z);
	lp0+=path(lp0.z);
    
    vec3 f=normalize(ta-ro);
    vec3 r=normalize(cross(f,vec3(0,1,0)));
    vec3 u=normalize(cross(r,f));
    
    vec3 rd=normalize(mat3(r,u,f)*vec3(p.xy,PI/2.));
    vec3 col=vec3(0.6,0.8,1.1);

    float t=intersect(ro,rd);
    if(t>-0.5)
    {
        vec3 pos=ro+t*rd;
        vec3 n=get_normal(pos);
        
        vec3 mate=2.*vec3(.9,0.3,.9);
                
        vec3 ld0=lp0-pos;
        float ldist=length(ld0);
        ld0/=ldist;
        vec3 lc0=vec3(1.2,0.8,0.5);
        
        float sha=shadow(pos+0.01*n, ld0, ldist);
        float dif=max(0.,dot(n,ld0))*sha*sha;
        float bac=max(0.,dot(n,-ld0));
        float amb=max(0.,dot(n,vec3(0,1,0)));
        float spe=pow(clamp(dot(ld0, reflect(rd, n)), 0.0, 1.0), 32.0);
        float fre=clamp(1.0+dot(rd,n), .0, 1.); 
        float sca=1.-density(pos,.5);
        
        vec3 Lo=(2.5*dif*lc0+
                 5.*spe*vec3(1.)*sha+
                 pow(fre,8.)*vec3(1.1,0.4,0.2))/(ldist);
        Lo+=.3*amb*vec3(0.5,0.8,1.);    
        Lo+=.3*bac*lc0;
        
       	Lo+=vec3(1.2,.2,0.)*sca;
        Lo+=vec3(0.,1.0,1.)*(1.-pow(fbm(pos*0.4+vec3(0,iTime*.5,0)),0.5));//*smoothstep(-1.5,1.,pos.y);
        Lo*=Lo;
        col=mate*Lo*0.2;
    }
    col=mix(col, .6*vec3(2.3,0.6,1.1), 1.0-exp(-0.0034*t*t) );
    col=tonemap(col);
    col=pow(clamp(col,0.0,1.0),vec3(0.45));    
    col=pow(col,vec3(0.95,.9,0.85));
    col*=pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1);
    fragColor.xyz=col;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
