/*
 * Original shader from: https://www.shadertoy.com/view/4dyBzR
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
float bass = 0.0;

/*
float megabass()
{
  float b = 0.0;
  for (int i = 0; i < 16; i++)
    b = max(texelFetch(texFFTIntegrated, i, 0).x, b);
  return b;
}
*/

// THX Flopine and Koltes for formula !
float cyl(vec3 p, float r, float h)
{
  return max(length(p.xz) - r, abs(p.y) - h);
}

float bou(vec3 p)
{
  float d = cyl(p, 0.5, 0.5);
  return min(d, cyl(p - vec3(0.0, 0.8, 0.0), 0.2, 0.3));
}

mat2 rot(float a)
{
  float c = cos(a);
  float s = sin(a);
  return mat2(c, s, -s, c);
}

int prout;

float map(vec3 p)
{
  vec3 per = vec3(3.0);
  ivec3 id = ivec3(p/per);
  vec3 q = mod(p, per) - 0.5 * per;
  q .y += 0.5 * sin(float(p.z));
  q.xy *= rot(float(id.x) * 0.2561 + float(id.y + id.z) + bass);
  q.yz *= rot(float(id.x) * 0.2561 + float(id.y + id.z) + bass);

  prout = id.x + id.y +id.z;
  float d = bou(q); 

  return d;
}

vec3 grad(vec3 p)
{
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(map(p+e.xyy) - map(p-e.xyy), map(p+e.yxy) - map(p-e.yxy), map(p+e.yyx) - map(p-e.yyx)));
}

vec3 rm(vec3 ro, vec3 rd, out float st)
{
     st = 1.0;
  vec3 p = ro;
   for (int i = 0; i < 64; ++i)
    {
    float d = map(p);
    if (abs(d) < 0.01)
    {
      st = float(i) / 64.0;
      break;
    }
    p += rd * 0.7 * d;
  }
  return p;
}

vec3 shade(vec3 p,  vec3 ro, vec3 n, float st)
{
  return vec3(exp(-distance(ro, p) * 0.1)) * vec3(0.5 + 0.5 * cos(float(prout) + bass * 0.1), 0.5 + 0.5 * sin(float(prout) + bass * 0.1), 1.0) * (1.0 - st); //* (n * 0.5 + 0.5);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  bass = iTime;//megabass();
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 finalColor = vec3(0.0);
  for (int i = 0; i < 4; ++i)
  {
    uv.y += 0.01 * cos(bass);
    
  float st;
  vec3 ro = vec3(0.0, 0.0, bass * 5.0);
  vec3 rd = normalize(vec3(uv, normalize(length(uv)) - 0.7));

  rd.xz *= rot(0.1 * bass);

  vec3 p = rm(ro, rd, st);
  vec3 n = grad(p);
  vec3 color = shade(p, ro, n, st);

  vec3 rd2 = reflect(rd, n);
  vec3 ro2 = p + rd2 * 0.01;

  float st2;
  vec3 p2 = rm(ro2, rd2, st2);
  vec3 n2 = grad(p2); 

  color = mix(color, shade(p2, ro, n2, st2), 0.2);
  color = pow(color, vec3(1.0 / 2.2));
   finalColor += color;
  
  }
   fragColor = vec4(finalColor / 4.0, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
