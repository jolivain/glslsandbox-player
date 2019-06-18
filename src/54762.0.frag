/*
 * Original shader from: https://www.shadertoy.com/view/tts3Ws
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
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.y;
    uv-=iTime*0.01;
    uv-=0.5;
    vec2 u = fract(uv*10.0)-0.5;
    vec2 index = floor(uv*10.0);
    float s = random(floor(uv*10.0)*10.0);    
    float a = 10.0*random(floor(uv*10.0)) + iTime * 3.0;
    u+=vec2(sin(a),cos(a))*0.2;
    float d = length(u);
    float k = smoothstep(d,d+0.05,s*0.3);
    fragColor = vec4(k);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
