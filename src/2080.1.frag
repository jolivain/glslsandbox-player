// volume explosion shader
// simon green / nvidia 2012
// http://developer.download.nvidia.com/assets/gamedev/files/gdc12/GDC2012_Mastering_DirectX11_with_Unity.pdf

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;

// sorry, port from HLSL!
#define float3 vec3
#define float4 vec4

// parameters
// be nice if we had sliders for these!
const int _MaxSteps = 64;
const float _StepDistanceScale = 0.5;
const float _MinStep = 0.001;
const float _DistThreshold = 0.005;

const int _VolumeSteps = 32;
const float _StepSize = 0.02; 
const float _Density = 0.1;

const float _SphereRadius = 0.5;
const float _NoiseFreq = 4.0;
const float _NoiseAmp = -0.5;
const float3 _NoiseAnim = float3(1, 0, 0);

// iq's nice integer-less noise function

// matrix to rotate the noise octaves
mat3 m = mat3( 0.00,  0.80,  0.60,
              -0.80,  0.36, -0.48,
              -0.60, -0.48,  0.64 );

float hash( float n )
{
    return fract(sin(n)*43758.5453);
}


float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*57.0 + 113.0*p.z;

    float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                    mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                        mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    return res;
}

float fbm( vec3 p )
{
    float f;
    f = 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p ); p = m*p*2.01;
    f += 0.0625*noise( p );
    p = m*p*2.02; f += 0.03125*abs(noise( p ));	
    return f/0.9375;
}


// distance field stuff
float sphereDist(float3 p, float4 sphere)
{
    return length(p - sphere.xyz) - sphere.w;
}

// returns signed distance to nearest surface
// displace is displacement from original surface (0, 1)
float distanceFunc(float3 p, out float displace)
{	
	float d = length(p) - _SphereRadius;	// distance to sphere
	//float d = length(p) - (sin(time*0.25)+0.8);	// animated radius
	
	// offset distance with pyroclastic noise
	//p = normalize(p) * _SphereRadius;	// project noise point to sphere surface
	displace = fbm(p*_NoiseFreq + _NoiseAnim*time);
	d += displace * _NoiseAmp;
	
	return d;
}

// calculate normal from distance field
float3 dfNormal(float3 pos)
{
    float eps = 0.001;
    float3 n;
    float s;
#if 0
    // central difference
    n.x = distanceFunc( float3(pos.x+eps, pos.y, pos.z), s ) - distanceFunc( float3(pos.x-eps, pos.y, pos.z), s );
    n.y = distanceFunc( float3(pos.x, pos.y+eps, pos.z), s ) - distanceFunc( float3(pos.x, pos.y-eps, pos.z), s );
    n.z = distanceFunc( float3(pos.x, pos.y, pos.z+eps), s ) - distanceFunc( float3(pos.x, pos.y, pos.z-eps), s );
#else
    // forward difference (faster)
    float d = distanceFunc(pos, s);
    n.x = distanceFunc( float3(pos.x+eps, pos.y, pos.z), s ) - d;
    n.y = distanceFunc( float3(pos.x, pos.y+eps, pos.z), s ) - d;
    n.z = distanceFunc( float3(pos.x, pos.y, pos.z+eps), s ) - d;
#endif

    return normalize(n);
}

// color gradient 
// this should be in a 1D texture really
float4 gradient(float x)
{
	const float4 c0 = float4(4, 4, 4, 1);	// hot white
	const float4 c1 = float4(1, 1, 0, 1);	// yellow
	const float4 c2 = float4(1, 0, 0, 1);	// red
	const float4 c3 = float4(0.4, 0.4, 0.4, 4);	// grey
	
	float t = fract(x*3.0);
	float4 c;
	if (x < 0.3333) {
		c =  mix(c0, c1, t);
	} else if (x < 0.6666) {
		c = mix(c1, c2, t);
	} else {
		c = mix(c2, c3, t);
	}
	//return float4(x);
	//return float4(t);
	return c;
}

// shade a point based on position and displacement from surface
float4 shade(float3 p, float displace)
{	
	// lookup in color gradient
	displace = displace*1.5 - 0.2;
	displace = clamp(displace, 0.0, 0.99);
	float4 c = gradient(displace);
	//c.a *= smoothstep(1.0, 0.8, length(p));
	
	// lighting
	float3 n = dfNormal(p);
	float diffuse = n.z*0.5+0.5;
	//float diffuse = max(0.0, n.z);
	c.rgb = mix(c.rgb, c.rgb*diffuse, clamp((displace-0.5)*2.0, 0.0, 1.0));
	
	//return float4(float3(displace), 1);
	//return float4(dfNormal(p)*float3(0.5)+float3(0.5), 1);
	//return float4(diffuse);
	//return gradient(displace);
	return c;
}

// procedural volume
// maps position to color
float4 volumeFunc(float3 p)
{
	float displace;
	float d = distanceFunc(p, displace);
	float4 c = shade(p, displace);
	return c;
}

// sphere trace
// returns hit position
float3 sphereTrace(float3 rayOrigin, float3 rayDir, out bool hit, out float displace)
{
	float3 pos = rayOrigin;
	hit = false;
	displace = 0.0;	
	float d;
	//float3 hitPos;
	float disp;
	for(int i=0; i<_MaxSteps; i++) {
		d = distanceFunc(pos, disp);
        	if (d < _DistThreshold) {
			hit = true;
			displace = disp;
			//hitPos = pos;
        		//break;	// early exit from loop doesn't work in ES?
        	}
		//d = max(d, _MinStep);
		pos += rayDir*d*_StepDistanceScale;
	}
	
	return pos;
	//return hitPos;
}


// ray march volume from front to back
// returns color
float4 rayMarch(float3 rayOrigin, float3 rayStep, out float3 pos)
{
	float4 sum = float4(0, 0, 0, 0);
	pos = rayOrigin;
	for(int i=0; i<_VolumeSteps; i++) {
		float4 col = volumeFunc(pos);
		col.a *= _Density;
		col.a = min(col.a, 1.0);
		
		// pre-multiply alpha
		col.rgb *= col.a;
		sum = sum + col*(1.0 - sum.a);	
#if 0
		// exit early if opaque
        	if (sum.a > _OpacityThreshold)
            		break;
#endif		
		pos += rayStep;
	}
	return sum;
}

void main(void)
{
    vec2 q = gl_FragCoord.xy / resolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= resolution.x/resolution.y;
	
    float rotx = mouse.y*4.0;
    float roty = mouse.x*4.0;
	
    // camera
    vec3 ro = 2.5*normalize(vec3(cos(roty), cos(rotx), sin(roty)));
    vec3 ww = normalize(vec3(0.0,0.0,0.0) - ro);
    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));
    vec3 vv = normalize(cross(ww,uu));
    vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );

    // sphere trace distance field
    bool hit;
    float displace;
    vec3 hitPos = sphereTrace(ro, rd, hit, displace);

    vec4 col = vec4(0, 0, 0, 1);
    if (hit) {
	// shade
   	col = shade(hitPos, displace);	// opaque version
	//col = rayMarch(hitPos, rd*_StepSize, hitPos);	// volume render
    }

    gl_FragColor = col;
}
