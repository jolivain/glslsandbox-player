/*
 * Original shader from: https://www.shadertoy.com/view/Wlj3DD
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

// --------[ Original ShaderToy begins here ]---------- //
// "Palace on the Hill" by dr2 - 2019
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA  1   // optional antialiasing

float PrBoxDf (vec3 p, vec3 b);
float PrRoundBoxDf (vec3 p, vec3 b, float r);
float PrBox2Df (vec2 p, vec2 b);
float PrBoxAn2Df (vec2 p, vec2 b, float w);
float PrRoundBox2Df (vec2 p, vec2 b, float r);
float PrSphDf (vec3 p, float r);
float PrCylDf (vec3 p, float r, float h);
float PrCylAnDf (vec3 p, float r, float w, float h);
vec2 PixToHex (vec2 p);
vec2 HexToPix (vec2 h);
bool HexNeb (vec2 a, vec2 b);
vec2 SSBump (float w, float s, float x);
float SmoothMin (float a, float b, float r);
float SmoothBump (float lo, float hi, float w, float x);
float Minv3 (vec3 p);
vec2 Rot2D (vec2 q, float a);
float Hashfv2 (vec2 p);
vec2 Hashv2v2 (vec2 p);
float Noisefv2 (vec2 p);
float Noisefv3 (vec3 p);
float Fbm1 (float p);
float Fbm2 (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

vec3 sunDir = vec3(0.), qHit = vec3(0.), bSize = vec3(0.), drSize = vec3(0.);
vec2 gId = vec2(0.), hillPos = vec2(0.);
float tCur = 0., dstFar = 0., baseHt = 0., wallThk = 0., hgSize = 0., drAng = 0., hillRad = 0.;
int idObj = 0;
bool isShad = false, isNt = false;
const int idWall = 1, idFlr = 2, idRoof = 3, idWbar = 4, idChim = 5, idDoor = 6,
   idRail = 7, idLmp = 8, idTabl = 9, idGrnd = 10;
const float pi = 3.14159, sqrt3 = 1.7320508;

#define DMIN(id) if (d < dMin) { dMin = d;  idObj = id; }
#define DMINQ(id) if (d < dMin) { dMin = d;  idObj = id;  qHit = q; }

float BldDf (vec3 p)
{
  vec3 q, pAbs, pMod;
  float dMin, d, twrRad, dWin, dTwr, dDoor, rUp, rRad;
  twrRad = 0.5;
  pMod = vec3 (mod (p.xz + 0.5, 1.) - 0.5, mod (p.y, bSize.y) - 0.5 * bSize.y).xzy;
  pAbs = abs (vec3 (p.xz, pMod.y - 0.1).xzy) - bSize;
  dMin = dstFar;
  q = p;
  d = max (PrBoxAn2Df (q.xz, bSize.xz, wallThk), abs (q.y - bSize.y) - bSize.y);
  dDoor = PrBox2Df ((q - vec3 (0., bSize.y - 1.05, 0.)).xy, drSize.xy);
  d = max (d, - dDoor);
  dWin = abs (q.y - bSize.y) - bSize.y;
  q = vec3 (pMod.xz, pMod.y - 0.1).xzy;
  dWin = max (dWin, min (max (PrBox2Df (q.xy, vec2 (0.2, 0.6)), pAbs.x + 0.7),
     max (PrBox2Df (q.zy, vec2 (0.2, 0.6)), pAbs.z + 0.7)));
  d = max (d, - dWin);
  dTwr = twrRad + 0.5 * wallThk - length (pAbs);
  d = max (d, dTwr);
  DMIN (idWall);
  q = vec3 (pAbs.xz, p.y).xzy;
  d = PrCylAnDf ((q - vec3 (0., bSize.y + 0.25, 0.)).xzy, twrRad, 0.07, bSize.y + 0.25);
  q.y = pMod.y - 0.1;
  d = max (d, - min (PrBox2Df (q.xy, vec2 (0.08, 0.6)), PrBox2Df (q.zy, vec2 (0.08, 0.6))));
  DMIN (idWall);
  q = p;
  q.y = pMod.y - 0.1;
  d = max (min (length (vec2 (pAbs.z, q.y)) - 0.3 * wallThk,
     max (length (vec2 (pMod.x, pAbs.z)) - 0.3 * wallThk, pAbs.y)), pAbs.x + 0.7);
  d = max (d, - dDoor);
  d = min (d, max (min (length (vec2 (pAbs.x, q.y)) - 0.3 * wallThk,
     max (length (vec2 (pAbs.x, pMod.z)) - 0.3 * wallThk, pAbs.y)), pAbs.z + 0.7));
  d = max (d, abs (p.y - bSize.y) - bSize.y);
  DMIN (idWbar);
  q = p;
  q.y = mod (p.y - 0.5 * wallThk + 0.5 * (bSize.y - 0.5 * wallThk),
     bSize.y - 0.5 * wallThk) - 0.5 * (bSize.y - 0.5 * wallThk);
  d = PrBoxDf (q, vec3 (bSize.xz, 0.5 * wallThk).xzy);
  d = max (max (d, - max (PrBox2Df (q.xz, bSize.xz - 1.1), abs (p.y - bSize.y) - 0.2)), dTwr);
  DMIN (idFlr);
  rRad = 12.;
  rUp = rRad - 0.721 + 0.01;
  q = p;
  q.y -= 2. * bSize.y - rUp;
  d = min (PrCylDf (q.yzx, rRad, bSize.x + wallThk), PrCylDf (q, rRad, bSize.z + wallThk));
  d = max (max (d, rUp - q.y), dTwr);
  DMIN (idRoof);
  q = vec3 (pAbs.xz, p.y - 2. * bSize.y - 0.9).xzy;
  d = 0.7 * PrCylDf (q.xzy, (twrRad + 0.07) * (0.6 - 0.4 * q.y / 0.4), 0.4);
  DMIN (idRoof);
  q = p;
  q.y -= 2. * bSize.y + 0.8;
  d = min (PrBoxDf (q, vec3 (bSize.x + wallThk, 0.1, 0.2)),
     PrBoxDf (q, vec3 (0.2, 0.1, bSize.z + wallThk)));
  DMIN (idChim);
  q.y -= 0.3;
  q.xz = pMod.xz;
  d = PrCylAnDf (q.xzy, 0.13, 0.05, 0.2);
  q.xz = abs (p.xz);
  d = max (d, max (min (q.x, q.z) - 0.5, 0.5 - min (bSize.x - q.x, bSize.z - q.z)));
  DMIN (idChim);
  q = vec3 (pAbs.x + bSize.x - drSize.x + 0.02, p.y - bSize.y + 1.05, pAbs.z - 0.5 * wallThk);
  q.xz = Rot2D (q.xz, - drAng);
  q.x -= 0.5 * drSize.x - 0.016;
  d = PrRoundBoxDf (q, vec3 (0.5 * drSize.x - 0.005, drSize.y - 0.01, drSize.z), 0.005);
  DMINQ (idDoor);
  rRad = 0.02;
  q = p;
  q.y -= bSize.y + 0.4;
  d = min (PrCylDf (vec3 (pAbs.x + 1., q.yz), rRad, bSize.z - 1.),
     PrCylDf (vec3 (q.xy, pAbs.z + 1.).yzx, rRad, bSize.x - 1.));
  q.xz = mod (q.xz + 0.25, 0.5) - 0.25;
  q.y -= -0.2;
  d = min (d, max (PrCylDf (q.xzy, rRad, 0.2), PrBoxAn2Df (p.xz, bSize.xz - 1., 0.1)));
  DMIN (idRail);
  rRad = 0.15;
  q = p;
  q.y -= 2. * bSize.y - wallThk - rRad;
  q.xz = abs (abs (q.xz) - 0.5 * bSize.xz) - 1.5 * rRad;
  d = PrSphDf (q, rRad);
  DMIN (idLmp);
  q = p;
  q.xz = abs (abs (q.xz) - 0.5 * bSize.xz);
  q.y -= 0.62;
  d = PrCylDf (q.xzy, 0.3, 0.02);
  q.y -= -0.32;
  d = min (d, PrCylDf (q.xzy, 0.03, 0.3));
  q.y -= 0.4;
  d = min (d, PrCylDf (q.xzy, 0.01, 0.1));
  DMIN (idTabl);
  q.y -= 0.1;
  d = PrSphDf (q, 0.3 * rRad);
  DMIN (idLmp);
  return dMin;
}

float ObjDf (vec3 p)
{
  vec3 q;
  vec2 cId, rr;
  float dMin, d, r;
  q = p;
  q.y -= baseHt;
  if (! isShad) d = PrBoxDf (q + vec3 (0., - bSize.y, 0.), bSize + vec3 (1., 1.6, 1.));
  dMin = (isShad || d < 0.1) ? BldDf (q) : d;
  if (! isShad) {
    q = p;
    q.y -= -0.005;
    q.y -= 5.01 * (1. - smoothstep (12., 28., length (q.xz)));
    d = 0.8 * PrCylDf (q.xzy, 32., 0.001);
    DMIN (idGrnd);
  }
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
  vec2 e = vec2 (0.0002, -0.0002);
  v = vec4 (- ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

float HillDf (vec3 p)
{
  vec3 q;
  float d;
  if (length (gId) == 0. || HexNeb (gId, vec2 (0.))) d = dstFar;
  else {
    q = p;
    q.xz -= HexToPix (gId * hgSize) + hillPos;
    q.y += hillRad * smoothstep (0., hillRad, length (q.xz));
    d = PrCylDf (q.xzy, hillRad, hillRad);
  }
  return d;
}

void SetHillConf ()
{
  vec2 rr;
  rr = Hashv2v2 (gId);
  hillRad = 0.4 * hgSize * (1. - 0.5 * length (rr));
  hillPos = (0.7 * hgSize * rr.x - hillRad) * sin (2. * pi * rr.y + vec2 (0.5 * pi, 0.));
}

float HillRay (vec3 ro, vec3 rd)
{
  vec3 vri, vf, hv, p;
  vec2 edN[3], pM, gIdP;
  float dHit, d, s, tol;
  edN[0] = vec2 (1., 0.);
  edN[1] = 0.5 * vec2 (1., sqrt3);
  edN[2] = 0.5 * vec2 (1., - sqrt3);
  for (int k = 0; k < 3; k ++) edN[k] *= sign (dot (edN[k], rd.xz));
  vri = hgSize / vec3 (dot (rd.xz, edN[0]), dot (rd.xz, edN[1]), dot (rd.xz, edN[2]));
  vf = 0.5 * sqrt3 - vec3 (dot (ro.xz, edN[0]), dot (ro.xz, edN[1]),
     dot (ro.xz, edN[2])) / hgSize;
  pM = HexToPix (PixToHex (ro.xz / hgSize));
  gIdP = vec2 (-99.);
  tol = 0.0005;
  dHit = 0.;
  for (int j = 0; j < 100; j ++) {
    hv = (vf + vec3 (dot (pM, edN[0]), dot (pM, edN[1]), dot (pM, edN[2]))) * vri;
    s = Minv3 (hv);
    p = ro + dHit * rd;
    gId = PixToHex (p.xz / hgSize);
    if (gId.x != gIdP.x || gId.y != gIdP.y) {
      gIdP = gId;
      SetHillConf ();
    }
    d = HillDf (p);
    if (dHit + d < s) {
      dHit += d;
    } else {
      dHit = s + 0.002;
      pM += sqrt3 * ((s == hv.x) ? edN[0] : ((s == hv.y) ? edN[1] : edN[2]));
    }
    if (d < tol || dHit > dstFar || p.y < 0. || rd.y > 0. && p.y > 20.) break;
  }
  if (d >= tol) dHit = dstFar;
  return dHit;
}

vec3 HillNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0005, -0.0005);
  v = vec4 (- HillDf (p + e.xxx), HillDf (p + e.xyy), HillDf (p + e.yxy), HillDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

vec3 SkyCol (vec3 ro, vec3 rd)
{
  vec3 col, rds, mDir, vn, clCol;
  vec2 q;
  float mRad, bs, ts, f, ff, fd;
  if (isNt) {
    rd.xz = Rot2D (rd.xz, 0.001 * tCur);
    mDir = normalize (vec3 (0., 0.1, -1.));
    mRad = 0.02;
    col = vec3 (0.02, 0.02, 0.04) + vec3 (0.06, 0.04, 0.02) *
       pow (clamp (dot (rd, mDir), 0., 1.), 16.);
    bs = dot (rd, mDir);
    ts = bs * bs - dot (mDir, mDir) + mRad * mRad;
    if (ts > 0.) {
      ts = bs - sqrt (ts);
      if (ts > 0.) {
        vn = normalize ((ts * rd - mDir) / mRad);
        col += 0.8 * vec3 (1., 0.9, 0.5) * clamp (dot (vec3 (-0.77, 0.4, 0.5), vn) *
           (1. - 0.3 * Noisefv3 (4. * vn)), 0., 1.);
      }
    } else {
      rds = floor (2000. * rd);
      rds = 0.00015 * rds + 0.1 * Noisefv3 (0.0005 * rds.yzx);
      for (int j = 0; j < 19; j ++) rds = abs (rds) / dot (rds, rds) - 0.9;
      col += 0.5 * smoothstep (0.01, 0.04, rd.y) * vec3 (0.8, 0.8, 0.6) *
         min (1., 0.5e-3 * pow (min (6., length (rds)), 5.));
    }
  } else {
    rd.y = abs (rd.y) + 0.0001;
    q = 0.02 * (ro.xz + tCur + ((50. - ro.y) / rd.y) * rd.xz);
    ff = Fbm2 (q);
    f = smoothstep (0.2, 0.8, ff);
    fd = smoothstep (0.2, 0.8, Fbm2 (q + 0.01 * sunDir.xz)) - f;
    clCol = (0.7 + 0.5 * ff) * (vec3 (0.7) - 0.7 * vec3 (0.3, 0.3, 0.2) * sign (fd) *
       smoothstep (0., 0.05, abs (fd)));
    fd = smoothstep (0.01, 0.1, rd.y);
    col = mix (mix (vec3 (0.7, 0.7, 0.75), vec3 (0.4, 0.5, 0.8), 0.3 + 0.7 * fd), clCol, 0.1 + 0.9 * f * fd);
  }
  return col;
}

float ObjSShadow (vec3 ro, vec3 rd)
{
  float sh, d, h;
  isShad = true;
  sh = 1.;
  d = 0.1;
  for (int j = 0; j < 40; j ++) {
    h = ObjDf (ro + d * rd);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.6 + 0.4 * sh;
}

float TxPattern (vec3 p)
{
  float t, tt, c;
  p = abs (0.5 - fract (4. * p));
  c = 0.;
  t = 0.;
  for (float j = 0.; j < 6.; j ++) {
    p = abs (p + 3.) - abs (p - 3.) - p;
    p /= clamp (dot (p, p), 0., 1.);
    p = 3. - 1.5 * p;
    if (mod (j, 2.) == 0.) {
      tt = t;
      t = length (p);
      c += exp (-1. / abs (t - tt));
    }
  }
  return c;
}

vec4 BldCol (vec3 ro, vec3 vn, bool inRoom)
{
  vec4 col4;
  vec2 q;
  float f;
  q = abs (ro.xz) - bSize.xz;
  f = max (q.x, q.y);
  if (idObj == idWall) {
    q = vec2 (abs (ro.x), abs (ro.y - baseHt - bSize.y + 1.05)) - drSize.xy;
    if (max (q.x, q.y) < 0.05) {
      col4 = vec4 (0.4, 0.2, 0.1, 0.1);
    } else if (f > 0.9 * wallThk) {
      col4 = vec4 (1., 1., 1., 0.2);
      q = SSBump (0.2 * wallThk, 0.5 * wallThk,
         mod (ro.y - baseHt - 0.5 * wallThk + 0.5 * (bSize.y - 0.5 * wallThk),
         bSize.y - 0.5 * wallThk) - 0.5 * (bSize.y - 0.5 * wallThk));
      if (q.x + q.y != 0.) {
        vn.y += 0.2 * (q.y - q.x);
        vn = normalize (vn);
        col4.rgb *= dot (q, vec2 (0.8, 1.1));
      }
    } else if (f < -0.9 * wallThk) {
      col4 = vec4 (0.9, 1., 0.9, 0.2);
      q = abs (abs (mod (ro.xz + 0.5, 1.) - 0.5) - 0.46);
      if (abs (vn.z) > 0.99 && (abs (ro.x) > 1. || ro.y - baseHt > bSize.y))
         col4.rgb *= 0.5 + 0.5 * smoothstep (0.01, 0.02, q.x);
      if (abs (vn.x) > 0.99) col4.rgb *= 0.5 + 0.5 * smoothstep (0.01, 0.02, q.y);
    } else {
      col4 = vec4 (0.9, 0.9, 0.9, 0.2);
    }
  } else if (idObj == idFlr) {
    col4 = vec4 (0.8, 0.5, 0.3, 0.2);
    if (abs (ro.y - baseHt - bSize.y) > 0.5 * bSize.y) {
      if (vn.y > 0.99) {
        col4 = mix (col4, vec4 (0.4, 0.3, 0.1, 0.), Fbm2 (vec2 (4., 32.) *
           ro.xz)) * (0.6 + 0.4 * smoothstep (0.03, 0.08, mod (8. * ro.z + 0.5, 1.)));
      } else if (vn.y < -0.99) {
        col4 = vec4 (vec3 (0., 0., 1.), 0.2);
        if (f < -0.21)
          col4 = vec4 (mix (col4.rgb, vec3 (1., 1., 0.3), step (1.7, TxPattern (0.5 * ro))), 0.2);
      }
    } else if (abs (vn.y) < 0.01) {
      col4 *= 1.5;
    }
   } else if (idObj == idRoof) {
    if (vn.y > 0.1) {
      col4 = vec4 (0.8, 0.8, 0.7, 0.3);
    } else {
      col4 = vec4 (1., 1., 1., 0.2);
      f = 0.;
      if (abs (vn.z) > 0.99) q = ro.xy;
      else if (abs (vn.x) > 0.99) q = ro.zy;
      else f = 99.;
      if (f == 0.) {
        f = abs (length (q - vec2 (0., 2. * bSize.y + baseHt + 0.34)) - 0.24);
        if (f < 0.04) col4 = isNt ? vec4 (0.8, 0.8, 0.6, -1.) : vec4 (0.8, 0.8, 0., 0.5);
      }
    }
  } else if (idObj == idChim) {
    col4 = vec4 (0.7, 0.7, 0.75, 0.2);
  } else if (idObj == idWbar) {
    col4 = vec4 (0.4, 0.5, 0.3, 0.2);
  } else if (idObj == idDoor) {
    if (length (qHit.xy - vec2 (drSize.x - 0.4, -0.1)) < 0.05) col4 = vec4 (0.8, 0.8, 0., 0.3);
    else col4 = (0.6 + 0.4 * smoothstep (0.03, 0.08, mod (12. * qHit.x + 0.5, 1.))) *
       mix (vec4 (0.7, 0.5, 0.2, 0.2), vec4 (0.5, 0.25, 0.1, 0.1),
       Fbm2 (vec2 (24., 4.) * qHit.xy));
  } else if (idObj == idRail) {
    col4 = vec4 (0.8, 0.8, 0.5, 0.3);
  } else if (idObj == idLmp) {
    col4 = vec4 (1., 1., 0.8, -1.);
  } else if (idObj == idTabl) {
    col4 = vec4 (0.7, 0.4, 0.1, 0.2);
  }
  return col4;
}

vec3 BldIntLit (vec4 col4, vec3 ro, vec3 vn, float sh)
{
  vec3 col, ltDir;
  float dif, att, f;
  if (idObj != idFlr) {
    dif = 0.;
    for (float sx = -1.; sx <= 1.; sx += 2.) {
      for (float sz = -1.; sz <= 1.; sz += 2.) {
        ltDir = vec3 (0.5 * sx * bSize.x, 2. * bSize.y + baseHt - 0.2, 0.5 * sz * bSize.z) - ro;
        att = length (ltDir);
        if (att > 0.) ltDir /= att;
        dif = max (dif, max (dot (vn, ltDir), 0.) / (1. + 0.1 * att * att));
      }
    }
    col = col4.rgb * (0.1 + 0.8 * dif);
  } else {
    col = 0.15 * col4.rgb;
    f = length (abs (ro.xz) - 0.5 * bSize.xz);
    if (vn.y > 0.99) col = col * (1.5 - 0.5 * smoothstep (1., 2., f)) * 
       (0.8 + 0.2 * smoothstep (0.35, 0.4, f)) + 0.2 * sh;
    else if (vn.y < -0.99 && ro.y > baseHt + 2. * bSize.y - 0.3)
       col = 1.3 * col * (2. - smoothstep (1., 2., f));
  }
  return col;
}

vec3 BldExtLit (vec4 col4, vec3 ro, vec3 rd, vec3 vn, float sh)
{
  vec3 col, ltDir;
  float dif, att;
  if (! isNt) {
    dif = max (dot (vn, sunDir), 0.);
    col = col4.rgb * (0.2 + 0.2 * max (dot (vn, - normalize (vec3 (sunDir.xz, 0.).xzy)), 0.) +
       0.7 * sh * dif) + col4.a * sh * smoothstep (0., 0.1, dif) *
       pow (max (dot (normalize (sunDir - rd), vn), 0.), 32.);
  } else {
    dif = 0.;
    for (float sx = -1.; sx <= 1.; sx += 1.) {
      for (float sz = -1.; sz <= 1.; sz += 2.) {
        ltDir = vec3 (sx * (bSize.x + 2.), baseHt + 1., sz * (bSize.z + 3.)) - ro;
        att = length (ltDir);
        if (att > 0.) ltDir /= att;
        dif = max (dif, max (dot (vn, ltDir), 0.) / (1. + 0.01 * att * att));
      }
    }
    col = 0.7 * col4.rgb * (0.2 + 0.8 * dif);
  }
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, gCol, vn, roo;
  vec2 q, vf;
  float dstObj, dstHill, sh, f, fogHt;
  bool isGrnd, isBg, inRoom;
  int idObjT;
  hgSize = 40.;
  wallThk = 0.08;
  drSize = vec3 (0.6, 0.85, 0.25 * wallThk);
  drAng = pi + 0.5 * pi * smoothstep (0., 1.5, 3.5 - length (vec2 (ro.x, abs (ro.z) - bSize.z)));
  roo = ro;
  isGrnd = false;
  isBg = false;
  isShad = false;
  dstObj = ObjRay (ro, rd);
  dstHill = HillRay (ro, rd);
  gCol = vec3 (0.2, 0.5, 0.3) * (isNt ? 0.05 : 1.);
  inRoom = false;
  vf = vec2 (0.);
  if (min (dstObj, dstHill) < dstFar) {
    if (dstObj < dstHill) {
      ro += dstObj * rd;
      gCol *= 0.7 + 0.3 * Fbm2 (2. * ro.xz);
      vn = ObjNf (ro);
      if (idObj == idGrnd) {
        col = vec3 (0.5, 0.4, 0.2) * (0.6 + 0.4 * Fbm2 (32. * ro.xz)); 
        f = smoothstep (0., 1., PrRoundBox2Df (ro.xz, bSize.xz + vec2 (1., 2.), 1.));
        if (f > 0.) {
          vn.xz = Rot2D (vn.xz, 0.3 * pi * f * Fbm2 (32. * vec2 (sin (atan (ro.z, - ro.x)) + 1.,
             0.03 * ro.y)));
          gCol = mix (col * (isNt ? 0.4 : 1.), gCol, f);
          isGrnd = true;
        } else vf = vec2 (64., 0.5);
        col4 = vec4 (col, 0.);
      } else {
        q = abs (ro.xz) - bSize.xz;
        f = max (q.x, q.y);
        inRoom = (idObj != idDoor && f < 0. && ro.y < baseHt + 2. * bSize.y ||
           idObj == idDoor && qHit.z > 0.);
        col4 = BldCol (ro, vn, inRoom);
        q = abs (ro.xz) - bSize.xz;
        f = max (q.x, q.y);
        if (idObj == idWall) {
          q = vec2 (abs (ro.x), abs (ro.y - baseHt - bSize.y + 1.05)) - drSize.xy;
          if (max (q.x, q.y) > 0.05 && f > 0.9 * wallThk) vf = vec2 (64., 0.5);
        } else if (idObj == idRoof && vn.y < 0.1) vf = vec2 (64., 0.5);
      }
    } else if (dstHill < dstFar) {
      ro += dstHill * rd;
      gCol *= 0.7 + 0.3 * Fbm2 (2. * ro.xz);
      gId = PixToHex (ro.xz / hgSize);
      SetHillConf ();
      vn = HillNf (ro);
      q = ro.xz - HexToPix (gId * hgSize) - hillPos;
      vn.xz = Rot2D (vn.xz, 0.03 * pi * dot (sin (vec2 (13., 23.) *
         (pi * Hashfv2 (gId) + atan (q.y, - q.x))), vec2 (1.)));
      isGrnd = true;
    }
  } else {
    if (rd.y > -0.02 && rd.y < 0.03 * Fbm1 (16. * atan (rd.z, - rd.x))) {
      col = isNt ? vec3 (0.07) : mix (vec3 (0.4, 0.5, 0.7), vec3 (0.3, 0.41, 0.55), 
         smoothstep (-0.02, 0.01, rd.y));
      isBg = true;
    } else if (rd.y >= 0.) {
      col = SkyCol (ro, rd);
      isBg = true;
    } else {
      ro += (- ro.y / rd.y) * rd;
      gCol *= 0.7 + 0.3 * Fbm2 (2. * ro.xz);
      vn = vec3 (0., 1., 0.);
      isGrnd = true;
    }
  }
  if (! isBg) {
    if (col4.a < 0.) {
      col = col4.rgb * max (0.6 - 0.4 * dot (rd, vn), 0.); 
    } else {
      if (vf.x > 0.) vn = VaryNf (vf.x * ro, vn, vf.y);
      sh = 1.;
      if (! isNt) {
        if (dstObj < min (dstHill, dstFar) && (idObj != idGrnd || ro.y > 0.1 || rd.y < 0.)) {
          idObjT = idObj;
          sh = ObjSShadow (ro, sunDir);
          idObj = idObjT;
        }
      }
      if (inRoom) col = BldIntLit (col4, ro, vn, sh);
      else if (! isGrnd) col = BldExtLit (col4, ro, rd, vn, sh);
      else if (isNt) col = gCol;
      else {
        gCol *= 0.5 + 0.5 * smoothstep (baseHt - 3., baseHt - 0.1, ro.y);
        col = gCol * (0.2 + 0.3 * max (dot (vn, - normalize (vec3 (sunDir.xz, 0.))), 0.) +
           0.7 * sh * max (dot (vn, sunDir), 0.));
        col = mix (col, vec3 (0.4, 0.5, 0.7) - 0.05, smoothstep (0.7, 1., length (ro) / dstFar));
      }
    }
  }
  fogHt = baseHt - 0.5;
  if (ro.y < fogHt) {
    f = Fbm2 (0.1 * (roo.xz + ((fogHt - roo.y) / rd.y) * rd.xz + 1.5 * tCur));
    col = mix (col, (isNt ? vec3 (0.1) + 0.1 * f : vec3 (0.7, 0.65, 0.7) + 0.2 * f),
       (1. - smoothstep (fogHt - 2., fogHt, ro.y)) *
       clamp (f * (1. - smoothstep (-0.05, -0.001, rd.y)), 0., 1.));
    if (ro.y < 0.001) col = mix (col, (isNt ? vec3 (0.1) : vec3 (0.4, 0.5, 0.8) + 0.02),
       smoothstep (-0.05, -0.001, rd.y));
  }
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, uvs, ori, ca, sa, mMid, ut, mSize, ms, tu;
  float el, az, asp, zmFac, tCyc, t, tt, ti, s, regId, winHt, sr, rz;
  bool mMove;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uvs = uv;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  asp = canvas.x / canvas.y;
  winHt = 0.85;
  mSize = (1./5.) * vec2 (asp, 1.) * winHt;
  mMid = vec2 (asp, winHt - mSize.y) * vec2 (1. - mSize.y, -1.);
  ut = abs (uv - mMid) - mSize;
  mMove = true;
  if (max (ut.x, ut.y) < 0.) {
    uv = (uv - mMid) / mSize.y;
    mMove = ! mMove;
  }
  regId = 0.;
  ms = mPtr.xy + 0.5 * vec2 (1., winHt);
  if (ms.x > 1. - mSize.x / asp && abs (ms.y - 0.5 * mSize.y) < 0.5 * mSize.y) regId = 1.;
  if (abs (mPtr.y) > 0.5 * winHt) regId = -1.;
  tCyc = 100.;
  isNt = (mod (tCur, 2. * tCyc) > tCyc);
  if (mPtr.z > 0. && regId == 1.) {
    if (ms.x > 1. - 0.5 * mSize.x / asp) mMove = ! mMove;
    if (ms.y < 0.5 * mSize.y) isNt = ! isNt;
  }
  az = 0.;
  el = 0.;
  if (mPtr.z > 0. && regId == 0.) {
    az = 3. * pi * mPtr.x;
    el = pi * mPtr.y;
    if (! mMove) {
      el -= -0.05 * pi;
      el = clamp (el, -0.4 * pi, 0.01 * pi);
    }
  } else {
    if (! mMove) {
      az = -0.4 * (floor (0.3 * tCur) + smoothstep (0., 0.1, mod (0.3 * tCur, 1.)));
      el = -0.05 * pi;
    }
  }
  baseHt = 5.;
  bSize = vec3 (8., 2., 4.);
  if (mMove) {
    t = (4. / tCyc) * mod (tCur, tCyc);
    az += pi * step (2., t);
    ti = mod (t, 1.);
    s = (t <= 2.) ? 1. : -1.;
    tt = (smoothstep (0.25, 0.75, ti) - step (min (abs (t - 0.5), abs (t - 2.5)), 0.5)) * s;
    ro = vec3 (0., baseHt + 1.4, 15. * tt);
    rz = abs (ro.z) / bSize.z - 1.;
    if (rz > 0.) ro.y += 0.4 * rz * rz;
    tu = vec2 (0.75 - ti, ti - 0.25);
    tu *= step (tu, vec2 (0.));
    if (tt == 0.) az -= 4. * pi * (tu.x - tu.y) * s;
    else if (abs (tt) == 1.) az -= 2. * pi * (tu.x + tu.y) * s;
    if (tt == 0.) el += 0.2 * (0.5 * pi - abs (0.5 * pi - mod (az, pi)));
    el = clamp (el, -0.2 * pi, 0.2 * pi);
  }
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  sunDir = normalize (vec3 (-1., 0.5, -1.));
  if (mMove) {
    zmFac = 2.;
    sunDir.xz = Rot2D (sunDir.xz, 0.1 * tCur);
  } else {
    ro = vuMat * vec3 (0., baseHt + 1., -50.);
    zmFac = 3.6;
    sunDir = vuMat * sunDir;
  }
  dstFar = 400.;
  col = vec3 (0.);
  if (abs (uvs.y) < winHt) {
#if ! AA
    const float naa = 1.;
#else
    const float naa = 3.;
#endif  
    sr = 2. * mod (dot (mod (floor (0.5 * (uv + 1.) * canvas), 2.), vec2 (1.)), 2.) - 1.;
    for (float a = 0.; a < naa; a ++) {
      rd = vuMat * normalize (vec3 (uv + step (1.5, naa) * Rot2D (vec2 (0.5 / canvas.y, 0.),
         sr * (0.667 * a + 0.5) * pi), zmFac));
      col += (1. / naa) * ShowScene (ro, rd);
    }
  }
  if (max (ut.x, ut.y) < 0.) {
    if (min (abs (ut.x), abs (ut.y)) * canvas.y < 2.) col = vec3 (0.2, 0.2, 0.1);
    else if (mPtr.z > 0. && regId == 1. && (min (abs (ut.x + mSize.x),
       abs (ut.y + mSize.y)) * canvas.y < 1.)) col = vec3 (0.3, 0.3, 0.1);

  }
  fragColor = vec4 (pow (col, vec3 (0.9)), 1.);
}

float PrBoxDf (vec3 p, vec3 b)
{
  vec3 d;
  d = abs (p) - b;
  return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
}

float PrBox2Df (vec2 p, vec2 b)
{
  vec2 d;
  d = abs (p) - b;
  return min (max (d.x, d.y), 0.) + length (max (d, 0.));
}

float PrRoundBoxDf (vec3 p, vec3 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

float PrBoxAn2Df (vec2 p, vec2 b, float w)
{
  return max (PrBox2Df (p, vec2 (b + w)), - PrBox2Df (p, vec2 (b - w)));
}

float PrRoundBox2Df (vec2 p, vec2 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
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

vec2 PixToHex (vec2 p)
{
  vec3 c, r, dr;
  c.xz = vec2 ((1./sqrt3) * p.x - (1./3.) * p.y, (2./3.) * p.y);
  c.y = - c.x - c.z;
  r = floor (c + 0.5);
  dr = abs (r - c);
  r -= step (dr.yzx, dr) * step (dr.zxy, dr) * dot (r, vec3 (1.));
  return r.xz;
}

vec2 HexToPix (vec2 h)
{
  return vec2 (sqrt3 * (h.x + 0.5 * h.y), (3./2.) * h.y);
}

bool HexNeb (vec2 a, vec2 b)
{
  vec2 d = a - b;
  return (d.x == 0. && abs (d.y) == 1. || abs (d.x) == 1. && d.y == 0. ||
    d.x * d.y == -1.);
}

vec2 SSBump (float w, float s, float x)
{
  return vec2 (step (x + s, w) * step (- w, x + s), step (x - s, w) * step (- w, x - s));
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
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
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

vec3 Hashv3f (float p)
{
  return fract (sin (p + vec3 (37., 39., 41.)) * cHashM);
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
