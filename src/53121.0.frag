/*
 * Original shader from: https://www.shadertoy.com/view/wsXXzf
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
float expfilter(float x, float s) {
 	return exp(- x*x / (s*s));
}

float linefilter(float p, float pr, float w) {
    
    return step(pr, p) * step(1. - pr - w, 1.-p);
}

float rectangle(vec2 uv, float x0, float x1, float y0, float y1) {
 	//return 0.;   
	return step(uv.x, x1) * step(1.-uv.x, 1.-x0) * step(1. - uv.y, 1. - y0) * step(uv.y, y1);
    
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    float il0 = 0.35 + 0.05 * cos(0.5*iTime);
    float il1 = 0.70 + 0.05 * cos(0.5*iTime + 0.5);
    float il3 = 0.15 + 0.1 * cos(iTime + 1.5);
    float il4 = 0.80 + 0.08 * cos(iTime + 2.);
    float il5 = 0.95 + 0.03 * cos(iTime + 2.5);
    
    float ih0 = 0.50 + 0.1 * cos(iTime + 3.);
    float ih1 = 0.70 + 0.08 * cos(iTime + 2.7);
    float ih2 = 0.15 + 0.1 * cos(iTime + 1.);
    
    
    
    float lv0 = linefilter(uv.x, il0, 0.01);
    float lv1 = linefilter(uv.x, il1, 0.01);
    float lv2 = linefilter(uv.x, il4, 0.01);
    float lv3 = linefilter(uv.x, il5, 0.01);
    
    
    float lh0 = linefilter(uv.y, ih0, 0.01);
    float lh1 = linefilter(uv.y, ih1, 0.01);
    
    float lhv0 = linefilter(uv.y, ih2, 0.01) * linefilter(uv.x, il0, 1.);
    float lvh0 = linefilter(uv.x, il3, 0.01) * linefilter(uv.y, ih0, 1.);
    
    
    
    float lines = lv0 + lv1 +lv3 + lh0 + lh1 + lhv0 + lvh0;
    
    float rectr = rectangle(uv, 0., il0, ih0, 1.); 
    float rectb = rectangle(uv, il1, 1., 0., ih2);  
    float rectj = rectangle(uv, il5, 1., ih0, 1.);  
                            
    
    vec4 RectJ = vec4(rectj * vec3(0., 0., 0.9), 1.);
    vec4 RectB = vec4(rectb * vec3(1., 1., 0.), 1.);
    vec4 RectR = vec4(rectr * vec3(0.1, 1., 0.9), 1.);
    
    
    // Output to screen R G B
    fragColor = vec4(0.98 - lines, 1. - lines, 0.9 - lines, 1.0) - RectJ - RectB - RectR;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
