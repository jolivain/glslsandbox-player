/*
 * Original shader from: https://www.shadertoy.com/view/wdsXWl
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Original by by inigo quilez - iq/2019
// Modified by Leonard Ritter <leonard.ritter@duangle.com>
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// except cart2rad() which I release in the public domain.

// this is a modification of https://www.shadertoy.com/view/3dsSWs
// where the points of a square are mapped as equidistant points on a L1 circle
// and then projected to L2, resulting in sets of equidistant points on
// concentric circles.

// it's unlikely the same technique will work in 3D as it depends
// on a polar coordinate system, but it might work again in 4D?

//-----------------------------------------------

float dot2( in vec2 v ) { return dot(v,v); }
float maxcomp( in vec2 v ) { return max(v.x,v.y); }

float sdLineSq( in vec2 p, in vec2 a, in vec2 b )
{
	vec2 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return dot2( pa - ba*h );
}

float sdPointSq( in vec2 p, in vec2 a )
{
    return dot2(p-a);
}

//-----------------------------------------------

// convert from unit grid to unit circle
vec2 cart2rad(vec2 o) {
    vec2 p = vec2(o.x + o.y, o.y - o.x);
    // radius
    float d = (abs(p.x) + abs(p.y)) * 0.5;
    // if radius is never zero, the cheaper case can be used
#if 1
    float invd = (d == 0.0) ? 0.0 : (0.25 / d);
#else
    float invd = 0.25 / d;
#endif
    float h = p.y * invd - 0.5;
    // angle
    float a = (((p.x < 0.0)? -h : h) + 0.75) * 3.1415926;
    return d * vec2(cos(a), sin(a));
}

//-----------------------------------------------

vec2 vertex( int i, int j, int num)
{
    // unit square
    vec2 s = -1.0+2.0*vec2(i,j)/float(num);
    
    // unit circle
#if 1
    vec2 c = cart2rad(s);
#else
    // old function
    vec2 c = maxcomp(abs(s))*normalize(s);
#endif
    
    // blend
    return mix(c,s,smoothstep(-0.5,0.5,sin(iTime*2.0)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    // plane coords
    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    float w = 2.0/iResolution.y;
    
    // scale
	p *= 1.15;
	w *= 1.15;
    
    // mesh: body
    vec2 di = vec2(10.0);
    const int num = 10;
	for( int j=0; j<num; j++ )
	for( int i=0; i<num; i++ )
    {
        vec2 a = vertex(i+0,j+0,num);
        vec2 b = vertex(i+1,j+0,num);
        vec2 c = vertex(i+0,j+1,num);
        di = min( di, vec2(min(sdLineSq(p,a,b), 
                               sdLineSq(p,a,c)),
                               sdPointSq(p,a)));
    }

    // mesh: top and right edges
	for( int j=0; j<num; j++ )
    {
        vec2 a = vertex(num,j+0,num);
        vec2 b = vertex(num,j+1,num);
        vec2 c = vertex(j+0,num,num);
        vec2 d = vertex(j+1,num,num);
        di = min( di, vec2(min(sdLineSq(p,a,b), 
                               sdLineSq(p,c,d)),
                           min(sdPointSq(p,a),
                               sdPointSq(p,c))));
    }
    // mesh: top-right corner
    di.y = min( di.y, sdPointSq(p,vertex(num,num,num)));
    di = sqrt(di);

    
    // color
    float col = 1.0;
    col *= 0.9+0.1*smoothstep(0.0,0.05,di.x);
    col *= smoothstep(0.0,0.008,di.x);
    col *= smoothstep(0.03,0.03+w,di.y );
    
    // vignette
    col *= 1.0 - 0.15*length(p);
    
    fragColor = vec4(col,col,col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
