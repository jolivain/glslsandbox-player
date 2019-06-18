/*
 * Original shader from: https://www.shadertoy.com/view/MssSDj
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
// Created by Ashwin Sudhir - thallippoli/2014
// ray marched field of hearts
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

const float max_iterations = 150.0;
const float stop_threshold = 0.0001;
const float grad_step = 0.1;
const float clip_far = 90.0;

// thanks to IQ for smin, path, and hash ===============================================

// polynomial smooth min (k = 0.1);
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec3 path( float t )
{
    vec2 p  = 100.0*sin( 0.02*t*vec2(1.0,1.2) + vec2(0.1,0.9) );
	     p +=  50.0*sin( 0.04*t*vec2(1.3,1.0) + vec2(1.0,4.5) );
	
	return vec3( p.x, 10. + 4.0*sin(0.05*t), p.y );   
}

float hash( vec2 p )
{
    float h = dot(p,vec2(127.1,311.7));
    
    return -1.0 + 2.0*fract(sin(h)*43758.5453123);
}
// =====================================================================================

float heart( vec3 pos, vec3 origin, float r ) 
{
    mat4 m = mat4( 1.0 );
    m[ 3 ] = vec4( 1.0, 1., 2. * hash( origin.zy ) * ( sin( 25.0 * iTime ) * 0.5 + 0.5 ) , 1.0 );
    vec3 c = vec3( 15, 20, 20 );
	pos = mod( pos, c ) - 0.5 * c;
    pos = ( m * vec4( pos, 1. ) ).xyz;
    
    float oval = length( pos - origin + vec3( 0, 7. * r / 3., 0 ) ) - 4. * r / 3. - pos.y / 2.8;
    float sphereLeft = length( pos - origin + vec3( r, r/3., 0 ) ) - r;
    float sphereRight = length( pos - origin + vec3( -r , r/3., 0 ) ) - r;
    
    return smin( min( sphereLeft, sphereRight ), oval, 1.8 ); 
}

float dist_field( vec3 pos ) 
{
	float d0 = heart( pos, vec3( 0.0, 1.5, 10.0 ), 1. );

    return d0;
}

vec2 rayMarch( vec3 origin, vec3 dir, float end ) 
{
	float depth = 0.0;
	for ( float i = 0.0; i < max_iterations; i++ ) 
	{
		float dist = dist_field( origin + dir * depth );
		if ( dist < stop_threshold )
			return vec2( depth, i / max_iterations );
		depth += dist;
		if ( depth >= end)
			return vec2( end, i / max_iterations );
	}
	return vec2( end, 1.0 );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 eye = vec3( path( iTime * 10. ).xy, iTime * 25.);
		
	float ar = iResolution.x / iResolution.y;
	
	vec2 ndcPoint = vec2( ( fragCoord.x / iResolution.x - 0.5) * ar, fragCoord.y / iResolution.y - 0.5 );
	vec3 dir = normalize( vec3( ndcPoint, 1.) );
    	
	vec2 result = rayMarch( eye, dir, clip_far );
    float s = 1.0 - result.x / clip_far;
    float o = result.y;
    fragColor = vec4( o * 2.5 + s, 0, 0, 1. );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
