/*
 * Original shader from: https://www.shadertoy.com/view/XlBSzd
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
	vec2 R = iResolution.xy,
        uv = (fragCoord - .5*R) / iResolution.y;
    
    vec3 rp = vec3(0.,0.,iTime);
    vec3 rd = normalize(vec3(uv,1.));
    
    vec3 c = vec3(0.);
    float s = 0.;
    
    for (int i = 0; i < 74; i++) {
        vec3 hp = rp+rd*s;
        float d = length(cos(hp*.6+
                             cos(hp*.3+iTime*.5)))-.2;
        float cc = clamp(1.-(d*.5+(d*5.)/s),-1.,1.);
        
        c += (cos(vec3(hp.xy,s))*.5+.5 + cos(vec3(s+iTime,hp.yx)*.1)*.5+.5 + 1.)/3.
              *cc*.02;
        
        s += d;
        rd = normalize(rd+vec3(d*.01,d*-.006,0.));
    }
    
    fragColor = vec4(c,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
