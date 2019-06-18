#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// port from https://www.shadertoy.com/view/lsySzd
// "Volumetric explosion" by Duke
//-------------------------------------------------------------------------------------
// Based on "Supernova remnant" (https://www.shadertoy.com/view/MdKXzc) 
// and other previous shaders 
// otaviogood's "Alien Beacon" (https://www.shadertoy.com/view/ld2SzK)
// and Shane's "Cheap Cloud Flythrough" (https://www.shadertoy.com/view/Xsc3R4) shaders
// Some ideas came from other shaders from this wonderful site
// Press 1-2-3 to zoom in and zoom out.
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
//-------------------------------------------------------------------------------------

// Whoever forced "BOTH" to be the default was a complete jackass...way to ruin a beautiful shader...
//
// comment this string to see each part in full screen
//#define BOTH
// uncomment this string to see left part
#define LEFT

//#define LOW_QUALITY

#define DITHERING

//#define TONEMAPPING

//-------------------
#define pi 3.14159265
#define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)

vec3 hash( vec3 p )
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}
float fbm( vec3 p )
{
   return noise(p*.06125)*.5 + noise(p*.125)*.25 + noise(p*.25)*.125 + noise(p*.4)*.2;
}

float rand(vec2 co)
{
   return fract(sin(dot(co*0.123,vec2(12.9898,78.233))) * 43758.5453);
}

float Sphere( vec3 p, float r )
{
   return length(p)-r;
}

//==============================================================
// otaviogood's noise from https://www.shadertoy.com/view/ld2SzK
//--------------------------------------------------------------
// This spiral noise works by successively adding and rotating sin waves while increasing frequency.
// It should work the same on all computers since it's not based on a hash function like some other noises.
// It can be much faster than other noise functions if you're ok with some repetition.
const float nudge = 4.;	// size of perpendicular vector
float normalizer = 1.0 / sqrt(1.0 + nudge*nudge);	// pythagorean theorem on that perpendicular to maintain scale
float SpiralNoiseC(vec3 p)
{
    float n = -mod(time * 0.2,-2.); // noise amount
    float iter = 2.0;
    for (int i = 0; i < 8; i++)
    {
        // add sin and cos scaled inverse with the frequency
        n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;	// abs for a ridged look
        // rotate by adding perpendicular and scaling down
        p.xy += vec2(p.y, -p.x) * nudge;
        p.xy *= normalizer;
        // rotate on other axis
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;
        // increase the frequency
        iter *= 1.733733;
    }
    return n;
}

float VolumetricExplosion(vec3 p)
{
    float final = Sphere(p,4.);
    #ifdef LOW_QUALITY
    final += noise(p*12.5)*.2;
    #else
    final += fbm(p*50.);
    #endif
    final += SpiralNoiseC(p.zxy*0.4132+333.)*3.0; //1.25;

    return final;
}

float map(vec3 p) 
{
	R(p.xz, mouse.x*0.008*pi+time*0.1);

	float VolExplosion = VolumetricExplosion(p/0.5)*0.5; // scale
    
	return VolExplosion;
}
//--------------------------------------------------------------

// assign color to the media
vec3 computeColor( float density, float radius )
{
	// color based on density alone, gives impression of occlusion within
	// the media
	vec3 result = mix( vec3(1.0,0.9,0.8), vec3(0.4,0.15,0.1), density );
	
	// color added to the media
	vec3 colCenter = 7.*vec3(0.8,1.0,1.0);
	vec3 colEdge = 1.5*vec3(0.48,0.53,0.5);
	result *= mix( colCenter, colEdge, min( (radius+.05)/.9, 1.15 ) );
	
	return result;
}

bool RaySphereIntersect(vec3 org, vec3 dir, out float near, out float far)
{
	float b = dot(dir, org);
	float c = dot(org, org) - 8.;
	float delta = b*b - c;
	if( delta < 0.0) 
		return false;
	float deltasqrt = sqrt(delta);
	near = -b - deltasqrt;
	far = -b + deltasqrt;
	return far > 0.0;
}

// Applies the filmic curve from John Hable's presentation
// More details at : http://filmicgames.com/archives/75
vec3 ToneMapFilmicALU(vec3 _color)
{
	_color = max(vec3(0), _color - vec3(0.004));
	_color = (_color * (6.2*_color + vec3(0.5))) / (_color * (6.2 * _color + vec3(1.7)) + vec3(0.06));
	return _color;
}

void main( void )
{  

    	vec2 uv = gl_FragCoord.xy/resolution.xy;
    
	// ro: ray origin
	// rd: direction of the ray
	vec3 rd = normalize(vec3((gl_FragCoord.xy-0.5*resolution.xy)/resolution.y, 1.0));
	vec3 ro = vec3(0., 0., -6.);
    	
	#ifdef DITHERING
	vec2 seed = uv + fract(time);
	#endif 
	
	// ld, td: local, total density 
	// w: weighting factor
	float ld=0., td=0., w=0.;

	// t: length of the ray
	// d: distance function
	float d=1., t=0.;
    
    	const float h = 0.1;
   
	vec4 sum = vec4(0.0);
   
    	float min_dist=0.0, max_dist=0.0;

   	if(RaySphereIntersect(ro, rd, min_dist, max_dist))
    	{
       
	t = min_dist*step(t,min_dist);
   
	// raymarch loop
    	#ifdef LOW_QUALITY
	for (int i=0; i<56; i++)
    	#else
    	for (int i=0; i<86; i++)
    	#endif
	{
	 
	    vec3 pos = ro + t*rd;
  
	    // Loop break conditions.
	    if(td>0.9 || d<0.12*t || t>10. || sum.a > 0.99 || t>max_dist) break;
        
	    // evaluate distance function
	    float d = map(pos);
        
	    #ifdef BOTH
	    if (uv.x<1.0)
	    {
            	d = abs(d)+0.07;
	    }
	    #else
	    #ifdef LEFT
	    d = abs(d)+0.07;
	    #endif
	    #endif
        
	    // change this string to control density 
	    d = max(d,0.03);
        
	    // point light calculations
	    vec3 ldst = vec3(0.0)-pos;
	    float lDist = max(length(ldst), 0.001);
	    
	    // the color of light 
	    vec3 lightColor=vec3(1.0,0.5,0.25);
        
	    sum.rgb+=(lightColor/exp(lDist*lDist*lDist*.08)/30.); // bloom
        
	    if (d<h) 
	    {
	    // compute local density 
	    ld = h - d;
            
	    // compute weighting factor 
	    w = (1. - td) * ld;
     
	    // accumulate density
	    td += w + 1./200.;
		
	    vec4 col = vec4( computeColor(td,lDist), td );
            
            // emission
            sum += sum.a * vec4(sum.rgb, 0.0) * 0.2 / lDist;	
            
	    // uniform scale density
	    col.a *= 0.2;
	    // colour by alpha
	    col.rgb *= col.a;
	    // alpha blend in contribution
	    sum = sum + col*(1.0 - sum.a);  
       
	    }
      
	    td += 1./70.;
		
	    #ifdef DITHERING
	    d=abs(d)*(.8+0.2*rand(seed*vec2(i)));
	    #endif 
		
	    // trying to optimize step size
	    #ifdef LOW_QUALITY
	    t += max(d*0.25,0.01);
	    #else
	    t += max(d * 0.08 * max(min(length(ldst),d),2.0), 0.01);
	    #endif
                
	}
    
	// simple scattering
	#ifdef LOW_QUALITY    
	sum *= 1. / exp( ld * 0.2 ) * 0.9;
	#else
	sum *= 1. / exp( ld * 0.2 ) * 0.8;
	#endif
        
   	sum = clamp( sum, 0.0, 1.0 );
   
	sum.xyz = sum.xyz*sum.xyz*(3.0-2.0*sum.xyz);
    
	}
   
	#ifdef TONEMAPPING
	gl_FragColor = vec4(ToneMapFilmicALU(sum.xyz*2.2),1.0);
	#else
	gl_FragColor = vec4(sum.xyz,1.0);
	#endif
}
