#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define ZNEAR 1.0
#define ZFAR 5.0
#define PI 3.14159265359

struct hit {
	float dist;
	vec3 pos;
	vec3 normal;
};

hit sphere(vec3 orig, vec3 dir, vec3 center, float radius) {
	float a = dot(dir, dir);
	float b = 2.0 * dot(dir, orig - center);
	float c = dot(orig - center, orig - center) - radius * radius;
	
	float d = b * b - 4.0 * a * c;
	
	hit h;
	h.dist = -1.0;
	
	if (d < 0.0) { return h; }
	
	float dist = (-b - sqrt(d)) / (2.0 * a);
	
	if (dist < 0.0) { return h; }
	
	h.dist = dist;
	h.pos = orig + dir * dist;
	h.normal = (center - h.pos) / radius;
	return h;
}

void main(void) {
	vec2 position = gl_FragCoord.xy / resolution;
	
	position -= 0.5;
	position.x /= resolution.y / resolution.x;
	
	vec3 orig = vec3(position, 0.0);
	vec3 dir = normalize(orig - vec3(0.0, 0.0, -ZNEAR));
	
	hit h;
	h.dist = -1.0;
	
	vec3 lightPos = vec3(sin(time * 0.5) * 2.0, 0.0, 2.0);
	
	float mind = -1.0;
	for (int i = 0; i < 128; i++) {
		float a = 2.0 * PI / 32.0 * float(i) + time * 0.3;
		vec3 xz = vec3(0.0, cos(a), sin(a));
		hit sh = sphere(orig, dir, vec3(float(i) / 32.0 - 2.0, 0.0, 2.0) + xz / (abs(float(i) / 32.0 - 2.0 - lightPos.x) + 1.3), 0.15);
		if (sh.dist >= 0.0 && (mind == -1.0 || sh.dist < mind)) {
			h = sh;
			mind = sh.dist;
		}
	}
	
	vec3 lightDir = normalize(h.pos - lightPos);
	

	vec3 color = vec3(0.0);
	
	if (h.dist >= 0.0) {
		vec3 eyeDir = -dir;
		
		float isqr = 5.0 / (4.0 * PI * pow(distance(h.pos, lightPos), 2.0));
		
		float ambient = 0.5;
		
		float diffuse = max(dot(lightDir, h.normal), 0.0);
		
		float specular = 0.5 * pow(max(dot(reflect(lightDir, h.normal), eyeDir), 0.0), 10.0);
	
		float radiance = min(max(ambient, diffuse) * isqr, 1.0);
		float highlight = min(specular * isqr, 1.0);
		
		color = mix(vec3(0.0, 0.4, 0.7) * radiance, vec3(1.0), highlight);
	}
	
	float lightProj = dot(dir, orig - lightPos);
	
	if (h.dist < 0.0 || -lightProj < h.dist) {
		float lightDist = length((orig - lightPos) - lightProj * dir);
		gl_FragColor = vec4(mix(color, vec3(1.0), pow(lightDist, -4.0) / 2000.0), 1.0);
	}
	else {
		gl_FragColor = vec4(color, 1.0);
	}
}
