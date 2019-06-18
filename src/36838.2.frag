#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

//Faster version of "Kelp Forest" by Martijn Steinrucken aka BigWings
//https://www.shadertoy.com/view/Ml3XWH

// "Fast Fish" by dr2 - 2016
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

/*
  Scene based on "Kelp Forest" by Martijn Steinrucken aka BigWings - 2016
  (https://www.shadertoy.com/view/llcSz8)

  Runs several times (4-5X) faster, mainly due to altered cell marching.

  Coloring/lighting changed to avoid confusion; 
*/

float Hashfv2 (vec2 p);
vec3 Hashv3f (float p);
vec2 Rot2D (vec2 q, float a);
float PrSphDf (vec3 p, float s);
float PrEllipsDf (vec3 p, vec3 r);
float PrRndBoxDf (vec3 p, vec3 b, float r);
float SmoothMin (float a, float b, float r);
float SmoothBump (float lo, float hi, float w, float x);

struct {
  vec3 vSc;
  float dBody, dDors, dTail, dMouth, dBump;
} fh;

vec3 qHit = vec3(0.), ltDir = vec3(0.);
float tCur = 0., dstFar = 0.;
const float dEps = 0.0005;
const vec3 fRep = vec3 (11.5, 4.5, 2.5), kRep = vec3 (2., 40., 2.),
   bRep = vec3 (4., 4., 4.),
   fVr = vec3 (1., 123.231, 87.342), bVr = vec3 (1., 1234.5234, 765.);
const vec2 kVr = vec2 (1.1, 764.);
const float pi = 3.14159;

float ScalesHt (vec2 uv)
{
  vec4 ds, scl, g;
  float s;
  uv -= floor (uv);
  ds = vec4 (length (uv - vec2 (1., 0.5)), length (uv - vec2 (0.5, 1.)),
     length (uv - vec2 (0.5, 0.)), length (uv - vec2 (0., 0.5)));
  scl = uv.x + vec4 (-0.5, 0., 0., 0.5) - 2. * ds;
  g = smoothstep (0.45, 0.5, ds);
  s = (1. - g.x) * scl.x;
  s = (s - scl.y) * g.y + scl.y;
  s = (s - scl.z) * g.z + scl.z;
  s = (s - scl.w) * g.w + scl.w;
  return -0.01 * s;
}

float ScalesSh (vec2 uv, float rnd)
{
  vec4 ds, scl, g;
  vec2 uvi;
  float s;
  uvi = floor (uv);
  uv -= uvi;
  ds = vec4 (length (uv - vec2 (1., 0.5)), length (uv - vec2 (0.5, 1.)),
     length (uv - vec2 (0.5, 0.)), length (uv - vec2 (0., 0.5)));
  scl.x = Hashfv2 (uvi + vec2 (0., rnd));
  scl.y = scl.x;
  scl.z = Hashfv2 (uvi + vec2 (0., rnd - 1.));
  scl.w = Hashfv2 (uvi + vec2 (-1., rnd));
  g = smoothstep (0.45, 0.5, ds);
  s = (1. - g.x) * scl.x;
  s = (s - scl.y) * g.y + scl.y;
  s = (s - scl.z) * g.z + scl.z;
  s = (s - scl.w) * g.w + scl.w;
  return s;
}

float WSmoothMin (float a, float b, float r, float f, float amp)
{
  float h;
  h = clamp (0.5 + 0.5 * (b - a) / r, 0., 1.);
  r *= 1. + cos (h * f) * amp;
  return mix (b, a, h) - r * h * (1. - h);
}

float FishDf (vec3 p, vec3 vr)
{
  vec3 q;
  vec2 r;
  float dCheek, dEye, dSnout, dGill, dAnal, dPect, dPelv, dScales, mask, a, d;
  p.z += sin (p.x - tCur * 2. + vr.x * 100.) * (0.15 + 0.1 * vr.y);
  p.z = abs (p.z);
  qHit = p;
  fh.dBump = 0.;
  dCheek = SmoothMin (PrEllipsDf (p - vec3 (-1., 0., 0.25), vec3 (0.4, 0.4, 0.2)),
     PrEllipsDf (p - vec3 (-1., 0., -0.25), vec3 (0.4, 0.4, 0.2)), 0.2);
  dEye = PrEllipsDf (p - vec3 (-1., 0., 0.4), vec3 (0.25, 0.25, 0.09));
  dSnout = PrEllipsDf (p - vec3 (-1.2, -0.2, 0.), vec3 (0.6, 0.4, 0.2));
  q = p - vec3 (-1.2, -0.6, 0.);
  q.xy = Rot2D (q.xy, 0.35);
  fh.dMouth = WSmoothMin (PrEllipsDf (q - vec3 (-0.3, 0.15, 0.),
     vec3 (0.36, 0.12, 0.18)),
     PrEllipsDf (q, vec3 (0.6, 0.12, 0.24)), 0.03, 15., 0.1);
  dSnout = SmoothMin (dSnout, fh.dMouth, 0.1);
  q = p - vec3 (-1., 0., 0.);
  fh.vSc = vec3 (5. * p.x + 16., 20. * atan (q.y, q.z) / pi + 0.5, vr.z);
  dScales = ScalesHt (fh.vSc.xy) * smoothstep (0.33, 0.45, dEye) *
     (1. - smoothstep (1.2, 1.8, dEye)) * smoothstep (-0.3, 0., p.x);
  q = p - vec3 (-0.7, -0.25, 0.2);
  q.xz = Rot2D (q.xz, -0.4);
  dGill = PrEllipsDf (q, vec3 (0.8, 0.77, 0.12));
  fh.dTail = PrEllipsDf (p - vec3 (4.5, 0.1, 0.), vec3 (0.5, 1., 0.1));
  r = p.xy - vec2 (3.8, 0.1);
  a = atan (r.x, r.y);
  mask = SmoothBump (0.275, 2.9, 0.2, a) * smoothstep (0.04, 1., dot (r, r));
  fh.dBump += sin (a * 70.) * 0.005 * mask;
  fh.dTail += mask * (sin (a * 5.) * 0.0275 + sin (a * 280.) * 0.001) + fh.dBump;
  a = atan (p.x, p.y);
  fh.dBump += SmoothBump (-0.2, 3., 0.2, p.x) * (sin (a * 100.) * 0.003 +
     (1. - pow (sin (a * 50.) * 0.5 + 0.5, 15.)) * 0.015 + sin (a * 400.) * 0.001);
  fh.dDors = SmoothMin (PrEllipsDf (p - vec3 (1.275, 1., 0.), vec3 (1.5, 0.5, 0.1)),
     PrEllipsDf (p - vec3 (0.5, 1.5, 0.), vec3 (0.5, 0.5, 0.05)), 0.1) + fh.dBump;
  dAnal = PrEllipsDf (p - vec3 (2.6, -0.7, 0.), vec3 (1., 0.35, 0.05)) +
     sin (a * 300.) * 0.001 + sin (a * 40.) * 0.01;
  q = p - vec3 (0.7, -0.6, 0.52);
  r = p.xy - vec2 (0.3, -0.4);
  a = atan (r.x, r.y);
  q.yz = Rot2D (q.yz, -0.2);
  q.xz = Rot2D (q.xz, -0.2);
  dPect = PrEllipsDf (q, vec3 (0.4, 0.2, 0.04)) +
     (sin (a * 10.) * 0.01 + sin (a * 100.) * 0.002) *
     SmoothBump (1.5, 2.9, 0.1, a) * smoothstep (0.01, 0.36, dot (r, r));
  q = p - vec3 (0.9, -1.1, 0.2);
  q.xy = Rot2D (q.xy, 0.4);
  q.yz = Rot2D (q.yz, 0.4);
  r = p.xy - vec2 (0.5, -0.9);
  a = atan (r.x, r.y);
  dPelv = PrEllipsDf (q, vec3 (2., 1., 0.2) * 0.2) +
     (sin (a * 10.) * 0.01 + sin (a * 60.) * 0.002) *
     SmoothBump (1.5, 2.9, 0.1, a) * smoothstep (0.01, 0.16, dot (r, r));
  fh.dBody = SmoothMin (dCheek, dSnout, 0.3);
  fh.dBody = SmoothMin (SmoothMin (fh.dBody,
     PrEllipsDf (p - vec3 (0.6, -0., 0.), vec3 (2., 1., 0.5)), 0.15),
     PrEllipsDf (p - vec3 (2.4, 0.1, 0.), vec3 (1.8, 0.6, 0.24)), 0.3) + dScales;
  fh.dBody = WSmoothMin (fh.dBody, dGill, 0.1, 15., 0.1);
  d = SmoothMin (fh.dBody, min (min (min (min (dPect, dPelv), fh.dTail), fh.dDors),
     dAnal), 0.05);
  d = WSmoothMin (d, dEye, 0.01, 6., 1.);
  return 0.9 * d;
}

float KelpDf (vec3 p, vec3 vr)
{
  p.xz = Rot2D (p.xz, p.y * pi * floor (vr.y * 10.) / 40.);
  return 0.9 * PrRndBoxDf (p, vec3 ((0.1 + 0.5 * vr.x) *
    (0.8 + 0.2 * sin (0.2 * pi * p.y)), 30., 0.02 + 0.01 * vr.y), 0.005);
}

float BubDf (vec3 p, vec3 pw, vec3 vr)
{
  vec3 b;
  float s, t, r, d, a;
  t = tCur;
  vr -= 0.5;
  s = pow (fract (dot (vr, vec3 (1.)) * 100.), 4.);
  pw.y += t;
  pw = 7. * pw + 2. * pi * vr + vec3 (t, 0., t);
  d = sin ((t + vr.y) * 3. * pi * (1. - s)) *
     0.3 * vr.x * (1. - s);
  a = vr.z * t;
  b = d * vec3 (cos (a), 0., sin (a));
  r = 0.1 - 0.05 * s + dot (sin (pw), vec3 (1.)) * s * 0.02;
  return 0.9 * PrSphDf (p - b, r);
}

float FObjDf (vec3 p)
{
  vec3 cId, vr;
  float d;
  cId = floor (p / fRep);
  vr = Hashv3f (dot (cId, fVr));
  d = (vr.x > 0.95) ? FishDf (p - fRep * (cId + 0.5), vr) : dstFar;
  return d;
}

float FObjRay (vec3 ro, vec3 rd)
{
  vec3 p, cId, vr, s;
  float dHit, d;
  dHit = 0.1;
  for (int j = 0; j < 120; j ++) {
    p = ro + rd * dHit;
    p.x += tCur;
    cId = floor (p / fRep);
    vr = Hashv3f (dot (cId, fVr));
    d = (vr.x > 0.95) ? FishDf (p - fRep * (cId + 0.5), vr) : dstFar;
    s = (fRep * (cId + step (0., rd)) - p) / rd;
    d = min (d, abs (min (min (s.x, s.y), s.z)) + 0.01);
    if (d < dEps || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

float KObjDf (vec3 p)
{
  vec3 cId, vr;
  float d;
  cId = floor (p / kRep);
  vr = Hashv3f (dot (cId.xz, kVr));
  d = (vr.x * smoothstep (7., 10., length (cId)) > 0.9) ?
     KelpDf (p - kRep * (cId + 0.5), vr) : dstFar;
  return d;
}

float KObjRay (vec3 ro, vec3 rd)
{
  vec3 p, cId, vr, s;
  float dHit, d;
  dHit = 0.1;
  for (int j = 0; j < 120; j ++) {
    p = ro + rd * dHit;
    p.x += sin (tCur + p.y * 0.2) * 0.5;
    cId = floor (p / kRep);
    vr = Hashv3f (dot (cId.xz, kVr));
    d = (vr.x * smoothstep (7., 10., length (cId)) > 0.9) ?
       KelpDf (p - kRep * (cId + 0.5), vr) : dstFar;
    s = (kRep * (cId + step (0., rd)) - p) / rd;
    d = min (d, abs (min (min (s.x, s.y), s.z)) + 0.01);
    if (d < dEps || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

float BObjDf (vec3 p)
{
  vec3 cId, vr;
  float d;
  cId = floor (p / bRep);
  vr = Hashv3f (dot (cId, bVr));
  d = (vr.x * smoothstep (2., 5., length (cId)) > 0.95) ?
     BubDf (p - bRep * (cId + 0.5), p, vr) : dstFar;
  return d;
}

float BObjRay (vec3 ro, vec3 rd)
{
  vec3 p, cId, vr, s;
  float dHit, d;
  dHit = 0.1;
  for (int j = 0; j < 120; j ++) {
    p = ro + rd * dHit;
    p.y -= tCur * 4. + 40.;
    cId = floor (p / bRep);
    vr = Hashv3f (dot (cId, bVr));
    d = (vr.x * smoothstep (2., 5., length (cId)) > 0.95) ?
       BubDf (p - bRep * (cId + 0.5), p, vr) : dstFar;
    s = (bRep * (cId + step (0., rd)) - p) / rd;
    d = min (d, abs (min (min (s.x, s.y), s.z)) + 0.01);
    if (d < dEps || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

float ObjDfN (vec3 p)
{
  vec3 q;
  float dHit;
  q = p;
  q.x += tCur;
  dHit = FObjDf (q);
  q = p;
  q.x += sin (tCur + p.y * 0.2) * 0.5;
  dHit = min (dHit, KObjDf (q));
  q = p;
  q.y -= tCur * 4. + 40.;
  dHit = min (dHit, BObjDf (q));
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec3 e = vec3 (0.001, -0.001, 0.);
  v = vec4 (ObjDfN (p + e.xxx), ObjDfN (p + e.xyy),
     ObjDfN (p + e.yxy), ObjDfN (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float TurbLt (vec3 p, vec3 n, float t)
{
  vec2 q, qq, a1, a2;
  float c, tt;
  q = vec2 (dot (p.yzx, n), dot (p.zxy, n));
  q = 2. * pi * mod (q, 1.) - 256.;
  t += 11.;
  c = 0.;
  qq = q;
  for (int k = 1; k <= 7; k ++) {
    tt = t * (1. + 1. / float (k));
    a1 = tt - qq;
    a2 = tt + qq;
    qq = q + tt + vec2 (cos (a1.x) + sin (a2.y), sin (a1.y) + cos (a2.x));
    c += 1. / length (q / vec2 (sin (qq.x), cos (qq.y)));
  }
  return clamp (pow (abs (1.25 - abs (0.167 + 40. * c)), 8.), 0., 1.);
}

float FinSh (vec3 rd)
{
  float u;
  u = clamp (fh.dBody * 2. * pow (fh.dBump * 50., 2.) *
     (1. - clamp (fh.dDors * 15., 0., 1.)) *
     SmoothBump (-0.3, 3., 0.1, qHit.x) * 3., 0., 1.) +
     smoothstep (3.8, 5.2, qHit.x) *
     (1. - pow (max (1. - (fh.dBump * 100. + 0.5), 0.), 3.)) + fh.dBody * 3.;
  return u * (rd.y * 0.5 + 0.7);
}

vec4 FishCol ()
{
  vec3 col, colTop, colBot, colBody, colHead, colMouth, colFin, colEye, pEye;
  float spec, aEye, sEye;
  pEye = qHit - vec3 (-1., 0., 0.4);
  aEye = atan (pEye.x, pEye.y);
  sEye = length (pEye);
  if (sEye > 0.26) {
    colBot = vec3 (1., 0.8, 0.6);
    colTop = 0.8 * colBot;
    colFin = vec3 (1., 1., 0.5);
    colMouth = 1.5 * colBot;
    colBody = mix (colTop, colBot, 1. - smoothstep (-0.2, 0.4, qHit.y) +
       ScalesSh (fh.vSc.xy, fh.vSc.z));
    colHead = mix (colTop, colBot, smoothstep (0., 0.5, sEye) *
       smoothstep (0.5, 1.1, sEye));
    colHead += 0.05 * (sin (aEye * 20. + sEye) *
       sin (aEye * 3. - sEye * 4.) * (sin (sEye * 10.) + 1.));
    colHead = mix (colMouth, colHead, smoothstep (0., 0.2, fh.dMouth));
    col = mix (colFin, mix (colBody, colHead, smoothstep (0.8, 1., fh.dTail)),
       clamp (1. - (fh.dBody - 0.01) * 50., 0., 1.)) *
       (0.125 * (sin (sEye * 5.) + 1.) * (sin (fh.dDors * 10.) + 1.) + 0.5);
    spec = 0.3;
  } else {
    colEye = vec3 (0.8, 0.6, 0.2);
    col = colEye + sin (aEye * 2. * pi + 0.3) * sin (aEye * pi) * 0.1;
    col *= smoothstep (0.13, 0.15, sEye) *
       (1.25 - smoothstep (0.19, 0.25, sEye));
    spec = 0.6;
  }
  return vec4 (col, spec);
}

float WatShd (vec3 rd)
{
  vec2 p;
  float t, h;
  p = 20. * rd.xz / rd.y;
  t = tCur * 2.;
  h = sin (p.x * 2. + t * 0.77 + sin (p.y * 0.73 - t)) +
     sin (p.y * 0.81 - t * 0.89 + sin (p.x * 0.33 + t * 0.34)) +
     (sin (p.x * 1.43 - t) + sin (p.y * 0.63 + t)) * 0.5;
  h *= smoothstep (0.5, 1., rd.y) * 0.04;
  return h;
}

vec3 BgCol (vec3 rd)
{
  float u, t, gd, b;
  u = rd.y + 1.;
  t = tCur * 4.;
  b = dot (vec2 (atan (rd.x, rd.z), 0.5 * pi - acos (rd.y)), vec2 (2., sin (rd.x)));
  gd = clamp (sin (5. * b + t), 0., 1.) * clamp (sin (3.5 * b - t), 0., 1.) +
     clamp (sin (21. * b - t), 0., 1.) * clamp (sin (17. * b + t), 0., 1.);
  return vec3 (0.25, 0.4, 1.) * (0.24 + 0.44 * u * u) * (1. + gd * 0.05);
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, bgCol, vn;
  float dstObj, d, spec;
  int idObj;
  col = vec3 (0.);
  bgCol = BgCol (rd);
  dstObj = dstFar;
  d = FObjRay (ro, rd);
  if (d < dstObj) {
    dstObj = d;
    idObj = 1;
  }
  d = KObjRay (ro, rd);
  if (d < dstObj) {
    dstObj = d;
    idObj = 2;
  }
  d = BObjRay (ro, rd);
  if (d < dstObj) {
    dstObj = d;
    idObj = 3;
  }
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObj == 1) {
      col4 = FishCol ();
      col = col4.rgb;
      col = mix (col, bgCol * vec3 (1., 0.8, 0.7), FinSh (rd));
      spec = col4.a;
    } else if (idObj == 2) {
      col = vec3 (0.2, 0.7, 0.3);
      spec = 0.;
    } else if (idObj == 3) {
      col = 0.7 * mix (vec3 (1.), BgCol (reflect (rd, vn)), 0.7);
      spec = 0.5;
    }
    col = col * (0.2 * bgCol +
       0.2 * max (dot (vn, normalize (vec3 (- ltDir.x, ltDir.y, - ltDir.z))), 0.) +
       0.2 * max (vn.y, 0.) + 0.6 * max (dot (vn, ltDir), 0.)) +
       spec * pow (max (0., dot (ltDir, reflect (rd, vn))), 32.);
    col *= 0.5 + 0.5 * clamp (rd.y + 1., 0., 1.5);
    col += 0.2 * TurbLt (0.03 * ro, abs (vn), 0.5 * tCur) *
       smoothstep (-0.3, -0.1, vn.y);
    col = mix (col, bgCol, smoothstep (0.3 * dstFar, dstFar, dstObj));
  } else col = bgCol + WatShd (rd);
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd;
  vec2 canvas, uv, ori, ca, sa;
  float el, az;
  canvas = resolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = time;

  az = 0.8 * pi + 0.02 * pi * tCur;
  el = -0.22 * pi * sin (0.027 * pi * tCur);

  el = clamp (el, -0.2 * pi, 0.2 * pi);
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
     mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  ro = vuMat * vec3 (0., 9., -10.);
  rd = vuMat * normalize (vec3 (uv, 2.5));
  ltDir = normalize (vec3 (0.2, 1., -0.2));
  dstFar = 50.;
  fragColor = vec4 (pow (ShowScene (ro, rd), vec3 (0.7)), 1.);
}

const vec4 cHashA4 = vec4 (0., 1., 57., 58.);
const vec3 cHashA3 = vec3 (1., 57., 113.);
const float cHashM = 43758.54;

float Hashfv2 (vec2 p)
{
  return fract (sin (dot (p, cHashA3.xy)) * cHashM);
}

vec3 Hashv3f (float p)
{
  return fract (sin (vec3 (p, p + 1., p + 2.)) *
     vec3 (cHashM, cHashM * 0.43, cHashM * 0.37));
}

float SmoothMin (float a, float b, float r)
{
  float h;
  h = clamp (0.5 + 0.5 * (b - a) / r, 0., 1.);
  return mix (b, a, h) - r * h * (1. - h);
}

float SmoothBump (float lo, float hi, float w, float x)
{
  return (1. - smoothstep (hi - w, hi + w, x)) * smoothstep (lo - w, lo + w, x);
}

vec2 Rot2D (vec2 q, float a)
{
  return q * cos (a) + q.yx * sin (a) * vec2 (-1., 1.);
}

float PrSphDf (vec3 p, float s)
{
  return length (p) - s;
}

float PrEllipsDf (vec3 p, vec3 r)
{
  return (length (p / r) - 1.) * min (r.x, min (r.y, r.z));
}

float PrRndBoxDf (vec3 p, vec3 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}
