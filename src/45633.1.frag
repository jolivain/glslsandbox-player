/*
 * Original shader from: https://www.shadertoy.com/view/Xl2XRG
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
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord.xy - 0.5*iResolution.xy) * (3.0/iResolution.y);
    
    float t = 0.25 * iTime + 3.5;
    float ti = floor(t);
    float dt = t - ti;
    
    vec2 ct[2];
    ct[0] = floor(mod(vec2(ti, ti/3.0), 3.0) - 1.0);
    ti += 1.0;
    ct[1] = floor(mod(vec2(ti, ti/3.0), 3.0) - 1.0);
    
    float a = smoothstep(0.0, 1.0, min(2.0 * dt, 1.0));
    float b = 1.0 - a;
    
    float c = float(abs(p.x) <= 1.5);
    for (int i = 0; i < 4; ++i) {
        vec2 pt = floor(p + 0.5);
        
        vec2 x1 = abs(p - ct[0]);
        vec2 x2 = abs(p - ct[1]);        
        x1[0] = max(x1.x, x1.y);
        x2[0] = max(x2.x, x2.y);
        
        float m = float(
            (x1[0] >= 0.5 || x1[0] <= a*0.5)
        	&& (x2[0] >= 0.5 || x2[0] <= b*0.5)
       	);
        c *= m;
        
        p = 3.0 * (p-pt);
        
        if (x1[0] < 0.5) {
            p /= a;
        }
        if (x2[0] < 0.5) {
        	p /= b;
        }
    }

	fragColor = vec4(vec3(0.1 + 0.9*c), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
