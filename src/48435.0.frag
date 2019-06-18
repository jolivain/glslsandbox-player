/*
 * Original shader from: https://www.shadertoy.com/view/ltdyDl
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

// Protect glslsandbox uniform names
#define time        stemu_time

// --------[ Original ShaderToy begins here ]---------- //

// GLOBALS

// position & direction
vec3 pos_finn = vec3(0.), pos_eyes = vec3(0.);
vec3 dir_eye = vec3(0.);
mat3 dir_mouth = mat3(0.);
vec3 dir_light = vec3(0.);

// coloring and animation
float heye = 0., weye = 0., beye = 0.;
float hmouth = 0., cmouth = 0.;
float hfinns = 0., htail = 0.;
float puff = 0.;
float time = 0.;
float tim_tail = 0.;
float ani_tail = 0., ani_mouth = 0.;

// colors
const vec3 col_water = vec3(.3, .7, 1.);
const vec3 col_fish_1 = vec3(1., 0.4, 0.2);
const vec3 col_fish_2 = vec3(1., 0.8, 0.5);
const vec3 col_eyes = vec3(0.7, 0.75, 1.);

// marching
const float maxdist = 5.;
const float det = .001;



// USEFUL LITTLE FUNCTIONS

// 2D rotation
mat2 rot2D(float a) {
  a = radians(a);
  float s = sin(a);
  float c = cos(a);
  return mat2(c, s, -s, c);
}

// Align vector
mat3 lookat(vec3 fw, vec3 up) {
  fw = normalize(fw);
  vec3 rt = normalize(cross(fw, normalize(up)));
  return mat3(rt, cross(rt, fw), fw);
}


// Tile fold 
float fmod(float p, float c) { return abs(c - mod(p, c * 2.)) / c; }

// Smooth min
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Smooth max
float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Torus
float sdTorus(vec3 p, vec2 t, vec3 s) {
  p = p.yxz * s;
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}


// PUFFY'S SURFACE DISPLACEMENT FUNCTIONS

float thorns(vec3 p) {
  p.xz*=rot2D(-25.);
  float s1 = smoothstep(.0, .7, -p.x + p.z + .6);
  float s2 = smoothstep(.15, .3, length(p.xy)) * smoothstep(.0, .3, length(p.yz));
  float s3 = smoothstep(.0, .25, abs(p.y));
  p.x = fmod(atan(p.x, p.y), .31459 / 2.);
  p.y = fmod(atan(p.y, p.z), .31459 / 2.);
  p.xz*=rot2D(25.);
  return min(1., exp((-3. - puff*3.) * length(p.xy))) * s1 * s2 * s3;
}

float spiral(vec3 p, vec3 c) {
  p.y = abs(p.y);
  vec3 pos = p;
  p = lookat(c, vec3(0., 1., 0.)) * p;
  float a = length(p.xy) * 35.;
  p.yx *= mat2(sin(a), cos(a), -cos(a), sin(a));
  float s=pow(abs(p.x), 2.) * smoothstep(0.7, 1., max(0., 1. - length(p.xy)));
  return s*smoothstep(0.,.05,pos.z+.1);
}

float skin(vec3 pos) {
  pos *= 2.;
  vec3 p = pos;
  float m = 1000.;
  for (int i = 0; i < 7; i++) {
    p = abs(p) / dot(p, p) - .5;
    m = min(m, length(p));
  }
  return max(0., 1. - m) * (.1 + smoothstep(-pos.x + 1., 0., .4)) * .003;
}

// PUFFY'S DE FUNCTIONS

// Body parts

float finn(vec3 p) {
  p.z += .27;
  p.x += .1;
  p.x *= 1.-pow(smoothstep(0., .2, -p.z),1.5)*.3;
  mat2 ro = rot2D(cos(tim_tail*4.+(p.x+p.z)*5.) *(3.-p.x*20.));   
  p.xy *= ro;
  p.zy *= ro;
  float e = atan(p.x, p.z);
  float o = sin(e * 20.) * .003;
  float a = .19 - p.z * .15;
  float d = max(abs(p.y + o) - .005, length(p.xz) - a + cos(o * 500.) * .02);
  d = max(p.x - p.z*.6, d);
  d = max(p.z-p.x*.3, d);
  return d * .75;
}


float tail(vec3 p) {
  p.z += .18;
  p.x += puff * .1;
  p.x += .45 + pow(smoothstep(0., .4, abs(p.z)), 5.) * .1;
  p.xy *= rot2D(cos(tim_tail + p.x * 5. + p.z * 3.) * 25.);
  float e = atan(p.x, p.z);
  float o = sin(e * 20.) * .003;
  float a = .27 - p.z * .15;
  float d = max(abs(p.y + o) - .003, length(p.xz) - a + cos(o * 500.) * .02);
  float d1 = smax(p.x - p.z * .2, d, .02);
  d1 = smax(-p.x * .4 + p.z, d1, .02);
  float d2 = smax(p.x + p.z * .3, d, .02);
  d2 = smax(-p.x * .3 - p.z, d2, .02);
  d = smin(d1, d2, .03);
  return d * .7;
}

float finns(vec3 p) {
  float amp = (1. - puff * .3) * .15;
  float t = time*5. + sign(p.y) * .2;
  float l = length(p) * 2.;
  p.y = abs(p.y);
  p += normalize(pos_finn) * (.28 + puff * .05);
  p*=1.3;
  p = lookat(normalize(vec3(-1., -.0, -5.)), vec3(0., 1., 0.)) * p;
  amp *= (1. + length(p) * 5.);
  float a = .2 + cos(t + atan(p.y, p.z) * 2.) * amp * .5;
  float b = 1.2 + puff *1.5 + sin(t - amp) * amp;
  p.zx *= mat2(sin(a), cos(a), -cos(a), sin(a));
  p.yx *= mat2(sin(b), cos(b), -cos(b), sin(b));
  float e = atan(p.y, p.z);
  float o = sin(e * 20.) * .003;
  float r = .45 - smoothstep(1., 3., abs(e)) * .25;
  float d =
      max(abs(p.x + o) - .005, length(p.yz) - r + cos(p.z * 100.) * .01) * .9;
  d = max(-p.y - p.z * .5, d);
  d = max(p.z + p.y * .2, d);
  d = smin(d, length(p) - .04, .04);
  return d * .8;
}

float mouth(vec3 p) {
  p *= dir_mouth;
  float mo = length(p.yz * vec2(.35 + ani_mouth * .1-p.z*2., 1.)) - .02 * (1. + ani_mouth * .4);
  return max(-p.x, mo);
}

float body(vec3 p) {
  float m = smoothstep(0., 1.5, -p.x + 1.3) * .2;
  float s = smoothstep(0., 1.7, -p.x);
  p.z -= puff * .1;
  p.z -= smoothstep(0., p.z*.3 + p.x - .6 + ani_mouth * .1,-.1)*.05;
  p.y *= 1. + pow(abs(p.z - .2), 2.) * 1.5;
  p.z *= 1. - (p.x + .1) * .1;
  p.zy *= 1.+smoothstep(0.,.5,-p.x)*.3;
  float d = length(p*vec3(1.+smoothstep(0.,.5,-p.x+p.z)*.5,1.,1.4)) - .47 - s-puff*.12;
  p += vec3(.14 + puff * .0, .0, .2);
  p.x -= p.z*.5;
  p.z += puff * .1;
  d = smin(d, length(p * vec3(0.6, 1.2, 1.7)) - .55 + m, .2) + .1;
  d+=smoothstep(0.,.7,-p.x)*.05;
  return (d+.05) * .7;
}

float eye(vec3 p) {
	float d = length(p) - .13;
    return d;
}

// Main DE function
float de(vec3 p) {
  beye = 0.;
  heye = 0.;
  weye = step(0., p.y);
  hmouth = 0.;
  hfinns = 0.;
  htail = 0.;
  p.y *= 1.15;
  vec3 rp = p;
  p.y = abs(p.y);
  mat2 rotbod=rot2D(smoothstep(0., 1.3, -p.x + .2) * ani_tail * 25.);
  rp.xy *= rotbod;
  rp.zy *= rotbod;
  float t = time * 10.;
  p += sin(p * 20. + t) * .002;
  float fi = finn(rp);
  float fis = finns(rp);
  float ta = tail(rp);
  float mo = mouth(p);
  float sk = skin(rp);
  float res = (body(rp) - thorns(rp) * (.01 + puff * .1)) * .8 - sk;
  res += spiral(rp, -pos_eyes + vec3(0.1, 1., -0.3))*.4;
  rp.y = abs(rp.y);
  float eyeh = eye(rp + pos_eyes * .9);
  float eyes = eye(rp + pos_eyes);
  res = smax(res, -mo, .013);
  res = smin(res, eyes, .02);
  res = smin(res, eyeh, .035);
  res = smin(res, fis, .02);
  res = smin(res, fi, .02);
  res = smin(res, ta, .03);
  beye = abs(res - eyes);
  heye = 1.-step(.005, beye);
  hfinns = 1.-step(.005,abs(res-fi));
  hfinns = max(hfinns,1.-step(.005,abs(res-fis)));
  htail = 1.-step(.02, abs(res-ta));
  hmouth = 1.-step(.01, abs(res-mo));
  return res;
}

// PUFFY'S COLORING FUNCTIONS

vec3 color_eyes(vec3 p, vec3 n) {
  vec3 p1 = p + pos_eyes;
  vec3 p2 = p + vec3(pos_eyes.x, -pos_eyes.y, pos_eyes.z);
  vec3 l = p1;
  vec3 c = vec3(1.);
  p1 = lookat(dir_eye, vec3(0., 1., .5)) * p1;
  p2 = lookat(dir_eye, vec3(0., 1., -.5)) * p2;
  p1.y -= .01;
  p2.y += .01;
  c -= smoothstep(.07, .085, length(p1.xy) + 1. - weye) * (.4 + col_eyes * 1.5);
  c -= smoothstep(.07, .085, length(p2.xy) + weye) * (.4 + col_eyes * 1.5);
  c *= smoothstep(.03 + sin(atan(p1.x, p1.y) * 25.) * .02, .07, length(p1.xy) + 1. - weye);
  c *= smoothstep(.03 + sin(atan(p2.x, p2.y) * 25.) * .02, .07, length(p2.xy) + weye);
  return mix(c, -col_fish_1 - .2, smoothstep(.0, .0055, beye));
}

vec3 color(vec3 p, vec3 n) {
  float c=.1+max(0.,p.x*3.);
  float th=pow(max(0.,.2-abs(thorns(p)))/.2,3.);
  vec3 col = mix(col_fish_1, col_fish_2, c);
  col=mix(col_fish_1, col, .3+th*.7);
  if (heye > 0.)
    col = color_eyes(p, n);
  if (hmouth > 0.)
    col = col_fish_2 - .03;
  if (hfinns > 0.)
    col = mix(col_fish_1, col_fish_2 + .15,
              smoothstep(.37, .5, length(p+vec3(0.,0.,.05)) - puff * .05));
  if (htail > 0.)
    col = mix(col_fish_1, col_fish_2 + .2,
              smoothstep(.6, .75, length(p) - puff * .1));
  return abs(col);
}

// BACKGROUND AND FOREGROUND FRACTAL

float fractal(vec3 p) {
  p += cos(p.z * 3. + time * 4.) * .02;
  float depth = smoothstep(0., 6., -p.z + 5.);
  p *= .3;
  p = abs(2. - mod(p + vec3(0.4, 0.7, time * .07), 4.));
  float ls = 0.;
  float c = 0.;
  for (int i = 0; i < 6; i++) {
    p = abs(p) / min(dot(p, p), 1.) - .9;
    float l = length(p);
    c += abs(l - ls);
    ls = l;
  }
  return .15 + smoothstep(0., 50., c) * depth * 4.;
}

// NORMALS AND LIGHTING

vec3 normal(vec3 p) {
  vec3 e = vec3(0.0, det * 2., 0.0);

  return normalize(vec3(de(p + e.yxx) - de(p - e.yxx),
                        de(p + e.xyx) - de(p - e.xyx),
                        de(p + e.xxy) - de(p - e.xxy)));
}

float shadow(vec3 pos) {
  float sh = 1.0;
  float totdist = det * 30.;
  float d = 10.;
  for (int i = 0; i < 8; i++) {
    if (d > det) {
      vec3 p = pos - totdist * dir_light;
      d = de(p);
      sh = min(sh, 20. * d / totdist);
      totdist += d;
    }
  }
  return clamp(sh, 0.0, 1.0);
}

float light(vec3 p, vec3 dir, vec3 n, float shw) {
  float dif = pow(max(0., dot(dir_light, -n)), 3.);
  float amb = pow(max(0., dot(dir, -n)), 3.);
  return dif * .7 * shw + amb * .2 + .15;
}

// RAY MARCHING AND SHADING

vec3 march(vec3 from, vec3 dir) {
  vec3 odir = dir;
  vec3 p = from + dir * 2.;
  float fg = fractal(p + dir) * .55;
  vec3 col = vec3(0.);
  float totdist = 0.;
  float d;
  float v = 0.;
  cmouth = 1.;
  for (int i = 0; i < 80; i++) {
    p = from + totdist * dir;
    d = de(p);
    if (d < det || totdist > maxdist)
      break;
    totdist += d;
    v += max(0., .1 - d) / .1;
  }
  float fade = smoothstep(maxdist * .2, maxdist * .9, maxdist - totdist);
  float ref = 1.;
  float eyes_ref = heye;
  float shw = 1.;
  if (d < det * 2.) {
    p -= (det - d) * dir;
    vec3 n = normal(p);
    col = color(p, n) * (.1 + .9 * cmouth);
    shw = shadow(p);
    col *= light(p, dir, n, shw);
    from = p - det * dir * 3.;
    dir = reflect(dir, n);
    ref = fade * (.3 * cmouth + eyes_ref * .2);
    col = mix(col_water * .15, col, fade);
  }
  col *= normalize(col_water + 1.5) * 1.7;
  p = maxdist * dir;
  vec3 bk = fractal(p) * ref * col_water;
  float glow = pow(max(0., dot(dir, -dir_light)), 1.5+eyes_ref*1.5);
  vec3 glow_water = normalize(col_water+1.);
  bk += glow_water*(glow*(1.-eyes_ref*.7) + pow(glow, 8.) * 1.5) * shw * cmouth * ref;
  col += v * .06 * glow * ref * glow_water;
  col += bk + fg * col_water;
  return col;
}

// MAIN

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
  // Set globals
  time = mod(iTime, 600.);
  ani_mouth = sin(time * 6.);
  puff = -.03+.5*smoothstep(.945, .95, abs(sin(time * .1)))+ani_mouth*.04;
  pos_finn = normalize(vec3(0.35, -1, 0.));
  pos_eyes = vec3(-1., -1.1, 1.) * .12;
  //pos_eyes*=1.+vec3(-1.,1.,0.)*puff*.05;
  dir_light = normalize(vec3(-.3, 0.2, 1.));
  dir_mouth = lookat(normalize(vec3(-.4-puff*.1+ani_mouth*.03, 0., -1.)), vec3(0., 1., 0.));
  tim_tail = time * 2.;
  ani_tail = cos(tim_tail);

  // Pixel coordinates
  vec2 uv = fragCoord / iResolution.xy - .5;
  vec2 uv2 = uv;
  float ar = iResolution.x / iResolution.y; 
  uv.x *= ar;

  // Camera
  vec2 mouse = (iMouse.xy / iResolution.xy - .5) * 4.;
  float tcam = (time+67.)*.05;
  float zcam = smoothstep(.7, 1., cos(tcam)) * 1.8 - .3;
  zcam -= smoothstep(.7, 1., -cos(tcam)) * 1.6;
  if (iMouse.z < .1) mouse = vec2(sin(time * .15)*ar, zcam);
  vec3 dir = normalize(vec3(uv, .9));
  vec3 from = vec3(1., 0., -0.5 + mouse.y) * 1.25;
  from.xy *= rot2D(-mouse.x * 40.);
  dir = lookat(normalize(-from+vec3(sin(time*.5)*.3,cos(time*.25)*.1,0.)), vec3(0., 0., -1.)) * dir;

  // Eyes direction
  dir_eye = normalize(from);
  //dir_eye.x = max(dir_eye.x, pos_eyes.x - .5);
  dir_eye.y = min(abs(dir_eye.y), pos_eyes.y*sign(dir_eye.y)+.5*sign(dir_eye.y));
  dir_eye.z = min(dir_eye.z, pos_eyes.z - .5);

  // March and color
  vec3 col = march(from, dir);
  col *= vec3(1.1, .9, .8);
  col += dot(uv2, uv2) * vec3(0., 0.6, 1.) * .8;

  // Output to screen
  fragColor = vec4(col, 1.);
}

// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
