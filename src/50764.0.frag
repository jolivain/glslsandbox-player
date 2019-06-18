/*
 * Original shader from: https://www.shadertoy.com/view/XtVfzd
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
const float eps = 1e-3;
const float pi = 3.1415926535;
const vec3 z_up = vec3(0.0, 0.0, 1.0);

// Ref: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 p) { 
    return fract(sin(dot(p, vec2(12.9898, 4.1414))) * 43758.5453);
}

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
	float fl = floor(p);
  	float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  	vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
}

float mod2(float p, float a) {
    return p - a * floor(p / a);
}

vec2 mod2(vec2 p, vec2 a) {
    return vec2(mod2(p.x, a.x), mod2(p.y, a.y));
}

float sdf_circle(vec2 p, vec2 o, float r) {
    return length(p - o) - r;
}

float sdf_ring(vec2 p, float r, float lineWidth) {
    float outer = sdf_circle(p, vec2(0, 0), r + 0.5 * lineWidth);
    float inner = sdf_circle(p, vec2(0, 0), r - 0.5 * lineWidth);
    
    return max(-inner, outer);
}

float sdf(vec2 p) {
    return min(sdf_ring(p, 0.75, 0.175), sdf_ring(p, 0.35, 0.175));
}

float sake_displacement(vec2 p, vec2 p0) {
    float dist = length(p - p0);
    vec2 dir = normalize(p - p0);
     
    float k = 5.0;
    float omega = 20.0;
    float basewave = 0.5 * sin(k * dist - mod2(omega * iTime, 2.0 * pi)) + 0.5;
    float k2 = 22.0;
    float omega2 = 44.0;
    float subwave = 0.5 * sin(k2 * dist - mod2(omega2 * iTime, 2.0 * pi)) + 0.5;
    float k3 = 45.0;
    float omega3 = 90.0;
    float subwave2 = 0.5 * sin(k3 * dist - mod2(omega3 * iTime, 2.0 * pi)) + 0.5;
    
    basewave = 2.0 * pow(basewave, 4.0) + 0.3 * pow(subwave, 2.0) + 0.09 * subwave2;
        
    float amp = min(1.0 / sqrt(eps + dist), 1.0);
    amp *= basewave;
    
    float outer_r = 0.82;
    amp += 100.0 * step(outer_r, length(p)) * (length(p) - outer_r) * (length(p) - outer_r);
    
    amp = 1.0 - exp(-amp);
    
    amp *= step(length(p0), 0.85);
    
    return -0.1 * amp;
}

vec3 sake_normal(vec2 p, vec2 p0) {
    float dfx = sake_displacement(p + vec2(1.0, 0.0) * eps, p0) - sake_displacement(p - vec2(1.0, 0.0) * eps, p0);
    float dfy = sake_displacement(p + vec2(0.0, 1.0) * eps, p0) - sake_displacement(p - vec2(0.0, 1.0) * eps, p0);
    return normalize(vec3(dfx, dfy, 2.0 * eps));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.xy;
    vec2 pos = (2.0 * fragCoord.xy - iResolution.xy) / min(iResolution.x, iResolution.y);
    vec2 mouse_pos = (2.0 * iMouse.xy - iResolution.xy) / min(iResolution.x, iResolution.y);
    
    if (iMouse.x == 0.0 && iMouse.y == 0.0) {
        mouse_pos = vec2(-0.5, -0.5) + 0.1 * vec2(2.0 * noise(iTime) - 1.0, 2.0 * noise(iTime + 11.52) - 1.0);
    }
    
    vec3 light_dir = normalize(vec3(3.0, 2.0, 1.0));
    const float max_sake_depth = 0.4;
    float sake_depth = mod2(0.05 * iTime, max_sake_depth) * step(length(mouse_pos), 0.85);
    
    vec3 normal = sake_normal(pos, mouse_pos);   
    vec3 refract_dir = refract(-z_up, normal, 1.4);
        
    vec2 displacement = refract_dir.xy / refract_dir.z * sake_depth;
    
    vec2 displaced_pos = pos + displacement;
    
    // rings
    vec3 ring_color = vec3(0.1, 0.1, 0.6);
    vec3 ring_edge_color = vec3(0.3, 0.6, 0.9);
    ring_color = mix(ring_edge_color, ring_color, smoothstep(-0.02, 0.02, -sdf(displaced_pos)));
    
    vec3 cup_color = vec3(0.98, 0.98, 0.98);  
    vec3 color = mix(ring_color, cup_color, smoothstep(0.0, 0.02, sdf(displaced_pos)));
    
    color *= 1.0 - 1.0 * max(0.0, dot(displaced_pos, light_dir.xy));
    color *= mix(0.8, 1.0, sake_depth / max_sake_depth);
    color *= mix(vec3(1.0), vec3(1.0, 1.0, 0.0), 1.0 - exp(-0.1 * sake_depth));   
    
    // reflection
    vec3 ref_dir = reflect(-z_up, normal);
    vec3 ref_color = 3.0 * vec3(1.0, 1.0, 1.0) * smoothstep(0.8, 0.9, dot(ref_dir, light_dir));
    ref_color += 0.5 * noise(2.0 * ref_dir.xy);
    ref_color *= 1.0 - exp(-2.0 * sake_depth);
    
    color += 1.0 * ref_color;
   
    // edge
    color = mix(color, cup_color * 0.6, smoothstep(0.86, 0.87, length(pos)));
    
    
    color = mix(color, vec3(0.1), smoothstep(0.91, 0.92, length(pos)));
    color *= 1.0 - 0.5 * length(uv) * length(uv);
    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
