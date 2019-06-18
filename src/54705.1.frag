#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// ---------------------------------------------------------------------------

#define iResolution resolution
#define iTime time

// origin https://www.shadertoy.com/view/wllGD2
#define PI  3.141592
#define TAU 6.283184


vec2 cs(float a){
    return vec2(cos(a),sin(a));
}

vec2 rot(vec2 v, float a) {
    vec2 c = cs(a);
    return v * mat2(c.x, -c.y, c.y, c.x);
}

vec2 sp(float t){
    return vec2(floor(t), fract(t));
}

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
        

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord*2.-iResolution.xy)/iResolution.y;
    fragColor=vec4(0.);
    for(float i = 0. ; i < 6. ; i++) {
        vec2 t = sp(iTime*.15 - i*.1);
        vec4 c = vec4(
            rand(vec2(t.x, i+0.))*2.0-1.0,
            rand(vec2(t.x, i+1.))*2.0-1.0,
            rand(vec2(t.x, i+2.))*0.5+0.5,
            rand(vec2(t.x, i+3.))*2.0-1.0
        );

        c.w = mod(t.x, 2.)*2.-1.;

        uv -= c.xy;
        if(length(uv)<c.z) {
            uv = rot(uv, smoothstep(0.,1.,t.y)*TAU*sign(c.w));
        } else if(length(uv)<c.z+.01) {
            fragColor.b+=sin(t.y*PI);
        }
        uv += c.xy;
    }

    fragColor.g =1.0-20.*rand(floor(uv*150.0));
    fragColor = max(fragColor, vec4(fragColor.g));
}
// ---------------------------------------------------------------------------

void main( void ) {
    mainImage( gl_FragColor, gl_FragCoord.xy );
    gl_FragColor.a = 1.0;
}
