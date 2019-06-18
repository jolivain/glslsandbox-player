/*
 * Original shader from: https://www.shadertoy.com/view/wlX3W7
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define uResolution iResolution
#define uTime iTime
const float kAntiAliasing = 0.005;
const vec3 kBlackColor = vec3(0.0);
const vec3 kWhiteColor = vec3(1.0);
const vec3 kGreenColor = vec3(203.0, 197.0, 111.0) / 255.0;
const vec3 kBlueColor = vec3(104.0, 140.0, 136.0) / 255.0;
const vec2 kOrigin = vec2(0.0);
const float kFaceRadiusUpper = 0.4005;
const float kFaceRadiusLower = 0.551;

float saturate(in float x) { return clamp(x, 0.0, 1.0); }
vec2 mirror_x(in vec2 p) { return vec2(abs(p.x), p.y); }

vec2 CalculateAspectRatio(in vec2 size) {
  return pow(size.yy / size, vec2(step(size.x, size.y) * 2.0 - 1.0));
}

// Returns the distance field of a 2D circle with anti-aliasing.
float SmoothCircle(in vec2 uv, in vec2 origin, float radius, float alias) {
  return 1.0 - smoothstep(radius - alias, radius + alias,
                          length(uv - origin));
}

// Returns the distance field of a 2D circle with default anti-aliasing.
float Circle(in vec2 uv, in vec2 origin, float radius) {
  return SmoothCircle(uv, origin, radius, kAntiAliasing);
}

/*
vec3 color(in int x) {
  return vec3(float(x >> 16) / 255.0, float((x >> 8) & 255) / 255.0, float(x & 255) / 255.0);
}
*/

/*
  Creative Commons Attribution-ShareAlike 3.0 License with 996 ICU clause:
  
  http://996.icu

  The above license is only granted to entities that act in concordance with local labor laws.
  In addition, the following requirements must be observed:

  The licensee must not, explicitly or implicitly, request or schedule 
    their employees to work more than 45 hours in any single week.
  The licensee must not, explicitly or implicitly, request or schedule 
    their employees to be at work consecutively for 10 hours.
  For more information about this protest, see http://996.icu

  - Ruofei Du
  https://www.shadertoy.com/view/wlX3W7
*/
vec3 RenderCat(in vec2 uv) {
  vec3 col = kWhiteColor;
  vec2 p = uv * 1.5 + vec2(0.0, 0.1);
  // Distorts the coordinates horizontally or vertically.
  vec2 q = p * vec2(0.8, 1.0);
  vec2 r = p * vec2(1.1, 1.0);
  float alias = 3.5 / uResolution.y;
  // Draws the face.
  float face = SmoothCircle(q, kOrigin, kFaceRadiusUpper, alias) * step(p.y, 0.0);
  face += SmoothCircle(r, kOrigin, kFaceRadiusLower, alias) * step(0.0, p.y);
  face = saturate(face);
  // Draws the left ear.
  q = p * vec2(1.0, 0.8);
  float ear = SmoothCircle(q + vec2(-0.4, -0.32), vec2(0.0), 0.898, alias) * step(p.x, -0.47);
  ear += SmoothCircle(q + vec2(0.9, 0.25), vec2(0.0), 0.9, alias) * step(-0.47, p.x);
  // Draws the right ear.
  ear += SmoothCircle(q + vec2(0.4, -0.32), vec2(0.0), 0.898, alias) * step(0.47, p.x);
  ear += SmoothCircle(q + vec2(-0.9, 0.25), vec2(0.0), 0.9, alias) * step(p.x, 0.47);
  ear -= face;
  ear*= step(0.0, p.y);
  ear = saturate(ear);
  col = mix(col, kGreenColor, ear);
  // Draws the outer ear.
  float ear_out = SmoothCircle(p + vec2(0.7, 0.5), vec2(0.0), 1.2, alias) * step(0.47, p.y) * step(-0.47, p.x);
  ear_out += SmoothCircle(p + vec2(-0.7, 0.5), vec2(0.0), 1.2, alias) * step(0.47, p.y) * step(p.x, 0.47);
  ear_out -= ear;
  ear_out = saturate(ear_out);
  col = mix(col, vec3(0.2), ear_out * 1.0);
  // Draws the eyes.
  col = mix(col, kBlackColor, face);
  float eye = SmoothCircle(q + vec2(0.23, -0.1), vec2(0.0), 0.2, alias);
  eye += SmoothCircle(q + vec2(-0.23, -0.1), vec2(0.0), 0.2, alias);
  col = mix(col, kWhiteColor, eye);
  eye = SmoothCircle((p * vec2(1.0, 0.8)) + vec2(0.22, -0.1), vec2(0.0), 0.15, alias);
  eye += SmoothCircle((p * vec2(1.0, 0.8)) + vec2(-0.22, -0.1), vec2(0.0), 0.15, alias);
  col = mix(col, kBlackColor, eye);
  // Draws the mouth.
  float mouth = smoothstep(-alias, 0.0, -p.y - 0.15);
  alias *= 2.0;
  mouth *= smoothstep(-alias, alias, p.y - 4.0 * p.x + 0.35);
  mouth *= smoothstep(-alias, alias, p.y + 4.0 * p.x + 0.35);
  col = mix(col, kBlueColor, saturate(mouth));
  return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5* uResolution.xy) / uResolution.y;
  fragColor = vec4(RenderCat(uv), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
