/*
 * Original shader from: https://www.shadertoy.com/view/tslXWl
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//uncomment this line to enable grayscale
//#define GRAYSCALE

const float PI=acos(-1.);
const float AA=2.;

float maxComp(vec3 c){
	return max(c.x,max(c.y,c.z));
}

//from https://www.shadertoy.com/view/4djSRW
float hash11(float p)
{
	vec3 p3  = fract(vec3(p) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
//  1 out, 2 in...
float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

//noise functions from https://www.shadertoy.com/view/Msf3WH
vec2 hash( vec2 p ){
	p = vec2( dot(p,vec2(127.1,311.7)),
			  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec2 p ){
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;

	vec2 i = floor( p + (p.x+p.y)*K1 );
	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = step(a.yx,a.xy);    
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;

    vec3 h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );

	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));

    return dot( n, vec3(70.0) );
	
}

float fNoise(vec2 p){
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    float f=0.;
    float str=.5;
    //change the number of iterations in this loop to make the contours more or less wobbly
    for(int i=0;i<4;i++){
        f += str*noise(p);
    	str/=2.;
        p = m*p;
    }
	return 0.5 + 0.5*f;
}

vec2 grad(vec2 p){
    vec2 eps=vec2(.001,0);
	return normalize(vec2(fNoise(p+eps.xy)-fNoise(p-eps.xy),
                		  fNoise(p+eps.yx)-fNoise(p-eps.yx)));
}
//palette from here https://www.shadertoy.com/view/ll2GD3
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 colorFromBand(vec2 p){
    float t=hash12(p);
    return pal(t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
}

vec3 render(vec2 crd,float t, float tc){
    vec2 uv=2.*crd/iResolution.xy-1.;
	float sz=iResolution.x/5.;

    float f=fNoise(uv);
    float n = 5.*hash11(.1*floor(sz*f));
    vec3 c=vec3(0.);
    vec2 g=grad(uv);
    for(float i=0.;i<4.;i+=1.){
        float s=i*PI/4.;
        vec2 d = vec2(cos(t+n+s),sin(t+n+s));
        if(d.y*g.x > d.x*g.y){
            c+=colorFromBand(vec2(f,i))*max(0.,(tc*dot(d,g)-tc+1.)*(3.*(.5-abs(fract(sz*f)-.5))));
        }
    }
    return c;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    float tc=20.*iMouse.x/iResolution.x+1.;
    float t=iTime*(2.*iMouse.y/iResolution.x+1.);
    vec3 c = vec3(0.);
    for(float i=0.;i<AA;i++){
    	for(float j=0.;j<AA;j++){
    		c+=render(fragCoord+(vec2(i,j)/AA),t,tc);
    	}
    }
    c/=AA*AA;
    #ifdef GRAYSCALE
    	fragColor = vec4(vec3(maxComp(c)),1.0);
    #else
    	fragColor = vec4(c,1.0);
    #endif
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
