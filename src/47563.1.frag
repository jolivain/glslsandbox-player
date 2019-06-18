/*
 * Original shader from: https://www.shadertoy.com/view/MdyfRK
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
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Live Jigsaw" by dr2 - 2018
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

// Self-solving jigsaw with live image

// Tiling based on simplified (textureless) version of Shane's "Jigsaw"
// Scenery updated from my old "Seabirds at Sunset"

#define AA  0   // optional antialiasing

float PrCapsDf (vec3 p, float r, float h);
float PrCylDf (vec3 p, float r, float h);
float PrSphDf (vec3 p, float r);
float PrFlatCylDf (vec3 p, float rhi, float rlo, float h);
float PrTorusDf (vec3 p, float ri, float rc);
float Maxv3 (vec3 p);
float SmoothBump (float lo, float hi, float w, float x);
vec2 Rot2D (vec2 q, float a);
float Hashfv2 (vec2 p);
float Noisefv3 (vec3 p);
float Fbm2 (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

mat3 birdMat[2], bdMat;
vec3 birdPos[2], bdPos = vec3(0.), fltBox = vec3(0.), qHit = vec3(0.),
     qnBlk = vec3(0.), sunDir = vec3(0.), waveDisp = vec3(0.),
     cloudDisp = vec3(0.), ltDir = vec3(0.), blkSize = vec3(0.);
float dstFar = 0., tCur = 0., birdVel = 0., birdLen = 0., legAng = 0.;
int idObj = 0, idObjGrp = 0;
const int idWing = 1, idBdy = 2, idEye = 3, idBk = 4, idLeg = 5;
const float pi = 3.14159;

#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

float BdWingDf (vec3 p, float dMin)
{
  vec3 q, qh;
  float wngFreq, wSegLen, wChord, wSpar, fTap, tFac, d, dd, a, wr, wf;
  wngFreq = 6.;
  wSegLen = 0.15 * birdLen;
  wChord = 0.3 * birdLen;
  wSpar = 0.03 * birdLen;
  fTap = 8.;
  tFac = (1. - 1. / fTap);
  q = p - vec3 (0., 0., 0.3 * birdLen);
  q.x = abs (q.x) - 0.1 * birdLen;
  wf = 1.;
  a = -0.1 + 0.2 * sin (wngFreq * tCur);
  d = dMin;
  qh = q;
  for (int k = 0; k < 5; k ++) {
    q.xy = Rot2D (q.xy, a);
    q.x -= wSegLen;
    wr = wf * (1. - 0.5 * q.x / (fTap * wSegLen));
    dd = PrFlatCylDf (q.zyx, wr * wChord, wr * wSpar, wSegLen);
    if (k < 4) {
      q.x -= wSegLen;
      dd = min (dd, PrCapsDf (q, wr * wSpar, wr * wChord));
    } else {
      q.x += wSegLen;
      dd = max (dd, PrCylDf (q.xzy, wr * wChord, wSpar));
      dd = min (dd, max (PrTorusDf (q.xzy, 0.98 * wr * wSpar, wr * wChord), - q.x));
    }
    if (dd < d) { d = dd;  qh = q; }
    a *= 1.03;
    wf *= tFac;
  }
  q = qh;
  DMINQ (idObjGrp + idWing);
  return dMin;
}

float BdBodyDf (vec3 p, float dMin)
{
  vec3 q;
  float bkLen, d, a, wr, tr, u;
  bkLen = 0.15 * birdLen;
  q = p;
  wr = q.z / birdLen;
  if (wr > 0.5) {
    u = (wr - 0.5) / 0.5;
    tr = 0.17 - 0.11 * u * u;
  } else {
    u = clamp ((wr - 0.5) / 1.5, -1., 1.);
    u *= u;
    tr = 0.17 - u * (0.34 - 0.18 * u); 
  }
  d = PrCapsDf (q, tr * birdLen, birdLen);
  DMINQ (idObjGrp + idBdy);
  q = p;
  q.x = abs (q.x);
  wr = (wr + 1.) * (wr + 1.);
  q -= birdLen * vec3 (0.3 * wr, 0.1 * wr, -1.2);
  d = PrCylDf (q, 0.009 * birdLen, 0.2 * birdLen);
  DMINQ (idObjGrp + idBdy);
  q = p;
  q.x = abs (q.x);
  q -= birdLen * vec3 (0.08, 0.05, 0.9);
  d = PrSphDf (q, 0.04 * birdLen);
  DMINQ (idObjGrp + idEye);
  q = p;  q -= birdLen * vec3 (0., -0.015, 1.15);
  wr = clamp (0.5 - 0.3 * q.z / bkLen, 0., 1.);
  d = PrFlatCylDf (q, 0.25 * wr * bkLen, 0.25 * wr * bkLen, bkLen);
  DMINQ (idObjGrp + idBk);
  return dMin;
}

float BdFootDf (vec3 p, float dMin)
{
  vec3 q;
  float lgLen, ftLen, d;
  lgLen = 0.1 * birdLen;
  ftLen = 0.5 * lgLen;
  q = p;
  q.x = abs (q.x);
  q -= birdLen * vec3 (0.1, -0.12, 0.6);
  q.yz = Rot2D (q.yz, legAng);
  q.xz = Rot2D (q.xz, -0.05 * pi);
  q.z += lgLen;
  d = PrCylDf (q, 0.15 * lgLen, lgLen);
  DMINQ (idObjGrp + idLeg);
  q.z += lgLen;
  q.xy = Rot2D (q.xy, 0.5 * pi);
  q.xy = Rot2D (q.xy, floor (3. * atan (q.y, - q.x) / (2. * pi) + 0.5) * (2. * pi / 3.));
  q.xz = Rot2D (q.xz, - pi + 0.4 * legAng);
  q.z -= ftLen;
  d = PrCapsDf (q, 0.2 * ftLen, ftLen);
  DMINQ (idObjGrp + idLeg);
  return dMin;
}

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin;
  dMin = dstFar;
  for (int k = 0; k < 2; k ++) {
    idObjGrp = (k + 1) * 256;
    q = birdMat[k] * (p - birdPos[k]);
    dMin = BdWingDf (q, dMin);
    dMin = BdBodyDf (q, dMin);
    dMin = BdFootDf (q, dMin);
  }
  return 0.9 * dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 150; j ++) {
    d = ObjDf (ro + dHit * rd);
    dHit += d;
    if (d < 0.001 || dHit > dstFar) break;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0005, -0.0005);
  v = vec4 (ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

vec4 BirdCol (vec3 n)
{
  vec4 col4;
  vec3 nn;
  float gw, w;
  int ig, id;
  ig = idObj / 256;
  id = idObj - 256 * ig;
  if (id == idWing) {
    gw = 0.15 * birdLen;
    w = mod (qHit.x, gw);
    w = SmoothBump (0.15 * gw, 0.65 * gw, 0.1 * gw, w);
    col4 = vec4 (mix (vec3 (0.05), vec3 (1.), w), 0.1);
  } else if (id == idEye) {
    col4 = vec4 (0., 0.6, 0., 1.);
  } else if (id == idBdy) {
    if (ig == 1) nn = birdMat[0] * n;
    else nn = birdMat[1] * n;
    col4 = vec4 (mix (mix (vec3 (1.), vec3 (0.1), smoothstep (0.5, 1., nn.y)), vec3 (1.),
       1. - smoothstep (-1., -0.7, nn.y)), 0.1);
  } else if (id == idBk) {
    col4 = vec4 (1., 1., 0., 0.1);
  } else if (id == idLeg) {
    col4 = vec4 ((0.5 + 0.4 * sin (100. * qHit.z)) * vec3 (0.6, 0.4, 0.), 0.1);
  }
  col4.gb *= 0.7;
  return col4;
}

vec3 BirdTrack (float t)
{
  vec3 bp, tt, fbR;
  float ti[9], rdTurn, tC, tCyc, tSeq, a, h, hd, tf, rSeg;
  rdTurn = 0.45 * min (fltBox.x, fltBox.z);
  t = - t;
  rdTurn = 0.45 * min (fltBox.x, fltBox.z);
  tC = 0.5 * pi * rdTurn / birdVel;
  tt = vec3 (fltBox.x - rdTurn, length (fltBox.xy), fltBox.z - rdTurn) * 2. / birdVel;
  tCyc = 2. * (2. * tt.z + tt.x  + 4. * tC + tt.y);
  tSeq = mod (t, tCyc);
  ti[0] = 0.;  ti[1] = ti[0] + tt.z;  ti[2] = ti[1] + tC;
  ti[3] = ti[2] + tt.x;  ti[4] = ti[3] + tC;  ti[5] = ti[4] + tt.z;
  ti[6] = ti[5] + tC;  ti[7] = ti[6] + tt.y;  ti[8] = ti[7] + tC;
  h = - fltBox.y;
  hd = 1.;
  if (tSeq > 0.5 * tCyc) { tSeq -= 0.5 * tCyc;  h = - h;  hd = - hd; }
  rSeg = -1.;
  fbR = vec3 (1.);
  fbR.xz -= vec2 (rdTurn) / fltBox.xz;
  bp.xz = fltBox.xz;
  bp.y = h;
  if (tSeq < ti[4]) {
    if (tSeq < ti[1]) {
      tf = (tSeq - ti[0]) / (ti[1] - ti[0]);
      bp.xz *= vec2 (1., fbR.z * (2. * tf - 1.));
    } else if (tSeq < ti[2]) {
      tf = (tSeq - ti[1]) / (ti[2] - ti[1]);  rSeg = 0.;
      bp.xz *= fbR.xz;
    } else if (tSeq < ti[3]) {
      tf = (tSeq - ti[2]) / (ti[3] - ti[2]);
      bp.xz *= vec2 (fbR.x * (1. - 2. * tf), 1.);
    } else {
      tf = (tSeq - ti[3]) / (ti[4] - ti[3]);  rSeg = 1.;
      bp.xz *= fbR.xz * vec2 (-1., 1.);
    }
  } else {
    if (tSeq < ti[5]) {
      tf = (tSeq - ti[4]) / (ti[5] - ti[4]);
      bp.xz *= vec2 (- 1., fbR.z * (1. - 2. * tf));
    } else if (tSeq < ti[6]) {
      tf = (tSeq - ti[5]) / (ti[6] - ti[5]);  rSeg = 2.;
      bp.xz *= - fbR.xz;
    } else if (tSeq < ti[7]) {
      tf = (tSeq - ti[6]) / (ti[7] - ti[6]);
      bp.xz *= vec2 (fbR.x * (2. * tf - 1.), - 1.);
      bp.y = h + 2. * fltBox.y * hd * tf;
    } else {
      tf = (tSeq - ti[7]) / (ti[8] - ti[7]);  rSeg = 3.;
      bp.xz *= fbR.xz * vec2 (1., -1.);
      bp.y = - h;
    }
  }
  if (rSeg >= 0.) {
    a = 0.5 * pi * (rSeg + tf);
    bp += rdTurn * vec3 (cos (a), 0., sin (a));
  }
  return vec3 (bp.z, bp.y + 1.2 * fltBox.y, - bp.x);
}

void BirdPM (float t)
{
  vec3 bpF, bpB, vel, acc, va, ort, cr, sr;
  float vy, el, dt;
  dt = 1.;
  bdPos = BirdTrack (t);
  bpF = BirdTrack (t + dt);
  bpB = BirdTrack (t - dt);
  vel = (bpF - bpB) / (2. * dt);
  vy = vel.y;
  vel.y = 0.;
  acc = (bpF - 2. * bdPos + bpB) / (dt * dt);
  acc.y = 0.;
  va = cross (acc, vel) / length (vel);
  vel.y = vy;
  el = - 0.7 * asin (vel.y / length (vel));
  ort = vec3 (el, atan (vel.z, vel.x) - 0.5 * pi, 0.2 * length (va) * sign (va.y));
  cr = cos (ort);
  sr = sin (ort);
  bdMat = mat3 (cr.z, - sr.z, 0., sr.z, cr.z, 0., 0., 0., 1.) *
     mat3 (1., 0., 0., 0., cr.x, - sr.x, 0., sr.x, cr.x) *
     mat3 (cr.y, 0., - sr.y, 0., 1., 0., sr.y, 0., cr.y);
  legAng = pi * clamp (0.4 + 1.5 * el, 0.12, 0.8);
}

float WaveHt (vec3 p)
{
  float ht, w, wb;
  p *= 0.03;
  ht = 0.5 * sin (2. * dot (p.xz + 20. * waveDisp.xz, vec2 (1.)));
  p += waveDisp;
  wb = 1.414;
  w = wb;
  for (int j = 0; j < 7; j ++) {
    w *= 0.5;
    p = wb * vec3 (p.y + p.z, p.z - p.y, 2. * p.x) + 20. * waveDisp;
    ht += w * abs (Noisefv3 (p) - 0.5);
  }
  return ht;
}

vec3 WaveNf (vec3 p, float d)
{
  vec2 e;
  e = vec2 (max (0.01, 0.001 * d * d), 0.);
  return normalize (vec3 (WaveHt (p) - vec2 (WaveHt (p + e.xyy), WaveHt (p + e.yyx)), e.x).xzy);
}

vec3 SkyCol (vec3 ro, vec3 rd)
{
  vec3 col, skyCol, p;
  float ds, fd, att, attSum, d, sd;
  p = ro + rd * (200. - ro.y) / rd.y;
  ds = 0.1 * sqrt (length (ro - p));
  fd = 0.001 / (smoothstep (0., 10., ds) + 0.1);
  p.xz *= fd;
  p.xz -= cloudDisp.xz;
  p *= 3.;
  att = Fbm2 (p.xz);
  attSum = att;
  fd *= 3.;
  d = fd;
  ds *= fd;
  for (int j = 0; j < 4; j ++) {
    attSum += Fbm2 (p.xz + d * sunDir.xz);
    d += ds;
  }
  sd = clamp (dot (sunDir, rd), 0., 1.);
  skyCol = mix (vec3 (0.7, 1., 1.), vec3 (1., 0.4, 0.1), 0.25 + 0.75 * sd);
  col = mix (vec3 (0.5, 0.75, 1.), skyCol, exp (-2. * (3. - sd) * max (rd.y - 0.1, 0.))) +
     0.3 * (vec3 (1., 0.4, 0.2) * pow (sd, 256.) + vec3 (1., 0.8, 0.7) * pow (sd, 1024.));
  attSum = 1. - smoothstep (1., 9., attSum);
  col = mix (vec3 (0.4, 0., 0.2), mix (col, vec3 (0.2),
     att * (0.001 + 0.999 * smoothstep (0.001, 0.004, rd.y))), attSum) +
     vec3 (1., 0.4, 0.) * pow (attSum * att, 4.) * (pow (sd, 8.) + 0.5);
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 vn, col;
  float dstObj, reflFac, dw;
  reflFac = 1.;
  dstObj = ObjRay (ro, rd);
  if (rd.y < 0. && dstObj >= dstFar) {
    dw = - (ro.y + 1.5) / rd.y;
    ro += dw * rd;
    rd = reflect (rd, WaveNf (ro, dw));
    ro += 0.01 * rd;
    dstObj = ObjRay (ro, rd);
    reflFac *= 0.7;
  }
  if (dstObj < dstFar) {
    ro += rd * dstObj;
    vn = ObjNf (ro);
    col4 = BirdCol (vn);
    col = col4.rgb * (0.2 + 0.8 * max (dot (vn, sunDir), 0.) +
       col4.a * pow (max (0., dot (sunDir, reflect (rd, vn))), 32.));
  } else col = SkyCol (ro, rd);
  return reflFac * col;
}

float BlkHit (vec3 ro, vec3 rd, vec3 blkSize)
{
  vec3 v, tm, tp, u;
  float dMin, dn, df;
  if (rd.x == 0.) rd.x = 0.001;
  if (rd.y == 0.) rd.y = 0.001;
  if (rd.z == 0.) rd.z = 0.001;
  v = ro / rd;
  tp = blkSize / abs (rd) - v;
  tm = - tp - 2. * v;
  dn = max (max (tm.x, tm.y), tm.z);
  df = min (min (tp.x, tp.y), tp.z);
  dMin = dstFar;
  if (df > 0. && dn < df) {
    dMin = dn;
    qnBlk = - sign (rd) * step (tm.zxy, tm) * step (tm.yzx, tm);
  }
  return dMin;
}

float JigDist (vec2 p, vec4 dpEdge, bool evOdd)
{
  vec4 a, cc, s;
  vec2 e, bx, by;
  float ecShift, ecRad, tcRad, d;
  e = vec2 (0, 1);
  e = evOdd ? e : e.yx;
  ecShift = 2.;
  ecRad = length (vec2 (0.5, 0.5 + ecShift));
  bx = ecShift * e.yx;
  by = (1. + ecShift) * e.xy;
  d = max (length (abs (p) + bx) - ecRad, ecRad - length (abs (p) - by));
  if (evOdd) dpEdge = dpEdge.zwxy;
  a = 0.05 * pi * clamp (0.5 - dpEdge, -0.2, 0.2);
  ecRad -= 0.02;
  s = (2. * step (vec4 (0.5), dpEdge) - 1.) * vec4 (-1., 1., -1., 1.);
  tcRad = 0.12;
  d = s.x * min (s.x * d, length (Rot2D (p + bx, a.x) - ecRad * e.yx)- tcRad);
  d = s.y * min (s.y * d, length (Rot2D (p - bx, a.y) + ecRad * e.yx)- tcRad);
  d = s.z * min (s.z * d, length (Rot2D (p - by, a.z) + ecRad * e.xy)- tcRad);
  d = s.w * min (s.w * d, length (Rot2D (p + by, a.w) - ecRad * e.xy)- tcRad);
  return d;
}

vec3 JigPat (vec2 p, float rndOff)
{
  vec4 dpEdge;
  vec2 cID, e, q, iq;
  float d, h;
  d = dstFar;
  e = vec2 (0.5, 0.);
  for (float iy = 0.; iy < 2.; iy ++) {
    for (float ix = 0.; ix < 2.; ix ++) {
      q = p + vec2 (ix, iy);
      iq = floor (q / 2.) * 2. - vec2 (ix, iy);
      dpEdge = vec4 (Hashfv2 (iq + rndOff + e.yx), Hashfv2 (iq + rndOff - e.yx),
         Hashfv2 (iq + rndOff + e.xy), Hashfv2 (iq + rndOff - e.xy));
      h = JigDist (mod (q, 2.) - 1., dpEdge, (ix == iy));
      if (h < d) {
        cID = iq;
        d = h;
      }
    }
  }
  return vec3 (- d, cID);
}

vec3 ShowSceneBlk (vec3 ro, vec3 rd)
{
  vec3 vn, col, jp;
  vec2 cID, w;
  float dBlk, t, rndOff;
  bool isImg;
  dBlk = BlkHit (ro, rd, blkSize);
  if (dBlk < dstFar) {
    ro += dBlk * rd;
    vn = qnBlk;
    isImg = false;
    if (vn.y > 0.99) {
      col = vec3 (0.2, 0.3, 0.2);
      t = tCur / 30. + 0.1;
      rndOff = 17. * floor (t);
      jp = JigPat (ro.xz, rndOff);
      cID = jp.yz;
      w = abs (cID) / blkSize.xz;
      if (Hashfv2 (cID + rndOff) < clamp (3.2 * SmoothBump (0.2, 0.8, 0.18,
         mod (t, 1.)) + 2. * max (w.x, w.y) - 2.2, 0., 1.)) {
        col = ShowScene (vec3 (0., 4., -30.), normalize (vec3 (ro.xz / blkSize.z, 2.4)));
        col = mix (vec3 (0.2), col, smoothstep (0.015, 0.025, jp.x));
        isImg = true;
      }
    } else col = vec3 (0.2, 0.2, 0.3);
    if (isImg) col = clamp (col * mix (1., smoothstep (0., 1., Maxv3 (col)), 0.2), 0., 1.);
    else {
      if (vn.y > 0.99) vn = VaryNf (128. * ro, vn, 0.5);
      col = col * (0.2 + 0.8 * max (dot (ltDir, vn), 0.)) +
         0.1 * pow (max (dot (normalize (ltDir - rd), vn), 0.), 16.);
    }
  } else col = vec3 (0.7, 0.7, 0.8) * (0.2 + 0.2 * (rd.y + 1.) * (rd.y + 1.));
  return col;
}

void mainImage (out vec4 fragColor, vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, ori, ca, sa;
  float el, az;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  sunDir = normalize (vec3 (0., 0.05, 1.));
  waveDisp = 0.001 * tCur * vec3 (1., 0., 1.);
  cloudDisp = 0.05 * tCur * vec3 (1., 0., -1.);
  birdLen = 1.2;
  birdVel = 7.;
  fltBox = vec3 (12., 4., 12.);
  for (int k = 0; k < 2; k ++) {
    BirdPM (tCur + float (k) * 10.);
    birdMat[k] = bdMat;
    birdPos[k] = bdPos;
  }
  dstFar = 100.;
  blkSize = vec3 (16.25, 0.1, 9.25);
  az = 0.;
  el = -0.5 * pi;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += pi * mPtr.y;
  }
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  ro = vuMat * vec3 (0., 0., -4. * blkSize.x);
  ltDir = vuMat * normalize (vec3 (0.5, 0.5, -1.));
  #if ! AA
  const float naa = 1.;
#else
  const float naa = 4.;
#endif  
  col = vec3 (0.);
  for (float a = 0.; a < naa; a ++) {
    rd = vuMat * normalize (vec3 (uv + step (1.5, naa) * Rot2D (vec2 (0.71 / canvas.y, 0.),
       0.5 * pi * (a + 0.5)), 6.8));
    col += (1. / naa) * ShowSceneBlk (ro, rd);
  }
  fragColor = vec4 (pow (clamp (col, 0., 1.), vec3 (0.8)), 1);
}

float PrSphDf (vec3 p, float s)
{
  return length (p) - s;
}

float PrCapsDf (vec3 p, float r, float h)
{
  return length (p - vec3 (0., 0., clamp (p.z, - h, h))) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

float PrFlatCylDf (vec3 p, float rhi, float rlo, float h)
{
  return max (length (p.xy - vec2 (rhi *
     clamp (p.x / rhi, -1., 1.), 0.)) - rlo, abs (p.z) - h);
}

float PrTorusDf (vec3 p, float ri, float rc)
{
  return length (vec2 (length (p.xy) - rc, p.z)) - ri;
}

float Maxv3 (vec3 p)
{
  return max (p.x, max (p.y, p.z));
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

const float cHashM = 43758.54;

float Hashfv2 (vec2 p)
{
  return fract (sin (dot (p, vec2 (37., 39.))) * cHashM);
}

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (vec2 (dot (p, cHashVA2), dot (p + vec2 (1., 0.), cHashVA2))) * cHashM);
}

vec4 Hashv4v3 (vec3 p)
{
  vec3 cHashVA3 = vec3 (37., 39., 41.);
  vec2 e = vec2 (1., 0.);
  return fract (sin (vec4 (dot (p + e.yyy, cHashVA3), dot (p + e.xyy, cHashVA3),
     dot (p + e.yxy, cHashVA3), dot (p + e.xxy, cHashVA3))) * cHashM);
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
  if (f > 0.001) {
    g = vec3 (Fbmn (p + e.xyy, n), Fbmn (p + e.yxy, n), Fbmn (p + e.yyx, n)) - Fbmn (p, n);
    n += f * (g - n * dot (n, g));
    n = normalize (n);;
  }
  return n;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
