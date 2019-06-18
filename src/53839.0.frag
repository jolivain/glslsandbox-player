/*
 * Original shader from: https://www.shadertoy.com/view/wd2Szc
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Plasma Coil" by dr2 - 2019
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

float PrTorusDf (vec3 p, float ri, float rc);
float PrTorus4Df (vec3 p, float ri, float rc);
float PrTorusAnDf (vec3 p, float ri, float rc, float w);
float SmoothBump (float lo, float hi, float w, float x);
vec2 Rot2D (vec2 q, float a);

vec3 ltDir = vec3(0.);
float tCur = 0., dstFar = 0., rTor = 0., htFlr = 0.,
      nSeg = 0., tzFac = 0., crExt = 0., aRot = 0.;
int idObj = 0;
const float pi = 3.14159;

#define DMIN(id) if (d < dMin) { dMin = d;  idObj = id; }

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin, d, cvOrd, a;
  dMin = dstFar;
  p.y -= htFlr;
  d = PrTorusDf (p.xzy, 1.5, rTor);
  DMIN (1);
  q = p;
  q.xy = Rot2D (q.xy, 0.5 * pi);
  q.yz = vec2 (atan (q.y, q.z) * rTor, length (q.yz) - rTor);
  cvOrd = 7.;
  a = atan (q.z, q.x) / (2. * pi);
  q.xz = Rot2D (vec2 (length (q.xz) - 2., mod (q.y + 2. * a + 1., 2.) - 1.),
     2. * pi * (cvOrd - 1.) * a);
  d = 0.4 * (length (Rot2D (q.xz, - (floor ((0.5 * pi - atan (q.x, q.z)) + pi / cvOrd))) -
     vec2 (0.6, 0.)) - 0.2);
  DMIN (2);
  q = p;
  q.xz = Rot2D (q.xz, 2. * pi * ((floor (4. * atan (q.z, - q.x) / (2. * pi)) + 0.5) / 4.));
  q.x = abs (q.x) - rTor;
  d = PrTorus4Df (q, 1., 5. + crExt);
  DMIN (3);
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 200; j ++) {
    p = ro + dHit * rd;
    d = ObjDf (p);
    if (d < 0.0005 || dHit > dstFar || p.y < 0.) break;
    dHit += d;
  }
  if (p.y < 0.) dHit = dstFar;
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  v = vec4 (- ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

float TrObjDf (vec3 p)
{
  p.y -= htFlr;
  p.xz = Rot2D (p.xz, 2. * pi * aRot / nSeg);
  p.xz = Rot2D (p.xz, 2. * pi * ((floor (nSeg * atan (p.z, - p.x) / (2. * pi)) + 0.5) / nSeg));
  p.x = abs (p.x) - rTor;
  p.z *= tzFac;
  return PrTorusDf (p, 2., 2.);
}

float TrObjRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 100; j ++) {
    p = ro + dHit * rd;
    d = TrObjDf (p);
    if (d < 0.0005 || dHit > dstFar || p.y < 0.) break;
    dHit += d;
  }
  if (p.y < 0.) dHit = dstFar;
  return dHit;
}

vec3 TrObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  v = vec4 (- TrObjDf (p + e.xxx), TrObjDf (p + e.xyy), TrObjDf (p + e.yxy), TrObjDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec3 col, glCol, bgCol, vn, roo, p;
  float dstObj, dstTrObj, nDotL, r, s, tCyc, t, tm;
  rTor = 80. / (2. * pi);
  nSeg = 12.;
  tCyc = 50.;
  t = 2. * pi * tCur / tCyc;
  tm = mod (tCur / tCyc, 1.);
  aRot = 0.01 * tCyc * t + 30. * (sin (t) - t);
  tzFac = 0.8 + 0.2 * cos (t);
  crExt = 0.05 * sin (512. * tCur) * SmoothBump (0.2, 0.8, 0.1, tm);
  htFlr = 5.8;
  roo = ro;
  dstTrObj = TrObjRay (ro, rd);
  dstObj = ObjRay (ro, rd);
  bgCol = mix (vec3 (0.1, 0.1, 0.2), vec3 (0.5, 0.3, 0.2), (0.5 +
     0.5 * SmoothBump (0.3, 0.7, 0.15, mod (64. * rd.y - 16. * atan (rd.z, - rd.x) / (2. * pi) +
     0.5 * aRot, 1.))) * SmoothBump (0.25, 0.75, 0.15, tm));
  glCol = mix (vec3 (0.9, 0.9, 0.3) * (0.97 + 0.03 * sin (64. * tCur)), vec3 (1., 1., 0.9),
     SmoothBump (0.3, 0.7, 0.1, tm));
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    nDotL = max (dot (vn, ltDir), 0.);
    s = mod (nSeg * atan (ro.z, - ro.x) / (2. * pi) - aRot, 1.);
    if (idObj == 1) {
      col = mix (vec3 (0.7, 0.7, 0.), vec3 (1.), 0.5 + 0.5 * sin (t)) *
         (0.4 + 0.6 * SmoothBump (0.35, 0.65, 0.05, s * tzFac));
    } else if (idObj == 2) {
      col = mix (vec3 (0.7, 0.6, 0.6), mix (vec3 (1., 0., 0.), vec3 (1.), 0.5 + 0.5 * cos (t)),
         SmoothBump (0.25, 0.75, 0.1, s));
    } else if (idObj == 3) {
      col = vec3 (0.7, 0.7, 0.8);
    }
    col = col * (0.2 + 0.8 * nDotL * nDotL) +
       0.1 * pow (max (dot (normalize (ltDir - rd), vn), 0.), 32.);
    if (idObj > 1) col.r += ((idObj == 2) ? 0.5 : 0.2) * max (- dot (rd, vn), 0.) *
       SmoothBump (0.3, 0.7, 0.1, tm);
  } else if (rd.y < 0.) {
    dstObj = - ro.y / rd.y;
    ro += dstObj * rd;
    r = length (ro.xz);
    if (r < 2. * rTor) {
      col = vec3 (0.2, 0.22, 0.2) * (0.8 + 0.2 * SmoothBump (0.03, 0.97, 0.01, mod (0.5 * r, 1.)));
      p = ro;
      p.xz = Rot2D (p.xz, 2. * pi * ((floor (4. * atan (p.z, - p.x) / (2. * pi)) + 0.5) / 4.));
      p.x = abs (p.x) - rTor;
      s =  smoothstep (1., 1.3, length (p.xz * vec2 (0.4, 1.) + crExt));
      col *= 0.8 + 0.2 * s;
      p = ro;
      p.xz = Rot2D (p.xz, 2. * pi * aRot / nSeg);
      p.xz = Rot2D (p.xz, 2. * pi * ((floor (nSeg * atan (p.z, - p.x) / (2. * pi)) + 0.5) / nSeg));
      col += glCol * 0.2 * s * SmoothBump (-0.2, 0.2, 0.1,
         length (vec2 (r / rTor - 1., 0.8 * p.z * tzFac / (2. * pi * rTor / nSeg))));
    } else col = bgCol;
  } else {
    col = bgCol;
  }
  dstObj = min (dstObj, dstFar);
  if (dstTrObj < dstObj) col += glCol * smoothstep (0.05, 0.5, dstObj - dstTrObj) *
     (0.05 + 0.4 * clamp (- dot (TrObjNf (roo + dstTrObj * rd), rd), 0., 1.));
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd;
  vec2 canvas, uv, ori, ca, sa;
  float el, az, zmFac;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  az = 0.01;
  el = -0.1 * pi;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += 1.5 * pi * mPtr.y;
  }
  el = clamp (el, -0.5 * pi, 0.01 * pi);
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  ro = vuMat * vec3 (0., 5., -80.);
  ro.y = max (ro.y, 0.01);
  zmFac = 8. - 3. * abs (el);
  rd = vuMat * normalize (vec3 (uv, zmFac));
  dstFar = 100.;
  ltDir = vuMat * normalize (vec3 (1., 1., -1.));
  fragColor = vec4 (ShowScene (ro, rd), 1.);
}

float PrTorusDf (vec3 p, float ri, float rc)
{
  return length (vec2 (length (p.xy) - rc, p.z)) - ri;
}

float PrTorus4Df (vec3 p, float ri, float rc)
{
  vec2 q;
  q = vec2 (length (p.xy) - rc, p.z);
  q *= q;
  return sqrt (sqrt (dot (q * q, vec2 (1.)))) - ri;
}

float PrTorusAnDf (vec3 p, float ri, float rc, float w)
{
  return abs (length (vec2 (length (p.xy) - rc, p.z)) - ri) - w;
}

float SmoothBump (float lo, float hi, float w, float x)
{
  return (1. - smoothstep (hi - w, hi + w, x)) * smoothstep (lo - w, lo + w, x);
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
