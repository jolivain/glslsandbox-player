// bubblegum by Kabuto. based on code from @ahnqqq (raymarcher) and Ian McEwan, Ashima Arts (simplex noise)

# ifdef GL_ES
precision mediump float;
# endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Start simplex noise

	//
	// Description : Array and textureless GLSL 2D/3D/4D simplex
	// noise functions.
	// Author : Ian McEwan, Ashima Arts.
	// Maintainer : ijm
	// Lastmod : 20110822 (ijm)
	// License : Copyright (C) 2011 Ashima Arts. All rights reserved.
	// Distributed under the MIT License. See LICENSE file.
	// https://github.com/ashima/webgl-noise
	//
	// Modified by Kabuto to return the derivative as well
	//
	
	
	vec4 permute(vec4 x) {
	     return mod(((x*34.0)+1.0)*x, 289.0);
	}
	
	vec4 taylorInvSqrt(vec4 r)
	{
	  return 1.79284291400159 - 0.85373472095314 * r;
	}
	
	// modified perlin noise, giving value in w and derivative in xyz
	vec4 snoise(vec3 v)
	  {
	  const vec2 C = vec2(1.0/6.0, 1.0/3.0) ;
	  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
	
	// First corner
	  vec3 i = floor(v + dot(v, C.yyy) );
	  vec3 x0 = v - i + dot(i, C.xxx) ;
	
	// Other corners
	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min( g.xyz, l.zxy );
	  vec3 i2 = max( g.xyz, l.zxy );
	
	  // x0 = x0 - 0.0 + 0.0 * C.xxx;
	  // x1 = x0 - i1 + 1.0 * C.xxx;
	  // x2 = x0 - i2 + 2.0 * C.xxx;
	  // x3 = x0 - 1.0 + 3.0 * C.xxx;
	  vec3 x1 = x0 - i1 + C.xxx;
	  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
	  vec3 x3 = x0 - D.yyy; // -1.0+3.0*C.x = -0.5 = -D.y
	
	// Permutations
	  i = mod(i,289.0);
	  vec4 p = permute( permute( permute(
		     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
		   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
		   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
	
	// Gradients: 7x7 points over a square, mapped onto an octahedron.
	// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
	  float n_ = 0.142857142857; // 1.0/7.0
	  vec3 ns = n_ * D.wyz - D.xzx;
	
	  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p,7*7)
	
	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_ ); // mod(j,N)
	
	  vec4 x = x_ *ns.x + ns.yyyy;
	  vec4 y = y_ *ns.x + ns.yyyy;
	  vec4 h = 1.0 - abs(x) - abs(y);
	
	  vec4 b0 = vec4( x.xy, y.xy );
	  vec4 b1 = vec4( x.zw, y.zw );
	
	  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
	  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
	  vec4 s0 = floor(b0)*2.0 + 1.0;
	  vec4 s1 = floor(b1)*2.0 + 1.0;
	  vec4 sh = -step(h, vec4(0.0));
	
	  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
	
	  vec3 p0 = vec3(a0.xy,h.x);
	  vec3 p1 = vec3(a0.zw,h.y);
	  vec3 p2 = vec3(a1.xy,h.z);
	  vec3 p3 = vec3(a1.zw,h.w);
	
	//Normalise gradients
	  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	  p0 *= norm.x;
	  p1 *= norm.y;
	  p2 *= norm.z;
	  p3 *= norm.w;
	
	// Mix final noise value
	  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	  m = m * m;
	  float w = 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
		  
	// derivatives
	  vec3 dx = vec3(0.001, 0, 0);
	  vec4 mx = max(0.6 - vec4(dot(x0+dx,x0+dx), dot(x1+dx,x1+dx), dot(x2+dx,x2+dx), dot(x3+dx,x3+dx)), 0.0);
	  mx = mx * mx;
	  float wx = 42.0 * dot( mx*mx, vec4( dot(p0,x0+dx), dot(p1,x1+dx), dot(p2,x2+dx), dot(p3,x3+dx) ) );

	  vec3 dy = vec3(0, 0.001, 0);
	  vec4 my = max(0.6 - vec4(dot(x0+dy,x0+dy), dot(x1+dy,x1+dy), dot(x2+dy,x2+dy), dot(x3+dy,x3+dy)), 0.0);
	  my = my * my;
	  float wy = 42.0 * dot( my*my, vec4( dot(p0,x0+dy), dot(p1,x1+dy), dot(p2,x2+dy), dot(p3,x3+dy) ) );

	  vec3 dz = vec3(0, 0, 0.001);
	  vec4 mz = max(0.6 - vec4(dot(x0+dz,x0+dz), dot(x1+dz,x1+dz), dot(x2+dz,x2+dz), dot(x3+dz,x3+dz)), 0.0);
	  mz = mz * mz;
	  float wz = 42.0 * dot( mz*mz, vec4( dot(p0,x0+dz), dot(p1,x1+dz), dot(p2,x2+dz), dot(p3,x3+dz) ) );
		  
	return vec4((wx-w)*1000.0, (wy-w)*1000.0, (wz-w)*1000.0, w);
	  }

// End simplex noise


const vec3 diffuse = vec3( .5, .75, 1. );
const vec3 eps = vec3( .001, 0., 0. );
const int iter = 100;

vec4 c( vec3 p )
{
	vec4 v = snoise(p*0.5) + vec4(-2.0*p.x, -2.0*p.y, 0.0, 1.0)/(p.x*p.x+p.y*p.y+1.0);
	return vec4(v.xyz, abs(v.w) + 0.01);
}

void main()
{
	float r = resolution.x / resolution.y;
	vec2 p = gl_FragCoord.xy / resolution * 2. - 1.;
	vec2 m = mouse-0.5;
	p.x *= r;
	m.x *= r;
	
	vec3 o = vec3( 0., 0., time );
	vec3 s = vec3( m, 0. );
	vec3 b = vec3( 0., 0., 0. );
	vec3 d = vec3( p, 1. ) / 32.;
	vec3 t = vec3( .5 );
	vec3 a;
	
	vec3 light = o + vec3(0,0,2.5);
	
	for( int i = 0; i < iter; ++i )
	{
		vec3 v = b+s+o;
		vec4 hv = c(v);
		float h = hv.w;
		b += h * 6.0 * d;
		float d = v.z*0.7;
		float dist = dot(v-light, v-light);
		float mx = min(dist, 1.0);
		t += (pow(max(0.0,dot(normalize(reflect(light-v, normalize(hv.xyz))), normalize(b))), 34.0) + abs(dot(normalize(hv.xyz), light-v))*0.1 * (normalize(hv.xyz)+1.0)) * pow(h, -1.2) * 0.1 * float(iter-i);
	}
	t = t / float(iter*iter);

	gl_FragColor = vec4( sqrt(t), 1. );
}


