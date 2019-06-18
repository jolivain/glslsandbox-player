/*
 * Original shader from: https://www.shadertoy.com/view/WsX3Rl
 */

#extension GL_OES_standard_derivatives : enable

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
//#define hue(h) (  .6 + .6 * cos( h + vec4(0,23,21,0)  ) ) // Fabrice cos hue https://www.shadertoy.com/view/ll2cDc
#define hue(h)   smoothstep( 0., 1.,  abs( mod( .955*(h) + vec4(0,4,2,0) , 6. ) - 3. ) -1. ) // IQ smooth hue https://www.shadertoy.com/view/MsS3Wc

vec4 t(vec2 U, float c) {
    float p = fwidth(U.y); if (p>3.) p = abs(p-6.283);       // pixel width (using hardware derivatives - 2Pi jump)
    return c > 0. && c < 9.
            ? U.y += c * .03*iTime, //iMouse.x/R.x,          // individual ring rotation
              ( .4 + .6* clamp(cos(30.*U.y)/30./p, 0., 1.) ) // stripped pattern with angular antialiasing
              * hue(U.y) 
            : vec4(0) ;
}

void mainImage( out vec4 O, vec2 U )
{
    vec2 R = iResolution.xy; 
    U = ( U+U - R ) / R.y;
    U = vec2( 2.5*length(U), atan(U.y,U.x) ); // to polar
    float c = 4.28*(U.x-.48), // floor: ring id (1..8). fract: index in ring
          d = fwidth(c);      // pixel width at current location (using hardware derivatives)
    
    // --- managing antialiased ring drawing
#if 1 // simple form    
    O = mix( t(U,floor(c)), t(U,ceil(c)), min(fract(c)/d,1.) );

#else // optimized form ( if most warps are not in borders )
    O = fract(c) > d
            ? t(U,ceil(c))    // seminal case
            : mix( t(U,floor(c)), t(U,ceil(c)), fract(c)/d ); // border pixel
#endif
    
  O = pow(O,vec4(1./2.2));  // better antialiasing if proper sRGB conversion
                            // NB: with hueFabrice + sRGB colors are less vivid.
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
