/* https://www.shadertoy.com/view/Xd3BWr */

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    float c = uv.x * 2.0 + time*2.0;
    c = mod(c, 1.0);
    float d = 0.01;
    c = smoothstep(0.5 - d, 0.5 + d, c);

    gl_FragColor = vec4(c);
}
