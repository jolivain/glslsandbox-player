//
// Low quality fast bayer demosaicing
//

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D  texture0;
uniform vec2       resolution;

const vec2 firstRed = vec2(0., 0.);

#define fetch(x, y) texture2D(texture0, vec2(x, y)).r

void main(void) {

    vec2 invres = vec2(1.) / resolution.xy;
    vec2 uv1 = vec2(gl_FragCoord.x * invres.x, 1.0 - gl_FragCoord.y * invres.y);
    vec2 uv2 = uv1 + invres;

    vec4 c = vec4(
        fetch(uv1.x, uv1.y),
        fetch(uv2.x, uv1.y),
        fetch(uv1.x, uv2.y),
        fetch(uv2.x, uv2.y));

    vec2 alt = mod(floor(gl_FragCoord.xy + firstRed), 2.0);

    gl_FragColor.rgb = (alt.y == 0.0) ?
        ((alt.x == 0.0) ?
            c.wyx :   /* blue */
            c.zxy) :  /* green 1 */
        ((alt.x == 0.0) ?
            c.yxz :   /* green 2 */
            c.xyw);   /* red */
}
