/*
 * Original shader from: https://www.shadertoy.com/view/llycW1
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
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.14159265359
#define maxDist 6.
#define nStep 25
#define nStepLight 3

float saturate(float i)
{
    return clamp(i,0.,1.);
}
float hash( float n ) {
    return fract(sin(n)*43758.5453);
}
float hash2( vec2 n ) {
    return fract(sin(dot(n,vec2(12.9898,78.233)))*43758.5453);
}

float noise(float p){
	float fl = floor(p);
  	float fc = fract(p);
	return mix(hash(fl), hash(fl + 1.0), fc);
}


// Created by inigo quilez - iq/2013
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

const mat3 m = mat3( 0.00,  0.80,  0.60,
           		    -0.80,  0.36, -0.48,
             		-0.60, -0.48,  0.64 );

float noise( in vec3 x ) { // in [0,1]
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.-2.*f);

    float n = p.x + p.y*57. + 113.*p.z;

    float res = mix(mix(mix( hash(n+  0.), hash(n+  1.),f.x),
                        mix( hash(n+ 57.), hash(n+ 58.),f.x),f.y),
                    mix(mix( hash(n+113.), hash(n+114.),f.x),
                        mix( hash(n+170.), hash(n+171.),f.x),f.y),f.z);
    return res;
}


float fbm( vec3 p ) { // in [0,1]
    float f;
    f  = 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );
    return f;
}
// --- End of: Created by inigo quilez --------------------


vec3 camera (vec2 ndc, vec3 camPos, float f, vec3 lookAt)
{
    vec3 forward = normalize(lookAt - camPos);
    vec3 right = cross(vec3(0.,1,0.), forward);
    vec3 up = normalize(cross (forward, right));
   	right = normalize(cross (up, forward));
    
    vec3 rd = up * ndc.y + right * ndc.x + f*forward;
    
	return rd;
}

float map (vec3 p)
{
    float v;
 	
	v = fbm (0.5*p);
    v =  noise((0.5*p + 5.*vec3(v,sin(v),0)));
    
  	v = 0.07 +  pow(v,7.);
    
    return v;
}

float lightMarch(vec3 ro, vec3 lightPos)
{
    vec3 rd = lightPos-ro;
    float d = length (rd);
    rd = rd/d;
    float t = 0.;
    float stepLength = d/ float(nStepLight);
    float densitySum = 0.;
    float sampleNoise;
    int _i = 0;
    for (int i = 0; i < nStepLight; i++)
    {
    	sampleNoise = map ( ro + t * rd);
       
        densitySum += sampleNoise;
        
        t += stepLength;
	_i++;
    }
    
    return exp(- d * (densitySum / float(_i)));
}

vec3 calculateLight(vec3 samplePos, vec3 lightPos, vec3 lightColor, float lightStr)
{
        float sampleLight = lightMarch (samplePos, lightPos);
        float distToLight = length(lightPos-samplePos)+1.;
        vec3 light = lightColor * lightStr * (1./(distToLight*distToLight)) * sampleLight;

    	return light;
}

vec3 march(vec3 ro, vec3 rd, float dither, float var)
{
    float value = 0.;
    float t = dither;
    float densitySum = 0.;

    float stepLength = maxDist / float(nStep);
    vec3 color = vec3(0);
    for (int i = 0; i < nStep; i++)
    {
        
        vec3 samplePos = ro + t * rd ; 
    	float sampleNoise = map (samplePos);
        densitySum += sampleNoise;
    	
        vec3 lightPos1 = vec3 (-2,1.8,0);
   		vec3 lightPos2 = vec3 (0.,0.,2.);
        
        vec3 light1 = calculateLight(samplePos, lightPos1, vec3 (0.6,0.25,0.15), 6.);
 		vec3 light2 = calculateLight(samplePos, lightPos2, vec3 (0.1 ,0.2,0.6), 6.);
        
        float n = 1. * (noise(samplePos.y+iTime)-0.5) + 0.4*samplePos.y;
        vec3 lightPos3 = vec3 (n,samplePos.y,7.*(hash(floor(0.1*iTime))-0.5));
    
      
        float storm = mix (1.5,0., sign(fract(0.1*iTime)-0.1 )) * noise (20.*iTime);
        vec3 light3 = calculateLight(samplePos, lightPos3, vec3 (1.,1.,1.), storm);

        
        vec3 ambientColor = vec3 (.0,0.1,0.1);
        color += exp(- t*(densitySum/float(i+1)))  * sampleNoise * (ambientColor + light1 + light2 + light3);
        
        t +=  stepLength * var;
    }
    
   
    return color;
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 ndc = uv * 2. - 1.;
    ndc.x *=iResolution.x/iResolution.y;
  
    vec2 mouse = iMouse.xy/iResolution.xy;
    

    vec3 cameraPos = vec3(0,0.,-3.);
    
    vec3 lookAt = vec3 (3.*cos(mouse.x*2.*PI), 0., 3.*sin(2.*PI*mouse.x ));
    
    lookAt = cameraPos + lookAt;
    lookAt = vec3(0.);
    
    //cameraPos = vec3 (10.*mouse.y*cos(mouse.x*2.*PI), 0., 10.*mouse.y*sin(2.*PI*mouse.x ));
    
    float distanceToCenter =  (sin(0.1*iTime)*0.5 + 1.) *4. +1.;
    
   	cameraPos = vec3  (distanceToCenter*cos(0.15*iTime), 0., distanceToCenter*sin(00.15*iTime));
    vec3 rd = camera(ndc, cameraPos, 1.0,lookAt);
    float var = length(rd)/1.0; //to get constant z in samples
    rd = normalize (rd);
    
    
    float dither = 0.2*hash2(uv);
    vec3 col = march(cameraPos, rd, dither,var);
    

    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
