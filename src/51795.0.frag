/*
 * Original shader from: https://www.shadertoy.com/view/WsX3zX
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// Returns the matrix that rotates a given point by 'a' radians

mat2 mm2(in float a) {
    
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);

}

// Hash functions by Dave Hoskins: https://www.shadertoy.com/view/4djSRW

vec3 hash33(vec3 p3) {
	p3 = fract(p3 * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yxz+19.19);
    return fract((p3.xxy + p3.yxx)*p3.zyx);

}

// 3D Perlin Noise Implementation

vec3 fade3(vec3 t) {
	return t*t*t*(t*(t*6.0-15.0)+10.0);
}

vec3 getGradient3D(vec3 p) {
	return normalize(-1.0 + 2.0 * hash33(p));
}

float perlin3D(vec3 p) {
	
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = fade3(f);
    
    float value000 = dot(getGradient3D(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0));
	float value100 = dot(getGradient3D(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
	float value010 = dot(getGradient3D(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
	float value110 = dot(getGradient3D(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
	float value001 = dot(getGradient3D(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
	float value101 = dot(getGradient3D(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
	float value011 = dot(getGradient3D(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
	float value111 = dot(getGradient3D(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));

	return mix(
		mix(
			mix(value000, value100, u.x),
			mix(value010, value110, u.x),
			u.y),
		mix(
			mix(value001, value101, u.x),
			mix(value011, value111, u.x),
			u.y),
		u.z);

}

// The distance field
float map(vec3 pos) {
    
    vec3 offset = vec3(1.5, 0.0, iTime);
    float noise1 = 0.05 * perlin3D(10.0 * pos + offset);
    float noise2 = length(pos) - 1.0;
        
    return max(noise1, noise2);
    
    // Iq style smooth union (https://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm)
    //float k = 0.05;
    //float h = clamp(0.5 - 0.5*(noise2-noise1)/k, 0.0, 1.0);
    //return mix(noise2, noise1, h) + k*h*(1.0-h);
    
}


// The colour at a given position
vec3 getBaseCol(vec3 pos) {
    return vec3(1.0, 1.0, 1.0) * (0.5 + 0.5 * sin(length(pos * 10.0)));
}

// Determines the output colour of the surface at a given position using simple normal-based lighting
vec3 renderSurface(vec3 pos) {
	
    vec2 eps = vec2(0.00, 0.01);
    
    float ambientIntensity = 0.1;
    vec3 lightDir = normalize(vec3(sin(iTime * 0.3), -0.3, 0.2));
    
    vec3 normal = normalize(vec3(
    	map(pos + eps.yxx) - map(pos - eps.yxx),
		map(pos + eps.xyx) - map(pos - eps.xyx),
		map(pos + eps.xxy) - map(pos - eps.xxy)
    ));
    
    vec3 baseColor = getBaseCol(pos);
    
    float diffuse = ambientIntensity + max(dot(-lightDir, normal), 0.0);
    return baseColor * diffuse;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
    // Normalises the fragCoord
    vec2 uv = fragCoord/iResolution.xy;
    vec2 ps = uv - 0.5;
    ps.x *= iResolution.x/iResolution.y;
    
    // Gets the direction of the ray and the origin
    vec3 ro = vec3(0.0, 0.0, -2.0);
    vec3 rd = normalize(vec3(ps, 0.7));
	
    // Rotates the ray depending on the mouse position. I lifted this from
    // https://www.shadertoy.com/view/XtGGRt, but it seems to be the common approach
    vec2 mo = iMouse.xy / iResolution.xy-.5;
    mo = (mo==vec2(-.5))?mo=vec2(0.0,0.0):mo; // Default position of camera
    mo.x *= iResolution.x/iResolution.y;
    mo *= 3.0;
    rd.yz *= mm2(mo.y);
    rd.xz *= mm2(mo.x);
    
    // Raymarch
    float t = 0.0;
    vec3 col = vec3(0.0, 0.0, 0.0);
    float eps = 0.001;
    const int iterations = 60;
    
    for (int i = 0; i < iterations; i++) {
    	
       	vec3 ps = ro + t * rd;
        float d = abs(map(ps));
        
        if (d < eps) {
            col = renderSurface(ps);
            break;
        }
        
        t += d;
        
    }
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
