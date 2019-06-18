/*
 * Original shader from: https://www.shadertoy.com/view/Wtl3Rl
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
const vec4  iMouse = vec4(0.0);
const vec4  iDate = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Roller-Coaster" by dr2 - 2019
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA   0  // optional antialiasing

float PrBoxDf (vec3 p, vec3 b);
float PrRoundBox2Df (vec2 p, vec2 b, float r);
float PrRound2BoxDf (vec3 p, vec3 b, float r);
float PrSphDf (vec3 p, float r);
float PrCylDf (vec3 p, float r, float h);
float PrCapsDf (vec3 p, float r, float h);
float PrTorusDf (vec3 p, float ri, float rc);
mat3 AxToRMat (vec3 vz, vec3 vy);
vec2 Rot2D (vec2 q, float a);
float SmoothBump (float lo, float hi, float w, float x);
float Noisefv2 (vec2 p);
float Fbm1 (float p);
float Fbm2 (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

#define N_CAR 5
#define N_SEG 12

mat3 carMat[N_CAR];
vec3 cPt[N_SEG], carPos[N_CAR], cPtOrg = vec3(0.), cUpCirc = vec3(0.), cDnCirc = vec3(0.), sunDir = vec3(0.), oDir = vec3(0.), oNorm = vec3(0.), qHit = vec3(0.);
float tLen[N_SEG + 1], tCur = 0., dstFar = 0., hTop = 0., rLoop = 0., sLoop = 0., sHzRamp = 0., rDnCirc = 0., rUpCirc = 0.,
   sDnRamp = 0., sUpRamp = 0., sHzStr = 0., trkDir = 0., hTrk = 0., wTrk = 0., tWait = 0., vfFast = 0., vfLoop = 0.;
int idObj = 0;
bool riding = false, isSh = false;
const int idTrk = 1, idPyl = 2, idTrnk = 3, idLeaf = 4, idPlat = 5, idArch = 6,
   idTun = 7, idCar = 8;
const float pi = 3.14159;

void TrkSetup ()
{
  cPtOrg = vec3 (2. * trkDir, 0., -3.);
  hTop = 1.5;
  rLoop = 2.2;
  sLoop = 0.3;
  sHzRamp = 0.5;
  rDnCirc = 2.;
  rUpCirc = rDnCirc + sLoop;
  sDnRamp = 1.5;
  sUpRamp = 1.3 * sDnRamp;
  sHzStr = sDnRamp - sUpRamp + 3. * sHzRamp;
  wTrk = 0.015;
  hTrk = 0.015;
  tWait = 2.;
  vfFast = 5.;
  vfLoop = 0.6;
  cDnCirc = cPtOrg + vec3 ((- rDnCirc - sLoop) * trkDir, 0., -2. * sHzRamp);
  cUpCirc = cPtOrg + vec3 ((- rUpCirc + sLoop) * trkDir, 2. * hTop, 2. * sDnRamp +
     6. * sHzRamp);
  cPt[0] = cDnCirc;   cPt[0].xz += vec2 (- rDnCirc * trkDir, sHzStr);
  cPt[1] = cPt[0];    cPt[1].z += sHzStr;
  cPt[3] = cUpCirc;   cPt[3].x -= rUpCirc * trkDir;
  cPt[4] = cUpCirc;   cPt[4].x += rUpCirc * trkDir;
  cPt[2] = cPt[3];    cPt[2].z -= 2. * sHzRamp;
  cPt[5] = cPt[4];    cPt[5].z -= 2. * sHzRamp;
  cPt[7] = cPtOrg;    cPt[7].x += sLoop * trkDir;
  cPt[8] = cPtOrg;    cPt[8].x -= sLoop * trkDir;
  cPt[6] = cPt[7];    cPt[6].z += 4. * sHzRamp;
  cPt[9] = cDnCirc;   cPt[9].x += rDnCirc * trkDir;
  cPt[10] = cDnCirc;  cPt[10].x -= rDnCirc * trkDir;
  cPt[N_SEG - 1] = cPt[0];
  tLen[0] = 0.;
  for (int k = 1; k < N_SEG; k ++) tLen[k] = length (cPt[k] - cPt[k - 1]);
  tLen[4] = pi * rUpCirc;
  tLen[6] /= 0.5 * (1. + vfFast);
  tLen[8] = length (vec2 (2. * pi * rLoop, 2. * sLoop)) * (1. + vfLoop);
  tLen[10] = pi * rDnCirc;
  for (int k = 7; k < N_SEG - 1; k ++) tLen[k] /= vfFast;
  for (int k = 1; k < N_SEG; k ++) tLen[k] += tLen[k - 1];
  tLen[N_SEG] = tLen[N_SEG - 1] + tWait;
}

vec3 TrkPath (float t)
{
  vec3 p, p1, p2, u;
  float w, ft, s;
  int ik;
  t = mod (t, tLen[N_SEG]);
  ik = -1;
  for (int k = 1; k < N_SEG; k ++) {
    if (t < tLen[k]) {
      t -= tLen[k - 1];
      p1 = cPt[k - 1];
      p2 = cPt[k];
      w = tLen[k] - tLen[k - 1];
      ik = k;
      break;
    }
  }
  oNorm = vec3 (0., 1., 0.);
  ft = t / w;
  if (ik < 0) {
    p = cPt[0];
    oDir = vec3 (0., 0., 1.);
  } else if (ik == 2 || ik == 6) {
    oDir = p2 - p1;
    if (ik == 6) ft *= (2. + (vfFast - 1.) * ft) / (vfFast + 1.);
    p.xz = p1.xz + oDir.xz * ft * vec2 (trkDir, 1.);
    p.y = p1.y + oDir.y * smoothstep (0., 1., ft);
    oDir.y *= 6. * ft * (1. - ft);
    oDir = normalize (oDir);
  } else if (ik == 4) {
    ft *= pi;
    p = cUpCirc;
    u = vec3 (- cos (ft) * trkDir, 0., sin (ft));
    p.xz += rUpCirc * u.xz;
    oDir = cross (oNorm, u);
    oDir.xz *= trkDir;
  } else if (ik == 8) {
    ft = (ft < 0.5) ? ft * (1. + vfLoop * (1. - 2. * ft)) :
       ft * (1. + 2. * vfLoop * (ft - 1.5)) + vfLoop;
    p = 0.5 * (cPt[7] + cPt[8]);
    p.x += sLoop * (1. - 2. * ft) * trkDir;
    ft *= 2. * pi;
    u = vec3 (0., cos (ft), sin (ft));
    p.yz += rLoop * (vec2 (1., 0.) - u.yz);
    oNorm = u;
    oDir = normalize (vec3 (-2. * sLoop * trkDir, 2. * pi * rLoop *
       vec2 (sin (ft), - cos (ft))));
  } else if (ik == 10) {
    ft *= pi;
    p = cDnCirc;
    u = vec3 (cos (ft) * trkDir, 0., - sin (ft));
    p.xz += rDnCirc * u.xz;
    oDir = cross (oNorm, u);
    oDir.xz *= trkDir;
  } else if (ik < N_SEG) {
    oDir = p2 - p1;
    p = p1 + oDir * ft;
    oDir = normalize (oDir);
  }
  return p;
}

#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

float TrkDf (vec3 p, float dMin)
{
  vec3 q;
  vec2 trCs;
  float d, f, tGap, tWid, rt, x;
  tGap = 0.7 * wTrk;
  tWid = 0.3 * wTrk;
  rt = 0.5 * tWid;
  trCs = vec2 (tWid, hTrk) - rt;
  q = p - cPtOrg;
  q.y -= rLoop;
  f = smoothstep (0., 1., atan (abs (q.z), - q.y) / pi);
  x = q.x * trkDir;
  q.xy = vec2 (q.x - sign (q.z) * sLoop * f * trkDir, length (q.yz) - rLoop);
  d = 0.9 * max (max (PrRoundBox2Df (vec2 (abs (q.x - sLoop * trkDir) - tGap, q.y), trCs, rt),
     q.z), x - (sLoop + wTrk));
  DMINQ (idTrk);
  d = 0.9 * max (max (PrRoundBox2Df (vec2 (abs (q.x + sLoop * trkDir) - tGap, q.y), trCs, rt),
     - q.z), - x - (sLoop + wTrk));
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[5] + cPt[6]);
  f = 0.5 * clamp (q.z / sDnRamp + 1., 0., 2.);
  q.y -= hTop * (2. * smoothstep (0., 1., f) - 1.);
  d = 0.6 * PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs.x, trCs.y * (1. +
     2. * abs (f * (1. - f))), sDnRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[1] + cPt[2]);
  f = 0.5 * clamp (q.z / sUpRamp + 1., 0., 2.);
  q.y -= hTop * (2. * smoothstep (0., 1., f) - 1.);
  d = 0.6 * PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs.x,
     trCs.y * (1. + 2. * abs (f * (1. - f))), sUpRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[2] + cPt[3]);
  d = PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs, sHzRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[4] + cPt[5]);
  d = PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs, sHzRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[6] + cPt[7]);
  d = PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs, 2. * sHzRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[8] + cPt[9]);
  d =  PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs, sHzRamp), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[1] + cPt[10]);
  d = PrRound2BoxDf (vec3 (abs (q.x) - tGap, q.yz), vec3 (trCs, sHzStr), rt);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[9] + cPt[10]);
  q.xy = vec2 (length (q.xz) - rDnCirc, q.y);
  d = max (PrRoundBox2Df (vec2 (abs (q.x) - tGap, q.y), trCs, rt), q.z);
  DMINQ (idTrk);
  q = p - 0.5 * (cPt[3] + cPt[4]);
  q.xy = vec2 (length (q.xz) - rUpCirc, q.y);
  d = max (PrRoundBox2Df (vec2 (abs (q.x) - tGap, q.y), trCs, rt), - q.z);
  DMINQ (idTrk);
  return dMin;
}

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin, d, colRad;
  dMin = dstFar;
  dMin = TrkDf (p, dMin);
  colRad = 0.02;
  q = p - cUpCirc;
  q.yz -= vec2 (- hTop, - 2. * sHzRamp);
  q.x = abs (q.x) - rUpCirc;
  q.xz = abs (q.xz) - 20. * colRad * max (- q.y / hTop - 0.75, 0.);
  d = 0.6 * PrCylDf (q.xzy, colRad, hTop);
  q = p - cUpCirc;
  q.xz = Rot2D (q.xz, (0.5 + floor (atan (q.z, - q.x) * (4. / pi))) * pi / 4.);
  q.xy -= vec2 (- rUpCirc, - hTop);
  q.xz = abs (q.xz) - 20. * colRad * max (- q.y / hTop - 0.75, 0.);
  d = min (d, 0.6 * max (PrCylDf (q.xzy, colRad, hTop), cUpCirc.z - p.z));
  q = p - 0.5 * (cPt[1] + cPt[2]);
  q.y -= -0.5 * (hTop + colRad);
  d = min (d, PrCylDf (q.xzy, colRad, 0.5 * hTop));
  q = p - 0.5 * (cPt[5] + cPt[6]);
  q.y -= -0.5 * hTop;
  d = min (d, PrCylDf (q.xzy, colRad, 0.5 * hTop - colRad));
  q = p - cPtOrg;
  q.y -= rLoop + 0.03;
  q.x = abs (q.x) - sLoop - wTrk - 0.25;
  q.xz = abs (q.xz) - 20. * colRad * max (- q.y / rLoop - 0.75, 0.);
  d = min (d, 0.6 * PrCylDf (q.xzy, colRad, rLoop + 0.03));
  q = p - cPtOrg;
  q.y -= 2. * (rLoop + 0.03);
  d = min (d, PrCylDf (q.yzx, colRad, sLoop + wTrk + 0.28));
  DMINQ (idPyl);
  for (int k = 0; k < N_CAR; k ++) {
    if (riding && k == N_CAR - 1) continue;
    q = p - carPos[k];
    if (! isSh) d = PrSphDf (q - vec3 (0., hTrk + 0.04, 0.), 0.25);
    if (isSh || d < 0.1) {
      q = carMat[k] * q;
      q.y -= hTrk + 0.04;
      d = max (PrCapsDf (q, 0.085, 0.125),
         - max (PrCapsDf (q + vec3 (0., -0.03, 0.), 0.075, 0.1), -0.015 - q.y));
      DMINQ (idCar + k);
    } else dMin = min (dMin, d);
  }
  q = p;
  q.y -= 0.5;
  q.xz = Rot2D (q.xz, (0.5 + floor (atan (q.z, - q.x) * (16. / pi))) * pi / 16.);
  q.x += 10.;
  d = 0.9 * PrCylDf (q.xzy, 0.04 - 0.03 * q.y, 0.5);
  DMINQ (idTrnk);
  q.y -= 0.6;
  d = 0.9 * PrCapsDf (q.xzy, 0.2 - 0.2 * q.y, 0.2);
  DMINQ (idLeaf);
  q = p - cPt[0];
  q.y -= 0.5 * hTrk;
  q.x = abs (q.x) - 0.24;
  d = PrBoxDf (q, vec3 (0.17, 0.5 * hTrk, 0.4));
  DMINQ (idPlat);
  q = p - cPt[0];
  q.y -= 0.07;
  q.z = abs (q.z) - 0.3;
  d = max (PrTorusDf (q, 0.01, 0.35), - q.y - 0.1);
  DMINQ (idArch);
  q = p - 0.5 * (cPt[9] + cPt[10]);
  q.y -= 0.07;
  d = 0.6 * max (max (abs (length (vec2 (length (q.xz) - rDnCirc, q.y)) - 0.3) - 0.02,
     abs (q.x) + q.z), - q.y - 0.07);
  DMINQ (idTun);
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 150; j ++) {
    p = ro + dHit * rd;
    d = ObjDf (p);
    dHit += d;
    if (d < 0.0005 || dHit > dstFar || p.y < 0.) break;
  }
  if (p.y < 0.) dHit = dstFar;
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.001, -0.001);
  v = vec4 (- ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

float ObjSShadow (vec3 ro, vec3 rd)
{
  float sh, d, h;
  isSh = true;
  sh = 1.;
  d = 0.02;
  for (int j = 0; j < 20; j ++) {
    h = ObjDf (ro + d * rd);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.8 + 0.2 * sh;
}

vec3 SkyBgCol (vec3 ro, vec3 rd)
{
  vec3 col, clCol, skCol;
  vec2 q;
  float f, fd, ff, sd;
  if (rd.y > -0.02 && rd.y < 0.03 * Fbm1 (8. * atan (rd.z, - rd.x))) {
    col = 0.9 * mix (vec3 (0.4, 0.55, 0.7), vec3 (0.3, 0.45, 0.55),
       smoothstep (-0.02, 0.01, rd.y));
  } else {
    q = 0.02 * (ro.xz + 0.5 * tCur + ((100. - ro.y) / rd.y) * rd.xz);
    ff = Fbm2 (q);
    f = smoothstep (0.2, 0.8, ff);
    fd = smoothstep (0.2, 0.8, Fbm2 (q + 0.01 * sunDir.xz)) - f;
    clCol = (0.7 + 0.5 * ff) * (vec3 (0.7) - 0.7 * vec3 (0.3, 0.3, 0.2) * sign (fd) *
       smoothstep (0., 0.05, abs (fd)));
    sd = max (dot (rd, sunDir), 0.);
    skCol = vec3 (0.4, 0.5, 0.8) + step (0.1, sd) * vec3 (1., 1., 0.9) *
       min (0.3 * pow (sd, 64.) + 0.5 * pow (sd, 2048.), 1.);
    col = mix (skCol, clCol, 0.1 + 0.9 * f * smoothstep (0.01, 0.1, rd.y));
  }
  return col;
}

vec3 GrndCol (vec3 ro, vec3 rd)
{
  vec3 vn, col;
  vec2 q;
  float f;
  vec2 e = vec2 (0.01, 0.);
  ro -= (ro.y / rd.y) * rd;
  f = Fbm2 (ro.xz);
  vn = normalize (vec3 (f - vec2 (Fbm2 (ro.xz + e.xy), Fbm2 (ro.xz + e.yx)), 0.1).xzy);
  col = mix (vec3 (0.4, 0.35, 0.1), vec3 (0.4, 0.5, 0.2), f) * (1. - 0.1 * Noisefv2 (ro.xz));
  f = smoothstep (7., 8., 0.15 * length (ro.xz * ro.xz * vec2 (2.8, 1.)));
  if (f < 1.) {
    col = mix (vec3 (0.6, 0.5, 0.3) * (1. - 0.4 * Fbm2 (64. * ro.xz)), col, f);
    vn = normalize (mix (vec3 (0., 1., 0.), vn, f));
    q = ro.xz - cUpCirc.xz;
    q.y -= -2. * sHzRamp;
    q.x = abs (q.x) - rUpCirc;
    f = length (q);
    if (ro.z > cUpCirc.z) {
      q = ro.xz - cUpCirc.xz;
      q = Rot2D (q, (0.5 + floor (atan (q.y, - q.x) * (4. / pi))) * pi / 4.);
      q.x -= - rUpCirc;
      f = min (f, length (q));
    }
    f = min (f, 2. * length (ro.xz - 0.5 * (cPt[1] + cPt[2]).xz));
    f = min (f, 2. * length (ro.xz - 0.5 * (cPt[5] + cPt[6]).xz));
    q = ro.xz - cPtOrg.xz;
    q.x = abs (q.x) - sLoop - wTrk - 0.25;
    f = min (f, length (q));
    col = mix (vec3 (0.6) * (1. - 0.4 * Fbm2 (512. * ro.xz)), col, smoothstep (0.1, 0.3, f));
    q = ro.xz - 0.5 * (cPt[9] + cPt[10]).xz;
    f = 99.;
    if (q.y < 0.) f = abs (length (q) - rDnCirc);
    if (abs (q.y - 1.) < 1.05) f = min (f, abs (abs (q.x) - rDnCirc));
    if (abs (ro.z + 2.5) < 1.5) f = min (f, abs (ro.x - cPtOrg.x - sLoop));
    col = mix (vec3 (0.6) * (1. - 0.4 * Fbm2 (512. * ro.xz)), col,
       smoothstep (7., 8., f / wTrk));
  } else if (abs (length (ro.xz) - 10.) < 0.2) {
    q = ro.xz;
    q = Rot2D (q, (0.5 + floor (atan (q.y, - q.x) * (16. / pi))) * pi / 16.);
    q.x += 10.;
    col *= 0.7 + 0.3 * smoothstep (0.1, 0.2, length (q));
  }
  col *= 0.1 + 0.9 * max (dot (vn, sunDir), 0.);
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, vn, roo;
  float dstObj, dstGrnd, nDotS, sh;
  isSh = false;
  dstObj = ObjRay (ro, rd);
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObj == idTrk) {
      col4 = vec4 (0.8, 0.8, 0.9, 0.3);
    } else if (idObj == idPyl) {
      col4 = vec4 (0.8, 0.5, 0.2, 0.1) * (0.7 + 0.3 *
         SmoothBump (0.05, 0.95, 0.01, mod (32. * qHit.y, 1.)));
    } else if (idObj == idPlat) {
      col4 = vec4 (0.8, 0.5, 0.2, 0.1) * (1. - 0.2 * Fbm2 (64. * ro.xz));
    } else if (idObj == idArch) {
      col4 = vec4 (mix (vec3 (0., 0., 1.), vec3 (1., 1., 0.),
         step (mod (32. * (atan (qHit.y, - qHit.x) / pi + 1.), 1.), 0.5)), 0.2);
    } else if (idObj == idTun) {
      col4 = vec4 (0.6, 0.5, 0.3, 0.) * (1. - 0.2 * Fbm2 (32. * ro.xz));
    } else if (idObj >= idCar) {
      col4 = (idObj == idCar + N_CAR - 1) ? vec4 (1., 1., 0., 0.5) : vec4 (1., 0., 0., 0.5);
      if (qHit.y < -0.05) col4.rgb = vec3 (0.7);
      if (qHit.z > 0.18) col4.rgb = vec3 (0., 1., 0.);
    } else if (idObj == idTrnk) {
      col4 = vec4 (0.5, 0.3, 0., 0.1) * (0.7 + 0.3 * SmoothBump (0.1, 0.9, 0.003,
         mod (8. * atan (qHit.z, - qHit.x) / pi, 1.)));
    } else if (idObj == idLeaf) {
      col4 = vec4 (0., 0.8, 0.2, 0.1);
      vn = VaryNf (32. * ro, vn, 4.);
    }
    nDotS = max (dot (vn, sunDir), 0.);
    if (idObj == idTrk || idObj == idArch || idObj >= idCar) nDotS *= nDotS;
    sh = ObjSShadow (ro, sunDir);
    col = col4.rgb * (0.2 + 0.8 * sh * nDotS) +
       step (0.95, sh) * col4.a * pow (max (dot (normalize (sunDir - rd), vn), 0.), 32.);
  } else if (rd.y < 0.) {
    roo = ro;
    col = GrndCol (ro, rd);
    dstGrnd = - ro.y / rd.y;
    if (dstGrnd < dstFar) col *= ObjSShadow (ro + dstGrnd * rd, sunDir);
    col = mix (col, SkyBgCol (roo, rd), pow (1. + rd.y, 32.));
  } else col = SkyBgCol (ro, rd);
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr, dateCur;
  vec3 ro, rd, vd, col;
  vec2 canvas, uv, uvs, uvw, ori, ca, sa, mMid[2], ut[2], mSize, msw;
  float az, el, asp, zmFac, pDist, sr, vel, vuId, regId, winHt;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uvs = uv;
  uv.x *= iResolution.x / iResolution.y;
  tCur = iTime;
  dateCur = iDate;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  asp = canvas.x / canvas.y;
  winHt = 0.85;
  trkDir = (mod (floor (dateCur.w / 3600.), 2.) > 0.) ? 1. : -1.;
  mSize = (1./5.) * vec2 (asp, 1.) * winHt;
  mMid[0] = vec2 (asp * (1. - mSize.y), winHt - mSize.y) * vec2 (- trkDir, -1.);
  mMid[1] = vec2 (asp * (1. - mSize.y), winHt - mSize.y) * vec2 (- trkDir, 1.);
  ut[0] = abs (uv - mMid[0]) - mSize;
  ut[1] = abs (uv - mMid[1]) - mSize;
  regId = -1.;
  if (mPtr.z > 0.) {
    regId = 0.;
    msw = mPtr.xy + 0.5 * vec2 (- trkDir, winHt);
    if (trkDir * msw.x < - (1. - mSize.x / asp)) {
      if (msw.y < mSize.y) {
        regId = 1.;
      } else if (msw.y > winHt - mSize.y) {
        regId = 2.;
        msw.y -= winHt - mSize.y;
      }
      msw.x = (msw.x + trkDir * (1. - 0.5 * mSize.x / asp)) / (mSize.x / asp);
      msw.y = (msw.y / mSize.y - 0.5);
    }
    if (abs (mPtr.y) > 0.5 * winHt) regId = -1.;
  }
  vuId = 0.;
  for (int k = 0; k < 2; k ++) {
    if (max (ut[k].x, ut[k].y) < 0.) {
      uv = (uv - mMid[k]) / mSize.y;
      vuId = float (k + 1);
      break;
    }
  }
  if (regId == 1.) {
    if (vuId == 0. || vuId == 1.) vuId = 1. - vuId;
  } else if (regId == 2.) {
    if (vuId == 0. || vuId == 2.) vuId = 2. - vuId;
  }
  riding = (vuId == 0.);
  TrkSetup ();
  vel = 0.5;
  for (int k = 0; k < N_CAR; k ++) {
    carPos[k] = TrkPath (vel * tCur - tWait + tLen[N_SEG] *
       float (N_CAR - 1 - k) / float (N_CAR));
    carMat[k] = AxToRMat (oDir, oNorm);
  }
  uvw = uv;
  if (vuId == 0.) {
    ro = carPos[N_CAR - 1];
    ro += (hTrk + 0.3) * oNorm - 0.3 * oDir;
    uvw = vec2 ((1./0.5) * sin (0.5 * uv.x), uv.y);
    zmFac = 3.;
    az = 0.;
    el = -0.02 * pi;
    if (regId == 0.) {
      az += 2. * pi * mPtr.x;
      el += 0.5 * pi * mPtr.y;
    }
    zmFac = 3.;
  } else if (vuId == 1.) {
    az = 0.5 * pi;
    el = -0.02 * pi;
    if (regId == 1.) {
      az -= 2. * pi * msw.x;
      el -= 0.5 * pi * msw.y;
      el = clamp (el, -0.45 * pi, 0.);
    }
    zmFac = 3.;
  } else if (vuId == 2.) {
    ro = 0.5 * (cDnCirc + cUpCirc);
    vd = carPos[N_CAR - 1] - ro;
    pDist = length (vd);
    vd = normalize (vd);
    az = 0.5 * pi + atan (- vd.z, vd.x);
    el = asin (vd.y);
    if (regId == 2.) {
      az += 0.5 * pi * msw.x;
      el += 0.5 * pi * msw.y;
    }
    zmFac = 2. + 0.3 * pDist;
  }
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  if (vuId == 1.) ro = vuMat * vec3 (0., 1., -15.);
  sunDir = normalize (vec3 (sin (0.02 * tCur - 0.5 * pi + vec2 (0.5 * pi, 0.)), 1.).xzy);
  dstFar = 60.;
  col = vec3 (0.);
  if (abs (uvs.y) < winHt) {
#if ! AA
    const float naa = 1.;
#else
    const float naa = 3.;
#endif  
    sr = 2. * mod (dot (mod (floor (0.5 * (uv + 1.) * canvas), 2.), vec2 (1.)), 2.) - 1.;
    for (float a = 0.; a < naa; a ++) {
      rd = normalize (vec3 (uvw + step (1.5, naa) * Rot2D (vec2 (0.5 / canvas.y, 0.),
          sr * (0.667 * a + 0.5) * pi), zmFac));
      rd = vuMat * rd;
      if (vuId == 0.) rd = rd * carMat[N_CAR - 1];
      col += (1. / naa) * ShowScene (ro, rd);
    }
  }
  for (int k = 0; k < 2; k ++) {
    if (max (ut[k].x, ut[k].y) < 0. && min (abs (ut[k].x), abs (ut[k].y)) * canvas.y < 2.)
       col = vec3 (0.4, 0.4, 0.);
  }
  fragColor = vec4 (col, 1.);
}

float PrBoxDf (vec3 p, vec3 b)
{
  vec3 d;
  d = abs (p) - b;
  return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
}

float PrRoundBox2Df (vec2 p, vec2 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

float PrRound2BoxDf (vec3 p, vec3 b, float r)
{
  return max (length (max (abs (p.xy) - b.xy, 0.)) - r, abs (p.z) - b.z);
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

float PrTorusDf (vec3 p, float ri, float rc)
{
  return length (vec2 (length (p.xy) - rc, p.z)) - ri;
}

mat3 AxToRMat (vec3 vz, vec3 vy)
{
  vec3 vx;
  vx = normalize (cross (vy, vz));
  vy = cross (vz, vx);
  return mat3 (vec3 (vx.x, vy.x, vz.x), vec3 (vx.y, vy.y, vz.y), vec3 (vx.z, vy.z, vz.z));
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
}

float SmoothBump (float lo, float hi, float w, float x)
{
  return (1. - smoothstep (hi - w, hi + w, x)) * smoothstep (lo - w, lo + w, x);
}

const float cHashM = 43758.54;

vec2 Hashv2f (float p)
{
  return fract (sin (p + vec2 (0., 1.)) * cHashM);
}

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (vec2 (dot (p, cHashVA2), dot (p + vec2 (1., 0.), cHashVA2))) * cHashM);
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

float Fbm2 (vec2 p)
{
  float f, a;
  f = 0.;
  a = 1.;
  for (int j = 0; j < 5; j ++) {
    f += a * Noisefv2 (p);
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
