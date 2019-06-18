/*
 * Original shader from: https://www.shadertoy.com/view/lsyczW
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

// --------[ Original ShaderToy begins here ]---------- //
#define saturate(x) clamp(x, 0.0, 1.0)
#define lerp(x, y, t) mix(x, y, t)

float body(vec3 p)
{
  p.x *= 0.6;
  float d1 = length(p.xy) - 0.4;
  p.y -= 0.5;
  float d2 = length(p.xy) - 0.18;
  float d = lerp(d1, d2, saturate((p.y + 0.9) * 0.8));
  d = max(d, abs(p.z) - 0.1);  
  return d;
}

float neck(vec3 p, out float id)
{ 
  id = 1.0;
  p.y -= 1.0;
  float t = min(p.y + 0.7, 1.21);
  float h = saturate(p.y + 0.7 - 1.21);
  p.z -= 0.114 - saturate(t) * 0.02 - h * 0.15;
  if (p.z > -0.012) id = 2.0;
  p.x *= (1.0 + 0.3 * t) - min(12.0 * h, 0.4 + h);
  p.y *= (1.0 + h * abs(p.x));
  float s = clamp((t - 0.32) * 10.0, 0.3, 1.0);
  float d = length(p.xz * vec2(1.0, s)) - 0.05;
  p.z += 0.3;
  s = mod(pow(t, 0.48) + 2.005, 0.036) - 0.002;
  s = saturate(0.004 - s * s * 800.0 * t);
  if (s > 0.0 && p.z > 0.3) id = 3.0;
  p.z -= s;
  d = max(d, length(p.xz) - 0.3);
  d = max(d, abs(p.y) - 0.74);  
  return d * 0.7;
}

float inner(vec3 p)
{
  p.y -= 0.32;
  float d1 = max(length(p.xy) - 0.1, -p.z);
  float d2 = max(length(p.xy) - 0.2, abs(p.z) - 0.09);
  return min(d1, d2);  
}

float bridge(vec3 p, out float id)
{
  id = 1.0;
  p.y += 0.06;
  p.z += clamp(abs(p.x) * 0.12, 0.01, 0.02) - 0.11;
  float d = length(max(abs(p) - vec3(0.15, 0.02, 0.02), 0.0)) * 0.9;
  float d2 = length(max(abs(p - vec3(0, 0.012, 0)) - vec3(0.07, 0.003, 0.027), 0.0));
  if (d2 < d) {d = d2; id = 2.0;}
  if (abs(p.x) > 0.06) return d;
  p.x = mod(p.x + 2.0, 0.02) - 0.01;
  p.z -= 0.025;
  float d3 = length(p.xyz) - 0.005;
  if (d3 < d) {d = d3; id = 3.0;}  
  return d;
}

float screws(vec3 p)
{
  float t = min(p.y - 1.53, 0.18);
  if (t < 0.0) return 1e3;
  p.z -= 0.075 - 0.15 * t;
  p.y = mod(t - p.z * 0.2, 0.06) - 0.03;
  p.x = abs(p.x) - 0.033;
  float r = p.z < 0.0 ? 0.01 : 0.005;
  float d = max(length(p.xy) - r, abs(p.z) - 0.035);
  d = min(d, max(length(p.xy) - 0.009, abs(p.z) - 0.02));
  p.z += 0.024;
  d = min(d, max(length(p.yz) - 0.004, abs(p.x) - 0.03));

  // handle
  p.x -= 0.02 + 0.05 * t;
  float h = length(p.xyz) - 0.014;
  p.x -= 0.01;
  h = max(h, length(max(abs(p.xyz) - vec3(0.01, 0.01, 0.004), 0.0)));
  d = min(d, h);
  return d * 0.9;
}

float strings(vec3 p)
{
  p.y -= 0.72;
  float t = min(p.y + 0.785, 1.57);
  p.x *= (1.0 + 0.4 * t);
  if (abs(p.x) > 0.06) return 1e3;
  
  float f = saturate(p.y - 0.78);
  if (p.y > 0.0) p.y *= 0.65 + 3.6 * abs(p.x);
  p.x += clamp(-sign(p.x) * 0.2 * f, -abs(p.x), abs(p.x));
  p.z += 0.15 * f;
  
  float r = 0.0006 - p.x * 0.006;
  p.z -= 0.125 - 0.015 * t;
  p.x = mod(p.x + 2.0, 0.02) - 0.01;
  float d = length(p.xz) - r;
  d = max(d, abs(p.y) - 0.785);
  return d;
}

vec2 DE(vec3 p)
{
  // bounding box
  vec3 bb = saturate(abs(p.xyz) - vec3(0.5, 2, 0.3));
  if (bb.x > 0.0 || bb.y > 0.0 || bb.z > 0.0) return vec2(length(bb) + 0.01, -1);
 
  float d = body(p);
  float id = 1.0;
  float sid = 0.0;
  float t = neck(p, sid);
  if (t < d) {d = t; id = 2.0 + sid * 0.1;}
  t = -inner(p);
  if (t > d) {d = t; id = 3.0;}
  t = bridge(p, sid);
  if (t < d) {d = t; id = 4.0 + sid * 0.1;}
  t = screws(p);
  if (t < d) {d = t; id = 5.0;}
  t = strings(p);
  if (t < d) {d = t; id = 6.0;}  
  return vec2(d, id);
}

vec4 ray_marching(vec3 ro,  vec3 rd)
{
  vec3 p = ro;
  for (int i = 0; i < 64; ++i)
  {
    vec2 d = DE(p);
    p += d.x * rd;
    if (d.x < 0.0001) return vec4(p, d.y);
  }
 
  float t = (-0.4 - ro.y) / rd.y;
  vec3 floorp = ro + t * rd;
  if (t > 0.0) return vec4(floorp, 0.0);
  return vec4(ro, -1);
}

vec3 brdf(vec3 diff, float m, vec3 N, vec3 L, vec3 V)
{
  vec3 H = normalize(V + L);
  vec3 F = vec3(0.05 + 0.95 * pow(1.0 - dot(V, H), 5.0));
  vec3 R = F * pow(max(dot(N, H), 0.0), m);
  return diff + R * (m + 8.0) / 8.0;
}

float hash(float n)
{
  return fract(sin(n) * 43758.5453);
}

float qnoise(in vec3 x)
{
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float n = p.x + p.y * 57.0 + 113.0 * p.z;
  float res = lerp(lerp(lerp(hash(n+  0.0), hash(n+  1.0),f.x),
                        lerp(hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                   lerp(lerp(hash(n+113.0), hash(n+114.0),f.x),
                        lerp(hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
  return res;
}


vec4 shade(vec3 ro, vec3 rd)
{
  vec4 rm = ray_marching(ro, rd);
  if (rm.w < 0.0) return vec4(0, 0, 0, 0);
    
  vec3 p = rm.xyz;
  float k = DE(p).x;
  float gx = DE(p + vec3(1e-5, 0, 0)).x - k;
  float gy = DE(p + vec3(0, 1e-5, 0)).x - k;
  float gz = DE(p + vec3(0, 0, 1e-5)).x - k;
  vec3 N = normalize(vec3(gx, gy, gz));
 
  float ao = 0.0;
  ao += DE(p + 0.01 * N).x * 50.0;
  ao += DE(p + 0.02 * N).x * 10.0;

  vec3 L = normalize(vec3(-0.1, 1, 1));
  float sr = ray_marching(p + 0.001 * L, L).w;
  float shadow = sr > 0.0 ? 0.0 : 1.0;
 
  vec3 diff = vec3(0.6);
  float m = 10.0;
  if (rm.w < 0.9) // floor
  {
    shadow = saturate(0.4 + 0.6 * shadow + 0.3 * length(p.xz));
	return vec4(vec3(0.0), 1.0 - shadow);
  }
  if (rm.w < 1.9) // body
  {
    vec3 C = vec3(0.32, 0.24, 0.08);
    float s = length(p.xy - vec2(0, 0.32));
    if (abs(s - 0.12) < 0.008) C = vec3(0.01, 0.004, 0);
    
    diff = lerp(vec3(0.02, 0.008, 0.001), C, saturate(N.z));
    float r = qnoise(200.0 * p.xzz + 2.0 * qnoise(5.0 * p.yyz));
    diff *= (r * 0.3 + 0.7);
    if (abs(abs(p.z) - 0.08) < 0.005) diff = vec3(0.4);
  }
  else if (rm.w < 2.25) // neck
  {
    diff = vec3(0.3, 0.18, 0.1) * (0.7 + qnoise(300.0 * p) * 0.3);
    if (rm.w > 2.15) diff *= 0.3;
  }
  else if (rm.w < 2.9)
  {
    diff = vec3(0.8, 0.6, 0.4);
    m = 80.0;
  }
  else if (rm.w < 3.9) // inner
  {
    diff = vec3(0.25, 0.2, 0.15) * (0.5 + 0.5 * qnoise(400.0 * p.xzz));
  }
  else if (rm.w < 4.15) // bridge
  {
    diff = vec3(0);
  }
  else if (rm.w < 4.25)
  {
    diff = vec3(0.6);
  }
  else if (rm.w < 4.35)
  {
    diff = vec3(0.04);
    m = 80.0;
  }
  else if (rm.w < 5.9) // screws
  {
    m = 50.0;
  }
  else // strings
  {
    m = 50.0;
  }
  vec3 f = brdf(diff, m, N, L, -rd);

  vec3 D = vec3(3.0);
  vec3 A = vec3(0.8);
  vec3 C = (D * saturate(dot(N, L)) * f * shadow + A * diff) * ao;
  return vec4(C, 1);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord.xy / iResolution.xy;

  vec3 p = vec3((uv * 2.0 - 1.0), 0.0);
  p.xy *= vec2(iResolution.x / iResolution.y, 1.0);
 
  vec3 param = vec3(iTime * 0.2, 0.3, 7);
  vec4 rot;
  rot.x = sin(param.x);
  rot.y = cos(param.x);
  rot.z = sin(param.y);
  rot.w = cos(param.y);
  
  vec3 rt = vec3(0, 0.6, 0);
  vec3 ro = vec3(rot.x * rot.w, abs(rot.y) * rot.z, rot.y);
  ro = ro * param.z;
  
  vec3 cd = normalize(rt - ro);
  vec3 cr = normalize(cross(cd, vec3(0, 1, 0)));
  vec3 cu = cross(cr, cd);
 
  vec3 rd = normalize(p.x * cr + p.y * cu + 5.0 * cd);
  vec4 radiance = shade(ro, rd);
  
  
  float len2 = dot(p, p);
  vec3 col = vec3(0.2, 0.22, 0.22) / (1.0 + len2 * len2 * 0.6);	
	
  col = lerp(col, radiance.rgb, radiance.a);
  fragColor = vec4(pow(col, vec3(0.45)), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
