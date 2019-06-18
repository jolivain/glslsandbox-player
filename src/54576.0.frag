/*
 * Original shader from: https://www.shadertoy.com/view/lldfR7
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
#define T iTime * 8.
#define PI2 6.28318
#define R iResolution.xy

//Dave Hoskins
//https://www.shadertoy.com/view/4djSRW
float H1(float p) {
	vec3 x  = fract(vec3(p) * .1031);
    x += dot(x, x.yzx + 19.19);
    return fract((x.x + x.y) * x.z);
}

//IQ cosine palattes
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 PT(float t) {return vec3(.5) + vec3(.5) * cos(6.28318 * (vec3(1) * t + vec3(0, .33, .67)));}

vec3 render(vec3 rd) {
    float a = (atan(rd.y, rd.x) / PI2) + .5, //polar  0-1
          l = floor(a * 24.) / 24.; //split into 24 segemnts
    vec3 c = PT(H1(l + T * .0001)) * step(.1, fract(a * 24.)); //segment colour and edge
    float m = mod(abs(rd.y) + H1(l) * 4. - T * .01, .3); //split segments 
    return c * step(m, .16) * m * 16. * max(abs(rd.y), 0.); //split segments
}

void mainImage(out vec4 C, vec2 U) {
    
    //ray direction
    vec2 uv = (U - R * .5) / R.y;
    vec3 f = vec3(0, 0, 1),
         r = vec3(f.z, 0, -f.x),
         d = normalize(f + 1. * uv.x * r + 1. * uv.y * cross(f, r));
        
    C = vec4(render(d), 1.);
}

void mainVR(out vec4 C, vec2 U, vec3 ro, vec3 rd) {
    C = vec4(render(rd), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
