/*
 * Original shader from: https://www.shadertoy.com/view/wdjSDW
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //

	//-----------------CONSTANTS MACROS-----------------

	#define PI 3.14159265359
	#define E 2.7182818284
	#define GR 1.61803398875

	//-----------------UTILITY MACROS-----------------

	#define time ((sin(float(__LINE__))/PI/GR+1.0/GR)*iTime+1000.0)
	#define sphereN(uv) (clamp(1.0-length(uv*2.0-1.0), 0.0, 1.0))
	#define clip(x) (smoothstep(0.25, .75, x))
	#define TIMES_DETAILED (1.0)
	#define angle(uv) (atan(uv.y, uv.x))
	#define angle_percent(uv) ((angle(uv)/PI+1.0)/2.0)

	#define flux(x) (vec3(cos(x),cos(4.0*PI/3.0+x),cos(2.0*PI/3.0+x))*.5+.5)

	#define rotatePoint(p,n,theta) (p*cos(theta)+cross(n,p)*sin(theta)+n*dot(p,n) *(1.0-cos(theta)))


	//-----------------LOGO COLOR/POSITION/SIZE MACROS-----------------

	#define WHITE (vec4(vec3(255.0,255.0,255.0)/255.0, 1.0))
	#define BROWN (vec4(vec3(165.0,42.0,42.0)/255.0, 1.0))
	#define SKIN (vec4((sin(time+seedling)*.25+.5)*WHITE.rgb+(cos(time-seedling)*.25+.75)*BROWN.rgb, 1.0))
	#define CLOTHING (vec4((flux(time+seedling)+(sin(-time/GR/PI-seedling)*.25+.5))*(sin(-time/E/PI)*.125+.875), 1.0))
	#define RED (vec4(vec3(255.0,0.0,0.0)/255.0, 1.0))
	#define GREEN (vec4(vec3(0.0,255.0,0.0)/255.0, 1.0))
	#define BLUE (vec4(vec3(0.0,0.0,255.0)/255.0, 1.0))
	#define YELLOW (vec4(vec3(255.0,255.0,0.0)/255.0, 1.0))

	#define female_size (1.0/GR)
	#define female_target (vec2(-sqrt(2.0)/GR/2.0, sqrt(2.0)/GR-female_size/GR))
	#define male_size (1.0/GR)
	#define male_target (vec2(-female_target.x, female_target.y))

	float saw(float x)
	{
		x /= PI;
		float f = mod(floor(abs(x)), 2.0);
		float m = mod(abs(x), 1.0);
		return f*(1.0-m)+(1.0-f)*m;
	}
	vec2 saw(vec2 x)
	{
		return vec2(saw(x.x), saw(x.y));
	}

	vec3 saw(vec3 x)
	{
		return vec3(saw(x.x), saw(x.y), saw(x.z));
	}

	//-----------------SEEDLINGS-----------------------
	float seedling = 0.0;
	vec2 offset = vec2(0.0);
	float last_height = 0.0;
	float scale = 1.0;
	float extraTurns = 0.0;
	float aspect = 1.0;

	//-----------------AUDIO ALGORITHM-----------------

	float lowAverage()
	{
		const int iters = 32;
		float product = 1.0;
		float sum = 0.0;
		
		float smallest = 0.0;
		
		for(int i = 0; i < iters; i++)
		{
			float sound = texture(iChannel1, vec2(float(i)/float(iters), 0.5)).r;
			smallest = 
			
			product *= sound;
			sum += sound;
		}
		return max(sum/float(iters), pow(product, 1.0/float(iters)));
	}

	//-----------------SIMPLEX ALGORITHM-----------------

	vec3 random3(vec3 c) {
		float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
		vec3 r;
		r.z = fract(512.0*j);
		j *= .125;
		r.x = fract(512.0*j);
		j *= .125;
		r.y = fract(512.0*j);
		return r-0.5;
	}

	float simplex3d(vec3 p) {
		const float F3 =  0.3333333;
		const float G3 =  0.1666667;
		
		vec3 s = floor(p + dot(p, vec3(F3)));
		vec3 x = p - s + dot(s, vec3(G3));
		
		vec3 e = step(vec3(0.0), x - x.yzx);
		vec3 i1 = e*(1.0 - e.zxy);
		vec3 i2 = 1.0 - e.zxy*(1.0 - e);
		
		vec3 x1 = x - i1 + G3;
		vec3 x2 = x - i2 + 2.0*G3;
		vec3 x3 = x - 1.0 + 3.0*G3;
		
		vec4 w, d;
		
		w.x = dot(x, x);
		w.y = dot(x1, x1);
		w.z = dot(x2, x2);
		w.w = dot(x3, x3);
		
		w = max(0.6 - w, 0.0);
		
		d.x = dot(random3(s), x);
		d.y = dot(random3(s + i1), x1);
		d.z = dot(random3(s + i2), x2);
		d.w = dot(random3(s + 1.0), x3);
		
		w *= w;
		w *= w;
		d *= w;
		
		return dot(d, vec4(52.0));
	}

	//-----------------LOGO RENDERING CODE-----------------

	float getEyes(vec2 uv)
	{
		vec2 p = uv;

		p.y += 1.0/PI;

		p.x *= GR;

		vec4 a = vec4(-1.0/GR, 1.0/GR, 0, 0);
		vec4 b = vec4(1.0/GR, 1.0/GR, 0, 0);

		p.y += cos(uv.x*8.0)/PI;

		float distA = length(p.xy-a.xy);
		float distB = length(p.xy-b.xy);

		float fade_lengthA = .20;
		float fade_lengthB = .20;

		float color = clamp((1.0-distA/fade_lengthA)*distB, 0.0, 1.0)
					  +clamp((1.0-distB/fade_lengthB)*distA, 0.0, 1.0);
		return color;
	}

	float getTeeth(vec2 uv)
	{
		vec2 p = uv;
		p.x *= PI;
		p.y *= PI*(cos(p.x/PI/PI));
		p.y += 1.5*cos(p.x)+1.0;
		p.y *= (sin(time*PI+seedling))+2.0;

		float r = p.x*p.x+p.y*p.y;
		
		float xy = sin(p.x*PI*10.0)+cos(p.y*3.0+PI);

		return clamp(clamp((3.0/(r*r*r)-p.y*p.y), 0.0, 1.0)*xy, 0.0, 1.0);
	}

	vec4 demon(vec2 uv)
	{
		float eyes = getEyes(uv);
		float teeth = getTeeth(uv);
		
		vec3 col = clamp(eyes+flux(seedling)*eyes+teeth, 0.0, 1.0);
		
		return vec4(col, clamp(length(col), 0.0, 1.0));
	}


	//-----------------ITERATED FUNCTION SYSTEM-----------------

	vec2 mobius(vec2 uv)
	{
		float r = length(uv);
		uv = normalize(uv)/log(r+1.0);
		
		float turns = 4.0*extraTurns;
		float theta = atan(uv.y, uv.x);
		
		uv = vec2((theta*turns), (turns/(length(uv))-time*PI));
		
		seedling += floor(uv.x/PI)+floor(uv.y/PI);
		
		return vec2(saw(uv));
	}

	vec2 iterate(vec2 uv, vec2 dxdy, out float magnification)
	{
		uv += offset;
		
		vec2 a = uv+vec2(0.0, 		0.0);
		vec2 b = uv+vec2(dxdy.x, 	0.0);
		vec2 c = uv+vec2(dxdy.x, 	dxdy.y);
		vec2 d = uv+vec2(0.0, 		dxdy.y);//((fragCoord.xy + vec2(0.0, 1.0)) / iResolution.xy * 2.0 - 1.0) * aspect;

		vec2 ma = mobius(a);
		vec2 mb = mobius(b);
		vec2 mc = mobius(c);
		vec2 md = mobius(d);
		
		float da = length(mb-ma);
		float db = length(mc-mb);
		float dc = length(md-mc);
		float dd = length(ma-md);
		
		float stretch = max(max(max(da/dxdy.x,db/dxdy.y),dc/dxdy.x),dd/dxdy.y);
		
		magnification = stretch;
		
		return mobius(uv);
	}
		
	vec4 getEvil( in vec2 fragCoord )
	{
		vec2 uv = fragCoord.xy / iResolution.xy;
		float scale = E;
		uv = uv*scale-scale/2.0;
		
		float aspect = iResolution.x/iResolution.y;
		
		uv.x *= aspect;
		
		vec2 uv0 = uv;
		
		const int max_iterations = 4;
		int target = max_iterations;//-int(saw(spounge)*float(max_iterations)/2.0);
		
		float antispeckle = 1.0; 
		float magnification = 1.0;
	  
		vec4 color = vec4(0.0);
		float border = 1.0;
		
		seedling = 0.0;
		
			
		offset = sin(vec2(time+seedling,
						  -time-seedling))*(.5/E);
		
		color += demon(uv);
		border *= (1.0-color.a);//*antispeckle;
		
		for(int i = 0; i < max_iterations; i++)
		{
			float iteration = float(i)/float(max_iterations);
			
			seedling = float(i);
			extraTurns = float(i*i+1);
			
			uv = (iterate(uv0, .5/iResolution.xy, magnification)*2.0-1.0);
			uv = uv*(saw(time+seedling)+1.0);
			
			uv = rotatePoint(vec3(uv, 0.0), vec3(0.0, 0.0, -1.0), sin(seedling+time)*PI).xy;

			color += demon(uv)*border*antispeckle;
			
			border *= smoothstep(1.0-1.0/GR/E/PI, 1.0, 1.0-color.a);//*antispeckle;
			
			float weight = smoothstep(0.0, 0.25, magnification);
			antispeckle *= 1.0/magnification;
		}
		
		//fragColor = vec4(everything(uv*2.0-1.0, o).a);
		//fragColor = everything(uv*2.0-1.0, o);
		
		return color;
	}

	#define STEPS 1./50.
	#define VOLUME_BIAS 0.01
	#define MIN_DIST 0.005
	#define STEP_DAMPING .9
	#define TAU PI*2.

	// raymarch toolbox
	float rng (vec2 seed) { return fract(sin(dot(seed*.1684,vec2(54.649,321.547)))*450315.); }
	mat2 rot (float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }
	float sdSphere (vec3 p, float r) { return length(p)-r; }
	float sdCylinder (vec2 p, float r) { return length(p)-r; }
	float sdIso(vec3 p, float r) { return max(0.,dot(p,normalize(sign(p))))-r; }
	float sdBox( vec3 p, vec3 b ) {
	  vec3 d = abs(p) - b;
	  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
	}
	float amod (inout vec2 p, float count) {
		float an = TAU/count;
		float a = atan(p.y,p.x)+an/2.;
		float c = floor(a/an);
		a = mod(a,an)-an/2.;
		p.xy = vec2(cos(a),sin(a))*length(p);
		return c;
	}

	float repeat (float v, float c) { return mod(v,c)-c/2.; }
	float smin (float a, float b, float r) {
		float h = clamp(.5+.5*(b-a)/r, 0., 1.);
		return mix(b,a,h)-r*h*(1.-h);
	}

	// geometry for spell
	float tubes (vec3 pos) {
		
		// cylinder made of 8 tube
		float cylinderRadius = .02; // change shape
		vec3 p = pos;
		p.xz *= rot(p.y*.5); // twist amount
		float c = amod(p.xz, 8.); // amount of tubes
		p.x -= 2.; // tube cylinder radius
		float tube = sdCylinder(p.xz, cylinderRadius);
		
		// another cylinder made of tubes 16
		p = pos;
		p.xz *= rot(-p.y*.5); // twist amount
		c = amod(p.xz, 16.); // amount of tubes
		p.x -= 2.; // tube cylinder radius
		tube = smin(tube, sdCylinder(p.xz, cylinderRadius), .15);
		return tube;
	}

	// geometry for spell
	float disks (vec3 pos) {
		float radius = 1.5;
		float radiusInner = .57;
		float thin = .01;
		float repeatY = 2.;
		float cellY = floor(pos.y/repeatY);
		float a = atan(pos.z,pos.x)-iTime*.3+cellY*.1;
		vec3 p = pos;
		p.y += sin(a*6.)*.1;
		p.y = repeat(p.y, repeatY);
		float disk = max(-sdCylinder(p.xz, radiusInner), sdCylinder(p.xz, radius));
		disk = max(abs(p.y)-thin,disk);
		return disk;
	}

	vec3 anim1 (vec3 p) {
		float t = iTime*.5;
		p.xz *= rot(t);
		p.xy *= rot(t*.7);
		p.yz *= rot(t*.5);
		return p;
	}

	vec3 anim2 (vec3 p) {
		float t = -iTime*.4;
		p.xz *= rot(t*.9);
		p.xy *= rot(t*.6);
		p.yz *= rot(t*.3);
		return p;
	}

	float map (vec3 pos) {
		float scene = 1000.;
		
		// ground and ceiling
		float bump = texture(iChannel0, pos.xz*.1).r;
		float ground = 2. - bump*.1;
		scene = min(scene, pos.y+ground);
		scene = min(scene, -(pos.y-ground));
		
		// spell geometry 1
		vec3 p = pos;
		p.y += sin(atan(p.z,p.x)*10.)*3.; // change numbers to get new distortion
		p.xz *= rot(p.y*.2-iTime);
		p = anim1(p);
		p.x = length(p.xyz)-3.;
		scene = smin(scene, tubes(p), .5);
		scene = smin(scene, disks(p), .5);
		
		// spell geometry 2
		p = pos;
		p.y += sin(atan(p.z,p.x)*3.)*2.; // change numbers to get new distortion
		p = anim2(p);
		p.xz *= rot(p.y+iTime);
		p.x = length(p.xyz)-3.;
		scene = smin(scene, tubes(p), .3);
		scene = smin(scene, disks(p), .3);
		
		return scene;
	}

	void camera (inout vec3 p) {
		p.xz *= rot((-PI*(0./iResolution.x-.5)));
	}

	vec4 getSoulMask( in vec2 uv )
	{
		uv = (uv.xy-.5*iResolution.xy)/iResolution.y;
		vec2 mouse = vec2(0.)/iResolution.xy;
		vec3 eye = vec3(0.,0.,-7.+mouse.y*3.);
		vec3 ray = normalize(vec3(uv,.7));
		camera(eye);
		camera(ray);
		vec3 pos = eye;
		float shade = 0.;
		for (float i = 0.; i <= 1.; i += STEPS) {
			float dist = map(pos);
			if (dist < VOLUME_BIAS) {
				shade += STEPS;
			}
			if (shade >= 1.) break;
			dist *= STEP_DAMPING + .1 * rng(uv+fract(iTime));
			dist = max(MIN_DIST, dist);
			pos += dist * ray;
		}
		vec4 color = vec4(1);
		color.rgb *= shade;
		return color;
	}
	//-------------------------------------------------------------------

	vec3 mod289(vec3 x) {
	  return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec4 mod289(vec4 x) {
	  return x - floor(x * (1.0 / 289.0)) * 289.0;
	}

	vec4 permute(vec4 x) {
		 return mod289(((x*34.0)+1.0)*x);
	}

	vec4 taylorInvSqrt(vec4 r)
	{
	  return 1.79284291400159 - 0.85373472095314 * r;
	}

	float snoise(vec3 v)
	  { 
	  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

	// First corner
	  vec3 i  = floor(v + dot(v, C.yyy) );
	  vec3 x0 =   v - i + dot(i, C.xxx) ;

	// Other corners
	  vec3 g = step(x0.yzx, x0.xyz);
	  vec3 l = 1.0 - g;
	  vec3 i1 = min( g.xyz, l.zxy );
	  vec3 i2 = max( g.xyz, l.zxy );

	  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
	  //   x1 = x0 - i1  + 1.0 * C.xxx;
	  //   x2 = x0 - i2  + 2.0 * C.xxx;
	  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
	  vec3 x1 = x0 - i1 + C.xxx;
	  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
	  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

	// Permutations
	  i = mod289(i); 
	  vec4 p = permute( permute( permute( 
				 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
			   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
			   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

	// Gradients: 7x7 points over a square, mapped onto an octahedron.
	// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
	  float n_ = 0.142857142857; // 1.0/7.0
	  vec3  ns = n_ * D.wyz - D.xzx;

	  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

	  vec4 x_ = floor(j * ns.z);
	  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

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
	  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
									dot(p2,x2), dot(p3,x3) ) );
	  }

	float normnoise(float noise) {
		return 0.5*(noise+1.0);
	}

	float clouds(vec2 uv) {
		uv += vec2(iTime*0.05, + iTime*0.01);
		
		vec2 off1 = vec2(50.0,33.0);
		vec2 off2 = vec2(0.0, 0.0);
		vec2 off3 = vec2(-300.0, 50.0);
		vec2 off4 = vec2(-100.0, 200.0);
		vec2 off5 = vec2(400.0, -200.0);
		vec2 off6 = vec2(100.0, -1000.0);
		float scale1 = 3.0;
		float scale2 = 6.0;
		float scale3 = 12.0;
		float scale4 = 24.0;
		float scale5 = 48.0;
		float scale6 = 96.0;
		return normnoise(snoise(vec3((uv+off1)*scale1,iTime*0.5))*0.8 + 
						 snoise(vec3((uv+off2)*scale2,iTime*0.4))*0.4 +
						 snoise(vec3((uv+off3)*scale3,iTime*0.1))*0.2 +
						 snoise(vec3((uv+off4)*scale4,iTime*0.7))*0.1 +
						 snoise(vec3((uv+off5)*scale5,iTime*0.2))*0.05 +
						 snoise(vec3((uv+off6)*scale6,iTime*0.3))*0.025);
	}


	vec4 getSmoke( in vec2 fragCoord )
	{
	  
		vec2 uv =  fragCoord.xy/iResolution.x;
		   
		float cloud = clouds(uv);
		
		return vec4(cloud,cloud,cloud,1.0);

	}

	//--------------------------------------------------------------------------

	vec4 dnoise(vec3 p);

	vec4 quat_rotation( float half_angr, vec3 unitVec );

	vec2 screen_uv;
	vec4 quat;

	float Checker2(vec2 uv)
	{
		float s = sin(uv.x)*cos(uv.y);
		//s = s*s*s*s*s;
		return s;
	}

	vec4 FlowNoise(vec3 uvw, vec2 uv)
	{
		vec4 n = vec4(0.);

		float f = 1.;
		float a = 1.;
				
		float lac = 2.13;
		
	#if 0	
		for (int i=0; i<5; i++)
		{	
			//offsetting swirl angle relative to position seems to flow along the gradient
			float ang = iTime*.4;//+uv.y*0.5;
			
			ang *= Checker2(uvw.xy*0.0125);
			
			vec3 ax = normalize(vec3(1,1,1)); 
	//		vec3 ax = texture(u_tex1,vec2(float(i)*0.1,0.)).xyz*2.-1.;
			quat = quat_rotation( ang*2.*f, normalize(ax) );

			float e = 0.1;//*f;
			
			//advect by going back in domain along noise gradient
			vec4 dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);
		}
	#else
		vec3 ax = normalize(vec3(1,1,1)); 
		float e = 0.1;//*f;
		float ang;
		vec4 dn;
			ang = iTime*.4+uv.y*0.5;
			quat = quat_rotation( ang*2.*f, normalize(ax) );
			dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);
		
			ang = iTime*.4+uv.y*0.5;
			quat = quat_rotation( ang*2.*f, normalize(ax) );
			dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);

			ang = iTime*.4+uv.y*0.5;
			quat = quat_rotation( ang*2.*f, normalize(ax) );
			dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);

			ang = iTime*.4+uv.y*0.5;
			quat = quat_rotation( ang*2.*f, normalize(ax) );
			dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);

			ang = iTime*.4+uv.y*0.5;
			quat = quat_rotation( ang*2.*f, normalize(ax) );
			dn = dnoise(uvw);
			uvw -= 0.01*dn.xyz;
			n += abs(a*dn);
			uvw *= lac;
			f *= lac;
			a *= (1./lac);
		
	#endif
		
		return n;
	}
		
	vec3 hsv2rgb(vec3 c)
	{
		vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
		return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}

	//thanks iq..
	// Smooth HSV to RGB conversion 
	vec3 hsv2rgb_smooth( in vec3 c )
	{
		vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );

		rgb = rgb*rgb*(3.0-2.0*rgb); // cubic smoothing	

		return c.z * mix( vec3(1.0), rgb, c.y);
	}

	vec3 hsv2rgb_trigonometric( in vec3 c )
	{
		vec3 rgb = 0.5 + 0.5*cos((c.x*6.0+vec3(0.0,4.0,2.0))*3.14159/3.0);

		return c.z * mix( vec3(1.0), rgb, c.y);
	}

	vec3 FlameColour(float f)
	{
		return hsv2rgb_smooth(vec3((f-(2.25/6.))*(1.25/6.),f*1.25+.2,f*.95));
	}

	void mainImage( out vec4 fragColor, in vec2 fragCoord )
	{
		vec2 uv = fragCoord.xy / iResolution.xy;

		uv.x *= iResolution.x/iResolution.y;	
		uv.y = 1. - uv.y;
		screen_uv = uv;
		
		float t = iTime*0.8;
		vec3 uvw = vec3(uv*1.15+vec2(0.,t),t*0.5);


		vec4 d = FlowNoise(uvw,uv);
		float de = d.w;
		de = length(d.xyz)*.15+.2-d.w*.2;
		vec3 n = FlameColour(de);

		vec4 soulMask = vec4(1.0) - getSoulMask(fragCoord);
		vec4 smoke = getSmoke(fragCoord) * 0.25;
        vec4 evil = getEvil(fragCoord) * 0.35;
		fragColor = vec4(soulMask.xyz,1.0);
		fragColor.xyz = vec3(n) * 1.6 - fragColor.xyz;
        
		fragColor.x = max(evil.x,fragColor.x);
		fragColor.y = max(evil.y,fragColor.y);
		fragColor.z = max(evil.z,fragColor.z);
        
        fragColor.x = max(smoke.x,fragColor.x);
		fragColor.y = max(smoke.y,fragColor.y);
		fragColor.z = max(smoke.z,fragColor.z);
		
	}

	vec4 quat_rotation( float half_angr, vec3 unitVec )
	{
		float s, c;
		s = sin( half_angr );
		c = cos( half_angr );
		return vec4( unitVec*s, c );
	}

	vec3 quat_times_vec(vec4 q, vec3 v)
	{
		//http://molecularmusings.wordpress.com/2013/05/24/a-faster-quaternion-vector-multiplication/
		vec3 t = 2. * cross(q.xyz, v);
		return v + q.w * t + cross(q.xyz, t);
	}

	/* Created by Nikita Miropolskiy, nikat/2013
	 * This work is licensed under a 
	 * Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
	 * http://creativecommons.org/licenses/by-nc-sa/3.0/
	 *  - You must attribute the work in the source code 
	 *    (link to https://www.shadertoy.com/view/XsX3zB).
	 *  - You may not use this work for commercial purposes.
	 *  - You may distribute a derivative work only under the same license.
	 */

	/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
	vec3 random3a(vec3 c) 
	{
		float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
		vec3 r;
		r.z = fract(512.0*j);
		j *= .125;
		r.x = fract(512.0*j);
		j *= .125;
		r.y = fract(512.0*j);
		r = r-0.5;

		
		//rotate for extra flow!
		r=quat_times_vec(quat,r);
		
		return r;
	}

	/* skew constants for 3d simplex functions */
	const float F3 =  0.3333333;
	const float G3 =  0.1666667;

	vec4 dnoise(vec3 p) 
	{
		 /* 1. find current tetrahedron T and its four vertices */
		 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
		 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
		 
		 vec3 s = floor(p + (p.x+p.y+p.z)*F3);
		 vec3 x = p - s + (s.x+s.y+s.z)*G3;
		 
		 vec3 e = step(vec3(0.0), x - x.yzx);
		 vec3 i1 = e*(1.0 - e.zxy);
		 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
			
		 vec3 x1 = x - i1 + G3;
		 vec3 x2 = x - i2 + 2.0*G3;
		 vec3 x3 = x - 1.0 + 3.0*G3;
				 
		 /* calculate surflet weights */
		 vec4 w;
		 w.x = dot(x, x);
		 w.y = dot(x1, x1);
		 w.z = dot(x2, x2);
		 w.w = dot(x3, x3);
		 
		 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
		 w = max(0.6 - w, 0.0);		//aka t0,t1,t2,t3
		 vec4 w2 = w*w;				//aka t20,t21,t22,t23
		 vec4 w4 = w2*w2;			//aka t40,t41,t42,t43
		 
		 /* 2. find four surflets and store them in d */
		 vec3 g0 = random3a(s);
		 vec3 g1 = random3a(s + i1);
		 vec3 g2 = random3a(s + i2);
		 vec3 g3 = random3a(s + 1.0);
		 
		 vec4 d;
		 /* calculate surflet components */
		 d.x = dot(g0, x);		//aka graddotp3( gx0, gy0, gz0, x0, y0, z0 )
		 d.y = dot(g1, x1);
		 d.z = dot(g2, x2);
		 d.w = dot(g3, x3);
		 
		 //derivatives as per
		 //http://webstaff.itn.liu.se/~stegu/aqsis/flownoisedemo/srdnoise23.c
		 vec4 w3 = w*w2;
		 vec4 temp = w3*d;
		 vec3 dnoise = temp[0]*x;
			 dnoise += temp[1]*x1;
			 dnoise += temp[2]*x2;
			 dnoise += temp[3]*x3;
			 dnoise *= -8.;
			 dnoise += w4[0]*g0+w4[1]*g1+w4[2]*g2+w4[3]*g3;
			 dnoise *= 52.; //???
			 
		 d *= w4;	//aka n0,n1,n2,n3
		 
		float n = (d.x+d.y+d.z+d.w)*52.;
		
		return vec4(dnoise,n);
	}	
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
