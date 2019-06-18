/*
 * Original shader from: https://www.shadertoy.com/view/tdX3W7
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

// --------[ Original ShaderToy begins here ]---------- //
#define T iTime
#define R iResolution.xy

#define PI 3.1415926536
#define HALF_PI 1.5707963268
#define TWO_PI 6.2831853072

// http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

	float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

/*


I never thought I would ever get to type
"The temple of bubbly spheres".  But then,
this happened!


Q: Are all of these techniques invented by IQ?
Not raymarching or SDFs, but the soft shadows
and distance functions?


PLEEASE Help me make this code better and easier to read!
Thanks in advance!

Inspiration: https://www.shadertoy.com/view/3dlGWH by user mla.
I think there were others like 3dlGWH as well, but I can't find them right now.


*/


#define REPEAT_LENGTH 2.3
#define SPHERE_Y 1.0
//#define INF_SPHERES

vec3 getOffset(vec3 p){
    return texture(iChannel0,p*0.8).xyz*2.0-1.0;
}


float map(vec3 p){
    vec3 p0=p;
    p+=0.01*getOffset(p0+vec3(T*0.1));
    
    p.z=mod(p.z,REPEAT_LENGTH)-0.5*REPEAT_LENGTH;
    
#ifdef INF_SPHERES
    p.x=mod(p.x,REPEAT_LENGTH)-0.5*REPEAT_LENGTH;
    return min(p.y,sdSphere(p-vec3(0.0,SPHERE_Y,0.0),1.0));
#endif
    
#ifndef INF_SPHERES
    p.x-=0.5*REPEAT_LENGTH;
    float sdf1 = sdSphere(p-vec3(0.0,SPHERE_Y,0.0),1.0);
    p.x+=REPEAT_LENGTH;
    float sdf2 = sdSphere(p-vec3(0.0,SPHERE_Y,0.0),1.0);
    return min(p.y,min(sdf1,sdf2));
#endif
}

float intersect(vec3 p, vec3 d) {
    float t=0.001;
    float h;
    for(int i=0;i<250;i++){
        h=map(p+t*d);
        if(h<0.001)return t;
        t+=h;
    }
    if(t>0.01)return -1.0;
    return t;
}

// https://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
float shadow(vec3 p, vec3 d){
    float t=0.01;
    float res=1.0;
    float ph=1e20;
    float k=10.0;
    for(int i=0;i<250;i++){
        float h=map(p+t*d);
        if(h<0.001)return 0.0;
        float y=h*h/(2.0*ph);
        float d=sqrt(h*h-y*y);
        res=min(res,k*d/max(0.0,t-y));
        ph=h;
        t+=h;
    }
    return res;
}

vec3 getNormal(vec3 p){
    float eps=0.001;
    return normalize(vec3(
        map(p+vec3(eps,0.0,0.0))-map(p-vec3(eps,0.0,0.0)),
        map(p+vec3(0.0,eps,0.0))-map(p-vec3(0.0,eps,0.0)),
        map(p+vec3(0.0,0.0,eps))-map(p-vec3(0.0,0.0,eps))
        ));
}

void mainImage(out vec4 fragColor,in vec2 fragCoord){
    vec2 uv=fragCoord/R.xy*2.0-1.0;
    uv.x*=R.x/R.y;
    
    vec3 camPos=vec3(0.0,1.0,T-5.0);
    vec3 lookAt=vec3(0.0,0.0,T);
    
    vec3 forward=normalize(lookAt-camPos);
    float ang=HALF_PI+0.2*cos(T*1.0+0.3);
    vec3 up=normalize(vec3(cos(ang),1.0,sin(ang)));
    vec3 right=cross(forward,up);
    vec3 dir=normalize(forward+up*uv.y+right*uv.x);
    
    float t=intersect(camPos,dir);
    if(t==-1.0){
        fragColor=vec4(0.0);
        return;
    }
    vec3 hit=camPos+dir*t;
    
#ifndef INF_SPHERES
    if(hit.x<-REPEAT_LENGTH*0.5||hit.x>REPEAT_LENGTH*0.5){
        fragColor=vec4(0.0);
        return;
    }
#endif
    vec3 hitDistorted=hit+(3.0+2.99*cos(T))*getOffset(hit+vec3(T*0.1));
    vec3 n=getNormal(hitDistorted);
    
    vec3 lightPos1=vec3(0.0,10.0+9.0*cos(T),T);
    vec3 lightPos2=vec3(2.0*sin(T),2.0,T);
    
	float diffuse1=dot(n,normalize(lightPos1-hitDistorted));
    float diffuse2=dot(n,normalize(lightPos2-hitDistorted));
    
    float light1=diffuse1*shadow(hit,normalize(lightPos1-hit));
    float light2=diffuse2*shadow(hit,normalize(lightPos2-hit));
    
    float totalLight=light1+10.0*light2;
//    totalLight=1.0;
    
    float fog=1.0*pow(1.9,-t);
    totalLight*=fog;
    
    fragColor=vec4(vec3(totalLight),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
