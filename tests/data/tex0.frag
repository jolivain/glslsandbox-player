#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D texture0;

void main(void)
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv.y = 1. - uv.y;
    gl_FragColor = texture2D(texture0, uv);
}
