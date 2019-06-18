/*
 * Original shader from: https://www.shadertoy.com/view/4lSXR3
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
// "Hot Rocks" by dr2 - 2015
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

const float pi = 3.14159;
const vec4 cHashA4 = vec4 (0., 1., 57., 58.);
const vec3 cHashA3 = vec3 (1., 57., 113.);
const float cHashM = 43758.54;

vec4 Hashv4f (float p)
{
  return fract (sin (p + cHashA4) * cHashM);
}

float Noisefv2 (vec2 p)
{
  vec2 ip = floor (p);
  vec2 fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  vec4 t = Hashv4f (dot (ip, cHashA3.xy));
  return mix (mix (t.x, t.y, fp.x), mix (t.z, t.w, fp.x), fp.y);
}

float Fbmn (vec3 p, vec3 n)
{
  vec3 s;
  float a;
  s = vec3 (0.);
  a = 1.;
  for (int i = 0; i < 5; i ++) {
    s += a * vec3 (Noisefv2 (p.yz), Noisefv2 (p.zx), Noisefv2 (p.xy));
    a *= 0.5;
    p *= 2.;
  }
  return dot (s, abs (n));
}

vec3 VaryNf (vec3 p, vec3 n, float f)
{
  vec3 g;
  float s;
  vec3 e = vec3 (0.1, 0., 0.);
  s = Fbmn (p, n);
  g = vec3 (Fbmn (p + e.xyy, n) - s,
     Fbmn (p + e.yxy, n) - s, Fbmn (p + e.yyx, n) - s);
  return normalize (n + f * (g - n * dot (n, g)));
}

vec3 HsvToRgb (vec3 c)
{
  vec3 p = abs (fract (c.xxx + vec3 (1., 2./3., 1./3.)) * 6. - 3.);
  return c.z * mix (vec3 (1.), clamp (p - 1., 0., 1.), c.y);
}

vec2 Rot2D (vec2 q, float a)
{
  return q * cos (a) * vec2 (1., 1.) + q.yx * sin (a) * vec2 (-1., 1.);
}

mat3 flMat = mat3(0.);
vec3 flPos = vec3(0.), ltPos = vec3(0.), ltAx = vec3(0.);
float tCur = 0.;
float dstFar = 100.;

vec3 TrackPath (float t)
{
  return vec3 (10. * sin (0.1 * t) * sin (0.06 * t) * cos (0.033 * t) +
     3. * cos (0.025 * t), 6., t);
}

float GrndDf (vec3 p)
{
  const mat2 qRot = mat2 (1.6, -1.2, 1.2, 1.6);
  vec2 q, t, ta, v;
  float wAmp, pRough, ht;
  wAmp = 1.;
  pRough = 0.5;
  q = 0.4 * p.xz;
  ht = 0.;
  for (int j = 0; j < 3; j ++) {
    t = q + 2. * Noisefv2 (q) - 1.;
    ta = abs (sin (t));
    v = (1. - ta) * (ta + abs (cos (t)));
    v = pow (1. - v, vec2 (pRough));
    ht += (v.x + v.y) * wAmp;
    q *= 1.5 * qRot;
    wAmp *= 0.25;
    pRough = 0.6 * pRough + 0.2;
  }
  return p.y - ht;
}

float GrndRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, h, s, sLo, sHi;
  s = 0.;
  sLo = 0.;
  dHit = dstFar;
  for (int j = 0; j < 100; j ++) {
    p = ro + s * rd;
    h = GrndDf (p);
    if (h < 0.) break;
    sLo = s;
    s += 0.8 * h + 0.005 * s;
    if (s > dstFar) break;
  }
  if (h < 0.) {
    sHi = s;
    for (int j = 0; j < 8; j ++) {
      s = 0.5 * (sLo + sHi);
      p = ro + s * rd;
      h = step (0., GrndDf (p));
      sLo += h * (s - sLo);
      sHi += (1. - h) * (s - sHi);
    }
    dHit = sHi;
  }
  return dHit;
}

vec3 GrndNf (vec3 p)
{
  vec4 v;
  const vec3 e = 0.0001 * vec3 (1., -1., 0.);
  v = vec4 (GrndDf (p + e.xxx), GrndDf (p + e.xyy),
     GrndDf (p + e.yxy), GrndDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float GrndGlow (vec3 ro, vec3 rd)
{
  float gl, f, d;
  gl = 0.;
  f = 1.;
  d = 0.;
  for (int j = 0; j < 5; j ++) {
    d += 0.4;
    gl += f * max (d - GrndDf (ro + rd * d), 0.);
    f *= 0.5;
  }
  return clamp (gl, 0., 1.);
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec3 vn, ltDir;
  float dstGrnd, di, atten, glw, dk;
  dstGrnd = GrndRay (ro, rd);
  vec3 bgCol = vec3 (0., 0., 0.03);
  vec3 col = bgCol;
  if (dstGrnd < dstFar) {
    ro += rd * dstGrnd;
    ltDir = ro - ltPos;
    di = 1. / max (length (ltDir), 0.01);
    ltDir *= di;
    atten = 30. * pow (min (di, 1.), 1.3) * pow (max (dot (ltAx, ltDir), 0.), 64.);
    vn = GrndNf (ro);
    vn = VaryNf (5. * ro, vn, max (2., 6. - 0.3 * dstGrnd));
    glw = GrndGlow (ro, vn);
    col += (1. - glw) * atten * (min (0.5 * Fbmn (31. * ro, vn), 1.) *
       (0.1 + 0.5 * max (dot (vn, - ltDir), 0.)) +
       pow (max (dot (reflect (- ltDir, vn), rd), 0.), 64.));
    col = mix (col, 2. * HsvToRgb (clamp (vec3 (0.06 * glw * glw,
       1.,  5. * glw), 0., 1.)), 1.2 * glw * glw);
    dk = clamp (2. * (dstGrnd / dstFar - 0.1), 0., 1.);
    col = mix (col, bgCol, dk * dk);
  }
  return clamp (col, 0., 1.);
}

void FlyerPM (float t)
{
  vec3 fpF, fpB, vel, acc, va, ort, cr, sr;
  float dt;
  dt = 0.2;
  flPos = TrackPath (t);
  fpF = TrackPath (t + dt);
  fpB = TrackPath (t - dt);
  vel = (fpF - fpB) / (2. * dt);
  vel.y = 0.;
  acc = (fpF - 2. * flPos + fpB) / (dt * dt);
  acc.y = 0.;
  va = cross (acc, vel) / length (vel);
  ort = vec3 (0.2, atan (vel.z, vel.x) - 0.5 * pi, length (va) * sign (va.y));
  cr = cos (ort);
  sr = sin (ort);
  flMat = mat3 (cr.z, - sr.z, 0., sr.z, cr.z, 0., 0., 0., 1.) *
     mat3 (1., 0., 0., 0., cr.x, - sr.x, 0., sr.x, cr.x) *
     mat3 (cr.y, 0., - sr.y, 0., 1., 0., sr.y, 0., cr.y);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  vec2 canvas = iResolution.xy;
  vec2 uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  vec3 rd, ro;
  FlyerPM (tCur);
  ro = flPos;
  rd = normalize (vec3 (uv, 3.)) * flMat;
  ltPos = flPos;
  ltPos.y += 1.;
  ltAx = vec3 (0., 0., 1.);
  ltAx.yz = Rot2D (ltAx.yz, 0.3 + 0.3 * sin (tCur));
  ltAx = ltAx * flMat;
  fragColor = vec4 (ShowScene (ro, rd), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
