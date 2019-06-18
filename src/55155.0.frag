/*
 * Original shader from: https://www.shadertoy.com/view/WtSGRV
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
#define RETRO_MODE 1

const float retroPixelSize = 4.0;
const float pi = 3.1415926535897932384626433832795;
const float twoPi = pi*2.0;
const float pulsateDuration = 1.5;

//  function from Iñigo Quiles (no cubic smoothing)
//  https://www.shadertoy.com/view/MsS3Wc
vec3 hsv2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

vec2 rotate(vec2 p, float angle) {
    return vec2(
        cos(angle)*p.x + sin(angle)*p.y,
        -sin(angle)*p.x + cos(angle)*p.y
    );
}

float heart(vec2 p, vec2 center, float size, float angle) {
    vec2 o = (p-center)/(1.6*size);
    vec2 ro = rotate(o, angle);
    float a = ro.x*ro.x+ro.y*ro.y - 0.3;
    return step(a*a*a*2.0, ro.x*ro.x*ro.y*ro.y*ro.y);
}

vec3 plasma(vec2 p, float scale) {
    float angle = iTime*0.3;
    vec2 rp = rotate(p, angle);
    rp *= scale;

    float v1 = sin(rp.x+iTime);
    float v2 = sin(rp.y+iTime);
    float v3 = sin(rp.x+rp.y+iTime);
    float v4 = sin(length(rp) + 1.7*iTime);
    float v = v1+v2+v3+v4;

    v *= 2.0;
    vec3 col = vec3(1.0, 0.3-sin(v+pi*.5)*0.2, 0.8 - sin(v+pi*.5)*0.2);
    return col*0.5 + 0.5;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv  = fragCoord;
#if RETRO_MODE
    uv = ceil(fragCoord / retroPixelSize) * retroPixelSize;
#endif
    vec2 currentCoord = 2.0*vec2(uv - 0.5*iResolution.xy) / iResolution.y;

    // pulsate animation
    float pulsateTime = mod(iTime, pulsateDuration) / pulsateDuration;
    float pulsateScalar = pow(pulsateTime, 0.2)*0.5 + 0.5;
    pulsateScalar = 1.0 + pulsateScalar*0.5*sin(pulsateTime*twoPi*3.0 + currentCoord.y*0.5)*exp(-pulsateTime*4.0);

    // plasma background
    vec3 finalColor = plasma(currentCoord, pulsateScalar*8.0);

    // center heart
    float radius = pulsateScalar*.4;
    float d = heart(currentCoord, vec2(0, -0.07), radius, 0.0);
    vec3 col = mix(vec3(1.0), vec3(0.95, 0.37, 0.47), pulsateScalar);
    finalColor = mix(finalColor, col, d);

    // rotating heart ring
    const float piOver6 = pi/6.0;
    pulsateScalar = 0.4 + pulsateScalar*0.3*sin(pulsateTime*twoPi*3.0 + currentCoord.x*0.6)*exp(-pulsateTime*3.33);
    float ringRadius = 0.25 + pulsateScalar;
    for (float angle = piOver6; angle < twoPi; angle += piOver6) {
        float currentAngle = iTime*.8+angle;
        vec2 center = vec2(ringRadius*cos(currentAngle), ringRadius*sin(currentAngle));
        float d = heart(currentCoord, center, 0.08, currentAngle);
        vec3 color = hsv2rgb(vec3((currentAngle/twoPi) + 0.5, ringRadius, 1.0));
        finalColor = mix(finalColor, color, d);
    }

    fragColor = vec4(finalColor, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
