/*
 * Original shader from: https://www.shadertoy.com/view/3dsXWf
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
// "Truncated Octahedral Voxels" by dr2 - 2019
// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

#define AA  1

vec3 vuOrg = vec3(0.), ltPos = vec3(0.), cMid = vec3(0.);
float dstFar = 0., tCur = 0., rVoid = 0., fcId = 0.;
const float pi = 3.14159;

vec3 HsvToRgb (vec3 c);
vec2 Rot2D (vec2 q, float a);
float Hashfv3 (vec3 p);

vec3 FcVec (float k)
{
  vec3 u, e;
  e = vec3 (1., 0., -1.);
  if (k <= 3.) u = (k == 1.) ? e.xyy : ((k == 2.) ? e.yxy : e.yyx);
  else if (k <= 5.) u = 0.5 * ((k == 4.) ? e.xxx : e.zxx);
  else u = 0.5 * ((k == 6.) ? e.xzx : e.xxz);
  return u;
}

bool CellOcc (vec3 p)
{
  return (length (p - vuOrg) > rVoid && Hashfv3 (17.3 * p) < 0.2);
}

float ObjRay (vec3 ro, vec3 rd)
{
  vec3 p, cm, fv;
  float dHit, dm, d, s;
  cMid = sign (ro) * floor (abs (ro) + 0.5);
  cm = mod (cMid, 2.);
  if (dot (cm, vec3 (1.)) > 0.) cMid += step (abs (cm.yzx - cm.zxy), vec3 (0.5)) *
     sign (ro - cMid);
  dHit = 0.;
  for (int j = 0; j < 120; j ++) {
    p = cMid - (ro + dHit * rd);
    fcId = 0.;
    dm = dstFar;
    for (float k = 1.; k < 8.; k ++) {
      fv = FcVec (k);
      s = dot (fv, rd);
      if (s != 0.) {
        d = dot (p + sign (s) * fv, fv)  / s;
        if (d < dm) {
          dm = d;
          fcId = sign (s) * k;
        }
      }
    }
    cMid = floor (cMid + 2. * sign (fcId) * FcVec (abs (fcId)) + 0.5);
    dHit += dm;
    if (CellOcc (cMid) || dHit > dstFar) break;
  }
  return dHit;
}

float ObjHitSh (vec3 ro, vec3 rd, float rng)
{
  vec3 p, cm, fv;
  float dHit, dm, d, s;
  cMid = sign (ro) * floor (abs (ro) + 0.5);
  cm = mod (cMid, 2.);
  if (dot (cm, vec3 (1.)) > 0.) cMid += step (abs (cm.yzx - cm.zxy), vec3 (0.5)) *
     sign (ro - cMid);
  dHit = 0.;
  for (int j = 0; j < 20; j ++) {
    p = cMid - (ro + dHit * rd);
    fcId = 0.;
    dm = dstFar;
    for (float k = 1.; k < 8.; k ++) {
      fv = FcVec (k);
      s = dot (fv, rd);
      if (s != 0.) {
        d = dot (p + sign (s) * fv, fv)  / s;
        if (d < dm) {
          dm = d;
          fcId = sign (s) * k;
        }
      }
    }
    cMid = floor (cMid + 2. * sign (fcId) * FcVec (abs (fcId)) + 0.5);
    dHit += dm;
    if (CellOcc (cMid) || dHit > rng) break;
  }
  return 0.3 + 0.7 * smoothstep (0.5 * rng, rng, dHit);
}

vec3 ShowScene (vec3 ro, vec3 rd)
{
  vec3 col, vn, ltDir;
  float dstObj, sh, ltDist, lDotV, atten;
  dstObj = ObjRay (ro, rd);
  if (dstObj < dstFar) {
    ro += dstObj * rd;
    vn = - normalize (sign (fcId) * FcVec (abs (fcId)));
    if (length (ro - cMid) > 0.9) col = HsvToRgb (vec3 (Hashfv3 (21.3 * cMid), 0.6, 1.));
    else col = vec3 (1., 0.8, 0.8) * (0.6 + 0.4 * cos (4. * pi * (0.4 +
       0.6 * Hashfv3 (17.3 * cMid)) * tCur)) * pow (0.7 - 0.3 * dot (rd, vn), 4.);
    ltDir = ltPos - ro;
    ltDist = max (length (ltDir), 0.1);
    ltDir /= ltDist;
    sh = ObjHitSh (ro + 0.01 * vn, ltDir, 15.);
    atten = 1. / (1. + 0.05 * (ltDist - rVoid + 1.) * (1. + 0.2 * (ltDist - rVoid + 1.)));
    lDotV = max (dot (ltDir, vn), 0.);
    col = col * (0.2 + 0.8 * atten * sh * lDotV * lDotV) +
       0.2 * atten * sh * pow (max (dot (normalize (ltDir - rd), vn), 0.), 16.);
    col += vec3 (0.5) * max (- dot (rd, vn), 0.) * (1. - smoothstep (0., 0.002,
       abs ((dstObj - rVoid + 2.) / dstFar - 0.5 * mod (0.1 * tCur, 1.))));
  } else {
    col = vec3 (0.5, 0.5, 0.6) * (0.2 + 0.8 * rd.z * rd.z);
  }
  return clamp (col, 0., 1.);
}

void mainImage (out vec4 fragColor, in vec2 fragCoord)
{
  mat3 vuMat;
  vec4 mPtr;
  vec3 ro, rd, ori, ca, sa, col;
  vec2 canvas, uv;
  float sr;
  canvas = iResolution.xy;
  uv = 2. * fragCoord.xy / canvas - 1.;
  uv.x *= canvas.x / canvas.y;
  tCur = iTime;
  mPtr = iMouse;
  mPtr.xy = mPtr.xy / canvas - 0.5;
  if (mPtr.z > 0.) ori = vec3 (pi * mPtr.y, 2. * pi * mPtr.x, 0.22 * pi);
  else ori = vec3 (0.017, 0.007, 0.019) * pi * tCur;
  ca = cos (ori);
  sa = sin (ori);
  vuMat = mat3 (ca.y, 0., - sa.y, 0., 1., 0., sa.y, 0., ca.y) *
          mat3 (1., 0., 0., 0., ca.x, - sa.x, 0., sa.x, ca.x) *
          mat3 (ca.z, - sa.z, 0., sa.z, ca.z, 0., 0., 0., 1.);
  rVoid = 16.;
  vuOrg = vec3 (0., 0., 8.);
  ro = vuOrg + vuMat * vec3 (1.1);
  ltPos = vuOrg + vuMat * vec3 (Rot2D (vec2 (5., 0.), 0.5 * tCur), 0.);
  dstFar = 50.;
#if ! AA
  const float naa = 1.;
#else
  const float naa = 3.;
#endif  
  col = vec3 (0.);
  sr = 2. * mod (dot (mod (floor (0.5 * (uv + 1.) * canvas), 2.), vec2 (1.)), 2.) - 1.;
  for (float a = 0.; a < naa; a ++) {
    rd = vuMat * normalize (vec3 (uv + step (1.5, naa) * Rot2D (vec2 (0.5 / canvas.y, 0.),
       sr * (0.667 * a + 0.5) * pi), 2.));
    col += (1. / naa) * ShowScene (ro, rd);
  }
  fragColor = vec4 (col, 1.);
}

vec3 HsvToRgb (vec3 c)
{
  return c.z * mix (vec3 (1.), clamp (abs (fract (c.xxx + vec3 (1., 2./3., 1./3.)) * 6. - 3.) - 1., 0., 1.), c.y);
}

vec2 Rot2D (vec2 q, float a)
{
  vec2 cs;
  cs = sin (a + vec2 (0.5 * pi, 0.));
  return vec2 (dot (q, vec2 (cs.x, - cs.y)), dot (q.yx, cs));
}

const float cHashM = 43758.54;

float Hashfv3 (vec3 p)
{
  return fract (sin (dot (p, vec3 (37., 39., 41.))) * cHashM);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
