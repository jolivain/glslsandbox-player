/*
 * Original shader from: https://www.shadertoy.com/view/3tfGD7
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
#define PI 3.14159265359

mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

float circle(vec2 uv) {
    return sqrt(dot(uv, uv));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	// ** UV
    vec2 uv = ((fragCoord-.5*iResolution.xy)/iResolution.y); // Normalized pixel coordinates (from 0 to 1)
    uv = uv * rot(iTime*0.1); // Normalized rotating uv
    
    // Rotation matrix
    float n = 6.+abs(sin(iTime*0.1)*2.); // Grid size
    
    // Cell ID
    vec2 idv2 = (floor(uv*n) + vec2(n,0));;
    float id = idv2.x*n + idv2.y;
    
    // ** Grids
    vec2 guv = fract(uv*n) -.5; // Grid uv
    vec2 roguv = guv; roguv *= rot(iTime); // Rotating grid uv - around self origin

    // Circle uv
    float r1 = 0.45 * sin(dot(idv2, idv2) + iTime)*sin(id*0.5), r2 = 0.5;
    vec2 croguv = roguv * (1.-smoothstep(r1,r2, circle(roguv)));
    
    // Final color
    vec3 fc = dot(croguv,croguv)/0.25*vec3(1.);
    vec3 col = fc;

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
