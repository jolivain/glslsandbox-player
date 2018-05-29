#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D backbuffer;

void main( void ) {
    vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
    vec3 color = texture2D(backbuffer, uv).rgb;
    gl_FragColor = vec4(clamp(color + 0.004, 0.0, 1.0), 1.0);
}
