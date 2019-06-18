#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float rand(vec2 st)
{
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

float atan2(in float y, in float x){
    return x == 0.0 ? sign(y) * 3.14 / 2.0 : atan(y, x);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void main( void ) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
    float n = 15.0;
    vec2 st = (fract(uv * n) - 0.5)*2.0;
    vec2 ist = floor(uv * n);

    float c = clamp(step(0.9, abs(st.x)) + step(0.9, abs(st.y)), 0.0, 1.0);	
    c = 1.0 - c;
    float y = 1.0 - step(sin(time*10.0*rand(vec2(ist.x, 2.0))), ist.y*abs(sin(rand(vec2(ist.x, 1.0)))));

    vec3 bg = vec3(0.25, 0.5, 1.0)*c*clamp(y, 0.25, 1.0);

    gl_FragColor = vec4(bg, 1);
}
