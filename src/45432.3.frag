// Rose. By David Hoskins. Jan 2014.
// https://www.shadertoy.com/view/ldBGDh



#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;


#define PI 3.14159265359
#define MOD3 vec3(.1143,.12369,.13787)

vec3 sunLight  = normalize( vec3(  .8, .7,  -0.5 ) );
float gTime = 0.0;
vec2 coord = vec2(0.);

//--------------------------------------------------------------------------
float Hash(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(p3.x * p3.y * p3.z);
}

//--------------------------------------------------------------------------
float HashWrap(in vec2 p)
{
	p.x = mod(p.x, 10.0);
	vec3 p3  = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract(p3.x * p3.y * p3.z);
}

//--------------------------------------------------------------------------
float Noise(in vec2 p)
{
	vec2 f = fract(p);
    p = floor(p);
    f = f*f*(3.0-2.0*f);
    float res = mix(mix(Hash(p),
						Hash(p + vec2(1.0, 0.0)), f.x),
					mix(Hash(p + vec2(0.0, 1.0)),
						Hash(p + vec2(1.0, 1.0)), f.x), f.y);
    return res;
}

//--------------------------------------------------------------------------
float NoiseWrap(in vec2 p)
{
	vec2 f = fract(p);
    p = floor(p);
    f = f*f*(3.0-2.0*f);
    float res = mix(mix(HashWrap(p),
						HashWrap(p + vec2(1.0, 0.0)), f.x),
					mix(HashWrap(p + vec2(0.0, 1.0)),
						HashWrap(p + vec2(1.0, 1.0)), f.x), f.y);
    return res;
}

//--------------------------------------------------------------------------
float Cylinder( vec3 p, vec2 h )
{
  return max( length(p.xz)-h.x, abs(p.y)-h.y );
}

//--------------------------------------------------------------------------
vec2 Rotate2D( vec2 p, float a)
{
	float si = sin(a);
	float co = cos(a);
	return mat2(co, si, -si, co) * p;
}

//--------------------------------------------------------------------------
vec2 Map(in vec3 p)
{
	vec2 a;
	float mat = 0.0;
	float anim = min(sqrt(time*.1+0.01) +.2, 1.);
	
	// Tilt depending on height...
	float t = -.9+smoothstep(-50.0, -400.0, p.y*2.2);
	p.zy = Rotate2D(p.zy, t);
	float f = length(p*vec3(1.0, 2.5, 1.0))-50.0;
	
	// Spin faster around centre...
	float l = dot(p.xz, p.xz) * .0162+.5;
	t = sqrt(50.0 / (l+.5));
	p.xz = Rotate2D(p.xz, t*anim*anim);
	
	// arctan needs to wrap in the noise function...
	a.x = (atan(p.x, p.z)+PI)/ (2.0 * PI) * 10.0;
	a.y  = pow(l, .35)*11.3;
	a.y *= smoothstep(15.0/(anim*anim), 0.0, (p.y*.2+2.3)*anim);
    float n = NoiseWrap(a)*40.0-23.0;
	n = n * smoothstep(85.0, 50.0, l);
	f = f + n;
	f = mix(dot(p, p)-2380.0, f, pow(anim, .05));
	
	// Stem...
	n = Cylinder(p-vec3(0.0, -100, 0.0), vec2(4.0, 100.0));
	if (n < f)
	{
		mat = 1.0;
		f = n;
	}
	return vec2(f, mat);
}

//--------------------------------------------------------------------------
vec3 GetSky(in vec3 rd)
{
	float a = pow(1.0-max(rd.y, 0.0), 2.0);
	vec3 c1 = mix(vec3(0.52, .65, .65),vec3(.8), a);
	vec3 c2 = vec3(.26, .29, .24);
	float f = Noise(rd.xy*4.0)*.3 + Noise(rd.xy*10.0)*.1;
	float r = smoothstep(-0.1, .1, -rd.y-f+.2);
	return mix(c1, c2, clamp(r, 0.0, 1.0));
}

//--------------------------------------------------------------------------
float Shadow(in vec3 ro, in vec3 rd)
{
	float res = 1.0;
    float t = 2.0;
	float h = 0.0;
    
	for (int i = 0; i < 20; i++)
	{
		h = Map(ro + rd * t).x;
		res = min(h / t, res);
		t += h*.02+.35;
	}
	
    return clamp(res, 0.0, 1.0);
}

//----------------------------------------------------------------------------------------
vec3 Normal(in vec3 pos, in float t)
{
	vec2  eps = vec2(.25,0.0);
	vec3 nor = vec3(Map(pos+eps.xyy).x - Map(pos-eps.xyy).x,
					Map(pos+eps.yxy).x - Map(pos-eps.yxy).x,
					Map(pos+eps.yyx).x - Map(pos-eps.yyx).x);
	return normalize(nor);
}

//--------------------------------------------------------------------------
vec3 DoLighting(in vec3 pos, in vec3 ray, in vec3 nor, in vec2 t)
{
	float sha = Shadow(pos, sunLight)*.9 + .1;
	vec3 mat;
	if (t.y < 0.5) 
	{
		//pos.y *= 2.5;
		float anim = min(sqrt(time*.1+0.01) +.2, 1.);
		mat = vec3(.8, .0, .0);
		float t = -.9+smoothstep(-50.0, -400.0, pos.y*2.2);
		pos.zy = Rotate2D(pos.zy, t);
		float l = dot(pos.xz, pos.xz) * .0162+14.5;
		t = (50.0 / (l+.5));
		pos.xz = Rotate2D(pos.xz, t*anim);
		pos /= pow(anim, 1.0);
		mat += vec3(.3,.3,.3)*Noise(pos.xz*1.5) * anim*anim * .35;
		mat += vec3(.8,.5,.3)*Noise(pos.xz*.25) * clamp(l*.2-13., 0.0, 1.0);

	}else
	{
		mat = mix(vec3(.1, .4, .05), vec3(.0,.2, 0.0), Noise(pos.xy*vec2(1.0, .3)));
	}
	
	vec3 col = mat * max(dot(sunLight, nor), 0.0) * sha + mat*.05;
	vec3 ref = reflect(ray, nor);
	float spec = pow(max(dot(sunLight, ref), 0.0), 10.0);
	col += vec3(.3, 0.15, .05) * spec * sha;
	return clamp(col, 0.0, 1.0);
}

//----------------------------------------------------------------------------------------
vec2 RayMarch( in vec3 ro, in vec3 rd )
{
    float h;
    float t		 = 53.0 - 3.5* Hash(coord * time);
	vec2 res	 = vec2(200.0, -1.0);
	bool hit	 = false;

	for( int i = 0; i < 220; i++ )
    {
		if (!hit && t < 220.0)
		{
			vec2 h = Map(ro + rd * t);
			if (h.x < 0.0)
			{
				res = vec2(t, h.y);
				hit = true;
			}
			t += h.x * .036 + t * .001;
		}
    }
    return res;
}

//--------------------------------------------------------------------------
vec3 CameraPath( float t )
{
    vec2 p = vec2(200.0 * sin(3.54*t), 200.0 * cos(2.0*t) );
	return vec3(p.x+420.0,  0.0, -655.0+p.y);
} 

//--------------------------------------------------------------------------
vec3 PostEffects(vec3 rgb, vec2 xy)
{
	// Gamma first...
	rgb = pow(rgb, vec3(0.45));
	// Then saturation...
	rgb = clamp(mix(  vec3(dot(vec3(.2125, .7154, .0721), rgb)), rgb, 1.3), 0.0, 1.0);
	
	// Vignette...
	rgb *= .4+0.4*pow(60.0*xy.x*xy.y*(1.0-xy.x)*(1.0-xy.y), 0.3 );	
	return rgb;
}

//----------------------------------------------------------------------
void main()
{
	float gTime = -time-2.3;
    	vec2 xy = gl_FragCoord.xy / resolution.xy;
	vec2 uv = (-1.0 + 2.0 * xy) * vec2(resolution.x/resolution.y,1.0);
	coord = gl_FragCoord.xy;
	
	float hTime = mod(gTime+1.85, 2.0);
	
	vec3 camPos = vec3(sin(gTime*.3)*50.0, -10.0, -102.0);
	vec3 camTar  = vec3(0.0, -10.0, 0.0);

	float roll = .2*sin(gTime*.13+1.2);
	vec3 cw = normalize(camTar-camPos);
	vec3 cp = vec3(sin(roll), cos(roll),0.0);
	vec3 cu = cross(cw,cp);
	vec3 cv = cross(cu,cw);
	vec3 ray = normalize(uv.x*cu + uv.y*cv + 1.3*cw);

	vec3 col;

	vec2 t = RayMarch(camPos, ray);
	if(t.y >= 0.0)
	{
		vec3 pos = camPos + t.x * ray;
		vec3 nor = Normal(pos, t.x);
		col = DoLighting(pos, ray, nor, t);
	}else
	{
		col = GetSky(ray);
	}

	col = PostEffects(col, xy);	
	
	gl_FragColor=vec4(col,1.0);
}

//--------------------------------------------------------------------------
