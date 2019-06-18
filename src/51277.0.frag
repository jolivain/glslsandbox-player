/*
 * Original shader from: https://www.shadertoy.com/view/wdlGWn
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
float PI = 3.1415926535;
float sections = 3.0;

float atan2(in float y, in float x) {
    return x == 0.0 ? sign(y) * PI / 2.0 : atan(y, x);
}

bool belongs(float time, vec2 uv, float near, float far) {
    near += sin(uv.x - time * 8.0) / 50.0;
    far += cos(uv.y - time * 8.0) / 50.0;
    vec2 center = vec2(0.5, 0.5);
    vec2 xy = uv - center;
    float dist = distance(xy, vec2(0.0, 0.0));
    float angle = mod(atan2(xy.y, xy.x) + time * 2.5 + sin(time * 4.0) / 1.0, PI * 2.0);
    float oddity = mod(angle / (2.0 * PI) * sections * 2.0, 2.0);
    if (dist > near && dist < far && floor(mod(oddity, 2.0)) == 0.0) {
        return true;
    } else {
        return false;
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 UV = fragCoord/iResolution.yy;
    UV.x -= (iResolution.x / iResolution.y - 1.0) / 2.0;
    float TIME = iTime;

    if (belongs(TIME, UV, 0.2, 0.25) || belongs(TIME + 0.5, UV, 0.3, 0.35) || belongs(TIME + 1.0, UV, 0.4, 0.45)) {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
