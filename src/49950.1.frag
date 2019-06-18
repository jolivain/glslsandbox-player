/*
 * Original shader from: https://www.shadertoy.com/view/Mltfzf
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Fibonacci's Fugu" by dr2 - 2018
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

// Prickly fish; motivated by kali's "Puffy" (mouseable)

float PrSphDf (vec3 p, float r);
float PrCylDf (vec3 p, float r, float h);
float PrCylAnDf (vec3 p, float r, float w, float h);
float SmoothMin (float a, float b, float r);
float SmoothBump (float lo, float hi, float w, float x);
vec3 RotToDirLim (vec3 v1, vec3 v2, vec3 p, float aMax);
vec2 Rot2D (vec2 q, float a);
float Minv3 (vec3 p);
vec3 Hashv3f (float p);

vec3 qBody = vec3(0.), ltDir = vec3(0.), bGrid = vec3(0.), eyePos = vec3(0.), eyeDir = vec3(0.);
float dstFar = 0., tCur = 0., bodyEx = 0., spkEx = 0., mthShp = 0.;
int idObj = 0;
const int idBody = 1, idFinV = 2, idFinL = 3, idTail = 4, idMouth = 5, idEye = 6, idBub = 7;
const float pi = 3.14159, phi = 1.618034;

float BubDf (vec3 p, vec3 pw, vec3 vr)
{
  vec3 b;
  float s, t, r, d, a;
  t = tCur;
  vr -= 0.5;
  s = pow (fract (dot (vr, vec3 (1.)) * 100.), 4.);
  pw.y += t;
  pw = 7. * pw + 2. * pi * vr + vec3 (t, 0., t);
  d = sin ((t + vr.y) * 3. * pi * (1. - s)) * 0.3 * vr.x * (1. - s);
  a = vr.z * t;
  b = d * vec3 (cos (a), 0., sin (a));
  r = 0.1 + s * (0.02 * dot (sin (pw), vec3 (1.)) - 0.05);
  return 0.9 * PrSphDf (p - 0.1 * b, 0.1 * r);
}

float DstBub (vec3 p, vec3 cId)
{
  vec3 vr;
  vr = Hashv3f (dot (cId, vec3 (31., 33., 35.)));
  return (vr.x * smoothstep (2., 5., length (cId)) > 0.9) ?
     BubDf (p - bGrid * (cId + 0.5), p, vr) : dstFar;
}

float BObjRay (vec3 ro, vec3 rd)
{
  vec3 p, cId, s;
  float dHit, d, eps;
  eps = 0.0005;
  if (rd.x == 0.) rd.x = 0.001;
  if (rd.y == 0.) rd.y = 0.001;
  if (rd.z == 0.) rd.z = 0.001;
  dHit = eps;
  for (int j = 0; j < 120; j ++) {
    p = ro + dHit * rd;
    p.y -= 0.4 * tCur + 40.;
    cId = floor (p / bGrid);
    d = DstBub (p, cId);
    s = (bGrid * (cId + step (0., rd)) - p) / rd;
    d = min (d, Minv3 (s) + eps);
    if (d < eps || dHit > dstFar) break;
    dHit += d;
  }
  if (d >= eps) dHit = dstFar;
  return dHit;
}

float BObjDf (vec3 p)
{
  return DstBub (p, floor (p / bGrid));
}

vec3 BObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  p.y -= 0.4 * tCur + 40.;
  v = vec4 (BObjDf (p + e.xxx), BObjDf (p + e.xyy), BObjDf (p + e.yxy), BObjDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

vec4 SphFib (vec3 v, float n)
{   // Keinert et al's inverse spherical Fibonacci mapping
  vec4 b;
  vec3 vf, vfMin;
  vec2 ff, c;
  float fk, ddMin, dd, a, z, ni;
  ni = 1. / n;
  fk = pow (phi, max (2., floor (log (n * pi * sqrt (5.) * dot (v.xy, v.xy)) /
     log (phi + 1.)))) / sqrt (5.);
  ff = vec2 (floor (fk + 0.5), floor (fk * phi + 0.5));
  b = vec4 (ff * ni, pi * (fract ((ff + 1.) * phi) - (phi - 1.)));
  c = floor ((0.5 * mat2 (b.y, - b.x, b.w, - b.z) / (b.y * b.z - b.x * b.w)) *
     vec2 (atan (v.y, v.x), v.z - (1. - ni)));
  ddMin = 4.1;
  for (int j = 0; j < 4; j ++) {
    a = dot (ff, vec2 (j - 2 * (j / 2), j / 2) + c);
    z = 1. - (2. * a + 1.) * ni;
    vf = vec3 (sin (2. * pi * fract (phi * a) + vec2 (0.5 * pi, 0.)) * sqrt (1. - z * z), z);
    dd = dot (vf - v, vf - v);
    if (dd < ddMin) {
      ddMin = dd;
      vfMin = vf;
    }
  }
  return vec4 (sqrt (ddMin), vfMin);
}

vec2 SpkShp ()
{
  vec4 f4;
  vec3 uf;
  float s;
  f4 = SphFib (normalize (qBody + vec3 (0., 0., 0.1)), 4096.);
  uf = f4.yzw;
  s = smoothstep (0.95, 0.99, dot (uf, normalize (vec3 (0., 0.24, 1.))));
  if (s == 0.) s = smoothstep (0.92, 0.99, dot (uf, normalize (vec3 (0., 0.35, -1.))));
  if (s == 0.) s = smoothstep (0.9, 0.94, dot (uf, normalize ((eyePos - vec3 (0., 0., -0.03)) *
     vec3 (sign (uf.x), 1., 1.))));
  if (s == 0.) s = smoothstep (0.97, 0.99, dot (uf, normalize (vec3 (sign (uf.x), 0., 0.25))));
  if (s == 0.) s = smoothstep (0.97, 0.99, dot (uf, normalize (vec3 (0., sign (uf.y), -0.1))));
  return vec2 (1. - s, f4.x);
}

float DstBody (vec3 p)
{
  vec3 q;
  vec2 spk;
  float spkLen, db, dt;
  qBody = p;
  spk = SpkShp ();
  spkLen = spk.x * (1. - smoothstep (0.001, 0.02, spk.y)) * (0.001 + 0.04 * spkEx);
  p.y -= -0.03 * bodyEx;
  p.x *= 1. + 1.5 * (p.y + 0.2) * (p.y + 0.2);
  p.xy *= 1. + 0.5 * smoothstep (0., 0.5, - p.z);
  q = (p - vec3 (0., 0.2 + 0.025 * bodyEx, 0.5 * (p.y - 0.2) - 0.14)) * vec3 (1.4, 1.7, 0.6);
  dt = PrSphDf (q, 0.4 - 0.2 * smoothstep (0., 1.5, 1.3 - p.z) + spkLen);
  q = p * vec3 (1.2, 1.2, 1. + 0.5 * smoothstep (0., 0.5, - p.y - p.z));
  db = PrSphDf (q, 0.37 + smoothstep (0., 1.7, - p.z) + 0.03 * bodyEx + spkLen);
  q = qBody;
  q.yz -= vec2 (0.1, 0.1);
  q.xy *= vec2 (0.5, 1.) + vec2 (0.1, -0.4) * mthShp;
  db = max (db, - PrCylDf (q, 0.02, 0.3));
  return SmoothMin (db, dt, 0.05);
}

float DstMth (vec3 p)
{
  p.yz -= vec2 (0.1, 0.34 + 0.02 * bodyEx - 2. * p.x * p.x);
  p.xy *= vec2 (0.5 + 0.1 * mthShp, 1. - 0.5 * mthShp);
  return PrCylAnDf (p, 0.015, 0.0015, 0.03);
}

float DstTail (vec3 p)
{
  float d, r, a;
  p.yz -= vec2 (0.11, -0.45);
  p.xz = Rot2D (p.xz, 0.5 * cos (2. * tCur - 3. * p.y + 5. * p.z));
  a = 0.003 * sin (32. * atan (p.y, p.z));
  r = length (p.yz);
  d = min (0.01 - 0.008 * smoothstep (0.15, 0.25, r) - abs (p.x -
     a * smoothstep (0.04, 0.08, r)), 0.35 - 0.05 * p.y - 0.01 * cos (a * 1024.) - r);
  d = - SmoothMin (abs (p.y) + 0.3 * p.z, SmoothMin (-0.3 * abs (p.y) - p.z, d, 0.02), 0.02);
  return d;
}

float DstFinL (vec3 p)
{
  float d, r, a, t, w;
  t = 5. * tCur + 0.2 * sign (p.x);
  p.x = abs (p.x) - 0.26 - 0.02 * bodyEx;
  p.xz = Rot2D (p.xz, 0.4 * pi);
  w = 0.15 * (1. - 0.15 * bodyEx) * (1. + 5. * length (p));
  p.yz = Rot2D (p.yz, 0.2 + 0.5 * w * cos (t + 2. * atan (p.x, - p.y)) - 0.5 * pi);
  p.xz = Rot2D (p.xz, 1.2 + 0.75 * bodyEx + w * sin (t - w) - 0.5 * pi);
  a = atan (p.x, - p.y);
  r = length (p.xy);
  d = min (0.01 - 0.008 * smoothstep (0.2, 0.3, r) -
     abs (p.z + 0.002 * sin (32. * a) * smoothstep (0.05, 0.08, r)),
     0.4 - 0.15 * smoothstep (1., 3., abs (a)) - 0.01 * cos (32. * a) - r);
  d = - 0.9 * SmoothMin (-0.2 * p.x + p.y, SmoothMin (p.x - 0.7 * p.y, d, 0.02), 0.02);
  return d;
}

float DstFinV (vec3 p)
{
  float d, r, a, y;
  p.y = abs (p.y + 0.035 * bodyEx) - 0.035 * bodyEx - 0.26 - 0.02 * sign (p.y);
  p.z -= -0.1;
  y = smoothstep (0., 0.2, p.y);
  p.z *= 1. - 0.3 * y * y;
  a = - cos (4. * tCur + 5. * (- p.y + p.z)) * (0.1 - 0.3 * p.z);
  p.xz = Rot2D (p.xz, a);
  p.xy = Rot2D (p.xy, a);
  a = 0.0025 * sin (32. * atan (p.y, p.z));
  r = length (p.yz);
  d = min (0.01 - 0.009 * smoothstep (0.1, 0.2, r) -
     abs (p.x + a * smoothstep (0.04, 0.1, r)), 0.22 - 0.015 * cos (512. * a) - r);
  d = - SmoothMin (p.y + 0.4 * p.z, SmoothMin (-0.4 * p.y - p.z, d, 0.02), 0.02);
  return d;
}

float FObjDf (vec3 p)
{
  float dMin, d, a, c;
  c = cos (2. * tCur);
  a = -0.5 * smoothstep (-0.2, 1.1, - p.z) * c;
  p.xz = Rot2D (p.xz, 0.1 * c + a);
  p.xy = Rot2D (p.xy, 0.5 * a);
  dMin = 0.3 * DstBody (p);
  idObj = idBody;
  d = DstMth (p);
  if (abs (d) < dMin) idObj = idMouth;
  dMin = SmoothMin (dMin, d, 0.01);
  d = 0.6 * DstTail (p);
  if (d < dMin) idObj = idTail;
  dMin = SmoothMin (dMin, d, 0.01);
  d = 0.7 * DstFinL (p);
  if (d < dMin) idObj = idFinL;
  dMin = SmoothMin (dMin, d, 0.01);
  d = 0.7 * DstFinV (p);
  if (d < dMin) idObj = idFinV;
  dMin = SmoothMin (dMin, d, 0.01);
  p.x = abs (p.x);
  d = PrSphDf (p - eyePos, 0.13);
  if (d < dMin) idObj = idEye;
  dMin = SmoothMin (dMin, d, 0.02);
  return dMin;
}

float FObjRay (vec3 ro, vec3 rd)
{
  float d, h;
  d = 0.;
  for (int j = 0; j < 120; j ++) {
    h = FObjDf (ro + d * rd);
    d += h;
    if (h < 0.0005 || d > dstFar) break;
  }
  return d;
}

vec3 FObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  v = vec4 (FObjDf (p + e.xxx), FObjDf (p + e.xyy), FObjDf (p + e.yxy), FObjDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float FObjSShadow (vec3 ro, vec3 rd)
{
  float sh, d, h;
  sh = 1.;
  d = 0.01;
  for (int j = 0; j < 30; j ++) {
    h = FObjDf (ro + d * rd);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.7 + 0.3 * sh;
}

float TurbLt (vec3 p, vec3 n, float t)
{
  vec4 b;
  vec2 q, qq;
  float c, tt;
  q = 2. * pi * mod (vec2 (dot (p.yzx, n), dot (p.zxy, n)), 1.) - 256.;
  t += 11.;
  c = 0.;
  qq = q;
  for (float j = 1.; j <= 7.; j ++) {
    tt = t * (1. + 1. / j);
    b = sin (tt + vec4 (- qq + vec2 (0.5 * pi, 0.), qq + vec2 (0., 0.5 * pi)));
    qq = q + tt + b.xy + b.zw;
    c += 1. / length (q / sin (qq));
  }
  return clamp (pow (abs (1.25 - abs (0.167 + 40. * c)), 8.), 0., 1.);
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
  float t, gd, b;
  t = 4. * tCur;
  b = dot (vec2 (atan (rd.x, rd.z), 0.5 * pi - acos (rd.y)), vec2 (2., sin (rd.x)));
  gd = clamp (sin (5. * b + t), 0., 1.) * clamp (sin (3.5 * b - t), 0., 1.) +
     clamp (sin (21. * b - t), 0., 1.) * clamp (sin (17. * b + t), 0., 1.);
  return vec3 (0.2, 0.5, 1.) * (0.24 + 0.44 * (rd.y + 1.) * (rd.y + 1.)) * (1. + gd * 0.05);
}

vec4 FObjCol (vec3 p)
{
  vec4 col4;
  vec3 ve;
  vec2 spk;
  float s, t;
  col4 = vec4 (0.9, 0.9, 0.5, 0.2);
  if (idObj == idBody) {
    col4.rgb *= 0.7 + 0.3 * smoothstep (-0.1, 0.1, qBody.y);
    spk = SpkShp ();
    col4.rgb = mix (col4.rgb, vec3 (0.9, 0.7, 0.7), 0.5 * smoothstep (0., 0.01, spk.x) *
       SmoothBump (0.25, 0.75, 0.1, mod (128. * atan (0.7 * qBody.x, qBody.y - 0.1) / pi, 1.)));
    col4 = mix (col4, vec4 (0.9, 0.9, 0.95, 0.5), step (0.02, spk.x) * step (spk.y, 0.02));
  } else if (idObj == idMouth) {
    col4 = vec4 (0.9, 0.7, 0.7, 0.3);
  } else if (idObj == idFinV || idObj == idFinL) {
    col4.rgb = mix (col4.rgb, vec3 (1., 1., 0.8), smoothstep (0.4, 0.5, length (p)));
  } else if (idObj == idTail) {
    col4.rgb = mix (col4.rgb, vec3 (1., 1., 0.8), smoothstep (0.6, 0.7, length (p)));
  } else if (idObj == idEye) {
    if (abs (p.y - eyePos.y - 0.04) < 0.001 + 0.1 * SmoothBump (0.13, 0.87, 0.07,
       mod (0.5 * tCur, 1.))) {
      ve = RotToDirLim (eyeDir, normalize (vec3 (sign (p.x), 0., 0.)),
         p - eyePos * vec3 (sign (p.x), 1., 1.), 0.35 * pi);
      s = length (ve.yz);
      t = (1. - step (s, 0.06 + 0.02 * SmoothBump (0.25, 0.75, 0.25,
         mod (12. * atan (ve.y, ve.z) / pi, 1.))));
      col4.rgb = (vec3 (0.25, 0.5, 0.25) + vec3 (0.75, 0.5, 0.75) * smoothstep (0.07, 0.1, s)) * t;
      col4.a = (t == 0.) ? -1. : 0.3;
    } else idObj = idBody;
  }
  return col4;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 vn, col, bgCol;
  float dstFish, dstBub, spec, sh;
  bgCol = BgCol (rd);
  dstFish = FObjRay (ro, rd);
  dstBub = BObjRay (ro, rd);
  if (min (dstBub, dstFish) < dstFar) {
    if (dstFish < dstBub) {
      ro += dstFish * rd;
      vn = FObjNf (ro);
      col4 = FObjCol (ro);
      col = col4.rgb;
      spec = col4.a;
      sh = FObjSShadow (ro, ltDir);
      if (spec >= 0.) col = mix (col, BgCol (reflect (rd, vn)), 0.2);
    } else if (dstBub < dstFar) {
      ro += dstBub * rd;
      vn = BObjNf (ro);
      col = mix (vec3 (1.), BgCol (reflect (rd, vn)), 0.7);
      spec = 0.5;
      sh = 1.;
      idObj = idBub;
    }
    if (spec >= 0.) {
      col = col * (0.1 + 0.2 * bgCol + 0.7 * sh * max (dot (vn, ltDir), 0.)) +
         spec * sh * pow (max (dot (normalize (ltDir - rd), vn), 0.), 32.);
      col += 0.3 * TurbLt (0.5 * ro, abs (vn), 0.5 * tCur) * smoothstep (-0.3, -0.1, vn.y);
      if (idObj == idBub) col *= 0.5 + 0.5 * clamp (rd.y + 1., 0., 1.5);
    } else {
      rd = reflect (rd, vn);
      col = 0.5 * (BgCol (rd) + WatShd (rd));
    }
    col = mix (col, bgCol, smoothstep (0.3, 0.95, min (dstBub, dstFish) / dstFar));
  } else col = bgCol + WatShd (rd);
  return col;
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, ori, ca, sa;
  float el, az, zmFac;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  az = - pi;
  el = 0.;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += 0.7 * pi * mPtr.y;
  } else {
    az += 2. * pi * sin (0.01 * pi * tCur);
    el -= 0.1 + 0.3 * pi * sin (0.016 * pi * tCur);
  }
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  zmFac = 3.;
  ro = vuMat * vec3 (0., 0., -2. - 0.5 * sin (0.35 * tCur));
  rd = vuMat * normalize (vec3 (uv, zmFac));
  ltDir = normalize (vec3 (0.5, 2., 1.));
  bGrid = vec3 (0.5);
  mthShp = sin (6. * tCur);
  bodyEx = SmoothBump (0.25, 0.75, 0.15, mod (0.4 * tCur, 1.));
  spkEx = SmoothBump (0.65, 0.85, 0.05, mod (0.2 * tCur, 1.));
  eyePos = vec3 (0.13);
  eyeDir = normalize (ro - eyePos + vec3 (0., 0.5, 0.));
  dstFar = 10.;
  col = ShowScene (ro, rd);
  fragColor = vec4 (clamp (col, 0., 1.), 1.);
}

float PrSphDf (vec3 p, float r)
{
  return length (p) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

float PrCylAnDf (vec3 p, float r, float w, float h)
{
  return max (abs (length (p.xy) - r) - w, abs (p.z) - h);
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

vec3 RotToDirLim (vec3 v1, vec3 v2, vec3 p, float aMax)
{
  vec3 n;
  float c;
  n = normalize (cross (v1, v2));
  c = max (dot (v1, v2), cos (aMax));
  return c * p + sin (acos (c)) * cross (n, p) + (1. - c) * dot (n, p) * n;
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
}

float Minv3 (vec3 p)
{
  return min (p.x, min (p.y, p.z));
}

const float cHashM = 43758.54;

vec3 Hashv3f (float p)
{
  return fract (sin (p + vec3 (37., 39., 41.)) * cHashM);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
