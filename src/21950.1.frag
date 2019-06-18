#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;

// by srtuss, 2013
// was trying to find some sort of "mechanical" fractal for texture/heightmap
// generation, but then i ended up with this.

// rotate position around axis
vec2 rotate(vec2 p, float a)
{
	return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
}

// 1D random numbers
float rand(float n)
{
    return fract(sin(n) * 43758.5453123);
}

// 2D random numbers
vec2 rand2(in vec2 p)
{
	vec2 tmp = fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));
	return vec2(.5+.5*sin(tmp.x*time + p.x),.5+.5*cos(tmp.y*time + p.y));
}

// 1D noise
float noise1(float p)
{
	float fl = floor(p);
	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

// voronoi distance noise, based on iq's articles
float voronoi(in vec2 x)
{
	vec2 p = floor(x);
	vec2 f = fract(x);
	
	vec2 res = vec2(8.0);
	for(int j = -1; j <= 1; j ++)
	{
		for(int i = -1; i <= 1; i ++)
		{
			vec2 b = vec2(i, j);
			vec2 r = vec2(b) - f + rand2(p + b);
			
			// chebyshev distance, one of many ways to do this
			float d = max(abs(r.x), abs(r.y));
			
			if(d < res.x)
			{
				res.y = res.x;
				res.x = d;
			}
			else if(d < res.y)
			{
				res.y = d;
			}
		}
	}
	return res.y - res.x;
}


void main(void)
{
	vec2 suv = gl_FragCoord.xy / resolution.xy;
	suv = (suv - 0.5) * 2.0;
	vec2 uv = surfacePosition;

	float v = 0.0;
	gl_FragColor = vec4(0.0);
	
	
	// add some noise octaves
	float a = 0.8, f = 5.0;
	
	for(int i = 1; i < 3; i ++) // 4 octaves also look nice, its getting a bit slow though
	{	
		float v1 = voronoi(uv * f + 5.0);
		float v2 = 0.0;
		
		// make the moving electrons-effect for higher octaves
		if(i > 0)
		{
			// of course everything based on voronoi
			v2 = voronoi(uv * f * 0.5 + 50.0 + time);
			gl_FragColor += vec4(0.1,0.2,0.5,1.0) * (0.07/v2 + 0.03/v1);
			float va = 0.0, vb = 0.0;
			va = 1.0 - smoothstep(0.0, 0.1, v1);
			vb = 1.0 - smoothstep(0.0, 0.08, v2);
			v += a * pow(va * (0.5 + vb), 2.0);
		}
		
		// make sharp edges
		v1 = 1.0 - smoothstep(0.0, 0.3, v1);
		
		// noise is used as intensity map
		v2 = a * (noise1(v1 * 5.5 + 0.1));
		
		// octave 0's intensity changes a bit
		if(i == 0)
			v += v2 * (noise1(time * 2.0) * 0.8 + 0.4);
		else
			v += v2;
		
		f *= 3.0;
		a *= 0.7;
	}

	// slight vignetting
	v *= exp(-0.6 * length(suv)) * 1.2;
	
	// use texture channel0 for color? why not.
	//vec3 cexp = texture2D(iChannel0, uv * 0.001).xyz * 3.0 + texture2D(iChannel0, uv * 0.01).xyz;//vec3(1.0, 2.0, 4.0);
	
	// old blueish color set
	vec3 cexp = vec3(3.0, 1.0, 3.0);
		cexp *= 1.3;

	vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.z), pow(v, cexp.y)) * 2.0;
	
	gl_FragColor += vec4(col * vec3(0.2,0.2,0.45), 1.0);
}
