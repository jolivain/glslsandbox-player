/*
 * Original shader from: https://www.shadertoy.com/view/wdXSWn
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
// Crypt Roots
// Ray marching improvised geometry with curvy shapes and rock textures
// Exploring level of details, materials and lights
// Licensed under hippie love conspiracy
// Leon Denise (ponk) 2019.02.24

// Using code from

// Inigo Quilez
// https://www.shadertoy.com/view/Xds3zN

// Morgan McGuire
// https://www.shadertoy.com/view/4dS3Wd

#define repeat(p,r) (mod(p,r)-r/2.)
const float PI = 3.14159;
mat2 rot (float a) { float c=cos(a), s=sin(a); return mat2(c,s,-s,c); }
float smoothmin (float a, float b, float r) { float h = clamp(.5+.5*(b-a)/r, 0., 1.); return mix(b, a, h)-r*h*(1.-h); }
float random (in vec2 st) { return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123); }
float hash(float n) { return fract(sin(n) * 1e4); }
float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);
    vec3 i = floor(x);
    vec3 f = fract(x);
    float n = dot(i, step);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}
float fbm (vec3 p) {
  float amplitude = 0.5;
  float result = 0.0;
  for (float index = 0.0; index <= 3.0; ++index) {
    result += noise(p / amplitude) * amplitude;
    amplitude /= 2.;
  }
  return result;
}
vec3 look (vec3 eye, vec3 target, vec2 anchor) {
    vec3 forward = normalize(target-eye);
    vec3 right = normalize(cross(forward, vec3(0,1,0)));
    vec3 up = normalize(cross(right, forward));
    return normalize(forward + right * anchor.x + up * anchor.y);
}
void moda(inout vec2 p, float repetitions) {
	float angle = 2.*PI/repetitions;
	float a = atan(p.y, p.x) + angle/2.;
	a = mod(a,angle) - angle/2.;
	p = vec2(cos(a), sin(a))*length(p);
}

float map (vec3 pos) {
  float chilly = noise(pos * 2.);
  float salty = fbm(pos*20.);
  
  pos.z -= salty*.04;
  salty = smoothstep(.3, 1., salty);
  pos.z += salty*.04;
  pos.xy -= (chilly*2.-1.) * .2;
    
  vec3 p = pos;
  vec2 cell = vec2(1., .5);
  vec2 id = floor(p.xz/cell);
  p.xy *= rot(id.y * .5);
  p.y += sin(p.x + .5);
  p.xz = repeat(p.xz, cell);
    
  vec3 pp = p;
  moda(p.yz, 5.0);
  p.y -= .1;
  float scene = length(p.yz)-.02;
    
  vec3 ppp = pos;
  pp.xz *= rot(pp.y * 5.);
  ppp = repeat(ppp, .1);
  moda(pp.xz, 3.0);
  pp.x -= .04 + .02*sin(pp.y*5.);
  scene = smoothmin(length(pp.xz)-.01, scene, .2);

  p = pos;
  p.xy *= rot(-p.z);
  moda(p.xy, 8.0);
  p.x -= .7;
  p.xy *= rot(p.z*8.);
  p.xy = abs(p.xy)-.02;
  scene = smoothmin(scene, length(p.xy)-.005, .2);

  return scene;
}

vec3 getNormal (vec3 pos) {
  vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
  return normalize( e.xyy*map( pos + e.xyy ) + e.yyx*map( pos + e.yyx ) + e.yxy*map( pos + e.yxy ) + e.xxx*map( pos + e.xxx ) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = (fragCoord.xy-0.5*iResolution.xy)/iResolution.y;
  vec3 eye = vec3(.1,.1,-iTime*.1-4.);
  vec3 at = vec3(0,0,eye.z-2.0);
  vec3 ray = look(eye, at, uv);
  vec3 pos = eye;
  float dither = random(uv+fract(iTime));
  float total = dither * .2;
  float shade = 0.0;
  const float count = 60.0;
  for (float index = count; index > 0.0; --index) {
    pos = eye + ray * total;
    float dist = map(pos);
    if (dist < 0.001 + total * .003) {
      shade = index / count;
      break;
    }
    dist *= 0.5 + 0.1 * dither;
    total += dist;
  }
  vec3 normal = getNormal(pos);
  vec3 color = vec3(0);
  color += smoothstep(.3, .6, fbm(pos*100.)) * .2;
  color += vec3(0.839, 1, 1) * pow(clamp(dot(normal, normalize(vec3(0,2,1))), 0.0, 1.0), 4.);
  color += vec3(1, 0.725, 0.580) * pow(clamp(dot(normal, -normalize(pos-at)), 0.0, 1.0), 4.);
  color += vec3(0.972, 1, 0.839) * pow(clamp(dot(normal, normalize(vec3(4,0,1))), 0.0, 1.0), 4.);
  color += vec3(0.972, 1, 0.839) * pow(clamp(dot(normal, normalize(vec3(-5,0,1)))*.5+.5, 0.0, 1.0), 4.);
  color = mix(vec3(0), color, clamp(dot(normal, -ray), 0.0, 1.0));
  color *= pow(shade, 1.0/1.2);
  fragColor = vec4(color, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
