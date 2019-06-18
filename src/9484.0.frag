#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float hash(float x)
{
	return fract(sin(x) * 43758.5453);
}

float noise(vec3 x)
{
	vec3 p = floor(x);
	vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
	float n = p.x + p.y * 57.0 + p.z*113.0;
	
	float a = hash(n);
	return a;
}

float manhattan(vec3 v)
{
	v = abs(v);
	return v.x + v.y + v.z;
}

float quad(vec3 v)
{
	return pow(pow(v.x,4.0) + pow(v.y,4.0) + pow(v.z,4.0), 0.25);
}

float cheby(vec3 v)
{
	v = abs(v);
	return v.x > v.y
	? (v.x > v.z ? v.x : v.z)
	: (v.y > v.z ? v.y : v.z);
}

float vor(vec3 v)
{
	vec3 start = floor(v);
	
	float dist = 9999999.0;
	vec3 cand;
	
	for(int z = -2; z <= 2; z += 1)
	{
		for(int y = -2; y <= 2; y += 1)
		{
			for(int x = -2; x <= 2; x += 1)
			{
				vec3 t = start + vec3(x, y, z);
				vec3 p = t + noise(t);

				float d = length(p - v);

				if(d < dist)
				{
					dist = d;
					cand = p;
				}
			}
		}
	}
	
	vec3 delta = cand - v;
	
	return length(delta);
	//return noise(cand); //length(delta);
}


vec3 turb(vec3 v)
{
	vec2 pos = ( gl_FragCoord.xy / resolution.xy );
	
	float n = vor( v );
	
	v.x += n * 20.0;
	v.y += n * 20.0;
	
	return v;
}

float doVoronoi()
{
	vec3 freq = vec3(0.01, 0.01, 0.2);	

	float n = 0.0;
	float amplitude = 1.0;
	float pers = 0.25;
	
	vec3 tc = vec3(gl_FragCoord.xy, time);
	
	float maxAmp = 0.0;
	
	//for(int i = 0; i < 6; ++i)
	//{
		n += vor( turb( tc * freq ) ) * amplitude;
		
		freq *= 2.0;
		
		maxAmp += amplitude;
		
		amplitude *= pers;	
	//}
	//n /= maxAmp;
	
	
	n = -n + 1.0;
	return n;
}
void main( void )
{
	float n = 0.0;
	
	n += doVoronoi();

	vec4 col = vec4(0.0);
	
	vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
	vec4 yel = vec4(1.0, 1.0, 0.0, 1.0);
	vec4 grn = vec4(0.0, 1.0, 0.0, 1.0);
	vec4 tur = vec4(0.0, 1.0, 1.0, 1.0);
	vec4 blu = vec4(0.0, 0.0, 1.0, 1.0);	
	vec4 pur = vec4(1.0, 0.0, 1.0, 1.0);
	// then red again

	float c = 6.0;
	float rng = 1.0 / c; // 0.1666666666666667

	if(		n < rng*1.0) col = mix(red, yel, (n-rng*0.0) * c);
	else if(n < rng*2.0) col = mix(yel, grn, (n-rng*1.0) * c);
	else if(n < rng*3.0) col = mix(grn, tur, (n-rng*2.0) * c);
	else if(n < rng*4.0) col = mix(tur, blu, (n-rng*3.0) * c);
	else if(n < rng*5.0) col = mix(blu, pur, (n-rng*4.0) * c);
	else if(n < rng*6.0) col = mix(pur, red, (n-rng*5.0) * c);
		
	gl_FragColor = vec4(n);
}

