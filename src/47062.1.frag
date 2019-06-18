/*
 * Original shader from: https://www.shadertoy.com/view/XscfzX
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
#define pi 3.141592653589

vec3 drawSpiral(vec2 uv, vec3 col, float thickness){
	   
    //float lim = 12.*pi;
    float growth = sqrt(2.);
    float theta = ( pi*log(length(uv)) )/(2.*log(growth) ); //angle of spiral for length of UV vector with spiral being r(theta)
    vec2 spiral = pow(growth,2./pi * theta)*vec2(cos(theta),sin(theta));
    
    if( abs(dot(normalize(uv),normalize(spiral))-1.) < 1.195 && abs(length(uv)-length(spiral)) < thickness  ){
     col = vec3(1.)*smoothstep(/*(sin(iTime)+1.1)/2.*/1.,0., abs(dot(normalize(uv),normalize(spiral))-1.) );  
    }
    
    col*=vec3((sin(iTime)+1.)/3.+.5,(cos(iTime)+1.)/3.+.5,(cos(iTime)+1.)/3.+.5);
    
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = 2.*(fragCoord-iResolution.xy*.5)/iResolution.y;
	uv/= fract(iTime) +.325;//fract(iTime)/.5+.675;
    
    // Time varying pixel color
    vec3 col = vec3(0.);

    //col = shape(uv, col, vec2(0.45, 0.25), 1., vec3(1.),  .0125);
    col = drawSpiral(uv, col, .45);
    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
