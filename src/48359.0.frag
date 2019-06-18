/*
 * Original shader from: https://www.shadertoy.com/view/lt3cDX
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Tux the Penguin" by dr2 - 2018
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA  0   // optional antialiasing

float PrSphDf (vec3 p, float r);
float PrCylDf (vec3 p, float r, float h);
float PrEllipsDf (vec3 p, vec3 r);
float SmoothMin (float a, float b, float r);
float SmoothBump (float lo, float hi, float w, float x);
vec2 Rot2D (vec2 q, float a);
vec3 VaryNf (vec3 p, vec3 n, float f);

vec3 ltDir = vec3(0.);
float dstFar = 0., tCur = 0., fAng = 0.;
int idObj;
const float pi = 3.14159;

#define DMIN(id) if (d < dMin) { dMin = d;  idObj = id; }

float ObjDf (vec3 p)
{
  vec3 q;
  float dMin, d, dh;
  dMin = dstFar;
  q = p;
  d = PrEllipsDf (q.xzy, vec3 (1.3, 1.2, 1.4));
  q.y -= 1.5;
  dh = PrEllipsDf (q.xzy, vec3 (0.8, 0.6, 1.3));
  q = p;
  q.x = abs (q.x);
  q -= vec3 (0.3, 2., -0.4);
  d = SmoothMin (d, max (dh, - PrCylDf (q, 0.15, 0.3)), 0.2);
  DMIN (1);
  q = p;
  q.yz -= vec2 (1.6, -0.6);
  d = max (PrEllipsDf (q, vec3 (0.4, 0.2, 0.6)), 0.01 - abs (q.y));
  DMIN (2);
  q = p;
  q.x = abs (q.x);
  q -= vec3 (0.3, 2., -0.4);
  d = PrSphDf (q, 0.15);
  DMIN (3);
  q = p;
  q.x = abs (q.x);
  q.xy -= vec2 (0.6, -1.05);
  q.yz = Rot2D (q.yz, -0.5 * pi);
  q.y -= -0.6;
  d = PrCylDf (q.xzy, 0.12, 0.7);
  DMIN (4);
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
  DMIN (5);
  q = p;
  q.x = abs (q.x);
  q -= vec3 (1.1, 0.3, -0.2);
  q.yz = Rot2D (q.yz, -0.25 * pi);
  q.xy = Rot2D (q.xy, fAng) - vec2 (0.1, -0.4);
  d = PrEllipsDf (q.xzy, vec3 (0.05, 0.25, 0.9));
  DMIN (6);
  return dMin;
}

float ObjRay (vec3 ro, vec3 rd)
{
  float dHit, d;
  dHit = 0.;
  for (int j = 0; j < 220; j ++) {
    d = ObjDf (ro + rd * dHit);
    if (d < 0.0005 || dHit > dstFar) break;
    dHit += d;
  }
  return dHit;
}

vec3 ObjNf (vec3 p)
{
  vec4 v;
  vec2 e = vec2 (0.0001, -0.0001);
  v = vec4 (ObjDf (p + e.xxx), ObjDf (p + e.xyy), ObjDf (p + e.yxy), ObjDf (p + e.yyx));
  return normalize (vec3 (v.x - v.y - v.z - v.w) + 2. * v.yzw);
}

float ObjSShadow (vec3 ro, vec3 rd)
{
  float sh, d, h;
  sh = 1.;
  d = 0.05;
  for (int j = 0; j < 30; j ++) {
    h = ObjDf (ro + rd * d);
    sh = min (sh, smoothstep (0., 0.05 * d, h));
    d += h;
    if (sh < 0.05) break;
  }
  return 0.6 + 0.4 * sh;
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec3 col, vn;
  float dstObj, sh;
  dstObj = ObjRay (ro, rd);
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = ObjNf (ro);
    if (idObj == 1 || idObj == 6) vn = VaryNf (64. * ro, vn, 0.3);
    if (idObj == 1) col = (ro.z < -0.6 || ro.z < 0. && length (vec2 (abs (ro.x), ro.y) -
       vec2 (0.3, 2.)) < 0.2) ? vec3 (0.9) : vec3 (0.1, 0.1, 0.15);
    else if (idObj == 2) col = vec3 (1., 0.8, 0.2);
    else if (idObj == 3) col = vec3 (0.05, 0.1, 0.05);
    else if (idObj == 4) col = vec3 (0.8, 0.8, 0.);
    else if (idObj == 5) col = vec3 (0.9, 0.9, 0.);
    else if (idObj == 6) col = vec3 (0.15, 0.15, 0.2);
    sh = ObjSShadow (ro, ltDir);
    col = col * (0.3 + 0.7 * sh * max (dot (vn, ltDir), 0.)) +
       0.2 * smoothstep (0.8, 1., sh) * pow (max (dot (normalize (ltDir - rd), vn), 0.), 32.);
  } else col = vec3 (0.6, 0.6, 1.);
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
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
  az = 0.;
  el = 0.;
  if (mPtr.z > 0.) {
    az += 2. * pi * mPtr.x;
    el += pi * mPtr.y;
  } else {
    az -= 0.4 * pi * sin (0.05 * pi * tCur);;
    el -= 0.1 * pi * sin (0.02 * pi * tCur);
  }
  ori = vec2 (el, az);
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x);
  ro = vuMat * vec3 (0., 0.7, -20.);
  fAng = -0.2 * pi + 0.1 * pi * SmoothBump (0.25, 0.75, 0.1, mod (0.2 * tCur, 1.)) *
     sin (16. * pi * tCur);
  dstFar = 30.;
  ltDir = vuMat * normalize (vec3 (1., 1., -1.));
#if ! AA
  const float naa = 1.;
#else
  const float naa = 4.;
#endif  
  col = vec3 (0.);
  for (float a = 0.; a < naa; a ++) {
    rd = vuMat * normalize (vec3 (uv + step (1.5, naa) * Rot2D (vec2 (0.71 / canvas.y, 0.),
       0.5 * pi * (a + 0.5)), 7.));
    col += (1. / naa) * ShowScene (ro, rd);
  }
  col *= 1. - 0.6 * length (uv);
  fragColor = vec4 (pow (col, vec3 (0.8)), 1.);
}

float PrSphDf (vec3 p, float r)
{
  return length (p) - r;
}

float PrCylDf (vec3 p, float r, float h)
{
  return max (length (p.xy) - r, abs (p.z) - h);
}

float PrEllipsDf (vec3 p, vec3 r)
{
  return (length (p / r) - 1.) * min (r.x, min (r.y, r.z));
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
