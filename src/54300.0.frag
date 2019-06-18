/*
 * Original shader from: https://www.shadertoy.com/view/wlX3DH
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
#define T iTime*0.2

mat2 rot(float a)
{
    a*=3.1415926;
    return mat2(cos(a),sin(a),-sin(a),cos(a));
}

float map(vec3 p)
{
    p.xy *= rot(T*2.0 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.7*sin(0.2*T));
    p = abs(p)-3.;
    p = abs(p)-0.5;
    p = abs(p)-5.*(sin(T)*0.5+0.5);
    p.xy *= rot(T*2.0 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.7*sin(0.2*T));
    p = abs(p)-0.5;
    p = abs(p)-5.*(sin(T*3.0)*0.5+0.5);
    p = abs(p)-2.;
    float d=0.1;    
    d=max(d,dot(p,vec3(-1,-1,-1)));
    d=max(d,dot(p,vec3(1,-1,1)));
    d=max(d,dot(p,vec3(1,1,-1)));
    d=max(d,dot(p,vec3(-1,1,1)));
    return (d*0.577 - 0.1);
}

float map2(vec3 p)
{
    p.xy += rot(T*0.5 + 0.3*sin(0.5*T))*vec2(3);
    p.zx += rot(T*1.5 + 0.2*sin(0.2*T))*vec2(2);
    p.xy *= rot(T*2.0 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.7*sin(0.2*T));
    p = abs(p)-3.;
    p = abs(p)-0.5;
    p = abs(p)-5.*(sin(T)*0.5+0.5);
    p.xy *= rot(T*2.0 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.7*sin(0.2*T));
    p = abs(p)-0.5;
    p = abs(p)-5.*(sin(T*3.0)*0.5+0.5);
    p = abs(p)-2.;
    return length(cross(p,normalize(vec3(1))));
}

float map3(vec3 p)
{
    p.xy *= rot(T*2.0 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.7*sin(0.2*T));
    p = abs(p)-3.;
    p = abs(p)-0.5;
    p = abs(p)-5.*(sin(T)*0.5+0.5);
    p.xy *= rot(T*0.5 + 0.3*sin(0.5*T));
    p.zx *= rot(T*1.5 + 0.2*sin(0.2*T)); 
    p = abs(p)-0.5;
    p = abs(p)-8.*(sin(T*3.0)*0.5+0.5);
    p = abs(p)-8.*(sin(T*3.0)*0.5+0.5);
    p = abs(p)-2.;
    return length(cross(p,normalize(vec3(1))));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec3 col = vec3(0);
    vec3 rd = normalize(vec3(p,-2));
    vec3 ro = vec3(0,0,30);
    float t=0.0,d;
    for(int i=0; i<20; i++)
    {
        vec3 p = ro + rd * t;
        d = map(p) * 0.3;
        if(d<0.01)break;
        t +=d;
        
    }
    col += 0.05/d* vec3(0.5,0,0)/length(p)*0.8;
    
    rd = normalize(vec3(p,-1.5));
    ro = vec3(1,3,25);
    t=0.0;
    for(int i=0; i<30; i++)
    {
        vec3 p = ro + rd * t;
        d = map2(p) * 0.3;
        if(d<0.01)break;
        t +=d;
        
    }
    col += 0.02/d*vec3(0.7,0.3,0)/length(p)*0.5;
    
    rd = normalize(vec3(p,(1.0-dot(p, p)*0.5)*0.5));
    ro = vec3(1,3,15);
    t=0.0;
    for(int i=0; i<20; i++)
    {
        vec3 p = ro + rd * t;
        d = map3(p) * 0.3;
        if(d<0.01)break;
        t +=d;
        
    }
    col += vec3(.1,.0,.0)*exp(-d*d*50.);
    col = pow(col,vec3(1.2));
    t=T * 5.0;
	col +=vec3(1,0.5,0)* sin(p.y*500.0-t)*sin(p.x*300.0- t) *0.2;

    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
