/*
 * Original shader from: https://www.shadertoy.com/view/3dSSDR
 */

#extension GL_OES_standard_derivatives : enable

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
//#define D smoothstep(3.,0., (1.-max(s.x,s.y)) / length(fwidth(p)) )
// vec3(p,cos,sin): trick to get rid of angle derivative discontinuity 
#define D smoothstep(3.,0., (1.-max(s.x,s.y)) / length(fwidth(vec3(p.x,cos(p.y),sin(p.y)))) )

void mainImage( out vec4 O, vec2 u )
{
    O-=O;
    vec2 R = iResolution.xy, 
         U = u+u-R,
         p = vec2(log(length(U)/R.y)-.3*iTime, atan(U.y,U.x) ),
        
    s = .5+.5*cos( 30. * p );  // log-polar grid
    O.r += D ;
    
    s = .5+.5*cos( 30. * p * mat2(1,-1,1,1) );
    O.g += D;                  // diagonals of log-polar grid

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
