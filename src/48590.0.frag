/*
 * Original shader from: https://www.shadertoy.com/view/XlKcRm
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
vec2 c2p(vec2 p){return vec2(atan(p.y,p.x),length(p));}
vec2 p2c(vec2 p){return vec2(cos(p.x),sin(p.x))*p.y;}
vec2 _min(vec2 a, vec2 b) {return a.x<b.x?a:b;}
vec3 look(vec2 xy, vec3 origin, vec3 target)
{
	vec3 up=normalize(vec3(0.,1.,0.));
    vec3 fwd=normalize(target-origin);
    vec3 right=normalize(cross(fwd,up));
    up=normalize(cross(fwd,right));
    return normalize(fwd+right*xy.x+up*xy.y);
}
#define LUM 1.
#define MAX_DISTANCE 20.
#define MAX_STEPS 70
#define EPSILON .001
float box(vec3 p, vec3 d)
{
    p=abs(p)-d;
    return max(p.x,max(p.y,p.z));
}
float map(vec3 p)
{
    p=p*0.8;
    p=p+2.;
    for(int i=0;i<5;i++)
    {
        p=p-vec3(1.,2.,3.);
    	p=p*1.5;
        p.xz=c2p(p.xz);
        p.x+=iTime/2.;
        p.xz=p2c(p.xz);
        p.xy=c2p(p.xy);
        p.x-=iTime/3.34;
        p.xy=p2c(p.xy);
        p=abs(p);
    }
	float d=box(p,vec3(0.5));
    return d;
}
float march(vec3 origin,vec3 ray)
{
    float t=0.;
    for(int i=0;i<MAX_STEPS; i++)
    {
        float len=float(i)*MAX_DISTANCE/float(MAX_STEPS);
        t+=pow(2.1/max(map(origin+ray*len),1.),1.);
    }
    return t/float(MAX_STEPS);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv=(fragCoord/iResolution.xy-.5)*2.;
	uv.x=uv.x*iResolution.x/iResolution.y;   
    vec3 camera=vec3(1.2);
    camera=vec3(sin(iTime/1.567),sin(iTime)*.2-.2,cos(iTime/1.567))*10.;
    vec3 ray=look(uv,camera,vec3(0.));
    // --- //
    vec3 pos=camera;
    vec3 dir=ray;
	float result=march(camera,ray);
    fragColor = vec4(vec3(.7,.8,1.)*atan(vec3(pow(result*2.8,2.))),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
