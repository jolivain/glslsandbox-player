/*
 * Original shader from: https://www.shadertoy.com/view/tsXGzN
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define SEED .0
#define OFFSET vec2(cos(iTime * .25) + 2. * sin(.1 * iTime), sin(iTime * .25) + 2. * cos(.167 * iTime))

float rand (vec2 p) {
    return fract(sin(dot(vec2(p.x + SEED, p.y), vec2(12.9898,78.233))) * 43758.5453123);
}

//  smoothed noise
float noise(vec2 p) {
    vec2 ip = floor(p);
    float c00 = rand(ip);
    float c01 = rand(ip + vec2(1., 0.));
    float c10 = rand(ip + vec2(0., 1.));
    float c11 = rand(ip + vec2(1.));
    
    vec2 fp = fract(p);
    vec2 uf = smoothstep(vec2(0.), vec2(1.), fp);
    float r0 = mix(c00, c01, uf.x);
    float r1 = mix(c10, c11, uf.x);
    return mix(r0, r1, uf.y);
}

float fbm (vec2 p) {
    const int iters = 10;
    
    float value = 0.;
    float freq = 1.;
    float amp = .5;
    
    float gain = .5;
    float rescale = 2.;
    
    for (int i = 0; i < iters; i++) {
        value += amp * noise(p * freq);
        freq *= rescale;
        amp *= gain;
    }
    
    return value;
}

float terrain(vec2 p) {
    //  stack+deform FBMs
    vec2 q = vec2(fbm(p), fbm(p + vec2(.1, -.1)));
    vec2 r = vec2(fbm(p + 4. * q * vec2(2., 1.)), fbm(p + 4. * q + vec2(-5., -3.)));
    return fbm(p + 4. * r);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.2831853 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;
    
    //  circle around
    uv += OFFSET;

    //  flatness
    float z = .2;
    //  estimate normals
    vec2 e = 1. / vec2(max(iResolution.x, iResolution.y));
    float r = terrain(uv + vec2(e.x, 0.));
    float l = terrain(uv - vec2(e.x, 0.));
    float b = terrain(uv + vec2(0., e.y));
    float t = terrain(uv - vec2(0., e.y));
    vec3 n = normalize(vec3(r - l, t - b, z));
    
    //  lighting
    vec3 ld = normalize(vec3(1., 1., 1.));
    float i = dot(n, ld);
    
    //  terrain color
    float h = terrain(uv);
    vec3 c = palette(h, vec3(.9, .6, 1.), vec3(1., .9, .75), vec3(.5), vec3(.57, .53, .4));
    c = mix(vec3(h), c, h * 1.33);
    
    //  clouds (+parallax)
    float clouds = fbm((uv + vec2(1.)) * 6. + .5 * OFFSET);
    clouds = clamp(0., 1., pow(clouds + .2, 10.));
    
    fragColor = vec4(mix(i * c + clouds * .75, vec3(1.), clouds), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
