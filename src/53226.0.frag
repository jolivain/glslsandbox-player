/*
 * Original shader from: https://www.shadertoy.com/view/3sfXzs
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
// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
float atan2(vec2 u)
{
    float s = (abs(u.x) > abs(u.y)) ? 1.0 : 0.0;
    return mix(3.14/2.0 - atan(u.x,u.y), atan(u.y,u.x), s);
}

vec2 hash( vec2 p ) { p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return fract(sin(p)*18.5453); }

// return distance(x), angle(z) and cell id(y)
vec2 voronoi( in vec2 x )
{
    vec2 n = floor( x );
    vec2 f = fract( x );

	vec3 m = vec3( 8.0 );
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2  g = vec2( float(i), float(j) );
        vec2  o = hash(n + g ) ;
//        vec2  o = hash(g );
      //vec2  r = g - f + o;
	    vec2  r = g - f + (.5 + .5  * sin(iTime+o*5.28));
//        float ang = atan2(r);
        float ang = (3.14/2.0 +atan2(r))/3.14;
		float d = length(r);//dot( r, r );
        if( d<m.x ){
            m = vec3( d, o );
            m.z = ang+iTime;
            m.y = ang + d*sin(iTime)*14.;
        
        }
    }

    return vec2( m.x, m.y+m.z );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = fragCoord.xy/max(iResolution.x,iResolution.y);
    
    // compute voronoi patterm
    vec2 c = voronoi( p *14.0);
//c.x +=sin(iTime)*.1;
    // colorize
    vec3 col = 0.5 + 0.5*cos( c.y*6.2831 + vec3(0.0,1.0,2.0) );	
    col *= clamp(1.0 - 0.4*c.x*c.x,0.0,1.0);
    col -= (1.0-smoothstep( 0.08, 0.09, c.x));
	
    fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
