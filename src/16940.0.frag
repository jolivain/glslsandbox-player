//Made by Jordan Duty(AKA djdduty) May 14, 2014.
precision highp float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;

#define M_PI 3.1

#define useFractal fractal2Color

//universeFractal from http://glsl.heroku.com/e#16703
#define iterations 10
#define formuparam 0.42

#define volsteps 10
#define stepsize 0.120

#define zoom   0.1000
#define tile   0.1120
#define speed  0.00100

#define brightness 0.001
#define darkmatter 0.500
#define distfading 0.120
#define saturation -0.900
vec3 universeFractal(vec2 surfacePos) {
	//get coords and direction
	vec2 uv=surfacePos;
	vec3 dir=vec3(uv*zoom,10.);
	
	float a2=time/10.0*speed;
	float a1=10.0;
	mat2 rot1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1));
	mat2 rot2=rot1;
	dir.xz*=rot1;
	dir.xy*=rot2;
	
	//mouse movement
	vec3 from=vec3(0.,0.,0.);
	from+=vec3(.001*time,.001*time,-2.);
	
	//from.x-=mouse.x;
	//from.y-=mouse.y;
	
	from.xz*=rot1;
	from.xy*=rot2;
	
	//volumetric rendering
	float s=.4,fade=.2;
	vec3 v=vec3(0.4);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) { 
			p=abs(p)/dot(p,p)-1.1*formuparam; // the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a*2.; // add contrast
		if (r>3) fade*=1.-dm; // dark matter, don't render near
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	return vec3(v * .01);	

}

//other fractal2 from http://glsl.heroku.com/e#16840
#define fractal_details 10
#define zoomout 1.0

vec3 fractal2Color(vec2 surfacePos) {

	vec2 p = surfacePos*zoomout;//*sin(time*0.5)*10.5;
	vec3 c = vec3(0);
	vec2 fractal;
	float deepfade = 1.0;
	for (int i=-0; i<fractal_details; i++) 
	{
		//deepfade -= float(i)/float(fractal_details);
		deepfade *= 0.5;
		fractal = abs(p)/dot(p,p)-1.0+sin(time*0.5)*0.5;
		vec2 pdiff = fractal-p;
		float ddiff = abs(length(pdiff));
		//c.rg += fractal*deepfade;
		c.rg += pdiff*deepfade;
		c.b += ddiff*deepfade;
		p = fractal;
	}
	return c;
}

//scene with spheres
struct Ray
{
	vec3 Dir;
	vec3 Pos;
};
	
struct Sphere
{
	vec3 Pos;
	vec3 Color;
	float Rad;
	float Reflection;
};

const int numSpheres = 7;
Sphere spheres[numSpheres];

vec3 LightPos = vec3(0,-3,10);
	
vec3 Intersects(Sphere s, Ray r)
{
	float t0, t1;
	vec3 l = s.Pos - r.Pos;
	float tca = dot(l, r.Dir);
	if(tca < 0.0) return vec3(0,0,-1.0);
	float d2 = dot(l, l) - tca*tca;
	if(d2 > s.Rad*s.Rad) return vec3(0,0,-1.0);
	float thc = sqrt((s.Rad*s.Rad) - d2);
	return vec3(tca-thc, tca+thc, 1);
}
	
float mix2(float a, float b, float c)
{
	return b*c+a*(1.0-c);	
}

vec3 Trace3(Ray r)
{
	vec3 Color = vec3(0,0,0);
	Sphere s;
	bool col = false;
	float tnear = 1e8;
	for(int i = 0; i < numSpheres; i++)
	{
		vec3 intTest = Intersects(spheres[i],r);
		if(intTest.z != -1.0) {
			if(intTest.x < tnear) {
				tnear = intTest.x;
				s = spheres[i];
				col = true;
			}
		}
	}
	if(col==false) return vec3(0,0,0);
	vec3 phit = r.Pos + r.Dir * tnear;        float spaceScale = 0.1;       Color+=(useFractal(phit.xy*spaceScale)+useFractal(phit.xz*spaceScale)+useFractal(phit.yz*spaceScale))/3.0;
	vec3 nhit = phit - s.Pos;
	nhit = normalize(nhit);
	float bias = 1e-4;
	
	vec3 lightDir = LightPos - phit;
	bool blocked = false;
	lightDir = normalize(lightDir);
	float DiffuseFactor = dot(nhit, lightDir);
	vec3 diffuseColor = vec3(0,0,0);
	vec3 ambientColor = vec3(s.Color * 0.2);
	
	for(int n = 0; n < numSpheres; n++)
	{
		Ray rl;
		rl.Pos = phit;
		rl.Dir = lightDir;
		vec3 intTestL = Intersects(spheres[n],rl); 
		if(intTestL.z != -1.0)
		{
			if(intTestL.x < length(LightPos-phit)) {
				blocked = true;	
			}
		}
	}
	
	if(!blocked)
	{
		if(DiffuseFactor > 0.0)
		{
			diffuseColor = 	vec3(1,1,1)*DiffuseFactor;
			Color += s.Color*diffuseColor + ambientColor;

		}
		else
		{
			Color+=ambientColor;	
		}
	} 
	else
	{
		Color+=ambientColor;
	}
	
	return Color;
}

vec3 Trace2(Ray r)
{
	vec3 Color = vec3(0,0,0);
	Sphere s;
	bool col = false;
	float tnear = 1e8;
	for(int i = 0; i < numSpheres; i++)
	{
		vec3 intTest = Intersects(spheres[i],r);
		if(intTest.z != -1.0) {
			if(intTest.x < tnear) {
				tnear = intTest.x;
				s = spheres[i];
				col = true;
			}
		}
	}
	if(col==false) return vec3(0,0,0);
	vec3 phit = r.Pos + r.Dir * tnear;
	vec3 nhit = phit - s.Pos;
	nhit = normalize(nhit);
	float bias = 1e-4;
	
	bool inside = false;
	if(dot(r.Dir, nhit) > 0.0) nhit *= -1.0, inside = true;
	
	if(s.Reflection > 0.0)
	{
		float facingratio = dot((r.Dir*-1.0), nhit);
		vec3 refldir = r.Dir - nhit * 2.0 * dot(r.Dir, nhit);
		refldir = normalize(refldir);
		Ray rd;
		rd.Pos = phit;
		rd.Dir = refldir;
		vec3 refl = Trace3(rd);
		float param1 = (1.0-s.Reflection);
		float param2 = s.Reflection;
		Color.x = (param1 * Color.x + param2 * refl.x);
		Color.y = (param1 * Color.y + param2 * refl.y);
		Color.z = (param1 * Color.z + param2 * refl.z);
	}
	
	vec3 lightDir = LightPos - phit;
	bool blocked = false;
	lightDir = normalize(lightDir);
	float DiffuseFactor = dot(nhit, lightDir);
	vec3 diffuseColor = vec3(0,0,0);
	vec3 ambientColor = vec3(s.Color * 0.2);
	
	for(int n = 0; n < numSpheres; n++)
	{
		Ray rl;
		rl.Pos = phit;
		rl.Dir = lightDir;
		vec3 intTestL = Intersects(spheres[n],rl); 
		if(intTestL.z != -1.0)
		{
			if(intTestL.x < length(LightPos-phit))
				blocked = true;	
		}
	}
	
	if(!blocked)
	{
		if(DiffuseFactor > 0.0)
		{
			diffuseColor = 	vec3(1,1,1)*DiffuseFactor;
			Color += s.Color*diffuseColor + ambientColor;
		}
		else
		{
			Color+=ambientColor;	
		}
	} 
	else
	{
		Color+=ambientColor;
	}
	
	
	return Color;
}

vec3 Trace(Ray r)
{
	vec3 Color = vec3(0,0,0);
	Sphere s;
	bool col = false;
	float tnear = 1e8;
	for(int i = 0; i < numSpheres; i++)
	{
		vec3 intTest = Intersects(spheres[i],r);
		if(intTest.z != -1.0) {
			if(intTest.x < tnear) {
				tnear = intTest.x;
				s = spheres[i];
				col = true;
			}
		}
	}
	if(col==false) return vec3(0,0,0);
	vec3 phit = r.Pos + r.Dir * tnear;
	vec3 nhit = phit - s.Pos;
	nhit = normalize(nhit);
	float bias = 1e-4;
	
	bool inside = false;
	if(dot(r.Dir, nhit) > 0.0) nhit *= -1.0, inside = true;
	
	if(s.Reflection > 0.0)
	{
		float facingratio = dot((r.Dir*-1.0), nhit);
		vec3 refldir = r.Dir - nhit * 2.0 * dot(r.Dir, nhit);
		refldir = normalize(refldir);
		Ray rd;
		rd.Pos = phit;
		rd.Dir = refldir;
		vec3 refl = Trace2(rd);
		float param1 = (1.0-s.Reflection);
		float param2 = s.Reflection;
		Color.x = (param1 * Color.x + param2 * refl.x);
		Color.y = (param1 * Color.y + param2 * refl.y);
		Color.z = (param1 * Color.z + param2 * refl.z);
	}
	
	vec3 lightDir = LightPos - phit;
	bool blocked = false;
	lightDir = normalize(lightDir);
	float DiffuseFactor = dot(nhit, lightDir);
	vec3 diffuseColor = vec3(0,0,0);
	vec3 ambientColor = vec3(s.Color * 0.2);
	
	for(int n = 0; n < numSpheres; n++)
	{
		Ray rl;
		rl.Pos = phit;
		rl.Dir = lightDir;
		vec3 intTestL = Intersects(spheres[n],rl); 
		if(intTestL.z != -1.0)
		{
			if(intTestL.x < length(LightPos-phit))
				blocked = true;	
		}
	}
	
	if(!blocked)
	{
		if(DiffuseFactor > 0.0)
		{
			diffuseColor = 	vec3(1,1,1)*DiffuseFactor;
			Color += s.Color*diffuseColor + ambientColor;
		}
		else
		{
			Color+=ambientColor;	
		}
	} 
	else
	{
		Color+=ambientColor;
	}
	
	
	return Color;
}

void main(void)
{
	spheres[0].Pos = vec3(5,0,-0);
	spheres[0].Color = vec3(1.0,1.0,1.0);
	spheres[0].Rad = 4.0;
	spheres[0].Reflection = 0.4;
	
	spheres[1].Pos = vec3(-5,0,-0);
	spheres[1].Color = vec3(0.0,0.0,0.0);
	spheres[1].Rad = 4.0;
	spheres[1].Reflection = 0.3;
	//floor
	spheres[2].Pos = vec3(-5,1004,-0);
	spheres[2].Color = vec3(0.0,0.0,0.0);
	spheres[2].Rad = 1000.0;
	spheres[2].Reflection = 0.5;
	//sides
	spheres[3].Pos = vec3(-5,0,-1040);
	spheres[3].Color = vec3(0.9,0.0,0.0);
	spheres[3].Rad = 1000.0;
	spheres[3].Reflection = 0.505;
	
	
	spheres[5].Pos = vec3(-1020,0,-0);
	spheres[5].Color = vec3(0.0,0.0,0.7);
	spheres[5].Rad = 1000.0;
	spheres[4].Pos = vec3(1020,0,-0);
	spheres[4].Color = vec3(0.0,0.9,0.0);
	spheres[4].Rad = 1000.0;
	spheres[4].Reflection = 0.505;
	spheres[5].Reflection = 0.505;
	
	spheres[6].Pos = vec3(-5,0,1040);
	spheres[6].Color = vec3(0.9,0.9,0.0);
	spheres[6].Rad = 1000.0;
	spheres[6].Reflection = 0.505;
	
	float invWidth = 1.0 / resolution.x;
	float invHeight = 1.0 / resolution.y;
	float fov = 60.0; 
	float aspectratio = resolution.x/resolution.y;
	float angle = tan(M_PI * 0.5 * fov / 180.0);
	
	vec3 sinTime = vec3(sin(time*2.0));
	
	vec3 camTrans = vec3(20.0*cos(0.5*time), 0, 20.0*sin(0.5*time));
	vec3 camDir = camTrans - vec3(0);
	
	camTrans.y = -5.0;
	LightPos.y = -10.0;//camTrans;
	
	mat3 rot;
	vec3 f = normalize(camTrans);
	vec3 u = vec3(0,1,0);
	vec3 s = normalize(cross(f,u));
	u = cross(s,f);
	rot[0][0] = s.x; rot[1][0] = s.y; rot[2][0] = s.z;
	rot[0][1] = u.x; rot[1][1] = u.y; rot[2][1] = u.z;
	rot[0][2] = f.x; rot[1][2] = f.y; rot[2][2] = f.z;
	
	Ray R;
	float xx = (2.0 *((gl_FragCoord.x+0.5) * invWidth) -1.0)*angle*aspectratio;
	float yy = (1.0-2.0*((gl_FragCoord.y+0.5)*invHeight))*angle;	
	R.Pos = camTrans;
	R.Dir = vec3(xx,yy,-1) * rot;
	R.Dir = normalize(R.Dir);
	
	gl_FragColor = vec4(Trace(R), 1.0);
}
