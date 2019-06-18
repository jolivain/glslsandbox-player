/*
 * Original shader from: https://www.shadertoy.com/view/tssGRX
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
#define t mod(iTime, 100.)*4.
#define sat(v) clamp(v, 0., 1.)
#define spow(v, p) clamp(pow(v, p), 0., 1.)

const float pi = acos(-1.);
const int MAX_ITER = 100;
const float MAX_DIST = 40.;

struct ray {
  vec3 o, d;
};

struct material {
  vec3 diffuse, specular;
  float shine;
};

vec2 repeat(vec2 p, float n) { return mod(p-.5*n, n)-.5*n; }
float vmax(vec3 v) { return max(max(v.x, v.y), v.z); }
mat2 rot(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }

float torus(vec3 p, vec2 c) {
  vec2 q = vec2(length(p.xz)-c.x, p.y);
  return length(q)-c.y;
}

float dist(vec3 p) {
  vec3 sp = p;
  sp.xy = repeat(p.xy, 2.);
  sp.xz = repeat(p.xz, 4.8);
  sp.xz *= rot(t+p.y*8.)+.2*sin(t*.4);
  sp.xy *= rot(pi/2.);

  return torus(sp, vec2(1., .5));
}

ray camera(vec2 uv, vec3 eye, vec3 target, float zoom) {
  ray r;
  r.o = eye;
  vec3 f = normalize(target - eye);
  vec3 s = cross(vec3(0,1,0), f);
  vec3 u = cross(f, s);
  vec3 i = (eye + f*zoom) + uv.x*s + uv.y*u;
  r.d = normalize(i-eye);
  return r;
}

vec2 march(ray r) {
  float d = 0.;
  for(int i=0; i<MAX_ITER*5; i++) {
    float h = dist(r.o+r.d*d)*.1;
    if(h<0.001*d || d>MAX_DIST) return vec2(d,i);
    d+=h;
  }
  return vec2(d,MAX_ITER);
}


vec3 norm(vec3 p) {
  vec2 e = vec2(-0.001, 0.001);
  return normalize(e.xyy*dist(p+e.xyy) + e.yxy*dist(p+e.yxy) + e.yyx*dist(p+e.yyx) + e.xxx*dist(p+e.xxx));
}

vec3 phong(vec3 p, material m, vec3 eye, vec3 lightPos) {
  vec3 n = norm(p);
  vec3 l = normalize(lightPos-p);
  vec3 v = normalize(eye - p);
  vec3 rf = normalize(reflect(-l, n));

  vec3 diff = m.diffuse * max(0., dot(n, l));
  vec3 spec = m.specular * max(0., pow(dot(rf, v), m.shine));

  return diff + spec;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  vec2 ruv = uv * (1.-uv);
  float vig = pow(ruv.x*ruv.y * 15., .8);;
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1.);

  uv *= 1.+length(uv)*2.;

  uv.y = abs(uv.y);
  vec3 eye = vec3(0,1,-2);
  eye.xz += .1*vec2(sin(cos(t*.05)*8.), cos(sin(t*.04)*12.));
  vec3 target = vec3(0.,1.+2.*sin(t*.1),0.);

  ray r = camera(uv, eye, target, .3+sin(t*.2)*.04);
  vec2 m = march(r);
  if(m.x > MAX_DIST) {
    fragColor = vec4(0.);
    return;
  }

  vec3 p = r.o+r.d*m.x;

  float halo = spow(.5*m.y/float(MAX_ITER), 2.);

  vec3 lightPos = vec3(3,3,-3);
  lightPos.xz += 20.*vec2(sin(t*.25), cos(t*.5));

  material mta;
  mta.diffuse = vec3(.14, .3, .9);
  mta.specular = vec3(1, 0, 0);
  mta.shine = 5.;

  vec3 color = phong(p, mta, eye, lightPos );
  color *= halo*20.;
  color = color*sat(exp(-m.y)) + color*halo;

  color *= vig;
  fragColor = vec4(pow(color, vec3(1./2.2)), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
