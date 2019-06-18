/*
 * Original shader from: https://www.shadertoy.com/view/XljSWm
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
const vec4 iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //

#define FRACTAL_ITER 4
#define STEPS 150
#define EPSILON 0.004

// rotation
mat2 rot( in float a ) {
	float c = cos(a);
    float s = sin(a);
    return mat2(c,s,-s,c);	
}

// distance to a menger sponge of n = 1
float crossDist( in vec3 p ) {
    vec3 absp = abs(p);
    // get the distance to the closest axis
    float maxyz = max(absp.y, absp.z);
    float maxxz = max(absp.x, absp.z);
    float maxxy = max(absp.x, absp.y);
    float cr = 1.0 - (step(maxyz, absp.x)*maxyz+step(maxxz, absp.y)*maxxz+step(maxxy, absp.z)*maxxy);
    // cube
    float cu = max(maxxy, absp.z) - 3.0;
    // remove the cross from the cube
    return max(cr, cu);
}

// menger sponge fractal
float fractal( in vec3 p ) {
    float scale = 1.0;
    float dist = 0.0;
    for (int i = 0 ; i < FRACTAL_ITER ; i++) {
        dist = max(dist, crossDist(p)*scale);
        p = fract((p-1.0)*0.5) * 6.0 - 3.0;
        scale /= 3.0;
    }
    return dist;
}

// plane formula
float plane( in vec3 p ) {
    const vec3 norm = vec3(0.57735);
    return dot( p, norm )-smoothstep(0.05, 1.0, sin(iTime*0.0954-2.5248)*0.5+0.5)*6.0;
}

// main distance function
float de( in vec3 p ) {
    return max(fractal(p), plane(p));
}

// normal function
vec3 normal( in vec3 p ) {
	const vec3 e = vec3(0.0, 0.001, 0.0);
    float dd = de(p);
	return normalize(vec3(
		dd-de(p-e.yxx),
		dd-de(p-e.xyx),
		dd-de(p-e.xxy)));	
}

// put normal vector in, get color out
vec3 toColor( in vec3 normal ) {
    vec3 color = normal*0.5+0.5;
    color *= vec3(0.9, 0.7, 0.6);
    color.b = cos((color.b)*4.3)*0.2+0.8;
    return color;
}

// used for the background
vec3 toGray( in vec3 color ) {
    return vec3((color.r+color.g+color.b)/3.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    vec2 uv = fragCoord.xy / iResolution.xy * 2.0 - 1.0;
	uv.x *= iResolution.x / iResolution.y;
	
	vec3 from = vec3(-6, 0, 0);
	vec3 dir = normalize(vec3(uv*0.6, 1.0));
	dir.xz *= rot(3.1415*.5);
	
	vec2 mouse=(iMouse.xy / iResolution.xy - 0.5) * 0.5;
	if (iMouse.z < 1.0) mouse = vec2(0.0);
	
	mat2 rotxz = rot(sin(iTime*0.0652-0.5)*0.8+mouse.x*5.0+2.5);
	mat2 rotxy = rot(0.3-mouse.y*5.0);
	
	from.xy *= rotxy;
	from.xz *= rotxz;
	dir.xy  *= rotxy;
	dir.xz  *= rotxz;

	float totdist = 0.0;
	bool set = false;
    float onPlane = 0.0;
	vec3 norm = vec3(0);
	float ao = 0.0;
    vec3 p = vec3(0);
    
	for (int steps = 0 ; steps < STEPS ; steps++) {
		p = from + totdist * dir;
		float fdist = fractal(p);
        float pdist = plane(p);
        float dist = max(fdist, pdist);
        totdist += dist;
		if (dist < EPSILON) {
			set = true;
            onPlane = abs(fdist-pdist);
			norm = normal(p);
            ao = float(steps) / float(STEPS);
            break;
		}
	}
    	
    if (set) {
        // get the color on the surface
        vec3 surfaceColor = toColor(norm);
       	surfaceColor = mix(surfaceColor, toGray(surfaceColor), 0.2);
        surfaceColor = surfaceColor * 0.8+0.2;
        fragColor.rgb = surfaceColor;
        // add fog
        fragColor.rgb -= totdist*0.04;
        // ambient occlusion
        fragColor.rgb -= smoothstep(0.0, 0.3, ao)*0.4;
        // add a pulse near the plane
        fragColor.rgb += (1.0-smoothstep(0.0, 0.02, onPlane))*surfaceColor*0.8;
    } else {
        // get the background color slightly desaturated
        fragColor.rgb = toColor(-dir);
        fragColor.rgb = mix(toGray(fragColor.rgb), fragColor.rgb, 0.4)*0.8;
    }
    
    fragColor.rgb = clamp(fragColor.rgb, 0.0, 1.0);
    fragColor.a = 1.0;
	
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
