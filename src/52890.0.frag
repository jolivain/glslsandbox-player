/*
 * Original shader from: https://www.shadertoy.com/view/3sXSW8
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy uniforms emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// golfed simplification of https://shadertoy.com/view/tslXDr

#define C(x,y) fract( sin(1e3*length (ceil(U)+vec2(x,y)))) > .5

void mainImage(inout vec4 O, in vec2 u) {
    vec2 R = iResolution.xy,
         U =  ( u+u - R ) / R.y * mat2(1,-2,1,2);
    U.y += iTime;
    R = fract( U *= 5. );
    bool r = R.x+R.y > 1.;
    O +=  C(1,-1)       ? 1.
        : C(1, 0) &&  r ? .8
        : C(0,-1) && !r ? .4
        : C(0, 0) ?   r ? .4 : .8
        : C(-1,0)       ? 0.
        :                 .3;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    gl_FragColor.rgb = vec3(0.);
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
