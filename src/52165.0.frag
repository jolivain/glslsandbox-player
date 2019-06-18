/*
 * Original shader from: https://www.shadertoy.com/view/wdjGRz
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
const float noseLength = 3.0;
const float noseRadius = 0.2;

const float tankLength = 4.0;
const float bottomRadius = 0.1;

const float groundClearance = 1.0;

const float finHeight = 2.0;
const float finWidth = 1.2;
const float finRadius = 0.1;
const float finSmooth = 0.5;

const float flameWidth = 0.3;
const float flameLength = 6.0;
const float flameDiamonds = 8.0;

const float speed = 0.3;
const float hopHeight = 32.0;

const vec3 lightDir = vec3(0.36, -0.48, 0.8);

const int marchIter = 200;
const float marchDist = 50.0;
const float epsilon = 0.001;

const float tau = 6.283185;

mat4 attitude = mat4(0.);

float hash1(float p) {
	vec2 p2 = fract(p * vec2(5.3983, 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
	return fract(p2.x * p2.y * 95.4337);
}

float hash1(vec3 p3) {
    p3 = fract(p3 * vec3(5.3983, 5.4427, 6.9371));
    p3 += dot(p3, p3.yxz + 19.1934);
    return fract(p3.x * p3.y * p3.z);
}

float noise1(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
	vec3 u = f * f * (3.0 - 2.0 * f);
    return 1.0 - 2.0 * mix(mix(mix(hash1(i + vec3(0.0, 0.0, 0.0)), 
                                   hash1(i + vec3(1.0, 0.0, 0.0)), u.x),
                               mix(hash1(i + vec3(0.0, 1.0, 0.0)), 
                                   hash1(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
                           mix(mix(hash1(i + vec3(0.0, 0.0, 1.0)), 
                                   hash1(i + vec3(1.0, 0.0, 1.0)), u.x),
                               mix(hash1(i + vec3(0.0, 1.0, 1.0)), 
                                   hash1(i + vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

const mat3 m = mat3( 0.51162, -1.54702,  1.15972,
                    -1.70666, -0.92510, -0.48114,
                     0.90858, -0.86654, -1.55678);

float fbm1(vec3 p) {
    float f = noise1(p); p = m * p;
    f += 0.5 * noise1(p); p = m * p;
    f += 0.25 * noise1(p);
    return f / 1.75;
}

float hop() {
    return pow(max(0.45 - 0.55 * cos(speed * iTime), 0.0), 2.0);
}

float altitude(float h) {
    return hopHeight * h;
}

float throttle() {
    return smoothstep(0.95, 0.2, cos(speed * iTime));
}

float hopper(vec3 pos) {
	const float halfTank = 0.5 * (tankLength - bottomRadius);

    vec2 p = vec2(length(pos.xy), pos.z);
    float dist = length(max(abs(p - vec2(0.0, bottomRadius + halfTank)) - vec2(1.0 - bottomRadius, halfTank), 0.0)) - bottomRadius;
    
    const float a = noseLength - noseRadius;
    const float b = 1.0 - noseRadius;
    const float r = 0.5 * (a * a + b * b) / b;
    vec2 q = vec2(1.0 - r - noseRadius, tankLength);
    vec2 d = p - q;
    d = d / length(d);
	q += r * d;    
    q.x = max(0.0, q.x);
    q.y = min(tankLength + noseLength - noseRadius, q.y);
    dist = min(dist, length(p - q) - noseRadius + marchDist * step(pos.z, tankLength));
    
    float t = floor(atan(pos.x, pos.y) * 3.0 / tau + 0.5) * tau / 3.0;
    float c = cos(t);
    float s = sin(t);
	pos.xy = mat2(c, s, -s, c) * pos.xy;
    
    const vec2 finTop = normalize(vec2(finHeight + groundClearance, finWidth));
    p = (mat3(1.0, 0.0, 0.0, 0.0, finTop.y, finTop.x, 0.0, -finTop.x, finTop.y) * (pos - vec3(0.0, 1.0, finHeight))).xz;
    p.y = max(p.y, 0.0);
    float fin = length(p) - finRadius;
    
    const vec2 finBottom = normalize(vec2(groundClearance + finRadius, finWidth));
    p = (mat3(1.0, 0.0, 0.0, 0.0, finBottom.y, finBottom.x, 0.0, -finBottom.x, finBottom.y) * (pos - vec3(0.0, 1.0, finRadius))).xz;
    p.y = min(p.y, 0.0);
    fin = max(fin, length(p) - finRadius);
    
    float h = clamp(0.5 + 0.5 * (dist - fin) / finSmooth, 0.0, 1.0);
    dist = mix(dist, fin, h) - finSmooth * h * (1.0 - h);
    return max(dist, -groundClearance - pos.z);
}

float scene(vec3 pos) {    
    pos = (attitude * vec4(pos, 1.0)).xyz;

    return hopper(pos);
}

float castRay(vec3 eye, vec3 ray, out float dist) {
    dist = 0.0;
    for (int i = 0; i < marchIter; ++i) {
        float sdf = scene(eye + dist * ray);
        dist += sdf;
        if (sdf < epsilon)
            return 1.0;
        if (dist >= marchDist)
            return 0.0;
    }
    return 1.0;
}

vec3 bump(vec3 p) {
    return vec3(
        fbm1(vec3(p.x + epsilon, p.y, p.z)) - fbm1(vec3(p.x - epsilon, p.y, p.z)),
        fbm1(vec3(p.x, p.y + epsilon, p.z)) - fbm1(vec3(p.x, p.y - epsilon, p.z)),
        fbm1(vec3(p.x, p.y, p.z + epsilon)) - fbm1(vec3(p.x, p.y, p.z - epsilon))
    ) / epsilon;
}

vec3 normal(vec3 p) {
    vec3 norm = normalize(vec3(
        scene(vec3(p.x + epsilon, p.y, p.z)) - scene(vec3(p.x - epsilon, p.y, p.z)),
        scene(vec3(p.x, p.y + epsilon, p.z)) - scene(vec3(p.x, p.y - epsilon, p.z)),
        scene(vec3(p.x, p.y, p.z + epsilon)) - scene(vec3(p.x, p.y, p.z - epsilon))
    ));
        
    p = (attitude * vec4(p, 1.0)).xyz;
    vec3 skin = bump(p * vec3(2.0, 2.0, 1.0));
    
    float z = 17.0 * p.z;
    skin.z += 0.1 * sin(z) * pow(cos(z) + 1.0, 4.0);
    
    return normalize(norm + 0.02 * skin);
}

float drawGround(vec2 pos) {
    float pad = smoothstep(8.0, 7.5, length(pos));
    
    vec3 ground = bump(0.8 * vec3(pos, 0.5));
    vec2 p = 8.0 * pos;
    ground.y += 0.03 * pad * sin(p.x) * pow(cos(p.x) + 1.0, 8.0);
    ground.x += 0.03 * pad * sin(p.y) * pow(cos(p.y) + 1.0, 8.0);
    ground.xy += 40.0 *normalize(pos) * pad * pad * (pad * (pad - 2.0) + 1.0);
    vec3 groundNorm = normalize(ground + vec3(0.0, 0.0, 6.0 + 4.0 * pad));
    float shade = 0.25 + 0.05 * pad + 0.1 * dot(groundNorm, lightDir);
    
    float r = length(pos);
    float power = throttle() / (1.0 + 0.2 * altitude(hop())) / (1.0 + r);
    shade *= 1.0 + power * 2.0 * fbm1(vec3(6.0 * pos / (r + 1.0 / (1.0 + r)), 0.5 * r - 15.0 * iTime));
    
    return shade;
}

vec3 drawFlame(vec3 color, vec3 eye, vec3 ray, float dist) {
    const vec3 up = vec3(0.0, 0.0, 1.0);
    vec3 norm = cross(up, normalize(cross(up, ray)));
    dist = min(dist - 1.0, dot(norm, eye) / dot(-norm, ray));
    
    for (int i = 0; i <= 20; ++i) {
    	vec3 pos = eye + (dist + 0.5 - 0.05 * float(i)) * ray;
        float z = abs(pos.z / max(flameLength * throttle(), epsilon));
        float r = length(pos.xy) / flameWidth;
        
        float diamonds = flameDiamonds * pow(z, 1.3) * (1.0 + 0.05 * hash1(iTime));
        diamonds = abs(cos(0.5 * tau * diamonds));
        r = r * (1.2 - 0.2 * diamonds);
        z *= 1.0 + 0.3 * hash1(iTime + 10.0);
        float a = 1.0 - z * z - r * r;
        
        z += 0.6 * (1.0 - a);
        vec3 c = 0.8 + 0.3 * cos(tau * (0.25 * z + vec3(0.55, 0.4, 0.0)));
        c = mix(c, vec3(1.0), 0.7 * smoothstep(0.0, 0.2, a - diamonds));
        a = 1.5 * smoothstep(0.0, 0.2, a);
        
    	color = mix(color, c, 0.05 * a * step(pos.z, 0.0));
    }
    
    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float h = hop();
    
    float height = altitude(h) + groundClearance;
    float roll = 0.1 * sin(3.0 * speed * iTime) * smoothstep(0.0, 0.5, h);
    float c = cos(roll);
    float s = sin(roll);
    attitude = mat4(c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, -height, 1);
    
    float body = noseLength + tankLength;
    vec3 center = vec3(0.0, 0.0, height + 0.2 * body);
    vec3 eye = center + vec3(3.0, -0.4, 1.5 - 1.0 * h) * body;
    float zoom = 3.0;
    
    vec3 forward = normalize(center - eye);
    vec3 right = normalize(cross(forward, vec3(0.0, 0.0, 1.0)));
    vec3 up = cross(right, forward);
    vec2 xy = 2.0 * fragCoord - iResolution.xy;
    vec3 ray = normalize(xy.x * right + xy.y * up + zoom * forward * iResolution.y);
    
    float dist;
    float hit = castRay(eye, ray, dist);
    vec3 pos = eye + dist * ray;

    vec3 norm = normal(pos);
    
    vec3 reflection = reflect(ray, norm);
    float d = 0.5 + 0.5 * dot(reflection, lightDir);
    vec3 r = 0.5 + 0.5 * reflection;
    float hopperShade = 0.3 + 0.15 * dot(cos(r * vec3(7.0, 7.0, 12.0)), vec3(1.0)) + 0.1 * r.z + 0.1 * step(0.35, r.z) + 0.5 * pow(d, 3.0);
    
    float groundDist = -eye.z / ray.z;
    pos = eye + groundDist * ray;
    float groundShade = drawGround(pos.xy);
    groundShade *= 1.0 - 0.5 * castRay(pos, lightDir, dist);
    float skyShade = 0.8 + 0.7 * ray.z;
    float backShade = mix(groundShade, skyShade, smoothstep(-0.5, 0.0, ray.z));
    
    vec3 hopperColor = pow(vec3(hopperShade), vec3(1.5, 1.1, 0.7));
    vec3 backColor = pow(vec3(backShade), vec3(1.5, 1.1, 0.7));
    
    backColor = drawFlame(backColor, eye - vec3(0.0, 0.0, height), ray, groundDist);
    
    fragColor = vec4(mix(backColor, hopperColor, hit), 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
