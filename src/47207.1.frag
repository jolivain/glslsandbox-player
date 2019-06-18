/*
 * Original shader from: https://www.shadertoy.com/view/4ssGzS
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iResolution resolution
const vec2 iMouse = vec2(0.);

// --------[ Original ShaderToy begins here ]---------- //
// The Cornell Box - @h3r3
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// Reproducing the famous Cornell Box through Raymarching, fake soft-shadows,
// fake indirect lighting, ambient occlusion and antialiasing.
// Reference data: http://www.graphics.cornell.edu/online/box/
// Reference image: http://www.graphics.cornell.edu/online/box/box.jpg

// --- Adapt from GLSL Sandbox
//#define time iTime

// Set ANTIALIAS_ALWAYS to false if the animation is too slow
#define ANTIALIAS_ALWAYS true
#define ANTIALIAS_SAMPLES 4
#define ANIMATE_CAMERA

#define PI 3.14159265359
#define EXPOSURE 34.
#define GAMMA 2.1
#define SOFT_SHADOWS_FACTOR 4.
#define MAX_RAYMARCH_ITER 128
#define MAX_RAYMARCH_ITER_SHADOWS 16
#define MIN_RAYMARCH_DELTA 0.0015
#define GRADIENT_DELTA 0.0002
#define OBJ_FLOOR		1.
#define OBJ_CEILING		2.
#define OBJ_BACKWALL	3.
#define OBJ_LEFTWALL	4.
#define OBJ_RIGHTWALL	5.
#define OBJ_LIGHT		6.
#define OBJ_SHORTBLOCK	7.
#define OBJ_TALLBLOCK	8.

// RGB wavelengths: 650nm, 510nm, 475nm
const vec3 lightColor = vec3(16.86, 8.76 +2., 3.2 + .5);
const vec3 lightDiffuseColor = vec3(.78);
const vec3 leftWallColor = vec3(.611, .0555, .062);
const vec3 rightWallColor = vec3(.117, .4125, .115);
const vec3 whiteWallColor = vec3(.7295, .7355, .729);
const vec3 cameraTarget = vec3(556, 548.8, 559.2) * .5;

float sdBox(vec3 p, vec3 b) {
	vec3 d = abs(p) - b;
	return min(max(d.x, max(d.y, d.z)), 0.) + length(max(d, 0.));
}

vec3 rotateX(in vec3 p, float a) {
	float c = cos(a); float s = sin(a);
	return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

vec3 rotateY(vec3 p, float a) {
	float c = cos(a); float s = sin(a);
	return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotateZ(vec3 p, float a) {
	float c = cos(a); float s = sin(a);
	return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

vec2 mapBlocks(vec3 p, vec3 ray_dir) { //  ray_dir may be used for some optimizations
	vec2 res = vec2(OBJ_SHORTBLOCK, sdBox(rotateY(p + vec3(-186, -82.5, -169.5), 0.29718), vec3(83.66749, 83.522452, 82.5)));
	vec2 obj1 = vec2(OBJ_TALLBLOCK, sdBox(rotateY(p + vec3(-368.5, -165, -351.5), -0.30072115), vec3(87.02012, 165, 83.6675)));
	if (obj1.y < res.y) res = obj1;
	return res;
}

vec2 map(vec3 p, vec3 ray_dir) { //  ray_dir may be used for some optimizations
	vec2 res = vec2(OBJ_FLOOR, p.y);
	vec2 obj1 = vec2(OBJ_CEILING, 548.8 - p.y);
	if (obj1.y < res.y) res = obj1;
	vec2 obj2 = vec2(OBJ_BACKWALL, 559.2 - p.z);
	if (obj2.y < res.y) res = obj2;
	vec2 obj3 = vec2(OBJ_LEFTWALL, 556. - p.x);
	if (obj3.y < res.y) res = obj3;
	vec2 obj4 = vec2(OBJ_RIGHTWALL, p.x);
	if (obj4.y < res.y) res = obj4;
	vec2 obj5 = vec2(OBJ_LIGHT, sdBox(p + vec3(-278, -548.8, -292), vec3(65, 0.05, 65)));
	if (obj5.y < res.y) res = obj5;
	vec2 obj6 = mapBlocks(p, ray_dir);
	if (obj6.y < res.y) res = obj6;
	return res;
}

vec2 map(vec3 p) {
    return map(p, vec3(0,0,0));
}

vec3 gradientNormal(vec3 p) {
    return normalize(vec3(
        map(p + vec3(GRADIENT_DELTA, 0, 0)).y - map(p - vec3(GRADIENT_DELTA, 0, 0)).y,
        map(p + vec3(0, GRADIENT_DELTA, 0)).y - map(p - vec3(0, GRADIENT_DELTA, 0)).y,
        map(p + vec3(0, 0, GRADIENT_DELTA)).y - map(p - vec3(0, 0, GRADIENT_DELTA)).y));
}

float raymarch(vec3 ray_start, vec3 ray_dir, out float dist, out vec3 p, out int iterations) {
    dist = 0.0;
    float minStep = 0.1;
	vec2 mapRes;
    for (int i = 1; i <= MAX_RAYMARCH_ITER; i++) {
        p = ray_start + ray_dir * dist;
        mapRes = map(p, ray_dir);
        if (mapRes.y < MIN_RAYMARCH_DELTA) {
           iterations = i;
           return mapRes.x;
        }
        dist += max(mapRes.y, minStep);
    }
    return -1.;
}

bool raymarch_to_light(vec3 ray_start, vec3 ray_dir, float maxDist, float maxY, out float dist, out vec3 p, out int iterations, out float light_intensity) {
    dist = 0.; 
    float minStep = 1.0;
    light_intensity = 1.0;
	float mapDist;
    for (int i = 1; i <= MAX_RAYMARCH_ITER_SHADOWS; i++) {
        p = ray_start + ray_dir * dist;
        mapDist = mapBlocks(p, ray_dir).y;
        if (mapDist < MIN_RAYMARCH_DELTA) {
            iterations = i;
            return true;
        }
		light_intensity = min(light_intensity, SOFT_SHADOWS_FACTOR * mapDist / dist);
		dist += max(mapDist, minStep);
        if (dist >= maxDist || p.y > maxY) { break; }
    }
    return false;
}

vec3 interpolateNormals(vec3 v0, vec3 v1, float x) {
	x = smoothstep(0., 1., x);
	return normalize(vec3(mix(v0.x, v1.x, x),
		mix(v0.y, v1.y, x),
		mix(v0.z, v1.z, x)));
}

float ambientOcclusion(vec3 p, vec3 n) {
    float step = 8.;
    float ao = 0.;
    float dist;
    for (int i = 1; i <= 3; i++) {
        dist = step * float(i);
		ao += max(0., (dist - map(p + n * dist).y) / dist);  
    }
    return 1. - ao * 0.1;
}

vec3 render(vec3 ray_start, vec3 ray_dir) {
	float dist; vec3 p; int iterations;
	float objectID = raymarch(ray_start, ray_dir, dist, p, iterations);
	
	vec3 color = vec3(0);
	if (p.z >= 0.) {
		if (objectID == OBJ_FLOOR) color = whiteWallColor;
		else if (objectID == OBJ_CEILING) color = whiteWallColor;
		else if (objectID == OBJ_BACKWALL) color = whiteWallColor;
		else if (objectID == OBJ_LEFTWALL) color = leftWallColor;
		else if (objectID == OBJ_RIGHTWALL) color = rightWallColor;
		else if (objectID == OBJ_LIGHT) color = lightDiffuseColor;
		else if (objectID == OBJ_SHORTBLOCK) color = whiteWallColor;
		else if (objectID == OBJ_TALLBLOCK) color = whiteWallColor;
		
		if (objectID == OBJ_LIGHT) {
			color *= lightColor;
		} else {
			float lightSize = 25.;
			vec3 lightPos = vec3(278, 548.8 -50., 292 - 50);
			if (objectID == OBJ_CEILING) { lightPos.y -= 550.; }
			
			lightPos.x = max(lightPos.x - lightSize, min(lightPos.x + lightSize, p.x));
			lightPos.y = max(lightPos.y - lightSize, min(lightPos.y + lightSize, p.y));
			vec3 n = gradientNormal(p);
			
			vec3 l = normalize(lightPos - p);
			float lightDistance = length(lightPos - p);
			float atten = ((1. / lightDistance) * .5) + ((1. / (lightDistance * lightDistance)) * .5);
			
			vec3 lightPos_shadows = lightPos + vec3(0, 140, -50);
			vec3 l_shadows = normalize(lightPos_shadows - p);
			float dist; vec3 op; int iterations; float l_intensity;
			bool res = raymarch_to_light(p + n * .11, l_shadows, lightDistance, 400., dist, op, iterations, l_intensity);
			
			if (res && objectID != OBJ_CEILING) l_intensity = 0.;
			l_intensity = max(l_intensity,.25);
			vec3 c1 = color * max(0., dot(n, l)) * lightColor * l_intensity * atten;
			
			// Indirect lighting
			vec3 c2_lightColor = lightColor * rightWallColor * .08;
			float c2_lightDistance = p.x + 0.00001;
			float c2_atten = 1. / c2_lightDistance;
			vec3 c2_lightDir0 = vec3(-1,0,0);
			vec3 c2_lightDir1 = normalize(vec3(-300., 548.8/2.,559.2/2.) - p);
			float c2_perc = min(p.x * .01, 1.);
			vec3 c2_lightDirection = interpolateNormals(c2_lightDir0, c2_lightDir1, c2_perc);
			vec3 c2 = color * max(0., dot(n, c2_lightDirection)) * c2_lightColor * c2_atten;
			
			vec3 c3_lightColor = lightColor * leftWallColor * .08;
			float c3_lightDistance = 556. - p.x + 0.1;
			float c3_atten = 1. / c3_lightDistance;
			vec3 c3_lightDir0 = vec3(1,0,0);
			vec3 c3_lightDir1 = normalize(vec3(556. + 300., 548.8/2.,559.2/2.) - p);
			float c3_perc = min((556. - p.x) * .01, 1.);
			vec3 c3_lightDirection = interpolateNormals(c3_lightDir0, c3_lightDir1, c3_perc);
			vec3 c3 = color * max(0., dot(n, c3_lightDirection)) * c3_lightColor * c3_atten;
			
			color = color * .0006 + c1;
			color += c2 + c3; // Fake indirect lighting
			
			// Ambient occlusion
			float ao = ambientOcclusion(p, n);
			color *= ao;
		}
	}
	return color;
}

vec3 rotateCamera(vec3 ray_start, vec3 ray_dir) {
	ray_dir.x = -ray_dir.x; // Flip the x coordinate to match the scene data
	vec3 target = normalize(cameraTarget - ray_start);
	float angY = atan(target.z, target.x);
	ray_dir = rotateY(ray_dir, PI/2. - angY);
	float angX = atan(target.y, target.z);
	ray_dir = rotateX(ray_dir, - angX);
	#ifdef ANIMATE_CAMERA
		float angZ = smoothstep(0., 1., (time - 5.) * .1) * sin(time * 1.1 + .77) * .05;
		ray_dir = rotateZ(ray_dir, angZ);
	#endif
	return ray_dir;
}

vec3 moveCamera(vec3 ray_start) {
	ray_start += vec3(278, 273, -800);
	#ifdef ANIMATE_CAMERA
		vec3 ray_start_a = ray_start
			+ vec3(cos(time * 0.8) * 180., cos(time * 0.9) * 180., (cos(time * .3) + 1.) * 390.);
		return mix(ray_start, ray_start_a, smoothstep(0., 1., (time - 5.) * .1));
	#else
		return ray_start;
	#endif
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 resolution = iResolution.xy;
    vec2 mouse = min(iMouse.xy / iResolution.xy, vec2(1));

    
	vec3 ray_start = vec3(0, 0, -1.4);
	vec3 color = vec3(0);
	if (ANTIALIAS_ALWAYS || time < 5.) {
		// ANTIALIAS
		float d_ang = 2.*PI / float(ANTIALIAS_SAMPLES);
		float ang = d_ang * .333;
		float r = .4;
		for (int i = 0; i < ANTIALIAS_SAMPLES; i++) {
			vec2 position = vec2((fragCoord.x + cos(ang)*r - resolution.x *.5) / resolution.y, (fragCoord.y + sin(ang)*r - resolution.y *.5) / resolution.y);
			vec3 ray_s = moveCamera(ray_start);
			vec3 ray_dir = rotateCamera(ray_s,normalize(vec3(position, 0) - ray_start));
			color += render(ray_s, ray_dir);
			ang += d_ang;
		}
		color /= float(ANTIALIAS_SAMPLES);
	} else {
		// NO ANTIALIAS
		vec2 position = vec2((fragCoord.x - resolution.x *.5) / resolution.y, (fragCoord.y - resolution.y *.5) / resolution.y);
		vec3 ray_s = moveCamera(ray_start);
		vec3 ray_dir = rotateCamera(ray_s, normalize(vec3(position, 0) - ray_start));
		color += render(ray_s, ray_dir);
	}
	
	color *= EXPOSURE;
	color = pow(color, vec3(1. / GAMMA));
    fragColor = vec4(color, 1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
