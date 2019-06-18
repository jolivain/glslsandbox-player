/*
 * Original shader from: https://www.shadertoy.com/view/Wss3D8
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
#define RECURSION_LEVEL 10

#define SCALE 1.0

#define SCENE_ROTATION_SPEED -0.1

#define PLANE_ROTATION_SPEED 0.3

#define EDGE_SHARPNESS 20000.0

#define PI 3.14159265359

mat2 rotate2d(float angle){
    return mat2(
        cos(angle), -sin(angle),
        sin(angle), cos(angle)
    );
}

float getChessboardLuminance(vec2 point) {
    float value =
        (1.0 - pow(cos(point.x * PI), EDGE_SHARPNESS))
        * sign(sin(point.x * PI));
    value *=
        (1.0 - pow(cos(point.y * PI), EDGE_SHARPNESS))
        * sign(sin(point.y * PI));
    return (value + 1.0) / 2.0;    
}

bool isBlack(vec2 point) {
    vec2 checkerV = mod(floor(point), 2.0);
    float checker = mod(checkerV.x + checkerV.y, 2.0);
    return (checker == 1.0);
}

float getLuminance(vec2 pixel) {
    float luminance = 1.0;
    for (int i = 0; i < RECURSION_LEVEL; i++) {
        pixel *= rotate2d(iTime * SCENE_ROTATION_SPEED);
        vec2 trans = vec2(pixel.x / pixel.y, 1.0 / pixel.y);
        trans *= rotate2d(iTime * PLANE_ROTATION_SPEED);    
        trans *= SCALE;

        luminance += getChessboardLuminance(trans) * luminance;
        // apply air perspective
        luminance *= abs(pixel.y);

        if (isBlack(trans)) {
            pixel = mod(trans, 2.0) - 1.0;
        } else {
            break;
        }
    }
    return luminance;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 pixel = (fragCoord -.5 * iResolution.xy) / iResolution.y;
    float luminance = getLuminance(pixel);
    fragColor = vec4(vec3(luminance),1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
