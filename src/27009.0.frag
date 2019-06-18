// Daniel Varga
// Newton-fractal for a time-dependent 4th degree polynomial.
// Based on modified Newton Fractal 1-z^3 by @hintz

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float TD = 0.5;

// for pretty colors
vec4 hsv2rgb(vec3 col)
{
    float iH = floor(mod(col.x,1.0)*6.0);
    float fH = mod(col.x,1.0)*6.0-iH;
    float p = col.z*(1.0-col.y);
    float q = col.z*(1.0-fH*col.y);
    float t = col.z*(1.0-(1.0-fH)*col.y);
  
  if (iH==0.0)
  {
    return vec4(col.z, t, p, 1.0);
  }
  if (iH==1.0)
  {
    return vec4(q, col.z, p, 1.0);
  }
  if (iH==2.0)
  {
    return vec4(p, col.z, t, 1.0);
  }
  if (iH==3.0)
  {
    return vec4(p, q, col.z, 1.0);
  }
  if (iH==4.0)
  {
    return vec4(t, p, col.z, 1.0);
  }
  
  return vec4(col.z, p, q, 1.0); 
}

// complex number math functions
vec2 mul(vec2 a, vec2 b)
{
  return vec2(a.x*b.x - a.y*b.y, a.y*b.x + a.x*b.y);
}

vec2 div(vec2 a, vec2 b)
{
  return vec2((a.x*b.x + a.y*b.y)/(b.x*b.x + b.y*b.y), (a.y*b.x - a.x*b.y)/(b.x*b.x + b.y*b.y));
}

vec2 exponential(vec2 a, float b)
{
  float r = pow(length(a),b);
  float s = b*atan(a.y,a.x);
  return vec2(r*cos(s),r*sin(s));
}

// Any function 
vec2 f(vec2 z)
{
  // return exponential(z,sin(time)*5.+8.)-1.;
  vec2 p = vec2(sin(time*TD),cos(time*TD));
  p = mul(p,z);
  p = p+vec2(sin(time*TD),cos(2.*time*TD));
  p = mul(p,z);
  p = p;//+vec2(sin(time*TD+10.)/10.,cos(.4*time*TD+5.)/10.);
  p = mul(p,z);
  p = p+vec2(2.,0.);
  p = mul(p,z);
  p = p+vec2(1.,1.);
  p = mul(p,z);
  p = p+vec2(1.,1.);
  return p;
}

// Newton-Raphson
vec2 iter(vec2 z)
{
  float h = sin(time*TD*0.8)*0.6;//1e-5;
  // Try it with 1.0, it's actually cooler than a faithful Newton-Raphson. It's like a Julia.
  vec2 delta = vec2(h,cos(time*TD*0.9)*0.25);
  // dz = (f(z + complex(h, h)) - f(z)) / complex(h, h)
  // zNext = z - f(z)/dz
  vec2 dz = f(z+delta)-f(z);
  dz = div(dz,delta);
  return z-div(f(z),dz);
}

vec2 newtonfractal(vec2 z)
{
  for (int n=0;n<100;n++)
  {
    vec2 old=z;
    z = iter(z);
   
    vec2 d=z-old;
     
    if (length(d) < 0.03)
    {
      //return vec2(.2,0.8);
      return vec2(atan(z.y,z.x)/3.141592653/2., float(n)*0.025); // Hue based on the direction of z.
      return vec2(z.x+z.y, float(n)*0.025); // Ad hoc coloring based on z, the original by @hintz, optimized for z^3-1.
    }
  }
  
  return vec2(0.,1.);
}

void main(void)
{
  float deltax=8.0+sin(time*TD*1.0)*3.8; // Time-dependent zoom-in-zoom-out.
float deltay = resolution.y/resolution.x * deltax;

float real = deltax*(gl_FragCoord.x/resolution.x-0.5);
float imag = deltay*(gl_FragCoord.y/resolution.y-0.5);
	
  vec2 results = newtonfractal(vec2(real, imag));

  float h = results.x;
  float v = 0.7-results.y;
  float s = 0.7;

  gl_FragColor = hsv2rgb(vec3(h,s,v));
}

