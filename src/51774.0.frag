/*
 * Original shader from: https://www.shadertoy.com/view/3ds3Rj
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
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define PI 3.14159265

float love_curve(in float x, in float a)
{
    // abs(x) to avoid the result being complex number
    // but seems some systems handle it well without the abs()
    return pow(abs(x),2./3.)+0.9*sqrt(3.3-x*x)*sin(a*PI*x);
}

float grad_love_curve(float x, float a)
{
	// abs(x) in the pow
	return -0.9*x*sin(a*PI*x)/sqrt(3.3-x*x)+
        	0.9*a*PI*sqrt(3.3-x*x)*cos(a*PI*x)+
        	0.666667/pow(abs(x),1./3.);

}
vec2 getsubpixel(int id,vec2 fragCoord)
{
	vec2 aa=vec2(floor((float(id)+0.1)*0.5),mod(float(id),2.0));
	return vec2((2.0*fragCoord.xy+aa-iResolution.xy)/iResolution.y);
}


vec2 barrel(vec2 p)
{   
    float k=.03;
    float r=p.x*p.x+p.y*p.y;
    p*=1.6+k*r+k*r*r;
    return p;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 q=fragCoord/iResolution.xy;
     
    vec3 tot=vec3(0.);
    for(int i=0;i<4;++i)
    {
        vec2 p=getsubpixel(i,fragCoord);
        
        if(abs(p.x)-0.72>0.)
            continue;
        
        p.x-=0.001;
        p.y+=0.2;
 
        p*=2.5;
        float eps = 0.00001;

        float f, df, d;

        float t=1.0/iResolution.y;

        f=love_curve(p.x, (sin(iTime*0.5)*0.5+0.5)*16.);
        //df=(f-love_curve(p.x+eps, (sin(iTime)*0.5+0.5)*16.))/eps;
        df=grad_love_curve(p.x,(sin(iTime*0.5)*0.5+0.5)*16.);
        d=abs(p.y-f)/sqrt(1.0+df*df);

        vec3 col=vec3(0.0);
        col=mix(col, vec3(0.,0.7,0.), 1.-smoothstep(0., t*2., d/2.5));
        tot+=col;
    }
    tot/=4.0;
    
    vec2 p=2.*q-1.;
    p=barrel(p);
    p.x*=iResolution.x/iResolution.y;
    
    p=mod(p,0.5)-.25;
    tot=mix(tot,vec3(0.,0.1,0.0),smoothstep(0.,0.01,p.x)-smoothstep(0.01,0.02,p.x));
    tot=mix(tot,vec3(0.,0.1,0.0),smoothstep(0.,0.01,p.y)-smoothstep(0.01,0.02,p.y));
    
    
    tot=pow(clamp(tot,0.0,1.0),vec3(0.45)); 
    tot*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.8);  // vigneting
    fragColor.xyz=tot;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
