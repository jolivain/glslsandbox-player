#version 100

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define ITER_MAX 100
#define MAX_DIST 50.0
#define EPS 0.002

float sphere(in vec3 p, float radius)
{
	return length(p) - radius;
}

float box(in vec3 p, in vec3 sz, float r)
{
	return length(max(abs(p) - sz, 0.0)) - r;	
}

vec3 twist(in vec3 p)
{
	float c = cos(6. * p.y * sin(time*.2));
	float s = sin(6. * p.y * sin(time*.2));

	mat2  m = mat2(c, -s, s, c);
	vec3  q = vec3(m * p.xz, p.y);
	
	return q;

}

float F(in vec3 p)
{
	return box(twist(p+vec3(0.,2.,0.)), vec3(.3+cos((time+p.y)*3.)*.3, .3+sin((time+p.y)*5.)*.2, 4.9), 0.1);
	//return sphere(twist(p), 1.0);
}

vec3 getNormal(vec3 p)
{
	vec3 e = vec3(0.0, EPS, 0.0);
	vec3 n = vec3(F(p + e.yxx) - F(p - e.yxx),
                      F(p + e.xyx) - F(p - e.xyx),
                      F(p + e.xxy) - F(p - e.xxy));
        n = normalize(n);
        return n;
}


vec3 rayCast(in vec3 o, in vec3 d)
{
	float dist = 0.0;
	float totalDist = 0.0;
	vec3 FogColor = vec3(0.5);
	vec3 color = FogColor * 0.5;
	float minDist = 0.0001;
	
	vec3 LightPos = vec3(2.0, 1.5, 1.0);
	vec3 LightColor = vec3(0.8, 0.8, 0.8);
	
	for (int step = 0; step < ITER_MAX; step++)
	{
		vec3 p = o + totalDist * d;
		dist = F(p)*.5; // mul * const to allow for more distortion
		totalDist += dist;
	
		if (dist < minDist)
			break;
		
		if (totalDist > MAX_DIST)
		{
			totalDist = MAX_DIST;
			break;
		}
	}
	
	// hit
	if (dist < 0.001)
	{
		vec3 P = o + totalDist * d;
		vec3 N = getNormal(P); //P; // sphere normal = P
		vec3 L = normalize(LightPos - P);
		// Phong et falloff todo
		//vec3 V, H
		//float falloff = ...
		
		float ambient = max(0.1, dot(N, d));
		float diffuse = max(0.0, dot(N, L));
		
		//float spec = todo
		//float ao = todo
		
		vec3 objColor = vec3(0.9, 0.6, 0.3);
		
		color = (objColor *  LightColor * diffuse) + (objColor * ambient);
		
		// *= ao;
	}

	color = mix(color, FogColor, smoothstep(0.0, 1.0, totalDist / MAX_DIST));
	return color;
	
}

void main( void )
{

	vec2 texcoord = gl_FragCoord.xy / resolution;
	vec2 pix = -1.0 + 2.0 * texcoord;
	pix.x *= resolution.x / resolution.y;
	pix.x = -pix.x;

	float r = abs(sin(time / 12.0) * 4.0) + 2.0;
	vec3 campos = vec3(1.8, 3.0, 1.0);//vec3(r * cos(time), sin(time / 5.0), r * sin(time));
	
	vec3 camLookAt = vec3(0.0, 0.9, 0.0);
	vec3 upVector = normalize(vec3(0.7, 1.0, 0.0));

	vec3 rayOrigin = campos;
	vec3 ww = normalize(camLookAt - rayOrigin);
	vec3 uu = normalize(cross(upVector, ww));
	vec3 vv = normalize(cross(ww, uu));
	vec3 rayDir = normalize(pix.x * uu + pix.y * vv + 1.5 * ww);
		
	vec3 color = rayCast(rayOrigin, rayDir);
	
	gl_FragColor = vec4(color, 1.0);

}
