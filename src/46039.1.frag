/*
 * Original shader from: https://www.shadertoy.com/view/4dGcDh
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
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Asteroid Field" by dr2 - 2018
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

float PrRoundBoxDf (vec3 p, vec3 b, float r);
float PrCylDf (vec3 p, float r, float h);
float PrCylAnDf (vec3 p, float r, float w, float h);
float PrCapsDf (vec3 p, float r, float h);
float SmoothMin (float a, float b, float r);
float Minv3 (vec3 p);
vec2 Rot2D (vec2 q, float a);
vec3 HsvToRgb (vec3 c);
float Hashfv2 (vec2 p);
vec3 Hashv3v3 (vec3 p);
float Noisefv3 (vec3 p);
float Fbm1 (float p);
float Fbm3 (vec3 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

mat3 flMat = mat3(0.), flyerMat = mat3(0.);
vec4 ast = vec4(0.);
vec3 flPos = vec3(0.), flyerPos = vec3(0.), qHit = vec3(0.),
     ltDir = vec3(0.), cId = vec3(0.), hsh = vec3(0.);
float tCur = 0., dstFar = 0., spd = 0., szFacFl = 0.;
int idObj = 0;
const vec3 bGrid = vec3 (1.);
const float pi = 3.14159;

vec3 trkAx = vec3 (0.7, 0.8, 1.2), trkAy = vec3 (1., 1.1, 0.9),
   trkFx = vec3 (0.43, 0.33, 0.23), trkFy = vec3 (0.41, 0.31, 0.12);

vec3 TrackPath (float t)
{
  return vec3 (dot (trkAx, cos (trkFx * t)), dot (trkAy, cos (trkFy * t)), t);
}

vec3 TrackVel (float t)
{
  return vec3 (- dot (trkFx * trkAx, sin (trkFx * t)),
     - dot (trkFy * trkAy, sin (trkFy * t)), 1.);
}

vec3 TrackAcc (float t)
{
  return vec3 (- dot (trkFx * trkFx * trkAx, cos (trkFx * t)),
     - dot (trkFy * trkFy * trkAy, cos (trkFy * t)), 0.);
}

void AstState ()
{
  float s, r, a;
  hsh = Hashv3v3 (cId);
  s = fract (64. * length (hsh));
  s *= s;
  r = 0.5 * bGrid.x * (0.8 + 0.2 * hsh.x * (1. - s) * abs (sin (3. * pi * hsh.y * (1. - s))));
  a = hsh.z * tCur + hsh.x;
  ast = vec4 ((r - 1.1 * (0.15 - 0.07 * s)) * vec3 (cos (a), sin (a), 0.), 0.15 - 0.07 * s);
}

float AstDf (vec3 p)
{
  vec2 s;
  s = abs (cId.xy - floor (TrackPath (bGrid.z * cId.z).xy / bGrid.xy));
  return (hsh.x > 0.7 && max (s.x, s.y) > 0.) ?
     length (p - bGrid * (cId + 0.5) - ast.xyz) - ast.w : dstFar;
}

vec3 AstCell (vec3 p)
{
  cId.xy = floor (p.xy / bGrid.xy);
  p.z += 0.1 * spd * tCur * Hashfv2 (cId.xy) * step (10., length (cId.xy));
  cId.z = floor (p.z / bGrid.z);
  return p;
}

float AstRay (vec3 ro, vec3 rd)
{
  vec3 cIdP, p, s;
  float dHit, d, eps;
  eps = 0.0005;
  if (rd.x == 0.) rd.x = 0.001;
  if (rd.y == 0.) rd.y = 0.001;
  if (rd.z == 0.) rd.z = 0.001;
  cIdP = vec3 (-999.);
  dHit = eps;
  for (int j = 0; j < 100; j ++) {
    p = ro + rd * dHit;
    p = AstCell (p);
    if (length (cId - cIdP) > 0.) {
      AstState ();
      cIdP = cId;
    }
    d = AstDf (p);
    s = (bGrid * (cId + step (0., rd)) - p) / rd;
    d = min (d, abs (Minv3 (s)) + eps);
    dHit += d;
    if (d < eps || dHit > dstFar) break;
  }
  if (d >= eps) dHit = dstFar;
  return dHit;
}

vec3 AstNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  p = AstCell (p);
  AstState ();
  v = vec4 (AstDf (p + e.xxx), AstDf (p + e.xyy), AstDf (p + e.yxy), AstDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float FlyerEngDf (vec3 p)
{
  vec3 q;
  float d;
  p = flyerMat * (p - flyerPos);
  p = p / szFacFl;
  q = p - vec3 (0., 0.3, -0.6);
  q.xz = abs (q.xz) - vec2 (1.6, 1.3);
  q.xy = Rot2D (q.xy, -32. * tCur);
  d = max (PrCylDf (q, 0.4, 0.4), 0.05 - min (abs (q.x), abs (q.y)));
  return szFacFl * d;
}

float FlyerEngRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 50; j ++) {
    d = FlyerEngDf (ro + dHit * rd);
    dHit += d;
    if (d < 0.0002 || dHit > dstFar) break;
  }
  return dHit;
}

float FlyerDf (vec3 p)
{
  vec3 q, qq;
  float dMin, d, h;
  dMin = dstFar / szFacFl;
  p = flyerMat * (p - flyerPos);
  p = p / szFacFl;
  q = p;
  h = 0.5 - 0.05 * (q.z + 0.3) * (q.z + 0.3);
  q.y -= h;
  d = PrRoundBoxDf (q, vec3 (0.9 - 0.06 * (q.z + 0.5) * (q.z + 0.5), h, 2.7), 0.15);
  q = p + vec3 (0., -0.3, 0.6);
  qq = q;  qq.xz = abs (qq.xz) - vec2 (1.6, 1.3);
  d = min (min (min (d, PrCylAnDf (qq, 0.44, 0.04 - 0.03 * (qq.z / 0.48) * (qq.z / 0.48), 0.48)),
     PrCylDf (qq, 0.15 - 0.12 * (qq.z / 0.45) * (qq.z / 0.45), 0.45)),
     PrRoundBoxDf (qq, vec3 (0.4, 0.01, 0.1), 0.01));
  q = p;  q.y -= 0.3;
  qq = q;  qq.z = abs (qq.z + 0.6) - 1.3;
  d = SmoothMin (d, PrRoundBoxDf (qq, vec3 (1.15, 0.03 - 0.05 * abs (qq.z), 0.3), 0.01), 0.05);
  DMINQ (1);
  q = p;  q.yz -= vec2 (0.52, 0.5);
  d = PrCapsDf (q, 0.6, 1.);
  DMINQ (2);
  return 0.7 * szFacFl * dMin;
}

float FlyerRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 150; j ++) {
    d = FlyerDf (ro + dHit * rd);
    dHit += d;
    if (d < 0.0002 || dHit > dstFar) break;
  }
  return dHit;
}

vec3 FlyerNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  v = vec4 (FlyerDf (p + e.xxx), FlyerDf (p + e.xyy), FlyerDf (p + e.yxy), FlyerDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

vec4 FlyerCol ()
{
  vec4 col;
  float ax;
  col = vec4 (0.9, 0.9, 0.95, 0.3);
  ax = abs (qHit.x);
  if (idObj == 1) {
    if (qHit.z > 2. && length (vec2 (ax - 0.15, qHit.y + 0.3)) < 0.08) {
      if (length (vec2 (ax - 0.15, qHit.y + 0.3)) < 0.06) col = vec4 (1., 1., 0.8, -2.);
      else col = vec4 (0.5, 0.5, 0.7, 0.3);
    } else if (qHit.z < -2. && length (vec2 (abs (ax - 0.3) - 0.15, qHit.y + 0.1)) < 0.1) {
      if (length (vec2 (abs (ax - 0.3) - 0.15, qHit.y + 0.1)) < 0.08) col = vec4 (1., 0., 0., -2.);
      else col = vec4 (0.5, 0.5, 0.7, 0.3);
    } else if (abs (abs (qHit.z + 0.15) - 1.3) < 0.1 && length (vec2 (ax - 1.6, qHit.y)) < 0.2) {
      col = vec4 (1., 0., 0., 0.3);
    } else if (ax < 0.02 || qHit.z < -2.8 && mod (8. * qHit.x + 0.1, 1.) < 0.2 ||
       qHit.z > 2.8 && mod (12. * qHit.y + 0.1, 1.) < 0.2 ||
       abs (qHit.z + 1.3) < 0.9 && ax < 0.8 && mod (6. * qHit.x + 0.1, 1.) < 0.15 ||
       abs (qHit.z + 0.7) < 0.5 && abs (qHit.y - 0.2) < 0.3 && mod (12. * qHit.y + 0.1, 1.) < 0.15) {
      col = vec4 (0.6, 0.6, 0.6, 0.3);
    } else if (abs (abs (qHit.z + 0.15) - 1.3) < 0.1 && ax > 1.12) {
      col = vec4 (0.6, 0.6, 0.6, 0.3);
    } else if (length (vec2 (abs (qHit.z + 0.6) - 1.3, ax - 1.6)) < 0.1 && abs (qHit.y) > 0.44) {
       col = mix (0.8 * col, vec4 (0., 1., 0., -2.), step (0.5, mod (0.5 * tCur, 1.)));
    }
  } else if (idObj == 2) {
    if (min (ax, abs (qHit.z - 1.)) > 0.03) col = vec4 (0.1, 0.1, 0.2, -1.);
  }
  return col;
}

vec3 HvnCol (vec3 rd)
{
  vec3 col;
  float b;
  b = dot (vec2 (atan (rd.x, rd.z), 0.5 * pi - acos (rd.y)), vec2 (2., sin (rd.x)));
  col = 0.3 * mix (vec3 (0.8, 0.8, 0.7), vec3 (0.6, 0.6, 0.5), 0.5 * (1. - rd.y)) *
     (0.4 + 0.15 * (rd.y + 1.) * (rd.y + 1.));
  rd.xz = Rot2D (rd.xz, 0.01 * tCur);
  rd = floor (2000. * rd);
  rd = 0.00015 * rd + 0.1 * Noisefv3 (0.0005 * rd.yzx);
  for (int j = 0; j < 19; j ++) rd = abs (rd) / dot (rd, rd) - 0.9;
  col += 0.3 * vec3 (1., 1., 0.9) * min (1., 0.5e-3 * pow (min (6., length (rd)), 5.));
  return col;
}

vec3 AstCol (vec3 ro, vec3 rd, float dstAst)
{
  vec3 vn, p, col;
  ro += dstAst * rd;
  vn = AstNf (ro);
  p = ro;
  p = AstCell (p);
  AstState ();
  p -= ast.xyz + bGrid * (cId + 0.5) + 0.3 * (hsh - 0.5);
  vn = VaryNf (32. * (0.5 + 0.5 * hsh.x) * p, vn, 10. * (0.5 + 0.5 * hsh.y));
  col = HsvToRgb (vec3 (0.13 + 0.03 * hsh.x, 0.3 + 0.3 * hsh.y,
     min (0.5 + 0.2 * hsh.z + 0.5 * Fbm3 (32. * p), 1.)));
  col = col * (0.1 + 0.9 * max (dot (vn, ltDir), 0.)) +
     0.2 * pow (max (dot (normalize (ltDir - rd), vn), 0.), 32.);
  return mix (col, HvnCol (rd), smoothstep (0.5, 1., min (dstAst / dstFar, 1.)));
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, vn;
  float dstAst, dstFlyer, dstEng, refFac;
  dstEng = FlyerEngRay (ro, rd);
  dstFlyer = FlyerRay (ro, rd);
  if (dstFlyer < dstEng) dstEng = dstFar;
  dstAst = AstRay (ro, rd);
  if (dstFlyer < min (dstAst, dstFar)) {
    ro += rd * dstFlyer;
    vn = FlyerNf (ro);
    col4 = FlyerCol ();
    col = col4.rgb;
    refFac = 0.;
    if (col4.a >= 0.) {
      col = col * (0.2 + 0.1 * max (dot (vn, - ltDir), 0.) + 0.7 * max (dot (vn, ltDir), 0.)) +
         col4.a *  pow (max (dot (normalize (ltDir - rd), vn), 0.), 32.);
      refFac = 0.5;
    } else if (col4.a == -1.) refFac = 0.9;
    if (refFac > 0.) {
      rd = reflect (rd, vn);
      ro += 0.01 * rd;
      dstAst = AstRay (ro, rd);
      col = mix (col, AstCol (ro, rd, dstAst), refFac);
    }
  } else col = AstCol (ro, rd, dstAst);
  if (dstEng < min (dstAst, dstFar)) col = mix (col, vec3 (1., 0.5, 0.1), 0.7);
  return pow (clamp (col, 0., 1.), vec3 (0.9));
}

void FlyerPM (float s, float rl, float vu)
{
  vec3 vel, ort, ca, sa;
  float el, az;
  flPos = TrackPath (s);
  vel = normalize (TrackVel (s));
  el = - asin (vel.y);
  az = atan (vel.z, vel.x) - 0.5 * pi;
  rl = clamp (rl - 3. * TrackAcc (s).x, -0.4 * pi, 0.4 * pi);
  ort = (vu >= 0.) ? vec3 (el, az, rl) : vec3 (- el, az + pi, - rl);
  ca = cos (ort);
  sa = sin (ort);
  flMat = mat3 (ca.z, - sa.z, 0., sa.z, ca.z, 0., 0., 0., 1.) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x) *
          mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y);
}

void mainImage (out vec4 fragColor, vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col, ori, ca, sa;
  vec2 canvas, uv, mMid, ut, mSize;
  float el, az, asp, vuDir;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  asp = canvas.x / canvas.y;
  mSize = (1./6.) * vec2 (asp, 1.);
  mMid = vec2 (1. / mSize.y, 1. / mSize.y - 1.) * mSize * vec2 (1. - 1./6., -1.);
  ut = abs (uv - mMid) - mSize;
  vuDir = 1.;
  if (max (ut.x, ut.y) < 0.) {
    uv = (uv - mMid) / mSize.y;
    vuDir = -1.;
  }
  szFacFl = 0.005;
  spd = 1.5;
  tCur = mod (tCur, 10800.) + 30.;
  az = 0.;
  el = 0.;
  if (mPtr.z > 0.) {
    if (mPtr.x < 0.5 - 1./6. || mPtr.y > -0.5 + 1./6.) {
      az = 2. * pi * mPtr.x;
      el = 0.6 * pi * mPtr.y;
    } else vuDir *= -1.;
  }
  ori = vec3 (el, az, 0.02 * pi * (Fbm1 (tCur) - 0.5));
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x) *
          mat3 (ca.z, - sa.z, 0., sa.z, ca.z, 0., 0., 0., 1.);
  FlyerPM (spd * tCur + ((vuDir > 0.) ? 0.5 + 0.45 * sin (0.2 * tCur) :
     - (0.25 + 0.2 * sin (0.2 * tCur))), 0.03 * pi * (Fbm1 (1.3 * tCur) - 0.5), 0.);
  flyerPos = flPos;
  flyerMat = flMat;
  FlyerPM (spd * tCur, 0., vuDir);
  ro = flPos;
  rd = normalize (vec3 (uv, 2.7));
  rd = rd * flMat;
  rd = vuMat * rd;
  ltDir = normalize (vec3 (1., 1., ((vuDir >= 0.) ? -1. : 1.)));
  ltDir.xy = Rot2D (ltDir.xy, -0.07 * pi * tCur);
  dstFar = 40.;
  col = ShowScene (ro, rd);
  if (max (ut.x, ut.y) < 0. && min (abs (ut.x), abs (ut.y)) * canvas.y < 2.)
     col = vec3 (0.1, 0.1, 0.8);
  fragColor = vec4 (col, 1.);
}

float PrRoundBoxDf (vec3 p, vec3 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

float PrCylAnDf (vec3 p, float r, float w, float h)
{
  return max (abs (length (p.xy) - r) - w, abs (p.z) - h);
}

float PrCapsDf (vec3 p, float r, float h)
{
  return length (p - vec3 (0., 0., h * clamp (p.z / h, -1., 1.))) - r;
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

float Minv3 (vec3 p)
{
  return min (p.x, min (p.y, p.z));
}

vec2 Rot2D (vec2 q, float a)
{
  return q * cos (a) + q.yx * sin (a) * vec2 (-1., 1.);
}

vec3 HsvToRgb (vec3 c)
{
  vec3 p;
  p = abs (fract (c.xxx + vec3 (1., 2./3., 1./3.)) * 6. - 3.);
  return c.z * mix (vec3 (1.), clamp (p - 1., 0., 1.), c.y);
}

const float cHashM = 43758.54;

float Hashfv2 (vec2 p)
{
  return fract (sin (dot (p, vec2 (37., 39.))) * cHashM);
}

vec2 Hashv2f (float p)
{
  return fract (sin (p + vec2 (0., 1.)) * cHashM);
}

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (vec2 (dot (p, cHashVA2), dot (p + vec2 (1., 0.), cHashVA2))) * cHashM);
}

vec3 Hashv3v3 (vec3 p)
{
  vec3 cHashVA3 = vec3 (37., 39., 41.);
  vec2 e = vec2 (1., 0.);
  return fract (sin (vec3 (dot (p + e.yyy, cHashVA3), dot (p + e.xyy, cHashVA3),
     dot (p + e.yxy, cHashVA3))) * cHashM);
}

vec4 Hashv4v3 (vec3 p)
{
  vec3 cHashVA3 = vec3 (37., 39., 41.);
  vec2 e = vec2 (1., 0.);
  return fract (sin (vec4 (dot (p + e.yyy, cHashVA3), dot (p + e.xyy, cHashVA3),
     dot (p + e.yxy, cHashVA3), dot (p + e.xxy, cHashVA3))) * cHashM);
}

float Noiseff (float p)
{
  vec2 t;
  float ip, fp;
  ip = floor (p);
  fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  t = Hashv2f (ip);
  return mix (t.x, t.y, fp);
}

float Noisefv2 (vec2 p)
{
  vec2 t, ip, fp;
  ip = floor (p);  
  fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  t = mix (Hashv2v2 (ip), Hashv2v2 (ip + vec2 (0., 1.)), fp.y);
  return mix (t.x, t.y, fp.x);
}

float Noisefv3 (vec3 p)
{
  vec4 t;
  vec3 ip, fp;
  ip = floor (p);
  fp = fract (p);
  fp *= fp * (3. - 2. * fp);
  t = mix (Hashv4v3 (ip), Hashv4v3 (ip + vec3 (0., 0., 1.)), fp.z);
  return mix (mix (t.x, t.y, fp.x), mix (t.z, t.w, fp.x), fp.y);
}

float Fbm1 (float p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    f += a * Noiseff (p);
    a *= 0.5;
    p *= 2.;
  }
  return f * (1. / 1.9375);
}

float Fbm3 (vec3 p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int i = 0; i < 5; i ++) {
    f += a * Noisefv3 (p);
    a *= 0.5;
    p *= 2.;
  }
  return f * (1. / 1.9375);
}

float Fbmn (vec3 p, vec3 n)
{
  vec3 s;
  float a;
  s = vec3 (0.);
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    s += a * vec3 (Noisefv2 (p.yz), Noisefv2 (p.zx), Noisefv2 (p.xy));
    a *= 0.5;
    p *= 2.;
  }
  return dot (s, abs (n));
}

vec3 VaryNf (vec3 p, vec3 n, float f)
{
  vec3 g;
  vec2 e = vec2 (0.1, 0.);
  g = vec3 (Fbmn (p + e.xyy, n), Fbmn (p + e.yxy, n), Fbmn (p + e.yyx, n)) - Fbmn (p, n);
  return normalize (n + f * (g - n * dot (n, g)));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
