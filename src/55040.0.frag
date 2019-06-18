/*
 * Original shader from: https://www.shadertoy.com/view/WlB3RW
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
#define LAYERS_COUNT 25.

#define BLACK_COL vec3(16,22,26)/255.

#define rand1(p) fract(sin(p* 78.233)* 43758.5453) 
#define hue(h) clamp( abs( fract(h + vec4(3,2,1,0)/3.) * 6. - 3.) -1. , 0., 1.)

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;    
    uv += vec2(sin(iTime),cos(iTime))*.2;
    
    float t = iTime*.125;          
        
    vec3 col = vec3(0.);
    float s = 0.;
    
    float bStep = 1./LAYERS_COUNT; 
    for(float n=0.; n< LAYERS_COUNT; n+=1.){        
        float sx = fract(t + bStep*n);
        vec2 guv = uv * ((1. - sx) * 50.);     
        vec2 gid = floor(guv);
        guv = fract(guv) - .5;

        float sz = (max(sx, .5) - .5);
        float b1 = .05 + sz * .5;        
        float b2 = b1-.02;       
        float l = length(guv);
        float si = smoothstep(b1, b2, l) - smoothstep(b1-.1, b2-.1, l);           
        float six = si* sx;
        
        col += hue(rand1(gid.x+gid.y*100. + n)).rgb * six;
        
        s += six;
    }
    
    col = mix(BLACK_COL, col, s);    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
