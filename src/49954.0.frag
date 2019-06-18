/*
 * Original shader from: https://www.shadertoy.com/view/Mt3BRj
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
// ----------------------------------------------------------------------------------------
//	"Square Cubed" by Antoine Clappier - Oct 2018
//
//	Licensed under:
//  A Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
//	http://creativecommons.org/licenses/by-nc-sa/4.0/
// ----------------------------------------------------------------------------------------


#define Pi     3.14159265359
#define Tau    6.28318530718

#define ToRad(a)     ((a)*Pi/180.0)
#define ToDeg(a)     ((a)*180.0/Pi)

#define Rot(a)       mat3(cos(ToRad(a)),-sin(ToRad(a)),0.,sin(ToRad(a)),cos(ToRad(a)),0.,0.,0.,1.)
#define RotP(a,p)    (Translate(-p)*Rot(a)*Translate(p))
#define Rot45        Rot(45.0)
#define Scale(s)     mat3(1./(s),0.,0.,0.,1./(s),0.,0.,0.,1.0)
#define Translate(t) mat3(1.,0.,0.,0.,1.,0.,-(t).x,-(t).y,1.0)


#define Count 2.0
#define Duration 15.0

// -----------------------------------------------------------
// -----------------------------------------------------------

// IQ’s Exact signed distance of a Rhombus
float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }
float RhombusSd(in vec3 p, in vec2 size) 
{
    vec2 q = abs(p.xy);

    float h = clamp( (-2.0*ndot(q,size) + ndot(size,size) )/dot(size,size), -1.0, 1.0 );
    float d = length( q - 0.5*size*vec2(1.0-h,1.0+h) );
    return d * sign( q.x*size.y + q.y*size.x - size.x*size.y );
}


// -----------------------------------------------------------
// -----------------------------------------------------------


vec4 Tile(vec2 uvi, vec2 uvf, float eps, float t)
{
    // Tweeners:
    float t0 = smoothstep(    0.0, 1.0/3.0, t);
    float t1 = smoothstep(1.0/3.0, 2.0/3.0, t);
    float t2 = smoothstep(2.0/3.0,     1.0, t);
    float ts = mix(t0, 1.0-t2, step(0.5,t));
 
    // Cube/hexagon center:
    float cc = sqrt(3.0)/6.0;
    vec2 ccc = vec2(cc-0.5, 0.5-cc);
                          
    // Post rotation and translation:
    mat3 post = Scale(1.0);
    post = Translate(-t0*ccc);
    post *= Translate( t2*ccc);
    post *= RotP(180.*t1, vec2(0.0));

    // Rhombus transforms:
    mat3 tfm0, tfm1, tfm2;
    tfm0  = Rot45*Translate(vec2(-0.5,0.5));
    tfm0 *= post;

    tfm1 =  Rot(135.)*Translate(vec2(-0.5,-0.5));
    tfm1 *= RotP(30.*t0, vec2(-1.0,0.0));
    tfm1 *= RotP(-30.*t2, vec2(-1.0,0.0));
    tfm1 *= post;
    
    tfm2  = Rot(135.)*Translate(vec2(0.5,0.5));
    tfm2 *= RotP(-30.*t0, vec2(0.0,1.0));
    tfm2 *= RotP(30.*t2, vec2(0.0,1.0));
    tfm2 *= post;

    // Rhombus size:
    vec2 s = vec2(1.0, mix(1.0, sqrt(3.0)/3.0, ts)) / sqrt(2.0);
    
    // Draw Rhombus:
    vec3 uvh = vec3(uvf,1.0);
    vec4 c = vec4(0.0);
    c = mix(vec4(vec3(0.2),1.0), c, smoothstep(0.0, eps, RhombusSd(tfm2*uvh, s)));
    c = mix(vec4(vec3(0.8),1.0), c, smoothstep(0.0, eps, RhombusSd(tfm0*uvh, s)));
    c = mix(vec4(vec3(0.5),1.0), c, smoothstep(0.0, eps, RhombusSd(tfm1*uvh, s)));

    return c;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized coordinates:
    float eps = 2.0/iResolution.y;
    vec2  uv =  eps*(fragCoord - 0.5*iResolution.xy);
	float t  = fract(iTime/Duration);
    
    // Rotate field:
    float tr = 0.3*t+0.7*smoothstep(0.0, 1.0, t);
    uv = (Rot(-180.*tr)*vec3(uv,1.)).xy;
    
    // Tiling:
    vec2 uvf, uvi;
    uv = uv*Count - vec2(0.5);
    uvi = floor(uv);
    uvf = 2.0*fract(uv)-1.0;
    eps *= 2.0*Count;

    // Render tile:
    vec4 tile = Tile(uvi, uvf, eps, t);
    vec4 col = mix(vec4(0.0), tile, tile.a);
  
    // Output:
    fragColor = col;
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
