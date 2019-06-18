/*
 * Original shader from: https://www.shadertoy.com/view/XlcfzS
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
// "Sliding Penguins" by dr2 - 2018
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

float PrSphDf (vec3 p, float r);
float PrCylDf (vec3 p, float r, float h);
float PrCapsDf (vec3 p, float r, float h);
float PrEllipsDf (vec3 p, vec3 r);
float PrTorusDf (vec3 p, float ri, float rc);
float SmoothMin (float a, float b, float r);
float SmoothBump (float lo, float hi, float w, float x);
vec2 Rot2D (vec2 q, float a);
float Noisefv2 (vec2 p);
vec3 Noisev3v2 (vec2 p);
float Fbm2s (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

#define N_PENG 3

mat3 pngMat[N_PENG], pMat;
vec3 pngPos[N_PENG], pPos = vec3(0.), qHit = vec3(0.), sunDir = vec3(0.), trkA = vec3(0.), trkF = vec3(0.);
float dstFar = 0., tCur = 0., fAng = 0.;
int idObj = 0;
bool doSh = false;
const float pi = 3.14159;

vec3 TrackPath (float t)
{
  return vec3 (dot (trkA, sin (trkF * t)), 0.5 * cos (0.007 * t) * cos (0.01 * t), t);
}

vec3 TrackDir (float t)
{
  return vec3 (dot (trkF * trkA, cos (trkF * t)), 0., 1.);
}

vec3 TrackAcc (float t)
{
  return vec3 (dot (trkF * trkF * trkA, - sin (trkF * t)), 0., 0.);
}

float GrndHt (vec2 p)
{
  float w;
  w = p.x - TrackPath (p.y).x;
  return SmoothMin (8. * Fbm2s (0.05 * p), 0.1 * w * w - 0.5, 0.5) + Fbm2s (0.1 * p);
}

float GrndRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, h, s, sLo, sHi;
  s = 0.;
  sLo = 0.;
  dHit = dstFar;
  for (int j = 0; j < 250; j ++) {
    p = ro + s * rd;
    h = p.y - GrndHt (p.xz);
    if (h < 0. || s > dstFar) break;
    sLo = s;
    s += max (0.01 * s, 0.4 * h);
  }
  if (h < 0.) {
    sHi = s;
    for (int j = 0; j < 5; j ++) {
      s = 0.5 * (sLo + sHi);
      p = ro + s * rd;
      if (p.y > GrndHt (p.xz)) sLo = s;
      else sHi = s;
    }
    dHit = 0.5 * (sLo + sHi);
  }
  return dHit;
}

vec3 GrndNf (vec3 p)
{
  const vec2 e = vec2 (0.01, 0.);
  return normalize (vec3 (GrndHt (p.xz) - vec2 (GrndHt (p.xz + e.xy),
     GrndHt (p.xz + e.yx)), e.x).xzy);
}

#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

float PengDf (vec3 p, float dMin)
{
  vec3 q;
  float d, dh;
  p.xz *= -1.;
  q = p;
  d = PrEllipsDf (q.xzy, vec3 (1.3, 1.2, 1.4));
  q.y -= 1.5;
  dh = PrEllipsDf (q.xzy, vec3 (0.8, 0.6, 1.3));
  q = p;
  q.x = abs (q.x);
  q -= vec3 (0.3, 2., -0.4);
  d = SmoothMin (d, max (dh, - PrCylDf (q, 0.15, 0.3)), 0.2);
  DMINQ (1);
  q = p;
  q.yz -= vec2 (1.6, -0.6);
  d = max (PrEllipsDf (q, vec3 (0.4, 0.2, 0.6)), 0.01 - abs (q.y));
  DMINQ (2);
  q = p;
  q.x = abs (q.x);
  q -= vec3 (0.3, 2., -0.4);
  d = PrSphDf (q, 0.15);
  DMINQ (3);
  q = p;
  q.x = abs (q.x);
  q.xy -= vec2 (0.6, -1.05);
  q.yz = Rot2D (q.yz, -0.5 * pi);
  q.y -= -0.6;
  d = PrCylDf (q.xzy, 0.12, 0.7);
  DMINQ (4);
  q -= vec3 (0.1, -0.67, -0.4);
  q.xz = Rot2D (q.xz, -0.07 * pi);
  d = PrEllipsDf (q.xzy, vec3 (0.15, 0.5, 0.05));
  q.z -= 0.5;
  q.xz = Rot2D (q.xz, 0.15 * pi);
  q.z -= -0.5;
  d = SmoothMin (d, PrEllipsDf (q.xzy, vec3 (0.15, 0.5, 0.05)), 0.05);
  q.z -= 0.5;
  q.xz = Rot2D (q.xz, -0.3 * pi);
  q.z -= -0.5;
  d = SmoothMin (d, PrEllipsDf (q.xzy, vec3 (0.15, 0.5, 0.05)), 0.05);
  DMINQ (5);
  q = p;
  q.x = abs (q.x);
  q -= vec3 (1.1, 0.3, -0.2);
  q.yz = Rot2D (q.yz, -0.25 * pi);
  q.xy = Rot2D (q.xy, fAng) - vec2 (0.1, -0.4);
  d = PrEllipsDf (q.xzy, vec3 (0.05, 0.25, 0.9));
  DMINQ (6);
  return dMin;
}

float ObjDf (vec3 p)
{
  vec3 q;
  float d, dMin;
  dMin = dstFar;
  for (int j = 0; j < N_PENG; j ++) {
    q = p - pngPos[j];
    d = PrSphDf (q, 3.);
    if (doSh || d < 0.1) dMin = PengDf (pngMat[j] * q, dMin);
    else dMin = min (dMin, d);
  }
  q = p;
  q.x -= TrackPath (p.z).x;
  q.y -= 2.;
  q.z = mod (q.z + 20., 40.) - 20.;
  d = 0.8 * PrTorusDf (q, 0.3, 7.);
  DMINQ (7);
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 160; j ++) {
    d = ObjDf (ro + dHit * rd);
    if (d < 0.0005 || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.001, -0.001);
  v = vec4 (ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float GrndSShadow (vec3 ro, vec3 rd)
{
  vec3 p;
  float sh, d, h;
  doSh = true;
  sh = 1.;
  d = 0.05;
  for (int j = 0; j < 30; j ++) {
    p = ro + d * rd;
    h = p.y - GrndHt (p.xz);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.5 + 0.5 * sh;
}

float ObjSShadow (vec3 ro, vec3 rd)
{
  float sh, d, h;
  sh = 1.;
  d = 0.1;
  for (int j = 0; j < 30; j ++) {
    h = ObjDf (ro + d * rd);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.5 + 0.5 * sh;
}

vec3 SkyCol (vec3 ro, vec3 rd)
{
  vec3 col, vn;
  float f;
  rd.y = abs (rd.y) + 0.0001;
  ro.xz += 0.5 * tCur;
  f = Fbm2s (0.02 * (rd.xz * (100. - ro.y) / rd.y + ro.xz));
  col = vec3 (0.1, 0.2, 0.4);
  col = mix (col, vec3 (0.8), clamp (3. * (f - 0.5) * rd.y + 0.1, 0., 1.));
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, vn, vns;
  float dstGrnd, dstObj, gg, dx, sh;
  doSh = false;
  dstGrnd = GrndRay (ro, rd);
  dstObj = ObjRay (ro, rd);
  if (dstObj < dstGrnd) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObj != 3) {
      if (idObj == 1) col4 = (qHit.z < -0.2 || qHit.z > 0.4 && abs (qHit.x) < 0.04 ||
         qHit.z < 0.4 && length (qHit.xy) < 0.2) ? vec4 (0.9, 0.9, 0.9, 0.1) :
         vec4 (0.15, 0.15, 0.2, 0.1);
      else if (idObj == 2) col4 = vec4 (1., 0.8, 0.2, 0.2);
      else if (idObj == 4) col4 = vec4 (0.8, 0.8, 0., 0.2);
      else if (idObj == 5) col4 = vec4 (0.9, 0.9, 0., 0.2);
      else if (idObj == 6) col4 = vec4 (0.2, 0.2, 0.25, 0.1);
      else if (idObj == 7) col4 = vec4 (0.3, 0.4, 0.7, 0.2);
      sh = ObjSShadow (ro, sunDir);
      col = col4.rgb * (0.2 + 0.1 * max (- dot (vn.xz, normalize (sunDir.xz)), 0.) +
         0.7 * sh * max (dot (vn, sunDir), 0.)) +
         sh * col4.a * pow (max (dot (normalize (sunDir - rd), vn), 0.), 32.);
    } else col = SkyCol (ro, reflect (rd, vn));
  } else if (dstGrnd < dstFar) {
    ro += dstGrnd * rd;
    vn = GrndNf (ro);
    gg = smoothstep (0.6, 0.9, vn.y);
    vn = VaryNf (4. * ro, vn, 0.5);
    vns = normalize (Noisev3v2 (128. * ro.xz) - 0.5);
    vns.y = abs (vns.y);
    dx = abs (ro.x - TrackPath (ro.z).x);
    col = vec3 (1.) * mix (1.1, 1., gg) * (0.7 +
       0.3 * mix (Noisefv2 (vec2 (16. * dx, 0.5 * ro.z)), 1., smoothstep (0., 2., dx)));
    sh = min (GrndSShadow (ro, sunDir), ObjSShadow (ro, sunDir));
    col = col * (0.2 + 0.1 * max (- dot (vn.xz, normalize (sunDir.xz)), 0.) +
       0.7 * sh * max (dot (vn, sunDir), 0.)) +
       0.3 * sh * gg * smoothstep (0.3, 0.5, dot (vn, sunDir)) *
       pow (max (dot (normalize (sunDir - rd), vns), 0.), 8.);
  } else col = SkyCol (ro, rd);
  return pow (clamp (col, 0., 1.), vec3 (0.9));
}

void PengPM (float s, float dir)
{
  vec3 vel, va, acc, ort, cr, sr;
  pPos = TrackPath (s);
  vel = TrackDir (s);
  acc = TrackAcc (s);
  pPos.x -= 50. * acc.x;
  va = cross (acc, vel) / length (vel);
  ort = vec3 (-0.1 * dir, atan (vel.z, vel.x) - 0.5 * dir * pi,
     12. * dir * length (va) * sign (va.y));
  cr = cos (ort);
  sr = sin (ort);
  pMat = mat3 (cr.z, - sr.z, 0., sr.z, cr.z, 0., 0., 0., 1.) *
     mat3 (1., 0., 0., 0., cr.x, - sr.x, 0., sr.x, cr.x) *
     mat3 (cr.y, 0., - sr.y, 0., 1., 0., sr.y, 0., cr.y);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  vec3 rd, ro;
  vec2 canvas, uv;
  float spd;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  tCur = mod (tCur, 600.) - 300.;
  trkA = 5. * vec3 (1.9, 2.9, 4.3);
  trkF = 0.18 * vec3 (0.23, 0.17, 0.13);
  spd = 10.;
  for (int j = 0; j < N_PENG; j ++) {
    PengPM (spd * tCur + 15. * float (j + 1), 1.);
    pPos.y = GrndHt (pPos.xz) + 1.35;
    pPos.y += max (0., 0.5 * cos (0.13 * pPos.z) * cos (0.2 * pPos.z));
    pngPos[j] = pPos;
    pngMat[j] = pMat;
  }
  if (mod (0.1 * tCur, 2.) > 1.2) PengPM (spd * tCur, 1.);
  else PengPM (spd * tCur + 15. * float (N_PENG + 1), -1.);
  ro = pPos;
  ro.y += 3.;
  rd = normalize (vec3 (uv, 2.6)) * pMat;
  fAng = -0.2 * pi + 0.1 * pi * SmoothBump (0.25, 0.75, 0.1, mod (0.2 * tCur, 1.)) *
     sin (16. * pi * tCur);
  sunDir = normalize (vec3 (0., 1.5, 1.));
  sunDir.xz = Rot2D (sunDir.xz, 0.3 * pi * sin (0.1 * tCur));
  dstFar = 250.;
  fragColor = vec4 (ShowScene (ro, rd), 1.);
}

float PrSphDf (vec3 p, float r)
{
  return length (p) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

float PrCapsDf (vec3 p, float r, float h)
{
  return length (p - vec3 (0., 0., clamp (p.z, - h, h))) - r;
}

float PrEllipsDf (vec3 p, vec3 r)
{
  return (length (p / r) - 1.) * min (r.x, min (r.y, r.z));
}

float PrTorusDf (vec3 p, float ri, float rc)
{
  return length (vec2 (length (p.xy) - rc, p.z)) - ri;
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
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

const float cHashM = 43758.54;

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (vec2 (dot (p, cHashVA2), dot (p + vec2 (1., 0.), cHashVA2))) * cHashM);
}

vec4 Hashv4f (float p)
{
  return fract (sin (p + vec4 (0., 1., 57., 58.)) * cHashM);
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

vec3 Noisev3v2 (vec2 p)
{
  vec4 h;
  vec3 g;
  vec2 ip, fp, ffp;
  ip = floor (p);
  fp = fract (p);
  ffp = fp * fp * (3. - 2. * fp);
  h = Hashv4f (dot (ip, vec2 (1., 57.)));
  g = vec3 (h.y - h.x, h.z - h.x, h.x - h.y - h.z + h.w);
  return vec3 (h.x + dot (g.xy, ffp) + g.z * ffp.x * ffp.y,
     30. * fp * fp * (fp * fp - 2. * fp + 1.) * (g.xy + g.z * ffp.yx));
}

float Fbm2s (vec2 p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int i = 0; i < 3; i ++) {
    f += a * Noisefv2 (p);
    a *= 0.5;
    p *= 2.;
  }
  return f * (1. / 1.75);
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
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
