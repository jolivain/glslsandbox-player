#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec2 P)
{
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;

  vec4 i = permute(permute(ix) + iy);

  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
  vec4 gy = abs(gx) - 0.5 ;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;

  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);

  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x;  
  g01 *= norm.y;  
  g10 *= norm.z;  
  g11 *= norm.w;  

  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));

  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}


float fbm(vec2 v) {
	int i;
	float c = 0.0;
	float w = 0.5;
	float s = 2.0;
	
	c = c + pow(w,0.0)*cnoise(v*pow(s,0.0));
	c = c + pow(w,1.0)*cnoise(v*pow(s,1.0));
	c = c + pow(w,2.0)*cnoise(v*pow(s,2.0));
	c = c + pow(w,3.0)*cnoise(v*pow(s,3.0));
	c = c + pow(w,4.0)*cnoise(v*pow(s,4.0));
	c = c + pow(w,5.0)*cnoise(v*pow(s,5.0));
	c = c + pow(w,6.0)*cnoise(v*pow(s,6.0));
	c = c + pow(w,7.0)*cnoise(v*pow(s,7.0));	
	c = c + pow(w,8.0)*cnoise(v*pow(s,8.0));
	//c = c + pow(w,9.0)*cnoise(v*pow(s,9.0));
	//c = c + pow(w,10.0)*cnoise(v*pow(s,10.0));
	
	return c+0.5;
}

void main(void)
{
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 p = uv+1.0;
	vec2 q = vec2(fbm(p), fbm(p+vec2(5.2,1.3)));
	//vec2 r = vec2(fbm(p+4.0*q+vec2(1.7,9.2)), fbm(p+4.0*q+vec2(8.3,2.8)));
	float c;
	//c = fbm(p);
	c = fbm(p+4.0*q+0.2*time);
	//c = fbm(p+1.0*r+0.1*time);
	gl_FragColor = vec4(c-.1, c, c+.1, 1.);
}
