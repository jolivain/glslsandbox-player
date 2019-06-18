/*
 * Original shader from: https://www.shadertoy.com/view/wsfXWN
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy uniform emulation
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
//#define time iTime

float map(vec3 p) {
	float t = 10.0 + dot(p, vec3(0, 1, 0));
	float ti = time * 0.1;
	float tir = floor(ti);
	float tif = fract(ti);
	vec3 tp = p;
	for(int i = 0 ; i < 3; i++) {
		p = tp;
		p.x += 1.0;
		t = min(t, length(mod(p.xz, 2.0) - 1.0) - 0.12);
		p.x += sin(p.y * 40.0 - time * 15.0) * 0.1;
		p.z += cos(p.y * 40.0 - time * 15.0) * 0.1;
		t = min(t, length(mod(p.xz, 2.0) - 1.0) - 0.1);
		tp = tp.zxy;
	}
	
	return t;
}

vec2 rot(vec2 p, float a) {
	float c = cos(a);
	float s = sin(a);
	
	return vec2(
		p.x * c - p.y * s,
		p.x * s + p.y * c);
		
}


vec3 getnor(vec3 p) {
	vec2 dd = vec2(0.01, 0.0);
	vec3 kn = vec3(0.0);
	kn.x = map(p) - map(p + dd.xyy);
	kn.y = map(p) - map(p + dd.yxy);
	kn.z = map(p) - map(p + dd.yyx);
	return normalize(kn);
	
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 uv = ( fragCoord.xy / iResolution.xy ) * 2.0 - 1.0;
	uv.x *= iResolution.x / iResolution.y;
	float ti = time * 0.1;
	vec3 pos = vec3(ti, ti, ti) * 5.0;
	vec3 dir = normalize(vec3(uv, 1.0));
	
	float tir = floor(ti);
	float tif = fract(ti);
	float tism = smoothstep(0.01, 0.5, tif);

	dir.xy = rot(dir.xy, tism + tir);
	dir.xz = rot(dir.xz, tism + tir);

	
	float t = 0.0;
	for(int i = 0 ; i < 256; i++) {
		float tm = map(pos + dir * t);
		if(tm < 0.01) break;
		t += tm * 0.2;
	}
	vec3 ip = pos + dir * t;
	vec3 L = normalize(vec3(1,2,3));
	vec3 V = normalize(ip);
	vec3 N = getnor(ip);
	vec3 H = normalize(V + N);
	float D = max(0.1, dot(L, N));
	float S = pow(max(0.1, dot(L, H)), 32.0);
	fragColor = vec4(D * S * vec3(0.1,1,3) + vec3(3,2,1) * vec3(pow(t, 2.0)) * 0.002, 1.0);
    fragColor.xyz = pow(fragColor.xyz, vec3(1.0 / 2.2));
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
