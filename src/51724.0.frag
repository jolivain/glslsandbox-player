/*
 * Original shader from: https://www.shadertoy.com/view/wdXGRS
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

// --------[ Original ShaderToy begins here ]---------- //
const float EPSILON = 0.0001;
const float end = 100.0;
const float start = 0.01;
const float PI = 3.14159265359;

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float r = 0.05;
float sdRoundBox(vec3 p) {
    return length(max(abs(p) - vec3(.25, 10.5, .25), 0.0)) - r;
}

float c = .68;
vec4 sceneSDF(vec3 p) {
    vec3 q = mod(p,c)-0.5*c;
    vec3 z1 = floor(p / c) + vec3(floor(iTime)) * 25.12;
    vec3 z2 = floor(p / c) + vec3(floor(iTime) + 1.) * 25.12;
    q.y = p.y;
    float d = sdRoundBox(q);
    
    vec3 col1 = vec3(
        rand(z1.xz * 2.14), rand(z1.xz * 3.52), rand(z1.zx * 5.21)
    );
    vec3 col2 = vec3(
        rand(z2.xz * 2.14), rand(z2.xz * 3.52), rand(z2.zx * 5.21)
    );
    
    return vec4(mix(col1, col2, mod(iTime, 1.)), d);
}

mat3 rotationMatrixY(float rad) {
    return mat3(
        vec3(cos(rad), 0.0, sin(rad)),
        vec3(0.0, 1.0, 0.0),
        vec3(-sin(rad), 0.0, cos(rad))
    );
}

mat3 rotationMatrixX(float rad) {
    return mat3(
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, cos(rad), -sin(rad)),
        vec3(0.0, sin(rad), cos(rad))
    ); 
}

mat3 rotationMatrixZ(float rad) {
    return mat3(
        vec3(cos(rad), -sin(rad), 0.0),
        vec3(sin(rad), cos(rad), 0.0),
        vec3(0.0, 0.0, 1.0)
    );
}

vec4 rayMarch(vec3 eye, vec3 rayDir) {
    float depth = start;
    for(int i = 0; i < 255; i++) {
   		vec4 data = sceneSDF(eye + rayDir * depth);
        float dist = data.w;
        
        if(dist < EPSILON){
 	      	return vec4(data.xyz, depth);   
        }else if(depth >= end) {
        	return vec4(vec3(0.0), end);   
        }
        
        depth += dist;
    }
    return vec4(vec3(0.0), end);
}

vec3 estimateNormal(vec3 p) {
    float E = 0.1;
    return normalize(vec3(
        sceneSDF(vec3(p.x + E, p.y, p.z)).w - sceneSDF(vec3(p.x - E, p.y, p.z)).w,
        sceneSDF(vec3(p.x, p.y + E, p.z)).w - sceneSDF(vec3(p.x, p.y - E, p.z)).w,
        sceneSDF(vec3(p.x, p.y, p.z + E)).w - sceneSDF(vec3(p.x, p.y, p.z - E)).w
    ));
}

vec3 rayDirection(float fov, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fov) / 2.0);
    return normalize(vec3(xy, -z));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.y;
    
    float t = iTime * 0.1;
    float rSine = 0.6 * sin(3. * t) + 1.6 * sin(0.7 * t) - 2.1 * sin(0.2 * t);
    
    
	mat3 rot = rotationMatrixY(rSine) * rotationMatrixX(0.5);
    
    vec3 eye = vec3(0.0, 14.0, 5. - iTime);
    vec3 rayDir = rot * rayDirection(45.0, iResolution.xy, fragCoord);
    
    vec4 data = rayMarch(eye, rayDir);
    float depth = data.w;
    
    vec3 col;
   
   	if(depth >= end - EPSILON) {
    	col = vec3(0.);
    }else{
        vec3 normal = estimateNormal(eye + depth * rayDir);
        vec3 light = vec3(-1.0, -.4, .9) * rotationMatrixY(0.5);
        float diffuse = clamp(dot(normal, -light), 0.0, 1.0) * .8;
        
        vec3 viewDir = normalize(-rayDir);
		vec3 reflectDir = reflect(light, normal);  
        float specular = pow(max(dot(viewDir, reflectDir) * .75, 0.0), 8.) * .5;
        float i = 0.1 + diffuse + specular;
        col = data.xyz * i;
    }
    
    fragColor = vec4(col,1.0);

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
