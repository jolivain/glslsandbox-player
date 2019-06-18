/*
 * Original shader from: https://www.shadertoy.com/view/wdjGDK
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define MAX_STEPS 50
#define MAX_DIST 100.
#define SURF_DIST .01
#define PI 3.141592653589793
#define SUBSPHERE_COUNT 24
#define MAINSPHERE vec4(0, 0, 0, 1)

vec4 secondaries[SUBSPHERE_COUNT];

// Hash from Dave_Hoskins
#define HASHSCALE1 .1031
float hash11(float p)
{
	vec3 p3  = fract(vec3(p) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float Noise1D(float x)
{
	float p = floor(x);
	float f = fract(x);
   	f = f*f*(3.0-2.0*f);

	return mix(hash11(p), hash11(p+1.0), f);
}

vec3 GetSphericalFibonacciCoord(int ng, int index)
{
	float phi = ( 1.0 + sqrt ( 5.0 ) ) / 2.0;
    
  	float ngFloat = float(ng);

    float iFloat = float( - ng + 1 + 2 * index);
    float theta = 2.0 * PI * iFloat / phi;
    float sphi = iFloat / ngFloat;
    float cphi = sqrt ( ( ngFloat + iFloat ) * ( ngFloat - iFloat ) ) / ngFloat;

    return vec3(
        cphi * sin ( theta ),
        cphi * cos ( theta ),
		sphi);
}

// Smooth min function from IQ
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float GetDist(vec3 p) 
{
	vec4 s = MAINSPHERE;
    
    float sphereDist =  length(p-s.xyz)-s.w;
    float d=sphereDist;
    
	float sphere2Radius = 0.25;
	for(int i=0;i<SUBSPHERE_COUNT;i++)
    {
		vec4 secSpj = secondaries[i] ;
		float secondarySphereDist = length(p- secSpj.xyz - MAINSPHERE.xyz)-secSpj.w;
		d = smin(d, secondarySphereDist, .1);
    }
    
    return d;
}

// Raytrace inside volume to check for occlusion
float RayMarchOut(vec3 ro, vec3 rd) 
{
	float dO=0.;
    
    for(float i=0.0; i<1.0; i+=0.05) 
	{
    	vec3 p = ro + rd*i;
        float dS = GetDist(p);
		dO += 0.05 * step(dS, 0.0);
    }
	return exp(-dO*1.1);
}


float RayMarch(vec3 ro, vec3 rd) 
{
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) 
	{
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || dS<SURF_DIST) break;
    }
    
    return dO;
}

vec3 GetNormal(vec3 p) 
{
	float d = GetDist(p);
    vec2 e = vec2(.01, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}


vec3 GetLight(vec3 p, vec3 rd, float curd, vec4 noise) 
{
	vec3 SScol = vec3(0.8, 0.4, 0.4);

    // Light 1
	vec3 lightCol = vec3(1.0, 0.1, 0.1);
	float d2;
    
    vec3 lightPos = vec3(0, 2, 6);
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);
	d2 = RayMarchOut(p+rd*(SURF_DIST*4. + noise.x*0.05), l);
    float dif = dot(n, l);
	float invDif = clamp(-dif, 0., 1.); 
    dif = clamp(dif, 0., 1.);

	vec3 light = (0.5 + dif*0.5)*SScol*d2*lightCol ;
	vec3 v = -rd;
	vec3 reflect = normalize(2.0 * dif * n - l); 
	float specular = pow(clamp(dot(reflect, v), 0.0, 1.0), 12.0) * dif;
	float specular2 = pow(clamp(dot(reflect, v), 0.0, 1.0), 5.0) * dif;
	light += (vec3(specular) + specular2 * SScol)*lightCol;


    // Light 2
	lightCol = vec3(0.1, 0.1, 1.0);
 	lightPos = vec3(0, -2, -6);
    l = normalize(lightPos-p);
  	d2 = RayMarchOut(p+rd*(SURF_DIST*4. + noise.x*0.05), l);
    dif = dot(n, l);
	invDif = clamp(-dif, 0., 1.); 
    dif = clamp(dif, 0., 1.);
	
	light += (0.5 + dif*0.5)*SScol*d2*lightCol ;
	reflect = normalize(2.0 * dif * n - l); 
	specular = pow(clamp(dot(reflect, v), 0.0, 1.0), 12.0) * dif;
	specular2 = pow(clamp(dot(reflect, v), 0.0, 1.0), 5.0) * dif;
	light += (vec3(specular) + specular2 * SScol)*lightCol;

    return light;
}

vec3 RotateY(vec3 pos, float angle) 
{
	return vec3(
        pos.x * cos(angle) - pos.z * sin(angle),
        pos.y,
        pos.x * sin(angle) + pos.z * cos(angle)
    );
}

vec3 RotateX(vec3 pos, float angle) 
{
	return vec3(
        pos.x,
        pos.y * cos(angle) - pos.z * sin(angle),
        pos.y * sin(angle) + pos.z * cos(angle)
    );
}

// Reinhard Tonemapping
vec3 ToneMap(vec3 inColor)
{
    inColor *= 1.0;  // Hardcoded Exposure Adjustment
    inColor = inColor/(vec3(1)+inColor);
    vec3 retColor = pow(inColor,vec3(1.0/2.2));
    return retColor;
    
    return inColor;
}

// Raymarching inspired by RayMarching for Dummies! from BigWIngs
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// Avoid recomputing the sphere pos more than once per pixel
	for(int i=0;i<SUBSPHERE_COUNT;i++)
    {
		vec3 ssphPos = GetSphericalFibonacciCoord(SUBSPHERE_COUNT, i).xzy;
		float rndVal = Noise1D(float(i)*0.1+iTime*2.5+ssphPos.y);
		ssphPos *= (.7 + rndVal*.7);
		secondaries[i] = vec4(ssphPos, mix(0.5, 0.15, rndVal));
    }

    vec4 noise = texture(iChannel0, fragCoord/1024.0); 

    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 offset =  vec3(0.0, 0.0, 0.0);
	float angle = mix(iTime, 4.0-iMouse.x/iResolution.x*8.0, step( 0.001, iMouse.z ));

	vec3 ro = offset + vec3(0.0, 0.0, -8.0);
	vec3 rd = normalize(vec3(uv.x, uv.y, 2));
    
	ro = RotateY(ro, angle);
	rd = RotateY(rd, angle);

    //rd = RotateX(rd, 0.5);
    float d = RayMarch(ro, rd);
    
    vec3 p = ro + rd * d;
    
    vec3 col = mix( vec3(0.5, 0.5, 0.5), GetLight(p, rd, d, noise), step(d,50.0));
        
    fragColor = vec4(ToneMap(col),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
