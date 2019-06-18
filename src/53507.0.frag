/*
 * Original shader from: https://www.shadertoy.com/view/MldGWS
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
// "Amiga Recursion" by dr2 - 2016
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

// Probably the best personal computer of its era.

// Too much recursion can be problematic (mousing enabled).

vec3 VaryNf (vec3 p, vec3 n, float f);
float SmoothBump (float lo, float hi, float w, float x);

float PrBoxDf (vec3 p, vec3 b);
float PrRoundBoxDf (vec3 p, vec3 b, float r);
float PrRoundBox2Df (vec2 p, vec2 b, float r);
float PrCylDf (vec3 p, float r, float h);
void PxInit ();
void PxBgn (vec2 p);
float PxText (vec2 p, int txt);
float PxChar (vec2 p, vec4 c);

mat3 vuMat = mat3(0.);
vec3 ltDir = vec3(0.);
vec2 sSize = vec2(0.), cSpace = vec2(0.);
float dstFar = 0., tCur = 0., sMidHt = 0.;
int idObj = 0, nRec = 0;
const int nRecMax = 5;
const float pi = 3.14159;

float ChqPat (vec2 p)
{
  vec2 ip;
  ip = floor (p);
  if (2. * floor (ip.y / 2.) != ip.y) p.x += 0.5;
  p = smoothstep (0., 0.1, abs (fract (p + 0.5) - 0.5));
  return 0.7 + 0.3 * p.x * p.y;
}

vec3 BgCol (vec3 ro, vec3 rd)
{
  vec3 col;
  if (rd.y >= 0.) col = mix (vec3 (0.2, 0.3, 0.55) + 0.2 * pow (1. - rd.y, 5.),
       vec3 (0.9), clamp (3. * rd.y - 0.5, 0., 1.));
  else col = mix ((1. + ChqPat (2. * (ro.xz - rd.xz * (ro.y / rd.y)))) *
     vec3 (0.2, 0.15, 0.1), vec3 (0.2, 0.3, 0.55) + 0.2, pow (1. + rd.y, 5.));
  return col;
}

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin, d, h;
  dMin = dstFar;
  q = p;
  q.y -= 0.35;
  d = PrRoundBoxDf (q, vec3 (1., 0.16, 0.7), 0.01);
  q = p - vec3 (0.7, 0.4, -0.72);
  d = max (d, - PrBoxDf (q, vec3 (0.17, 0.01, 0.2)));
  q.y -= -0.02;
  d = max (d, - PrBoxDf (q, vec3 (0.08, 0.08, 0.03)));
  q.y -= 0.01;
  d = max (d, - PrBoxDf (q, vec3 (0.045, 0.05, 0.05)));
  q = p;  q.yz -= vec2 (0.3, -0.72);
  d = max (d, - PrBoxDf (q, vec3 (1.1, 0.01, 0.03)));
  q = p;  q.x = abs (q.x) - 0.4;  q.yz -= vec2 (0.35, -0.72);
  d = max (d, - PrBoxDf (q, vec3 (0.01, 0.17, 0.03)));
  q = p;  q.x = abs (q.x) - 1.;  q.yz -= vec2 (0.35, 0.05);
  d = max (d, - PrBoxDf (q, vec3 (0.02, 0.007, 0.7)));
  if (d < dMin) { dMin = d;  idObj = 1; }
  q = p;  q.x = abs (q.x) - 0.95;  q.y -= 0.09;  q.x -= 0.02 * q.y;
  d = PrRoundBoxDf (q, vec3 (0.025 + 0.02 * q.y, 0.09, 0.6), 0.005);
  q = p;  q -= vec3 (-0.05, 0.09, 0.3);
  d = min (d, PrRoundBoxDf (q, vec3 (0.9, 0.09, 0.02), 0.005));
  if (d < dMin) { dMin = d;  idObj = 2; }
  q = p;  q.yz -= vec2 (0.55, 0.05);  q.xz = abs (q.xz) - vec2 (0.55, 0.4);
  d = PrCylDf (q.xzy, 0.05, 0.05);
  if (d < dMin) { dMin = d;  idObj = 3; }
  q = p;  q.yz -= vec2 (0.71 + sSize.y, -0.45);
  d = 0.9 * max (PrRoundBoxDf (q, vec3 (sSize.x + 0.16, sSize.y + 0.12, 0.13), 0.03),
     - PrRoundBox2Df (q.xy, sSize + 0.01, 0.03));
  if (d < dMin) { dMin = d;  idObj = 4; }
  q = p - vec3 (0.7, 0.4, -0.55);
  d = PrBoxDf (q, vec3 (0.16, 0.008, 0.16));
  if (d < dMin) { dMin = d;  idObj = 5; }
  q = p;
  h = sSize.y + 0.05 - 0.1 * (q.z - 0.05);
  q.yz -= vec2 (0.6 + h, 0.05);
  d = 0.9 * PrRoundBoxDf (q, vec3 (sSize.x + 0.12, h, 0.6), 0.03);
  if (d < dMin) { dMin = d;  idObj = 6; }
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 100; j ++) {
    d = ObjDf (ro + dHit * rd);
    dHit += d;
    if (d < 0.001 || dHit > dstFar) break;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  const vec3 e = vec3 (0.001, -0.001, 0.);
  int idObjT;
  idObjT = idObj;
  v = vec4 (ObjDf (p + e.xxx), ObjDf (p + e.xyy),
     ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  idObj = idObjT;
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float ObjAO (vec3 ro, vec3 rd)
{
  float ao, d;
  ao = 0.;
  for (int j = 0; j < 8; j ++) {
    d = 0.1 + float (j) / 16.;
    ao += max (0., d - 3. * ObjDf (ro + rd * d));
  }
  return 0.5 + 0.5 * clamp (1. - 0.2 * ao, 0., 1.);
}

vec3 ShowScene (vec3 ro)
{
  vec3 col, rd, roh, vn;
  vec2 sb;
  float dstObj, ao;
  bool isBg, isScrn;
  isBg = false;
  isScrn = true;
  for (int k = 0; k <= nRecMax; k ++) {
    rd = normalize (vec3 (ro.xy, 7.));
    if (k == 0) ro.xy = vec2 (0.);
    ro.z -= 20. * sSize.y;
    rd = vuMat * rd;
    ro = vuMat * ro;
    ro.y += sMidHt;
    dstObj = ObjRay (ro, rd);
    if (dstObj >= dstFar) isBg = true;
    else {
      ro += rd * dstObj;
      roh = ro;
      if (idObj != 6) isScrn = false;
      else {
        ro.y -= sMidHt;
        sb = abs (ro.xy) - sSize;
        isScrn = (max (sb.x, sb.y) < 0. && ro.z < -0.5 && k < nRec);
      } 
    }
    if (! isScrn || isBg || k == nRec) break;
  }
  if (isBg) {
    col = BgCol (ro, rd);
    if (rd.y < 0.) {
      roh = ro - (ro.y / rd.y) * rd;
      if (length (roh.xz) < 2.) col *= ObjAO (roh, vec3 (0., 1., 0.));
    }
  } else {
    col = vec3 (0.8, 0.81, 0.79);
    PxInit ();
    if (idObj == 1) {
      if (ro.z < -0.65) {
        col *= 1.2;
        sb = ro.xy - vec2 (-0.82, 0.42);
        sb.x -= 0.2 * sb.y;
        if (PxText (sb * 260., 1) > 0.) col = vec3 (0.1);
        else if (PxText ((ro.xy - vec2 (-0.75, 0.21)) * 240., 2) > 0.)
           col = vec3 (0.1, 0.1, 0.8);
        else if (abs (abs (ro.x) - 0.9) < 0.02 && abs (ro.y - 0.3) < 0.008)
           col = (ro.x < 0.) ? vec3 (0., 2., 0.) : ((mod (0.33 * tCur, 1.) < 0.3) ?
           vec3 (1., 0., 0.) : vec3 (0.4));
      }
    } else if (idObj == 2) {
      col *= 0.9;
    } else if (idObj == 3) {
      col = vec3 (0.4, 0.3, 0.1);
    } else if (idObj == 4) {
      if (ro.z < -0.45) col *= 1.2;
      if (ro.z < -0.6 && abs (ro.x) < sSize.x + 0.15 &&
         abs (ro.y - sMidHt) < sSize.y + 0.11) col *= 0.8;
    } else if (idObj == 5) {
      col = vec3 (0.1);
    } else if (idObj == 6) {
      if (length (ro.yz - vec2 (-0.4, -0.05)) < 0.15 &&
         mod (ro.y + 0.4 - 0.01, 0.04) < 0.02) col *= 0.4;
      else if (ro.z < -0.5) {
        col = vec3 (0.1);
        sb = (ro.xy - vec2 (0., 0.6 * sSize.y)) * 340.;
        if (PxText (sb, 0) > 0.) col = vec3 (1., 0.1, 0.1);
        else if (mod (tCur, 1.) < 0.5) {
          ro.xy = (abs (sb - vec2 (0., 0.5) * cSpace) - vec2 (29., 3.) * cSpace);
          if (max (ro.x, ro.y) < 1.25 &&
             (min (abs (ro.x), abs (ro.y)) < 1.25)) col = vec3 (1., 0.1, 0.1);
        }
      }
    }
    if (! isScrn) {
      vn = ObjNf (roh);
      ao = ObjAO (roh, vn);
      vn = VaryNf (100. * roh, vn, 0.2);
      col = ao * col * (0.3 +
         0.1 * max (dot (vn, - normalize (vec3 (ltDir.x, 0., ltDir.z))), 0.) +
         0.6 * (max (dot (vn, ltDir), 0.) +
         0.1 * pow (max (0., dot (ltDir, reflect (rd, vn))), 64.)));
    }
  }
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  vec4 mPtr;
  vec3 ro, rd, col;
  vec2 canvas, uv, ut, ori, ca, sa;
  float el, az, ds;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  ut = abs (uv) - vec2 (1.33, 1.);
  if (max (ut.x, ut.y) > 0.003) col = vec3 (0.82);
  else {
    dstFar = 60.;
    ltDir = normalize (vec3 (1., 3., -1.));
    ds = SmoothBump (0.2, 0.8, 0.1, mod (0.043 * tCur, 1.));
    az = -0.15 * pi * (2. * floor (mod (0.043 * tCur + 0.5, 2.)) - 1.) * (1. - ds);
    el = -0.08 * pi * (1. - ds);
    if (mPtr.z > 0.) {
      az += 2. * pi * mPtr.x;
      el += 0.7 * pi * mPtr.y;
    }
    az = clamp (az, -0.4 * pi, 0.4 * pi);
    el = clamp (el, -0.4 * pi, 0.01 * pi);
    ori = vec2 (el, az);
    ca = cos (ori);
    sa = sin (ori);
    vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
       mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
    sSize = 0.55 * vec2 (1.33, 1.);
    sMidHt = 1.26;
    nRec = int ((1. - abs (2. * mod (0.1 * tCur, 1.) - 1.)) * float (nRecMax + 1));
    col = ShowScene (vec3 (uv, 12. * sSize.y * ds));
  }
  fragColor = vec4 (col, 1.);
}

float PrBoxDf (vec3 p, vec3 b)
{
  vec3 d;
  d = abs (p) - b;
  return min (max (d.x, max (d.y, d.z)), 0.) + length (max (d, 0.));
}

float PrRoundBoxDf (vec3 p, vec3 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

float PrRoundBox2Df (vec2 p, vec2 b, float r)
{
  return length (max (abs (p) - b, 0.)) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

/*
 Text derived from 8x12 Font shader by Flyguy (Mt2GWD)
 Glyph bitmaps generated from 8x12 font sheet
   http://www.massmind.org/techref/datafile/charset/extractor/charset_extractor.htm
*/

vec4 glph[95];
vec2 cPos = vec2(0.);
const int g_spc=0, g_exc=1, g_quo=2, g_hsh=3, g_dol=4, g_pct=5, g_amp=6, g_apo=7,
   g_lbr=8, g_rbr=9, g_ast=10, g_crs=11, g_com=12, g_dsh=13, g_per=14, g_lsl=15, g_0=16,
   g_1=17, g_2=18, g_3=19, g_4=20, g_5=21, g_6=22, g_7=23, g_8=24, g_9=25, g_col=26,
   g_scl=27, g_les=28, g_equ=29, g_grt=30, g_que=31, g_ats=32, g_A=33, g_B=34, g_C=35,
   g_D=36, g_E=37, g_F=38, g_G=39, g_H=40, g_I=41, g_J=42, g_K=43, g_L=44, g_M=45,
   g_N=46, g_O=47, g_P=48, g_Q=49, g_R=50, g_S=51, g_T=52, g_U=53, g_V=54, g_W=55,
   g_X=56, g_Y=57, g_Z=58, g_lsb=59, g_rsl=60, g_rsb=61, g_pow=62, g_usc=63, g_a=64,
   g_b=65, g_c=66, g_d=67, g_e=68, g_f=69, g_g=70, g_h=71, g_i=72, g_j=73, g_k=74,
   g_l=75, g_m=76, g_n=77, g_o=78, g_p=79, g_q=80, g_r=81, g_s=82, g_t=83, g_u=84,
   g_v=85, g_w=86, g_x=87, g_y=88, g_z=89, g_lpa=90, g_bar=91, g_rpa=92, g_tid=93,
   g_lar=94;

float PxChar (vec2 p, vec4 c)
{
  vec2 cb;
  float pOn, b;
  p = floor (p - cPos);
  if (min (p.x, p.y) >= 0. && max (p.x - 8., p.y - 12.) < 0.) {
    b = 8. * (p.y + 1.) - (p.x + 1.);
    if (b < 48.) cb = (b < 24.) ? vec2 (c.w, b) : vec2 (c.z, b - 24.);
    else cb = (b < 72.) ? vec2 (c.y, b - 48.) : vec2 (c.x, b - 72.);
    pOn = mod (floor (cb.x / exp2 (cb.y)), 2.);
  } else pOn = 0.;
  cPos.x += cSpace.x;
  return pOn;
}

void PxBgn (vec2 p)
{
  cPos = floor (p * cSpace);
}

#define G(g) s += PxChar (p, glph[g])
#define G4(g1, g2, g3, g4) G (g1), G (g2), G (g3), G (g4)

void PxInit ()
{
  glph[g_spc] = vec4 (0x000000, 0x000000, 0x000000, 0x000000);
  glph[g_exc] = vec4 (0x003078, 0x787830, 0x300030, 0x300000);
  glph[g_quo] = vec4 (0x006666, 0x662400, 0x000000, 0x000000);
  glph[g_hsh] = vec4 (0x006C6C, 0xFE6C6C, 0x6CFE6C, 0x6C0000);
  glph[g_dol] = vec4 (0x30307C, 0xC0C078, 0x0C0CF8, 0x303000);
  glph[g_pct] = vec4 (0x000000, 0xC4CC18, 0x3060CC, 0x8C0000);
  glph[g_amp] = vec4 (0x0070D8, 0xD870FA, 0xDECCDC, 0x760000);
  glph[g_apo] = vec4 (0x003030, 0x306000, 0x000000, 0x000000);
  glph[g_lbr] = vec4 (0x000C18, 0x306060, 0x603018, 0x0C0000);
  glph[g_rbr] = vec4 (0x006030, 0x180C0C, 0x0C1830, 0x600000);
  glph[g_ast] = vec4 (0x000000, 0x663CFF, 0x3C6600, 0x000000);
  glph[g_crs] = vec4 (0x000000, 0x18187E, 0x181800, 0x000000);
  glph[g_com] = vec4 (0x000000, 0x000000, 0x000038, 0x386000);
  glph[g_dsh] = vec4 (0x000000, 0x0000FE, 0x000000, 0x000000);
  glph[g_per] = vec4 (0x000000, 0x000000, 0x000038, 0x380000);
  glph[g_lsl] = vec4 (0x000002, 0x060C18, 0x3060C0, 0x800000);
  glph[g_0]   = vec4 (0x007CC6, 0xD6D6D6, 0xD6D6C6, 0x7C0000);
  glph[g_1]   = vec4 (0x001030, 0xF03030, 0x303030, 0xFC0000);
  glph[g_2]   = vec4 (0x0078CC, 0xCC0C18, 0x3060CC, 0xFC0000);
  glph[g_3]   = vec4 (0x0078CC, 0x0C0C38, 0x0C0CCC, 0x780000);
  glph[g_4]   = vec4 (0x000C1C, 0x3C6CCC, 0xFE0C0C, 0x1E0000);
  glph[g_5]   = vec4 (0x00FCC0, 0xC0C0F8, 0x0C0CCC, 0x780000);
  glph[g_6]   = vec4 (0x003860, 0xC0C0F8, 0xCCCCCC, 0x780000);
  glph[g_7]   = vec4 (0x00FEC6, 0xC6060C, 0x183030, 0x300000);
  glph[g_8]   = vec4 (0x0078CC, 0xCCEC78, 0xDCCCCC, 0x780000);
  glph[g_9]   = vec4 (0x0078CC, 0xCCCC7C, 0x181830, 0x700000);
  glph[g_col] = vec4 (0x000000, 0x383800, 0x003838, 0x000000);
  glph[g_scl] = vec4 (0x000000, 0x383800, 0x003838, 0x183000);
  glph[g_les] = vec4 (0x000C18, 0x3060C0, 0x603018, 0x0C0000);
  glph[g_equ] = vec4 (0x000000, 0x007E00, 0x7E0000, 0x000000);
  glph[g_grt] = vec4 (0x006030, 0x180C06, 0x0C1830, 0x600000);
  glph[g_que] = vec4 (0x0078CC, 0x0C1830, 0x300030, 0x300000);
  glph[g_ats] = vec4 (0x007CC6, 0xC6DEDE, 0xDEC0C0, 0x7C0000);
  glph[g_A]   = vec4 (0x003078, 0xCCCCCC, 0xFCCCCC, 0xCC0000);
  glph[g_B]   = vec4 (0x00FC66, 0x66667C, 0x666666, 0xFC0000);
  glph[g_C]   = vec4 (0x003C66, 0xC6C0C0, 0xC0C666, 0x3C0000);
  glph[g_D]   = vec4 (0x00F86C, 0x666666, 0x66666C, 0xF80000);
  glph[g_E]   = vec4 (0x00FE62, 0x60647C, 0x646062, 0xFE0000);
  glph[g_F]   = vec4 (0x00FE66, 0x62647C, 0x646060, 0xF00000);
  glph[g_G]   = vec4 (0x003C66, 0xC6C0C0, 0xCEC666, 0x3E0000);
  glph[g_H]   = vec4 (0x00CCCC, 0xCCCCFC, 0xCCCCCC, 0xCC0000);
  glph[g_I]   = vec4 (0x007830, 0x303030, 0x303030, 0x780000);
  glph[g_J]   = vec4 (0x001E0C, 0x0C0C0C, 0xCCCCCC, 0x780000);
  glph[g_K]   = vec4 (0x00E666, 0x6C6C78, 0x6C6C66, 0xE60000);
  glph[g_L]   = vec4 (0x00F060, 0x606060, 0x626666, 0xFE0000);
  glph[g_M]   = vec4 (0x00C6EE, 0xFEFED6, 0xC6C6C6, 0xC60000);
  glph[g_N]   = vec4 (0x00C6C6, 0xE6F6FE, 0xDECEC6, 0xC60000);
  glph[g_O]   = vec4 (0x00386C, 0xC6C6C6, 0xC6C66C, 0x380000);
  glph[g_P]   = vec4 (0x00FC66, 0x66667C, 0x606060, 0xF00000);
  glph[g_Q]   = vec4 (0x00386C, 0xC6C6C6, 0xCEDE7C, 0x0C1E00);
  glph[g_R]   = vec4 (0x00FC66, 0x66667C, 0x6C6666, 0xE60000);
  glph[g_S]   = vec4 (0x0078CC, 0xCCC070, 0x18CCCC, 0x780000);
  glph[g_T]   = vec4 (0x00FCB4, 0x303030, 0x303030, 0x780000);
  glph[g_U]   = vec4 (0x00CCCC, 0xCCCCCC, 0xCCCCCC, 0x780000);
  glph[g_V]   = vec4 (0x00CCCC, 0xCCCCCC, 0xCCCC78, 0x300000);
  glph[g_W]   = vec4 (0x00C6C6, 0xC6C6D6, 0xD66C6C, 0x6C0000);
  glph[g_X]   = vec4 (0x00CCCC, 0xCC7830, 0x78CCCC, 0xCC0000);
  glph[g_Y]   = vec4 (0x00CCCC, 0xCCCC78, 0x303030, 0x780000);
  glph[g_Z]   = vec4 (0x00FECE, 0x981830, 0x6062C6, 0xFE0000);
  glph[g_lsb] = vec4 (0x003C30, 0x303030, 0x303030, 0x3C0000);
  glph[g_rsl] = vec4 (0x000080, 0xC06030, 0x180C06, 0x020000);
  glph[g_rsb] = vec4 (0x003C0C, 0x0C0C0C, 0x0C0C0C, 0x3C0000);
  glph[g_pow] = vec4 (0x10386C, 0xC60000, 0x000000, 0x000000);
  glph[g_usc] = vec4 (0x000000, 0x000000, 0x000000, 0x00FF00);
  glph[g_a]   = vec4 (0x000000, 0x00780C, 0x7CCCCC, 0x760000);
  glph[g_b]   = vec4 (0x00E060, 0x607C66, 0x666666, 0xDC0000);
  glph[g_c]   = vec4 (0x000000, 0x0078CC, 0xC0C0CC, 0x780000);
  glph[g_d]   = vec4 (0x001C0C, 0x0C7CCC, 0xCCCCCC, 0x760000);
  glph[g_e]   = vec4 (0x000000, 0x0078CC, 0xFCC0CC, 0x780000);
  glph[g_f]   = vec4 (0x00386C, 0x6060F8, 0x606060, 0xF00000);
  glph[g_g]   = vec4 (0x000000, 0x0076CC, 0xCCCC7C, 0x0CCC78);
  glph[g_h]   = vec4 (0x00E060, 0x606C76, 0x666666, 0xE60000);
  glph[g_i]   = vec4 (0x001818, 0x007818, 0x181818, 0x7E0000);
  glph[g_j]   = vec4 (0x000C0C, 0x003C0C, 0x0C0C0C, 0xCCCC78);
  glph[g_k]   = vec4 (0x00E060, 0x60666C, 0x786C66, 0xE60000);
  glph[g_l]   = vec4 (0x007818, 0x181818, 0x181818, 0x7E0000);
  glph[g_m]   = vec4 (0x000000, 0x00FCD6, 0xD6D6D6, 0xC60000);
  glph[g_n]   = vec4 (0x000000, 0x00F8CC, 0xCCCCCC, 0xCC0000);
  glph[g_o]   = vec4 (0x000000, 0x0078CC, 0xCCCCCC, 0x780000);
  glph[g_p]   = vec4 (0x000000, 0x00DC66, 0x666666, 0x7C60F0);
  glph[g_q]   = vec4 (0x000000, 0x0076CC, 0xCCCCCC, 0x7C0C1E);
  glph[g_r]   = vec4 (0x000000, 0x00EC6E, 0x766060, 0xF00000);
  glph[g_s]   = vec4 (0x000000, 0x0078CC, 0x6018CC, 0x780000);
  glph[g_t]   = vec4 (0x000020, 0x60FC60, 0x60606C, 0x380000);
  glph[g_u]   = vec4 (0x000000, 0x00CCCC, 0xCCCCCC, 0x760000);
  glph[g_v]   = vec4 (0x000000, 0x00CCCC, 0xCCCC78, 0x300000);
  glph[g_w]   = vec4 (0x000000, 0x00C6C6, 0xD6D66C, 0x6C0000);
  glph[g_x]   = vec4 (0x000000, 0x00C66C, 0x38386C, 0xC60000);
  glph[g_y]   = vec4 (0x000000, 0x006666, 0x66663C, 0x0C18F0);
  glph[g_z]   = vec4 (0x000000, 0x00FC8C, 0x1860C4, 0xFC0000);
  glph[g_lpa] = vec4 (0x001C30, 0x3060C0, 0x603030, 0x1C0000);
  glph[g_bar] = vec4 (0x001818, 0x181800, 0x181818, 0x180000);
  glph[g_rpa] = vec4 (0x00E030, 0x30180C, 0x183030, 0xE00000);
  glph[g_tid] = vec4 (0x0073DA, 0xCE0000, 0x000000, 0x000000);
  glph[g_lar] = vec4 (0x000000, 0x10386C, 0xC6C6FE, 0x000000);
  cSpace = vec2 (8., 13.);
}

float PxText (vec2 p, int txt)
{
  float s;
  s = 0.;
  if (txt == 0) {
    PxBgn (- vec2 (27., -1.));
    G4 (g_S, g_o, g_f, g_t);  G4 (g_w, g_a, g_r, g_e);  G (g_spc);
    G4 (g_F, g_a, g_i, g_l);  G4 (g_u, g_r, g_e, g_per);  G (g_spc);
    G4 (g_P, g_r, g_e, g_s);  G4 (g_s, g_spc, g_l, g_e);
    G4 (g_f, g_t, g_spc, g_m);  G4 (g_o, g_u, g_s, g_e);  G (g_spc);
    G4 (g_b, g_u, g_t, g_t);  G4 (g_o, g_n, g_spc, g_t);
    G4 (g_o, g_spc, g_c, g_o);  G4 (g_n, g_t, g_i, g_n);
    G4 (g_u, g_e, g_per, g_spc);
    PxBgn (- vec2 (17., 1.));
    G4 (g_G, g_u, g_r, g_u);  G (g_spc);  G4 (g_M, g_e, g_d, g_i);
    G4 (g_t, g_a, g_t, g_i);  G4 (g_o, g_n, g_spc, g_hsh);
    G4 (g_8, g_2, g_0, g_1);  G4 (g_0, g_0, g_0, g_3);  G (g_per);
    G4 (g_D, g_E, g_A, g_D);  G4 (g_B, g_E, g_E, g_F);
  } else if (txt == 1) {
    PxBgn (- vec2 (2., 0.));
    G4 (g_A, g_M, g_I, g_G);  G (g_A);
  } else if (txt == 2) {
    PxBgn (- vec2 (4., 0.));
    G4 (g_C, g_o, g_m, g_m);  G4 (g_o, g_d, g_o, g_r);  G (g_e);
  }
  return s;
}

const vec4 cHashA4 = vec4 (0., 1., 57., 58.);
const vec3 cHashA3 = vec3 (1., 57., 113.);
const float cHashM = 43758.54;

vec4 Hashv4f (float p)
{
  return fract (sin (p + cHashA4) * cHashM);
}

float Noisefv2 (vec2 p)
{
  vec4 t;
  vec2 ip, fp;
  ip = floor (p);
  fp = fract (p);
  fp = fp * fp * (3. - 2. * fp);
  t = Hashv4f (dot (ip, cHashA3.xy));
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
  const vec3 e = vec3 (0.1, 0., 0.);
  s = Fbmn (p, n);
  g = vec3 (Fbmn (p + e.xyy, n) - s, Fbmn (p + e.yxy, n) - s,
     Fbmn (p + e.yyx, n) - s);
  return normalize (n + f * (g - n * dot (n, g)));
}

float SmoothBump (float lo, float hi, float w, float x)
{
  return (1. - smoothstep (hi - w, hi + w, x)) * smoothstep (lo - w, lo + w, x);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
