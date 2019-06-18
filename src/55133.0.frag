/*
 * Original shader from: https://www.shadertoy.com/view/ttB3zG
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
const vec4 yellow = vec4(1.0,1.0,0.0,1.0);
const vec4 purple = vec4(0.6,0.0,1.0,1.0);

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord-iResolution.xy/2.0)/iResolution.y;
       
    vec4 col = vec4(1);
    //bakground
     if(uv.x<0.0)col = yellow;
     else col = purple;
    
    if(length(uv-vec2(.44,.0))<0.37)col = vec4(0,1,1,1);
    if(length(uv-vec2(-.44,.0))<0.37)col = vec4(0,1,1,1);
    
    vec2 grid = fract(uv*30.0)-0.5;
    
    vec4 dotCol;
    float dotsize =pow(cos(iTime*0.3),4.0)*0.35;
    
    if(uv.x<0.0)dotCol = purple;
    else dotCol = yellow;
    
    if(length(grid)<dotsize)col = dotCol;
   

    // Output to screen
    fragColor = col;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
