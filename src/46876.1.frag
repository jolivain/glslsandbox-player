#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
    vec2 mouse_coord = mouse.xy * resolution.xy;
    vec2 m = mouse_coord - gl_FragCoord.xy;
    if (m.x >= -0.5 && m.x < 0.5 && m.y >=-0.5 && m.y < 0.5)
        gl_FragColor = vec4(1.);
    else
        gl_FragColor = vec4(vec3(0.), 1.);
}
