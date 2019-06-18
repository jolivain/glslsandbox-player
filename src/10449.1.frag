#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

// Mountains. (C) David Hoskins - 2013
// https://www.shadertoy.com/view/4slGD4
// A ray-marched version of my terrain renderer which uses
// streaming texture normals for speed:-
// http://www.youtube.com/watch?v=qzkBnCBpQAM

// It uses binary subdivision to accurately find the height map.
// Lots of thanks to Iñigo and his noise functions!

// Video of my OpenGL version that 
// http://www.youtube.com/watch?v=qzkBnCBpQAM

// Stereo version code thanks to Croqueteer :)
//#define STEREO 

// Take out the trees by removing the following line: 
#define TREES

#ifdef TREES
float treeLine = 0.0;
float treeCol = 0.0;
#endif

vec3 sunLight  = normalize( vec3(  0.4, 0.4,  0.48 ) );
vec3 sunColour = vec3(1.0, .9, .83);
float specular = 0.0;
vec3 cameraPos = vec3(0.0);

// This peturbs the fractal positions for each iteration down...
// Helps make nice twisted landscapes...
const mat2 rotate2D = mat2(1.4623, 1.67231, -1.67231, 1.4623);

// Alternative rotation:-
// const mat2 rotate2D = mat2(1.2323, 1.999231, -1.999231, 1.22);

//--------------------------------------------------------------------------
// Noise functions...
float Hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

//--------------------------------------------------------------------------
float Hash(vec2 p)
{
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

//--------------------------------------------------------------------------
float Noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0;
    float res = mix(mix( Hash(n+  0.0), Hash(n+  1.0),f.x),
                    mix( Hash(n+ 57.0), Hash(n+ 58.0),f.x),f.y);
    return res;
}

//--------------------------------------------------------------------------
vec2 Noise2( in vec2 x )
{
	vec2 res = vec2(Noise(x), Noise(x+vec2(4101.03, 2310.0)));
    return res-vec2(.5, .5);
}

//--------------------------------------------------------------------------
// iq's derivative noise function...
vec3 NoiseDerivative( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
    vec2 u = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0;
    float a = Hash(n+  0.0);
    float b = Hash(n+  1.0);
    float c = Hash(n+ 57.0);
    float d = Hash(n+ 58.0);
	return vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,
				30.0*f*f*(f*(f-2.0)+1.0)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));
}

//--------------------------------------------------------------------------
#ifdef TREES
float Trees(vec2 p)
{
	p *= 5.0;
	vec2 rnd = Noise2(p);//vec2(Hash(floor(p.x*4.0)), Hash(floor(p.y*4.0)))*.5;
	vec2 v2 = fract(p+rnd)-.5;
	return max(.5-(length(v2)), 0.0) * treeLine*.6;
}
#endif

//--------------------------------------------------------------------------
// Low def version for ray-marching through the height field...
float Terrain( in vec2 p)
{
	vec2 pos = p*0.08;
	float w = (Noise(pos*.25)*0.75+.15);
	w = 36.0 * w * w;
	vec2 dxy = vec2(0.0, 0.0);
	float f = .0;
	for (int i = 0; i < 5; i++)
	{
		vec3 v = NoiseDerivative(pos);
		dxy += v.yz;
		f += (w * (v.x) / (1.0 + dot(dxy, dxy))) ;
		w = -w * 0.37;	//...Flip negative and positive for variation
		pos = rotate2D * pos;
	}
	float ff = Noise(pos*.003);
	
	f += pow(ff, 6.0)*85.-1.0;
	return f;
}

//--------------------------------------------------------------------------
// Map to lower resolution for height field mapping for Scene function...
float Map(in vec3 p)
{
	float h = Terrain(p.xz);
		
	#ifdef TREES
	float ff = Noise(p.xz*1.3)*.8;
	treeLine = smoothstep(ff, .1+ff, h) * smoothstep(.5+ff, .4+ff, h);
	treeCol = Trees(p.xz);
	h += treeCol;
	#endif
	
    return p.y - h;
}

//--------------------------------------------------------------------------
// High def version only used for grabbing normal information.
float Terrain2( in vec2 p)
{
	// There's some real magic numbers in here! 
	// The Noise calls add large mountain ranges for more variation over distances...
	vec2 pos = p*0.08;
	float w = (Noise(pos*.25)*0.75+.15);
	w = 36.0 * w * w;
	vec2 dxy = vec2(0.0, 0.0);
	float f = .0;
	for (int i = 0; i < 5; i++)
	{
		vec3 v = NoiseDerivative(pos);
		dxy += v.yz;
		f += (w * (v.x)  / (1.0 + dot(dxy, dxy)));
		w =  - w * 0.37;	//...Flip negative and positive for varition	   
		pos = rotate2D * pos;
	}
	float ff = Noise(pos*.003);
	f += pow(ff, 6.0)*85.-1.0;
	
	#ifdef TREES
	treeCol = Trees(p);
	f += treeCol;
	if (treeCol > 0.0) return f;
	#endif
	
	// That's the last of the low resolution, now go down further for the Normal data...
	for (int i = 0; i < 6; i++)
	{
		vec3 v = NoiseDerivative(pos);
		dxy += v.yz;
		f += (w * (v.x) / (1.0 + dot(dxy, dxy)));
		w =  - w * 0.37;
		pos = rotate2D * pos;
	}
	
	
	return f;
}

//--------------------------------------------------------------------------
float FractalNoise(in vec2 xy)
{
	float w = .65;
	float f = 0.0;

	for (int i = 0; i < 4; i++)
	{
		f += Noise(xy) * w;
		w *= 0.5;
		xy *= 2.3;
	}
	return f;
}

//--------------------------------------------------------------------------
// Simply Perlin clouds that fade to the horizon...
// 200 units above the ground...
vec3 GetClouds(in vec3 sky, in vec3 rd)
{
	if (rd.y < 0.0) return sky;
	float v = (200.0-cameraPos.y)/rd.y;
	rd.xz *= v;
	rd.xz += cameraPos.xz;
	rd.xz *= .010;
	float f = (FractalNoise(rd.xz) -.55) * 5.0;
	// Uses the ray's y component for horizon fade of fixed colour clouds...
	sky = mix(sky, vec3(.55, .55, .52), clamp(f*rd.y-.1, 0.0, 1.0));

	return sky;
}



//--------------------------------------------------------------------------
// Grab all sky information for a given ray from camera
vec3 GetSky(in vec3 rd)
{
	float sunAmount = max( dot( rd, sunLight), 0.0 );
	float v = pow(1.0-max(rd.y,0.0),5.)*.5;
	vec3  sky = vec3(v*sunColour.x*0.4+0.18, v*sunColour.y*0.4+0.22, v*sunColour.z*0.4+.4);
	// Wide glare effect...
	sky = sky + sunColour * pow(sunAmount, 6.5)*.32;
	// Actual sun...
	sky = sky+ sunColour * min(pow(sunAmount, 1150.0), .3)*.65;
	return sky;
}

//--------------------------------------------------------------------------
// Merge mountains into te sky background for correct disappearance...
vec3 ApplyFog( in vec3  rgb, in float dis, in vec3 dir)
{
	float fogAmount = clamp(dis* 0.0000165, 0.0, 1.0);
	return mix( rgb, GetSky(dir), fogAmount );
}

//--------------------------------------------------------------------------
// Calculate sun light...
void DoLighting(inout vec3 mat, in vec3 pos, in vec3 normal, in vec3 eyeDir, in float dis)
{
	float h = dot(sunLight,normal);
	float c = max(h, 0.0)+.1;
	mat = mat * sunColour * c ;
	// Specular...
	if (h > 0.0)
	{
		vec3 R = reflect(sunLight, normal);
		float specAmount = pow( max(dot(R, normalize(eyeDir)), 0.0), 3.0)*specular;
		mat = mix(mat, sunColour, specAmount);
	}
}

//--------------------------------------------------------------------------
// Hack the height, position, and normal data to create the coloured landscape
vec3 TerrainColour(vec3 pos, vec3 normal, float dis)
{
	vec3 mat;
	specular = .0;
	vec3 dir = normalize(pos-cameraPos);
	
	vec3 matPos = pos * 2.0;// ... I had change scale halfway though, this lazy multiply allow me to keep the graphic scales I had

	float disSqrd = dis * dis;// Squaring it gives better distance scales.

	float f = clamp(Noise(matPos.xz*.05), 0.0,1.0);//*10.8;
	f += Noise(matPos.xz*.1+normal.yz*1.08)*.85;
	f *= .55;
	vec3 m = mix(vec3(.63*f+.2, .7*f+.1, .7*f+.1), vec3(f*.43+.1, f*.3+.2, f*.35+.1), f*.65);
	mat = m*vec3(f*m.x+.36, f*m.y+.30, f*m.z+.28);
	// Should have used smoothstep to add colours, but left it using 'if' for sanity...
	if (normal.y < .5)
	{
		float v = normal.y;
		float c = (.5-normal.y) * 4.0;
		c = clamp(c*c, 0.1, 1.0);
		f = Noise(vec2(matPos.x*.09, matPos.z*.095+matPos.yy*0.15));
		f += Noise(vec2(matPos.x*2.233, matPos.z*2.23))*0.5;
		mat = mix(mat, vec3(.4*f), c);
		specular+=.1;
	}

	// Grass. Use the normal to decide when to plonk grass down...
	if (matPos.y < 45.35 && normal.y > .65)
	{

		m = vec3(Noise(matPos.xz*.073)*.5+.15, Noise(matPos.xz*.12)*.6+.25, 0.0);
		m *= (normal.y- 0.75)*.85;
		mat = mix(mat, m, clamp((normal.y-.65)*1.3 * (45.35-matPos.y)*0.1, 0.0, 1.0));
	}
	#ifdef TREES
	if (treeCol > 0.0)
	{
		mat = vec3(.02+Noise(matPos.xz*5.0)*.03, .05, .0);
		normal = normalize(normal+vec3(Noise(matPos.xz*33.0)*1.0-.5, .0, Noise(matPos.xz*33.0)*1.0-.5));
		specular = .0;
	}
	#endif
	
	// Snow topped mountains...
	if (matPos.y > 50.0 && normal.y > .28)
	{
		float snow = clamp((matPos.y - 50.0 - Noise(matPos.xz * .1)*28.0) * 0.035, 0.0, 1.0);
		mat = mix(mat, vec3(.7,.7,.8), snow);
		specular += snow;
	}
	// Beach effect...
	if (matPos.y < 1.45)
	{
		if (normal.y > .4)
		{
			f = Noise(matPos.xz * .084)*1.5;
			f = clamp((1.45-f-matPos.y) * 1.34, 0.0, .67);
			float t = (normal.y-.4);
			t = (t*t);
			mat = mix(mat, vec3(.09+t, .07+t, .03+t), f);
		}
		// Cheap under water darkening...it's wet after all...
		if (matPos.y < 0.0)
		{
			mat *= .5;
		}
	}

	DoLighting(mat, pos, normal,dir, disSqrd);
	
	// Do the water...
	if (cameraPos.y < 0.0)
	{
		// Can go under water, but current camera doesn't find a place...
		mat = mix(mat, vec3(0.0, .1, .2), .75); 
	}else
	if (matPos.y < 0.0)
	{
		// Pull back along the ray direction to get water surface point at y = 0.0 ...
		float localtime = (time)*.03;
		vec3 watPos = matPos;
		watPos += -dir * (watPos.y/dir.y);
		// Make some dodgy waves...
		float tx = cos(watPos.x*.052) *4.5;
		float tz = sin(watPos.z*.072) *4.5;
		vec2 co = Noise2(vec2(watPos.x*4.7+1.3+tz, watPos.z*4.69+localtime*35.0-tx));
		co += Noise2(vec2(watPos.z*8.6+localtime*13.0-tx, watPos.x*8.712+tz))*.4;
		vec3 nor = normalize(vec3(co.x, 20.0, co.y));
		nor = normalize(reflect(dir, nor));//normalize((-2.0*(dot(dir, nor))*nor)+dir);
		// Mix it in at depth transparancy to give beach cues..
		mat = mix(mat, GetClouds(GetSky(nor), nor), clamp((watPos.y-matPos.y)*1.1, .4, .66));
		// Add some extra water glint...
		float sunAmount = max( dot(nor, sunLight), 0.0 );
		mat = mat + sunColour * pow(sunAmount, 228.5)*.6;
	}
	mat = ApplyFog(mat, disSqrd, dir);
	return mat;
}

//--------------------------------------------------------------------------
float BinarySubdivision(in vec3 rO, in vec3 rD, float t, float oldT)
{
	// Home in on the surface by dividing by two and split...
	for (int n = 0; n < 4; n++)
	{
		float halfwayT = (oldT + t ) * .5;
		vec3 p = rO + halfwayT*rD;
		if (Map(p) < 0.25)
		{
			t = halfwayT;
		}else
		{
			oldT = halfwayT;
		}
	}
	return t;
}

//--------------------------------------------------------------------------
bool Scene(in vec3 rO, in vec3 rD, out float resT )
{
    float t = 1.2;
	float oldT = 0.0;
	float delta = 0.0;
	for( int j=0; j<170; j++ )
	{
		if (t > 240.0) return false; // ...Too far
	    vec3 p = rO + t*rD;
        if (p.y > 95.0) return false; // ...Over highest mountain

		float h = Map(p); // ...Get this positions height mapping.
		// Are we inside, and close enough to fudge a hit?...
		if( h < 0.25)
		{
			// Yes! So home in on height map...
			resT = BinarySubdivision(rO, rD, t, oldT);
			return true;
		}
		// Delta ray advance - a fudge between the height returned
		// and the distance already travelled.
		// It's a really fiddly compromise between speed and accuracy
		// Too large a step and the tops of ridges get missed.
		delta = max(0.01, 0.2*h) + (t*0.0065);
		oldT = t;
		t += delta;
	}

	return false;
}

//--------------------------------------------------------------------------
vec3 CameraPath( float t )
{
	float m = 1.0*300.0;
	t = (time*1.5+m+350.)*.006 + t;
    vec2 p = 376.0*vec2( sin(3.5*t), cos(1.5*t) );
	return vec3(140.0-p.x, 0.6, -88.0+p.y);
}

//--------------------------------------------------------------------------
// Some would say, most of the magic is done in post! :D
vec3 PostEffects(vec3 rgb, vec2 uv)
{
	// Gamma first...
	rgb = pow(rgb, vec3(0.45));
	#define CONTRAST 1.2
	#define SATURATION 1.12
	#define BRIGHTNESS 1.14
	rgb = mix(vec3(.5), mix(vec3(dot(vec3(.2125, .7154, .0721), rgb*BRIGHTNESS)), rgb*BRIGHTNESS, SATURATION), CONTRAST);
	rgb = clamp(rgb+Hash(rgb.rb+uv)*.05, 0.0, 1.0);
	return rgb;
}

//--------------------------------------------------------------------------
void main(void)
{
    vec2 xy = -1.0 + 2.0*gl_FragCoord.xy / resolution.xy;
	vec2 uv = xy * vec2(resolution.x/resolution.y,1.0);
	vec3 camTar;

	#ifdef STEREO
	float isCyan = mod(gl_FragCoord.x + mod(gl_FragCoord.y,2.0),2.0);
	#endif

	// Use several forward heights, of decreasing influence with distance from the camera.
	float h = 0.0;
	float f = 1.0;
	for (int i = 0; i < 7; i++)
	{
		h += Terrain(CameraPath((1.0-f)*.004).xz) * f;
		f -= .1;
	}
	cameraPos.xz = CameraPath(0.0).xz;
	camTar.xz	 = CameraPath(.005).xz;
	camTar.y = cameraPos.y = (h*.23)+3.5;
	
	float roll = 0.15*sin(time*.2);
	vec3 cw = normalize(camTar-cameraPos);
	vec3 cp = vec3(sin(roll), cos(roll),0.0);
	vec3 cu = normalize(cross(cw,cp));
	vec3 cv = normalize(cross(cu,cw));
	vec3 rd = normalize( uv.x*cu + uv.y*cv + 1.5*cw );

	#ifdef STEREO
	cameraPos += .45*cu*isCyan; // move camera to the right - the rd vector is still good
	#endif

	vec3 col;
	float distance;
	if( !Scene(cameraPos,rd, distance) )
	{
		// Missed scene, now just get the sky value...
		col = GetSky(rd);
		col = GetClouds(col, rd);
	}
	else
	{
		// Get world coordinate of landscape...
		vec3 pos = cameraPos + distance * rd;
		// Get normal from sampling the high definition height map
		// Use the distance to sample larger gaps to help stop aliasing...
		float p = min(.3, .0005+.00001 * distance*distance);
		vec3 nor  	= vec3(0.0,		    Terrain2(pos.xz), 0.0);
		vec3 v2		= nor-vec3(p,		Terrain2(pos.xz+vec2(p,0.0)), 0.0);
		vec3 v3		= nor-vec3(0.0,		Terrain2(pos.xz+vec2(0.0,-p)), -p);
		nor = cross(v2, v3);
		nor = normalize(nor);

		// Get the colour using all available data...
		col = TerrainColour(pos, nor, distance);
	}

	col = PostEffects(col, uv);
	
	#ifdef STEREO	
	col *= vec3( isCyan, 1.0-isCyan, 1.0-isCyan );	
	#endif
	
	gl_FragColor=vec4(col,1.0);
}

//--------------------------------------------------------------------------
