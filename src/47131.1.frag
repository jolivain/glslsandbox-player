/*
 * Original shader from: https://www.shadertoy.com/view/ls3BWf
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
const float MIN_DIST = 0.0;
const float MAX_DIST = 15.0;
const float EPSILON = 0.0001;
const float PI = 3.14159;


mat4 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
        vec4(c, 0, s, 0),
        vec4(0, 1, 0, 0),
        vec4(-s, 0, c, 0),
        vec4(0, 0, 0, 1)
    );
}

mat4 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);

    return mat4(
        vec4(1, 0, 0, 0),
        vec4(0, c, -s, 0),
        vec4(0, s, c, 0),
        vec4(0, 0, 0, 1)
    );
}

mat4 rotateZ(float a ) {
    float c = cos( a );
    float s = sin( a );
    return mat4(
        c,-s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
}

mat4 scale(float a ) {
    return mat4(
        a,0, 0, 0,
        0, a, 0, 0,
        0, 0, a, 0,
        0, 0, 0, 1
    );
}

float sdSphere( vec3 p, float s)
{
  
  return length(p)-s;
}


float rand_1_05(in vec2 uv)
{
    float noise = (fract(sin(dot(uv ,vec2(12.9898,78.233)*2.0)) * 43758.5453));
    return noise;
}	


// Voronoi from iq
vec3 Voronoi( in vec3 x )
{
    x.y *= 15. * (1.+ cos(iTime)/15.); // scale of my voronoi
    x.x *= 15. * (1.- sin(iTime)/10.); 
    
    vec3 p = floor( x );
    vec3 f = fract( x );

	float id = 1.;
    vec2 res = vec2( .8 );
    for( int k=-1; k<=1; k++ )
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec3 b = vec3( float(i), float(j), float(k) );
        vec3 r = vec3( b ) - f + rand_1_05( 10.*vec2(p + b) );


        float d = dot( r, r ) ;

        if( d < res.x )
        {
			id = dot( p+b, vec3(1.0,57.0,113.0 ) );
            
            res = vec2( d, res.x );

            
        }
        else if( d < res.y )
        {
            res.y = d;
        }
    }

    return vec3( res, abs(id));
}


// Sphere uv mapping from aiekick : https://www.shadertoy.com/view/MtS3DD
vec3 sphere_map(vec3 p)
{
    vec2 uv;
    uv.x = 1. + atan(p.z, p.x) / (2.*3.14159);
    uv.y = 1. - asin(p.y) / 3.14159;
    return Voronoi(vec3(uv,0.0));
}


float map(vec3 originPos)
{
    vec3 ret = sphere_map(normalize(originPos));
	return length(originPos) - 1. - .5*ret.x * (-.5) * (.5+sin(iTime)/5.) ; //*(sin(iTime)/2.-2.);  // peaks variation   
}

float trace(vec3 o, vec3 r)
{
 float t= 0.0;
    for(int i=0; i< 45; ++i) // for number of iteration
    {
    	vec3 p = o + r*t; // until we find intersection
        float d = map(p);
        if (d < EPSILON) break;
        t += d ; // advancing on ray
    }
    return t;
        
}

float applyFog( float b ) 
{
    return pow(1.0 / (1.0 + b), 1.0);;
}

vec3 estimateNormal(vec3 p) 
{ float d = map(p); 
 return normalize(vec3( map(vec3(p.x + EPSILON, p.y, p.z)), map(vec3(p.x, p.y + EPSILON, p.z)), map(vec3(p.x, p.y, p.z + EPSILON)) ) - d); 
} 

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    uv = uv * 2.0 - 1.0;
	uv.x *= iResolution.x/iResolution.y;

    vec3 ro = vec3( 0.0, 0.0, -3.0 );      
    vec3 rd = normalize(vec3(uv,3.0)) ; // normalized so it does not poke geometry close to camera
    float t = trace(ro, rd); // distance
	vec3 intersection = ro + rd * t;     
    vec3 vNormal = estimateNormal(intersection);
    
    vec3 col = vec3(0.2);
	if(t < MAX_DIST)
    {
        // Determine light direction 
        vec3 ld = intersection - ro; // where the camera is (?)        
        ld = normalize(ld);

        // Spec
        float spec = pow(max(dot( reflect(-ld, vNormal), -rd), 0.), 16.); 
      	col *= sqrt( spec  * vec3(10.,10.0,10.0));
        col += sphere_map(normalize(intersection)) * vec3(1.,0.001,0.00005) * (1.+sin(iTime)/2.);

    }
    else // background
    {
     	col = vec3(0.2);


        vec3 light_color = vec3(0.9, 0., 0.1);
        float light = .0;

        light = (1.+cos(iTime)/10.)*0.1 / distance(normalize(uv)*(1.+cos(iTime)/5.)*0.68, uv);

        col+= light * light_color;
    }
	
	
	col = sqrt( col ) ;
    

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
