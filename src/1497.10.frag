#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

struct Ray
{
	vec3 Origin;
	vec3 Direction;
};

// minecraft flickers!
// warped by weylandyutani amsterdam 2012
	
// (Kabuto) made this a bit more minecraft-like ;-)	speed-optimized by selectively both blob-based and voxel-based raymarching

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
	float snoise(vec3 v)
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
	 return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
		  
	// derivatives
	 /* vec3 dx = vec3(0.001, 0, 0);
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
		  
	return vec4((wx-w)*100.0, (wy-w)*100.0, (wz-w)*100.0, w);*/
	  }

// End simplex noise
	
#define pi 6.1415
//Landscape
	
float random(vec4 seed)
{
 	return fract(sin(dot(seed.xy ,vec2(12.9898,78.233)) + dot(seed.zw ,vec2(15.2472,93.2541))) * 43758.5453);
}

float floorTo(float value, float factor)
{
 	return floor(value / factor) * factor;
}

vec2 floorTo(vec2 value, vec2 factor)
{
 	return vec2(floorTo(value.x, factor.x), floorTo(value.y, factor.y));
}

float lerp(float x, float X, float amount, bool usecos)
{
	 if(usecos)
	 {
	  	return x + (X - x) * ((cos(amount * pi) - 1.0 ) / -2.0);
	 }
	 else
	 {
	  	return x + (X - x) * amount;
	 }
}

float bilerp(float xy, float Xy, float xY, float XY, vec2 amount, bool usecos)
{
 	float x = lerp(xy, xY, amount.y, usecos);
 	float X = lerp(Xy, XY, amount.y, usecos);
	return lerp(x, X, amount.x, usecos);
}

float getBilerp(vec2 position, vec2 size, float seed, bool usecos)
{
 	vec2 min = floorTo(position, size);
 	vec2 max = min + size;
 
 	return bilerp(random(vec4(min.x, min.y, seed, seed)),
   		random(vec4(max.x, min.y, seed, seed)),
   		random(vec4(min.x, max.y, seed, seed)),
   		random(vec4(max.x, max.y, seed, seed)),
   		(position - min) / size, usecos);
}

vec2 getTunnelCoords(float z) {
	return vec2(cos(z*0.03)*6.0 + cos(z*0.023)*12.0, cos(z*0.02)*6.0);
}

// > 0 -> void, < 0 -> solid. if > 0 it should be the approximate distance to nearest solid.
float ShouldDraw(vec3 voxel)
{	
	vec2 tunnel = getTunnelCoords(voxel.z);
	float tx = voxel.x - tunnel.x;
	float ty = voxel.y - tunnel.y;
	return max(2.-sqrt(tx*tx+ty*ty), (5. + ty*.4 + snoise(voxel*.03)*5. - 1. + snoise(voxel*.01)*12.));
}

//currently returns one of 4 stone types
float getStoneType(vec3 voxel) {
	float s1 = snoise(voxel*.01);
	float s2 = snoise(voxel*.007);
	return mix(sign(s1)*.5+2.5, sign(s2)*.5+.5, step(abs(s1*.2),abs(s2)));
}


void IterateVoxel(inout vec3 voxel, Ray ray, out vec3 hitPoint, out vec3 actual)
{	
	vec3 stp = voxel + step(vec3(0), ray.Direction) - ray.Origin;
	vec3 max = stp / ray.Direction;
	
	if(max.x < min(max.y, max.z)) {
		voxel.x += sign(ray.Direction.x);
		hitPoint = vec3(1,0,0);
		actual = stp.x/ray.Direction.x*ray.Direction + ray.Origin;
	} else if(max.y < max.z) {
		voxel.y += sign(ray.Direction.y);
		hitPoint = vec3(0,1,0);
		actual = stp.y/ray.Direction.y*ray.Direction + ray.Origin;
	} else {
		voxel.z += sign(ray.Direction.z);
		hitPoint = vec3(0,0,1);
		actual = stp.z/ray.Direction.z*ray.Direction + ray.Origin;
	}
}
	
vec3 getColorAt(vec3 voxel, vec3 actual, vec3 hitPoint, Ray ray) {
	const float lightDist = 55.0;
	float lightNum = voxel.z/lightDist+1e-5;
	float lightFrac = fract(lightNum);
	lightNum -= lightFrac;
	float lightZ = lightNum*lightDist;
	vec3 light = vec3(getTunnelCoords(lightZ), lightZ);
	vec3 lv = light-voxel;
	float lvl = length(lv);
	float light2 =( dot( hitPoint, lv )/lvl+1.2) / (lvl*lvl);
	float totallight = light2*(1.-lightFrac);
	
	lightNum += 1.;
	lightZ += lightDist;
	light = vec3(getTunnelCoords(lightZ), lightZ);
	lv = light-voxel;
	lvl = length(lv);
	light2 =( dot( hitPoint, lv )/lvl+1.2) / (lvl*lvl);
	totallight += light2*lightFrac;
	totallight *= 103.;
	totallight += dot(hitPoint*sign(ray.Direction),vec3(0,-1,0))*0.2+0.2 ;
	
	vec2 tex = floor(fract(vec2(dot(hitPoint,actual.zxx),dot(hitPoint,actual.yzy)))*16.);
	
	float stone = getStoneType(voxel)+1.;
	
	vec3 c0 = vec3(0.7+stone*.1,0.7,0.7-stone*.1);
	vec3 c1 = vec3(0.7,0.7,0.7)+vec3(stone-3.5,3.5-stone,-0.3)*step(2.5,stone);
	
	
	float rnd = dot(sin(tex*vec2(3.3-stone*.7,.01+.3*stone)), sin(tex*vec2(3.1+stone,.01+.3*stone)));
	vec3 rndV = max(.2,rnd)*c0+max(.2,-rnd)*c1;
	
	if (actual.y < -20.1) {
		vec3 water = ray.Origin + ray.Direction*(-20. - ray.Origin.y)/ray.Direction.y;
		return vec3((vec3(0.03,0.1,0.2)+rndV*.05+sin(water.x*11.)*.03+sin(water.z*11.)*.03)*totallight);
	} else if (stone == 1. && ShouldDraw(voxel+vec3(0,1,0)) > 0. && actual.y-voxel.y > 0.7) {
		return vec3((vec3(0.1,0.4,0.)+rndV*.15)*totallight);
	} else if (stone == 1. && ShouldDraw(voxel+vec3(0,3,0)) > 0.) {
		return vec3((vec3(0.35,0.15,0.0)+rndV*.1)*totallight);
	}
	
	return vec3(1.,.8,.6)*rndV*totallight;
}
	

vec3 GetRayColor(Ray ray)
{
	vec3 voxel = ray.Origin - fract(ray.Origin);
	vec3 hitPoint = vec3(0.0);
	vec3 actual = vec3(0.0);
	
	const int maxIter = 250;/*CAREFUL WITH THIS!!!*/
	
	for(int i=0;i<maxIter;i++)
	{
		float dist = ShouldDraw(voxel);
		if(dist < 0. || i == maxIter-1) {
			return getColorAt(voxel, actual, hitPoint, ray);
		} else if (voxel.y > 20.) {
			return vec3(0.1, 0.3, 0.9);
		} else if (dist < 3.) {
			IterateVoxel(voxel, ray, hitPoint, actual);
		}
		else {
			voxel = ray.Origin + ray.Direction * (dot(voxel + .5 - ray.Origin, ray.Direction)+dist-1.);
			voxel = floor(voxel);
		}
	}
	
	return vec3(0);
}

void GetCameraRay(const in vec3 position, const in vec3 lookAt, out Ray currentRay)
{
	vec3 forwards = normalize(lookAt - position);
	vec3 worldUp = vec3(0.0, 1.0, 0.0);
	
	
	vec2 uV = ( gl_FragCoord.xy / resolution.xy );
	vec2 viewCoord = uV * 2.0 - 1.0;
	
	float ratio = resolution.x / resolution.y;
	
	viewCoord.y /= ratio;                              
	
	currentRay.Origin = position;
	
	vec3 right = normalize(cross(forwards, worldUp));
	vec3 up = cross(right, forwards);
	       
	currentRay.Direction = normalize( right * viewCoord.x + up * viewCoord.y + forwards);
}

void main( void ) 
{
	Ray currentRay;
 
	float time2 = time*15.;
	GetCameraRay(vec3(getTunnelCoords(time2),time2), vec3(0.1, 0.0, time2*1.+17.), currentRay);

	//making black "black" instead of alpha black... _gtoledo3
	vec3 color = GetRayColor(currentRay);
	gl_FragColor = vec4((color+sqrt(color))*.5,1.0);
}
