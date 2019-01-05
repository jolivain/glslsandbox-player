#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D texture0;
uniform sampler2D backbuffer;

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv.y = 1. - uv.y;
    vec4 tex = texture2D(texture0, uv);
    vec4 bb = texture2D(backbuffer, uv);
    gl_FragColor = mix(tex, bb, 0.5);
}
