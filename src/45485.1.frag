/*
 * Original shader from: https://www.shadertoy.com/view/Xsd3RH
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
// Created by randy read - rcread/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

#define N normalize

float min3( vec3 a ) { return min( a.x, min( a.y, a.z ) ); }
float max3( vec3 a ) { return max( a.x, max( a.y, a.z ) ); }

vec3 make_rd( vec2 p, vec3 c ) {
    vec2 r = iResolution.xy;
    vec3 b = vec3( 0, 1, 0 ), a = cross( b, c );
    p = ( p - r / 2. ) / r;
    b = cross( a, c );
    return N( p.x * a + p.y * b + c );
}

void mainImage( out vec4 o, vec2 i )
{
	float ti = iTime, c = .96;
	vec3 t, ip, 
        cl = vec3( 1 ), 
        ro = 11. * vec3( sin( ti * ( .1 + cos( ti / 1e6 ) / 4. ) ), sin( ti * .2 ), cos( ti * .5 ) ), 
        rd = make_rd( i, N( -ro ) );

	t = ( c - ro ) / rd;
	for ( int i = 0 ; i < 3 ; i++ ) {
		if ( t[i] >= 0. ) {
			ip = abs( ro + rd * t[i] );
			if ( max3( ip ) <= 4. * c ) {
				ip[i] = 1.;
				cl[i] = 1. - min3( ip );
			}
		}
	}
	o.rgb = smoothstep( .04, 0., cl );
    //*
    float d = max3( o.rgb );
    o.rgb = vec3( o.r + o.g, o.r + o.b, o.g + o.b );
    o.rgb = o.rgb * d / max3( o.rgb );
	//*/
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
  gl_FragColor.a = 1.0;
}
