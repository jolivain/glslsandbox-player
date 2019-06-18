/*
 * Original shader from: https://www.shadertoy.com/view/WdBSDD
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// experimenting w/ orbit traps.
// mouse the lower-left to restore auto-pilot.
// turn AA down to 1 if it's too slow.
// or turn down MAX_ITERS.

#define AA         2.0
#define MAX_ITERS 16.0

// from https://gist.github.com/NiklasRosenstein/ee1f1b5786f94e17995361c63dafeb3f
vec2 cmpxmul(in vec2 a, in vec2 b) {
	return vec2(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
}

mat2 Rot2(in float rads) {
    float s = sin(rads);
    float c = cos(rads);
    return mat2(c, s, -s, c);
}

float myTime;
vec2  MS;

void mainImage( out vec4 fragColor, in vec2 XYZW )
{
    // funky offset to get a pretty thumbnail
    myTime = (iTime - 5.0) / 3.14159;
    
    vec2 UV  = (XYZW.xy - iResolution.xy * 0.5) / iResolution.y * 2.0;
    vec2 MS  = (iMouse.xy - iResolution.xy * 0.5) / iResolution.y * 2.0;

    vec3 RGB = vec3(0.0);
    
    mat2 otRot1 = Rot2(myTime);
    vec2 otp;
    if (dot(iMouse.xy, vec2(1.0)) > 100.0) {
        otp = -MS;
    }
    else {
        otp = vec2(cos(myTime) * 1.0, 0.4 * sin(myTime * 1.13));
    }

    float dilation = (cos(myTime * 0.21) * -0.5 + 0.5) * .1;
    float mix1 = cos(myTime * 0.87) * -0.5 + 0.5;
    float mix2 = cos(myTime * 0.31) * -0.5 + 0.5;
    float mix3 = cos(myTime * 0.23) * -0.5 + 0.5;
    
    const float AAR = (AA - 1.0) / 2.0;
    for (float aax = -AAR; aax <= AAR; aax += 1.0) {
    for (float aay = -AAR; aay <= AAR; aay += 1.0) {
        vec2 c   = UV + 0.5 * vec2(aax, aay) / iResolution.xy;

        c += otp;

        float accum = 1e20;
        vec2  vAcc  = vec2(0.0);
        vec2  z     = vec2(0.0);


        // looks good with relatively few iterations.
        for (float n = 0.0; n < MAX_ITERS; n += 1.0) {

            // basic mandelbrot
            z =  cmpxmul(z, z);
            z += c;

            // offset z by center of orbit trap
            vec2 otz = z - otp;

            // rotate trap
            otz *= otRot1;

            float d1 = otz.x;
            float d2 = length(otz);
            float d  = mix(d2, d1, mix1);

            // dilate trap
            d = abs(d - dilation);

            // the first two iterations have boringly un-distorted Z.
            if ((n > 0.0) && (d < accum)) {
                accum = d;
                vAcc = z;
            }
        }

        float f = accum;
        f = sqrt(f);
        f = sqrt(f);

        vec3 rgb = vec3(f);
        // fract()ing here because video tends to load as clamped,
        // despite being marked as repeat.
        vec3 tex = 1.0 * texture(iChannel0, fract(1.0 * (vAcc + 0.5))).rgb;
        vec3 tx2 = 0.4 * vec3(fract(vAcc * 2.0), length(fract(vAcc / 4.0)));
        tex = mix(tex, tx2      , mix2);
        tex = mix(tex, vec3(0.0), mix3);
        rgb = 1.0 - (1.0 - tex) * f;
        RGB += rgb;
	}
    }
    RGB /= AA * AA;

    fragColor = vec4(RGB, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
