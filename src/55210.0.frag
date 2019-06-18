/*
 * Original shader from: https://www.shadertoy.com/view/wtB3R3
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
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Stairs to Nowhere" by dr2 - 2019
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA  1   // optional antialiasing

float PrCapsDf (vec3 p, float r, float h);
vec3 HexGrid (vec2 p);
float SmoothBump (float lo, float hi, float w, float x);
vec2 Rot2D (vec2 q, float a);
float Noisefv2 (vec2 p);
float Fbm2 (vec2 p);
vec3 VaryNf (vec3 p, vec3 n, float f);

vec4 szFlr = vec4(0.);
vec3 sunDir = vec3(0.), vnCylOut;
float dstFar = 0., tCur = 0., szFac = 0., flSpc = 0., nFlr = 0.,
      twrRad = 0., bCylRad = 0., bCylHt = 0., dCylOut = 0.,
      bSizeV = 0., cIdV = 0.;
int idObj;
const float pi = 3.14159, sqrt3 = 1.73205, sqrt2 = 1.41421;
const int idFlr = 1, idStr = 2, idRl = 3, idStn = 4, idCln = 5, idMir = 6;

#define SZ(x) (szFac * (x))
#define DMIN(id) if (d < dMin) { dMin = d;  idObj = id; }

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin, d, stSpc, xLim1, xLim2, bRad, r, a, x;
  bool topFlr, botFlr;
  r = length (p.xz) - twrRad;
  a = 2. * pi * ((floor (6. * atan (p.x, - p.z) / (2. * pi)) + 0.5) / 6.);
  stSpc = SZ(6.);
  xLim1 = abs (dot (p.xz, sin (a + vec2 (0.5 * pi, 0.)))) - SZ(22.);
  xLim2 = xLim1 + SZ(16.);
  bRad = SZ(0.35);
  topFlr = (cIdV == 2. * nFlr - 1.);
  botFlr = (cIdV == 0.);
  dMin = dstFar;
  if (topFlr) {
    d = length (max (abs (vec2 (p.y + 0.5 * szFlr.w, r + szFlr.z + stSpc)) -
       vec2 (0.5 * szFlr.w, szFlr.z), 0.));
    DMIN (idFlr);
    d = max (length (vec2 (p.y + SZ(0.4), abs (r + szFlr.z + stSpc - SZ(0.5))) -
       (szFlr.z - SZ(0.1))) - bRad, - xLim2);
    DMIN (idRl);
  }
  d = max (length (max (abs (vec2 ((topFlr ? - p.y : abs (p.y)) - flSpc,
     r - 0.4 * (szFlr.z + stSpc))) - vec2 (szFlr.w, 1.4 * (szFlr.z + stSpc)), 0.)), - xLim1);
  DMIN (idFlr);
  d = max (length (max (abs (vec2 (p.y + szFlr.w, r)) - vec2 (szFlr.w,
     2. * szFlr.z + stSpc + SZ(0.5)), 0.)), xLim2);
  DMIN (idFlr);
  p.zx = Rot2D (p.zx, a);
  p.z = abs (p.z) - twrRad;
  for (float sz = -1.; sz <= 1.; sz += 2.) {
    if (! topFlr || sz < 0.) {
      q.x = abs (p.x) - szFlr.x;
      q.yz = p.yz - sz * vec2 (szFlr.y - szFlr.w, - (szFlr.z + stSpc));
      d = abs (q.y) - (szFlr.y - szFlr.w - SZ(0.005));
      q.xy = vec2 (q.x + sz * q.y, - sz * q.x + q.y) / sqrt2;
      x = mod (q.x, SZ(sqrt2));
      d = max (max (max (q.y - min (x, SZ(sqrt2) - x), abs (q.z) - szFlr.z),
         - SZ(1.) - q.y), d);
      DMIN (idStr);
    }
  }
  d = max (length (vec2 (p.y + flSpc - SZ(4.), abs (r - szFlr.z) -
     (2. * szFlr.z + stSpc - SZ(0.8)))) - bRad, - xLim1);
  DMIN (idRl);
  d = max (length (vec2 (p.y - SZ(3.5), abs (r - SZ(0.4)) -
     (2. * szFlr.z + stSpc - SZ(0.1)))) - bRad, xLim2);
  DMIN (idRl);
  q = vec3 (abs (p.x) - szFlr.x - SZ(4.), p.y + 0.5 * flSpc,
     abs (p.z - (szFlr.z + stSpc)) - szFlr.z);
  d = max (length (vec2 ((q.x + q.y) / sqrt2, q.z)) - bRad,
     abs (abs (p.x) - szFlr.x) - SZ(8.));
  DMIN (idRl);
  q.xz = vec2 (abs (p.x) - szFlr.x + SZ(4.), abs (p.z + szFlr.z + stSpc) - szFlr.z);
  if (! botFlr) {
    d = max (length (vec2 ((q.x - (p.y + 1.5 * flSpc)) / sqrt2, q.z)) - bRad,
       abs (abs (p.x) - szFlr.x) - SZ(8.));
    DMIN (idRl);
  }
  if (! topFlr) {
    d = max (length (vec2 ((q.x - (p.y - 0.5 * flSpc)) / sqrt2, q.z)) - bRad,
       abs (abs (p.x) - szFlr.x) - SZ(8.));
    DMIN (idRl);
  }
  q.x = abs (p.x) - SZ(22.);
  d = min (length (vec2 (q.x, p.y + flSpc - SZ(4.))),
     length (vec2 (abs (p.x) - SZ(6.), p.y - SZ(3.5)))) - bRad;
  d = max (d, max (abs (p.z) - (2. * szFlr.z + stSpc), szFlr.z - abs (abs (p.z) -
     (szFlr.z + stSpc))));
  DMIN (idRl);
  q.yz = vec2 (p.y + flSpc - SZ(2.5), abs (abs (p.z) - (szFlr.z + stSpc)) - szFlr.z);
  d = PrCapsDf (q.xzy, SZ(0.7), SZ(2.));
  DMIN (idStn);
  if (! topFlr) {
    d = length (vec2 (q.x, p.z)) - SZ(0.8);
    DMIN (idCln);
    d = max (p.z + 0.7 * twrRad, abs (p.y) - flSpc);
    DMIN (idMir);
  }
  d = PrCapsDf (vec3 (abs (p.x) - SZ(6.), p.y - SZ(2.5), q.z).xzy, SZ(0.7), SZ(2.));
  DMIN (idStn);
  return 0.7 * dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  vec3 p;
  float dHit, d, eps, sy;
  eps = 0.0005;
  dHit = eps;
  if (rd.y == 0.) rd.y = 0.001;
  for (int j = 0; j < 220; j ++) {
    p = ro + dHit * rd;
    cIdV = floor (p.y / bSizeV);
    sy = (bSizeV * (cIdV + step (0., rd.y)) - p.y) / rd.y;
    d = abs (sy) + eps;
    if (cIdV >= 0. && cIdV < 2. * nFlr) {
      p.y = p.y - bSizeV * (cIdV + 0.5);
      d = min (ObjDf (p), d);
    }
    dHit += d;
    if (d < eps || dHit > dstFar) break;
  }
  if (d >= eps) dHit = dstFar;
  return dHit;
}

float ObjSShadow (vec3 ro, vec3 rd)
{
  vec3 p;
  float sh, d, h, sy;
  sh = 1.;
  d = SZ(0.05);
  for (int j = 0; j < 40; j ++) {
    p = ro + d * rd;
    cIdV = floor (p.y / bSizeV);
    sy = (bSizeV * (cIdV + step (0., rd.y)) - p.y) / rd.y;
    if (cIdV >= 0. && cIdV < 2. * nFlr) {
      p.y -= bSizeV * (cIdV + 0.5);
      h = ObjDf (p);
      sh = min (sh, smoothstep (0., 0.05 * d, h));
    } else h = abs (sy);
    d += h;
    if (sh < 0.05) break;
  }
  return 0.7 + 0.3 * sh;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.002, -0.002);
  cIdV = floor (p.y / bSizeV);
  p.y -= bSizeV * (cIdV + 0.5);
  v = vec4 (- ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (2. * v.yzw - dot (v, vec4 (1.)));
}

void InCylHit (vec3 ro, vec3 rd)
{
  vec3 s;
  float a, b, w, ws, srdy;
  dCylOut = dstFar;
  vnCylOut = vec3 (0.);
  a = dot (rd.xz, rd.xz);
  b = dot (rd.xz, ro.xz);
  w = b * b - a * (dot (ro.xz, ro.xz) - bCylRad * bCylRad);
  if (w > 0.) {
    ws = sqrt (w);
    srdy = sign (rd.y);
    if (a > 0.) {
      dCylOut = (- b + ws) / a;
      s = ro + dCylOut * rd;
    } else s.y = bCylHt;
    if (abs (s.y) < bCylHt) vnCylOut.xz = - s.xz / bCylRad;
    else {
      dCylOut = (- srdy * ro.y + bCylHt) / abs (rd.y);
      vnCylOut.y = - srdy;
    }
  }
}

vec3 SkyCol (vec3 ro, vec3 rd)
{
  float sd;
  rd = normalize (vec3 (rd.x, max (0.001, rd.y), rd.z));
  ro.xz += tCur;
  sd = max (dot (rd, sunDir), 0.);
  return mix (vec3 (0.2, 0.3, 0.65) + 0.2 * pow (sd, 256.), vec3 (0.9),
     clamp (3. * (Fbm2 (0.02 * (rd.xz * (100. - ro.y) / rd.y + ro.xz)) - 0.5) * rd.y + 0.1, 0., 1.));
}

vec3 ShStagGrid (vec2 p)
{
  vec2 q, sq, ss;
  q = p;
  if (2. * floor (0.5 * floor (q.y)) != floor (q.y)) q.x += 0.5;
  sq = smoothstep (0.05, 0.1, abs (fract (q + 0.5) - 0.5));
  q = fract (q) - 0.5;
  ss = 0.5 * smoothstep (0.3, 0.5, abs (q.xy)) * sign (q.xy);
  if (abs (q.x) < abs (q.y)) ss.x = 0.;
  else ss.y = 0.;
  return vec3 (ss.x, 0.8 + 0.2 * sq.x * sq.y, ss.y);
}

vec3 BgCol (vec3 ro, vec3 rd)
{
  vec3 vn, col, qh, rg;
  vec2 qw;
  float hy, hhy, hw, ww, f, b, aa, sRotH, sRotV, sh;
  InCylHit (ro + vec3 (0., - bCylHt, 0.), rd);
  if (vnCylOut.y == 0.) {
    ro += dCylOut * rd;
    vn = vnCylOut;
    hy = (ro.y - bCylHt) / bCylHt;
    hhy = abs (hy) - 0.43;
    aa = atan (vn.x, - vn.z) / pi;
    sRotH = mod (48. * 0.5 * (1. + aa) + 0.5, 1.) - 0.5;
    hw = 0.29;
    ww = 0.28;
    qw = abs (vec2 (sRotH, hhy));
    if (qw.x < ww && qw.y < hw) {
      qw = abs (qw - 0.5 * vec2 (ww, hw)) - vec2 (0.44 * ww, 0.47 * hw);
      if (max (qw.x, qw.y) < 0.) col = 0.7 * SkyCol (ro, reflect (rd, vn));
      else col = vec3 (0.5, 0.5, 0.3) * (0.2 + 0.8 * max (dot (vn, sunDir), 0.)) +
         0.5 * pow (max (dot (normalize (sunDir - rd), vn), 0.), 128.);
    } else {
      col = vec3 (0.7, 0.8, 0.7);
      qw -= vec2 (ww, hw);
      if (abs (hy) > (1. - 0.85/16.) || max (qw.x, qw.y) < 0.02) {
        col *= 0.9;
        vn.xz = Rot2D (vn.xz, - pi * aa);
        if (abs (hy) > (1. - 0.85/16.)) {
          sRotV = (1. - abs (2. * SmoothBump (1. - 0.9/16., 0.97, 0.03, abs (hy)) - 1.));
        } else {
          sRotV = (1. - abs (2. * SmoothBump (hw, hw + 0.02, 0.02, abs (hhy)) - 1.)) * sign (hhy);
          vn.xz = Rot2D (vn.xz, 0.4 * pi * sign (sRotH) *
             (1. - abs (2. * SmoothBump (- (ww + 0.02), ww + 0.02, 0.04, sRotH) - 1.)));
        }
        vn.yz = Rot2D (vn.yz, -0.2 * pi * sRotV * sign (hy));
        vn.xz = Rot2D (vn.xz, pi * aa);
      } else {
        qw = 16. * vec2 (12. * aa, hy);
        rg = ShStagGrid (qw);
        col *= rg.y * (1. - 0.3 * Noisefv2 (8. * qw));
        rg.xz *= sign ((abs (vn.x) > 0.5) ? vn.x : vn.z);
        if (abs (vn.x) > 0.5) {
          if (rg.x == 0.) vn.xy = Rot2D (vn.xy, rg.z);
          else vn.xz = Rot2D (vn.xz, rg.x);
        } else {
          if (rg.x == 0.) vn.zy = Rot2D (vn.zy, rg.z);
          else vn.zx = Rot2D (vn.zx, rg.x);
        }
      }
      col = col * (0.4 + 0.6 * max (dot (vn, sunDir), 0.));
    }
  } else if (vnCylOut.y > 0.) {
    ro += dCylOut * rd;
    b = 1. - smoothstep (-0.1, -0.01, rd.y) * smoothstep (0.4, 0.8, dCylOut / (1.6 * bCylRad));
    qh = HexGrid (0.75 * ro.xz);
    f = max (length (qh.xy) - 0.5, 0.) * b;
    vn = vec3 (0., Rot2D (vec2 (1., 0.), 4. * f * f));
    vn.zx = vn.z * vec2 (qh.x, - qh.y) / length (qh.xy);
    vn = VaryNf (64. * ro, vn, 0.2 * b);
    col = vec3 (0.72, 0.72, 0.75) * (1. - 0.1 * b * Noisefv2 (128. * ro.xz)) *
       (1. - min (0.2 * b * (1. - smoothstep (0.03, 0.06, qh.z)), 0.1));
    sh = ObjSShadow (ro, sunDir);
    col = col * (0.2 + 0.8 * sh * max (dot (vn, sunDir), 0.));
  } else col = SkyCol (ro, rd);
  return col;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec4 col4;
  vec3 col, vn, rot, refCol;
  float dstObj, sh, nDotS;
  bSizeV = 2. * flSpc;
  dstObj = ObjRay (ro, rd);
  rot = ro + dstObj * rd;
  refCol = vec3 (1.);
  if (dstObj < dstFar && idObj == idMir && length (rot.xz) < 0.33 * twrRad) {
    ro = rot;
    vn = ObjNf (ro);
    rd = reflect (rd, vn);
    ro += 0.01 * rd;
    dstObj = ObjRay (ro, rd);
    refCol = vec3 (0.7, 1., 1.);
  }
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObj == idFlr) {
      col4 = vec4 (0.7, 0.4, 0.2, 0.1);
      if (vn.y > 0.99) col4 *= 0.8 + 0.2 * SmoothBump (0.1, 0.9, 0.05, mod (0.5 * length (ro.xz) / SZ(1.), 1.));
    } else if (idObj == idStr) {
      col4 = vec4 (0.6, 0.3, 0.2, 0.1);
    } else if (idObj == idRl) {
      col4 = vec4 (0.7, 0.7, 0.9, 0.4);
    } else if (idObj == idStn) {
      col4 = vec4 (0.9, 0.9, 0.1, 0.4);
    } else if (idObj == idCln) {
      col4 = vec4 (0.6, 0.8, 0.6, 0.2);
    } else if (idObj == idMir) {
      col4 = vec4 (0.5, 0.6, 0.6, 0.4);
    }
    nDotS = max (dot (vn, sunDir), 0.);
    if (idObj != idFlr && idObj != idStr) nDotS *= nDotS;
    sh = ObjSShadow (ro, sunDir);
    col = col4.rgb * (0.2 + 0.8 * sh * nDotS) + col4.a * step (0.95, sh) * sh *
       pow (max (dot (normalize (sunDir - rd), vn), 0.), 32.);
  } else col = BgCol (ro, rd);
  col *= refCol;
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, ori, ca, sa;
  float el, az, azt, zmFac, sr;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  az = 0.;
  azt = 0.;
  el = -0.15 * pi;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += 0.5 * pi * mPtr.y;
  } else {
    azt = (1.2/16.) * pi * (floor (0.2 * tCur) + smoothstep (0.9, 1., mod (0.2 * tCur, 1.)));
  }
  zmFac = 2.8 + 6. * smoothstep (0.2 * pi , 0.7 * pi, abs (az));
  az += azt;
  el = clamp (el, -0.4 * pi, 0.03 * pi);
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  szFac = 0.2;
  szFlr = SZ(vec4 (14., 8.5, 4., 0.5));
  flSpc = 2. * szFlr.y - szFlr.w;
  nFlr = 3.;
  twrRad = SZ(60.);
  bCylRad = 80.;
  bCylHt = 24.;
  ro = vuMat * vec3 (0., 1.5 * nFlr * flSpc, - bCylRad + 1.);
  dstFar = 200.;
  sunDir = normalize (vec3 (1., 2., -1.));
#if ! AA
  const float naa = 1.;
#else
  const float naa = 3.;
#endif  
  col = vec3 (0.);
  sr = 2. * mod (dot (mod (floor (0.5 * (uv + 1.) * canvas), 2.), vec2 (1.)), 2.) - 1.;
  for (float a = 0.; a < naa; a ++) {
    rd = vuMat * normalize (vec3 (uv + step (1.5, naa) * Rot2D (vec2 (0.5 / canvas.y, 0.),
       sr * (0.667 * a + 0.5) * pi), zmFac));
    col += (1. / naa) * ShowScene (ro, rd);
  }
  fragColor = vec4 (col, 1.);
}

float PrCapsDf (vec3 p, float r, float h)
{
  return length (p - vec3 (0., 0., clamp (p.z, - h, h))) - r;
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

vec3 HexGrid (vec2 p)
{
  vec2 q;
  p -= HexToPix (PixToHex (p));
  q = abs (p);
  return vec3 (p, 0.5 * sqrt3 - q.x + 0.5 * min (q.x - sqrt3 * q.y, 0.));
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

vec2 Hashv2v2 (vec2 p)
{
  vec2 cHashVA2 = vec2 (37., 39.);
  return fract (sin (vec2 (dot (p, cHashVA2), dot (p + vec2 (1., 0.), cHashVA2))) * cHashM);
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
    iMouse = vec4(mouse * resolution, 1.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
