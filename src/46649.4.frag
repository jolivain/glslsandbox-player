/*
 * Original shader from: https://www.shadertoy.com/view/4scBW8
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.14159265359
#define rot(a) mat2(cos(a + PI*0.25*vec4(0,6,2,0)))
#define FOV 2.0

float hash13( in vec3 p3 ) {
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float de( in vec3 p, in vec3 dir, in float r, out vec3 color ) {
    // accumulate distance and color
    float d = 9e9;
    color = vec3(0);
    float colorAcc = 0.0;
    
    // hexagonal tiling
    const vec2 dim = vec2(1, 1.73205080757);
    vec2 centerA = (floor(p.xy*dim)+0.5)/dim;
    vec2 centerB = (floor((p.xy+dim*0.5)*dim)+0.5)/dim-dim*0.5;
    vec2 a = p.xy-centerA.xy; vec2 b = p.xy-centerB.xy;
    vec2 center = dot(a,a)<dot(b,b) ? centerA : centerB;
	
    for (int i = 0 ; i < 7 ; i++) {
        float theta = float(i) * (2.0*PI/6.0);
        vec2 offset = vec2(sin(theta), cos(theta))*min(1.0/dim.y, float(i));
        vec3 sphere = vec3(center + offset, 0);
        sphere.z = sin(sphere.x-sphere.y*4.3+iTime)*0.2;

        vec3 inCenter = p - sphere;
        float len = length(inCenter);
        vec3 norm = inCenter / len;

        // select the nearest sphere
        float dist = len-0.3;
        d = min(d, dist);

        // colors and light
        vec3 colorHere = vec3(sin(sphere.x*90.0+sphere.y*80.0)*0.45+0.5);
        const vec3 lightDir = normalize(vec3(1, -1, 3));
        colorHere *= vec3(max(0.0, dot(lightDir, norm)));
        colorHere += pow(max(0.0, dot(lightDir, reflect(dir, norm))), 8.0);
        
        // accumulate color across neighborhood
        float alpha = max(0.0001, smoothstep(r, -r, dist));
        color += colorHere*alpha;
        colorAcc += alpha;
    }
    
    color /= colorAcc;
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
	vec3 from = vec3(iTime, iTime, 1.2);
	vec3 dir = normalize(vec3(uv, -1.0/tan(FOV*0.5)));
	dir.yz *= rot(-0.85);
    dir.xy *= rot(0.2);
    
    float sinPix = sin(FOV / iResolution.y);
    vec4 acc = vec4(0, 0, 0, 1);
    vec3 dummy = vec3(0);
    float totdist = de(from, dir, 0.0, dummy)*hash13(vec3(fragCoord, iTime));
    for (int i = 0 ; i < 100 ; i++) {
		vec3 p = from + totdist * dir;
        float r = max(totdist*sinPix, abs((totdist-2.5)*0.1));
        vec3 color = vec3(1);
        float dist = de(p, dir, r, color);
        
        // cone trace the surface
		float alpha = smoothstep(r, -r, dist);
        acc.rgb += acc.a * (alpha*color.rgb);
        acc.a *= (1.0 - alpha);
        
        // hit a surface, stop
        if (acc.a < 0.01) break;
        // continue forward
        totdist += max(abs(dist), r*0.5);
	}
    
    fragColor.rgb = clamp(acc.rgb, vec3(0), vec3(1));
    fragColor.rgb = pow(fragColor.rgb, vec3(1.0/2.2));
    fragColor.a = 1.0;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
