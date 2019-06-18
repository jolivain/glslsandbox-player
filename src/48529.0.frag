/*
 * Original shader from: https://www.shadertoy.com/view/lldcDf
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //
float sphereSDF(vec2 p, float size) {
	return length(p) - size;
}

float boxSDF(vec2 p, vec2 size) {
	vec2 r = abs(p) - size;
    return min(max(r.x, r.y),0.) + length(max(r,vec2(0,0)));
}

vec3 colormap(float x) {
    float s = sin(x*6.28);
    if (x > 0.) {
    	return vec3(1,1,1.+s)/2.;
    } else {
        return vec3(1,1.+s,1)/2.;
    }
}

void AddObj(inout float dist, inout vec3 color, float d, vec3 c) {
    if (dist > d) {
        dist = d;
        color = c;
    }
}

void scene(in vec2 pos, out vec3 color, out float dist) {
    dist = 1e9; color = vec3(0,0,0);
    AddObj(dist, color, boxSDF(pos - vec2(-3,1), vec2(1,1)), vec3(.6,.8,1.));
    AddObj(dist, color, sphereSDF(pos - vec2(3,1), 1.), vec3(1,.9,.8));
    AddObj(dist, color, sphereSDF(pos - (mouse * 2.0 - 1.0) * 4.0, 0.5), vec3(0,.1,0));
    AddObj(dist, color, boxSDF(pos - vec2(0,1), vec2(1.5,0.1)), vec3(.3,.1,.1));
}

void trace(vec2 p, vec2 dir, out vec3 c) {
    for (int i = 0; i < 100; i++) {
        float d;
        scene(p, c, d);
        if (d < 1e-3) return;
        if (d > 1e1) break;
        p += dir * d;
    }
    c = vec3(0,0,0);
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
        vec2(12.9898,78.233)))*
        43758.5453123);
}

#define SAMPLES 128

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (fragCoord-(iResolution.xy/2.0))/iResolution.y*10.0;
    vec3 col = vec3(0.);
    for (int i = 0; i < SAMPLES; i++) {
        float t = (float(i) + random(uv+float(i)+iTime)) / float(SAMPLES) * 2. * 3.1415;
        vec3 c;
        trace(uv, vec2(cos(t), sin(t)), c);
        col += c;
    }
    col /= float(SAMPLES);
    // Output to screen
    fragColor = vec4(col*2.,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
