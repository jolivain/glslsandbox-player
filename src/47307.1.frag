/*
 * Original shader from: https://www.shadertoy.com/view/XddcWl
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
// Thanks iq and Shane

#define EPS      0.001
#define STEPS     1028
#define FAR        100.
#define PI acos( -1.0 )
#define TPI   PI * 2.0

float hash( float n )
{

    return fract( sin( n ) * 45843.349 );
    
}

float noise( in vec3 x )
{

    vec3 p = floor( x );
    vec3 k = fract( x );
    
    k *= k * k * ( 3.0 - 2.0 * k );
    
    float n = p.x + p.y * 57.0 + p.z * 113.0; 
    
    float a = hash( n );
    float b = hash( n + 1.0 );
    float c = hash( n + 57.0 );
    float d = hash( n + 58.0 );
    
    float e = hash( n + 113.0 );
    float f = hash( n + 114.0 );
    float g = hash( n + 170.0 );
    float h = hash( n + 171.0 );
    
    float res = mix( mix( mix ( a, b, k.x ), mix( c, d, k.x ), k.y ),
                     mix( mix ( e, f, k.x ), mix( g, h, k.x ), k.y ),
                     k.z
    				 );
    
    return res;
    
}

float fbm( in vec3 p )
{

    float f = 0.0;
    f += 0.5000 * noise( p ); p *= 2.02;
    f += 0.2500 * noise( p ); p *= 2.03;
    f += 0.1250 * noise( p ); p *= 2.01;
    f += 0.0625 * noise( p );
    f += 0.0125 * noise( p );
    return f / 0.9375;
    
}

vec2 path(in float z)
{
    float s = sin(z/24.)*cos(z/12.); return vec2(s*12., 0.);
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

mat2 rot( float a )
{

    return mat2( cos( a ), -sin( a ),
                 sin( a ),  cos( a )
               );
    
}

float map( vec3 p )
{

    /*vec2 tun = abs(p.xy-fbm(p))*vec2(0.5, 0.1071);
    float n = 1. - max(tun.x, tun.y) + (0.5);
    return min(n, p.y + fbm(p));*/
    
    float tun = length( p.xy - path( p.z ) ) - 12.0;
    float dif = length( p.xy - path( p.z ) ) - 6.5;
    float fin = max( tun, -dif );
    return fin - fbm( p + iTime );

}

vec3 norm( vec3 p )
{

    vec2 e = vec2( EPS, 0.0 );
    return normalize( vec3( map( p + e.xyy ) - map( p - e.xyy ),
                            map( p + e.yxy ) - map( p - e.yxy ),
                            map( p + e.yyx ) - map( p - e.yyx )
                          ) );
    
}

float softShadows( in vec3 ro, in vec3 rd )
{

    float res = 1.0;
    for( float t = 0.1; t < 8.0; ++t )
    {
    
        float h = map( ro + rd * t );
        if( h < EPS ) return 0.0;
        res = min( res, 2.0 * h / t );
    
    }
    
    return res;

}

vec3 shad( vec3 ro, vec3 rd, float t )
{

    vec3 p = ro + rd * t;
    vec3 n = norm( p );
    vec3 lig = normalize( vec3( 0.0, 0.0, iTime ) );
    vec3 ref = reflect( rd, n );
    vec3 col = vec3( 0.0 );
    //vec3 ref = texture( iChannel0, reflect( rd, n ) ).xyz;
    
    float amb = 0.5 + 0.5 * n.y;
    float dif = max( 0.0, dot( n, lig ) );
    float sha = softShadows( p, lig );
    float spe = pow( clamp( dot( ref, lig ), 0.0, 1.0 ), 16.0 );
    float rim = pow( 1.0 + dot( n, rd ), 2.0 );
    
    col += 0.4 * amb;
    col += 0.2 * dif * sha;
    col += 1.0 * spe;
    col += 0.5 * rim;
    col += mix( vec3( 0.3, 0.1, 0.0 ), vec3( 0.0, 0.1, 0.2 ), fbm( p + iTime ) );
    
    return col;
    
}

float ray( vec3 ro, vec3 rd, out float d )
{

    float t = 0.0; d = EPS;
    for( int i = 0; i < STEPS; ++i )
    {
    
        d = 0.5 * map( ro + rd * t );
        if( d < EPS || t > FAR ) break;
        
        t += d;
    
    }
    
    return t;

}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = ( -iResolution.xy + 2.0 * fragCoord ) / iResolution.y;
    vec2 mou = iMouse.xy / iResolution.xy;
    
    vec3 ro = vec3( ( -mou.x * TPI ), 0.0, iTime );
    vec3 ww = normalize( vec3( 0.0 ) - ro );
    vec3 uu = normalize( cross( vec3( 0.0, 1.0, 0.0 ), ww ) );
    vec3 vv = normalize( cross( uu, ww ) );
    vec3 rd = normalize( uv.x * uu + uv.y * vv + 1.5 * ww );
    
    //vec3 rd = ro + vec3( 0.0, 0.1, 0.5 );//ro + vec3( 0.0, 0.1, 0.5 );
    rd.xy += path( rd.z ); 
    ro.xy += path( ro.z );
    
    float d = 0.0;
    float t = ray( ro, rd, d );
    
	vec3 col = d < EPS ? shad( ro, rd, t ) : vec3( 1.0 );

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec3(mouse * resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
