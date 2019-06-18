/*
 * Original shader from: https://www.shadertoy.com/view/ttlGWs
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define MAX_STEPS 100
#define MAX_DIST 300.
#define SURF_DIST .01


//NOISE GENERATION
float noise2D(vec2 p)
{
	return fract(sin(p.x * 67. + p.y * 1231.57) * 5723.);
}


float smoothNoise(vec2 uv)
{
	//grid local UV
	vec2 lv = fract(uv);
	//grid ID
	vec2 id = floor(uv);

	//smooth lv
	lv = lv*lv*(3.-2.*lv);

	float bl = noise2D(id);
	float br = noise2D(id + vec2(1, 0));
	float b = mix(bl, br, lv.x);

	float tl = noise2D(id + vec2(0, 1));
	float tr = noise2D(id + vec2(1));
	float t = mix(tl, tr, lv.x);

	return mix(b, t, lv.y);
}


//4 octaves of lerp'd noise
float valueNoise(vec2 uv)
{
	float value = smoothNoise(uv * 4.)
	            + smoothNoise(uv * 8.) * .5;
	            + smoothNoise(uv * 16.) * .25;
	            + smoothNoise(uv * 32.) * .125;

	value /= 2.;

	return value;
}


//END NOISE GENERATION


vec3 repeatXZ(vec3 p, float c)
{
	vec3 q = mod(p, c) - .5 * c;
	q.y = p.y;

	return q;
}


mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);

	return mat2(-c, -s, s, -c);
}


float getSphereDist(vec3 p)
{
	return length(p) - 1.;
}


float getCubeDist(vec3 p)
{
	vec3 toCorner = abs(p) - 1.;

	float extDist = length(max(toCorner, 0.));
	float intDist = max(toCorner.x, max(toCorner.y, toCorner.z));

	return extDist + min(intDist, 0.);
}


float getSceneDist(vec3 p)
{
	float c = 2.5;
	vec2 cubeCoords = floor(abs(p.xz) / c) * .06;
	float yOffset = valueNoise(cubeCoords + vec2(iTime*.5,0) );
    
    //scale the offset which is between 0 - 1
    yOffset *= 4.;
	
	vec3 cubePos = vec3(0, .5, 0);
	cubePos.y += yOffset;

	float dist = getCubeDist(repeatXZ(p, c) - cubePos) - .2;

	return min(dist, p.y);
}


float rayMarch(vec3 ro, vec3 rd, out int objFound)
{
	float dist = 0.;
	objFound = -1;

	for (int i = 0; i < MAX_STEPS; ++i)
	{
		vec3 p = ro + dist * rd;
		float sceneDist = getSceneDist(p);

		dist += sceneDist * .3;

		if (sceneDist < SURF_DIST)
		{
			objFound = 1;
			break;
		}
		else if (dist > MAX_DIST)
		{
			break;
		}
	}

	return dist;
}


vec3 getNormal(vec3 p)
{
	float dist = getSceneDist(p);

	vec2 e = vec2(.02, 0.);

	vec3 normal = dist - vec3(
		getSceneDist(p - e.xyy),
		getSceneDist(p - e.yxy),
		getSceneDist(p - e.yyx)
	);

	return normalize(normal);
}


float getLight(vec3 p)
{
	vec3 lightPos = vec3(112, 10, 0);

	vec3 toLight = normalize(lightPos - p);
	vec3 normal = getNormal(p);

	float angle = dot(normal, toLight);
	float diff = clamp(angle, 0., 1.);

	//shadows
	int oFound;
	float dist = rayMarch(p+normal*SURF_DIST*10., toLight, oFound);

	if (oFound == 1 && dist < length(p - lightPos))
	{
		diff *= .1;
	}

	return diff;
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
	vec2 uv = (fragCoord - .5 * iResolution.xy) / iResolution.y;
	vec3 ro = vec3(112, 32, 0);
	vec3 rd = normalize(vec3(uv.x, uv.y - .6, 1));

	int oFound;
	float dist = rayMarch(ro, rd, oFound);
	vec3 col = vec3(0);

	if (oFound == 1)
	{
		vec3 collidePoint = ro + dist * rd;
		float diff = getLight(collidePoint);

		col = vec3(diff);
	}

	fragColor = vec4(col, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
