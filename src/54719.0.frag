/*
 * Original shader from: https://www.shadertoy.com/view/MltcDB
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
#define STEPS 64.
#define STEPS_SHADOW 32.
#define PI 3.14159
#define EPS 0.0001
#define EPSN 0.001
#define EPSOUT 0.01

mat2 rot(float a){
	return mat2(cos(a), -sin(a), sin(a), cos(a));
}

float hash2(vec2 p){
	return fract(12345.6789 * sin(dot(p, vec2(12.345, 67.891))));
}

float hash3(vec3 p){
	return fract(12345.6789 * sin(dot(p, vec3(12.34, 56.78, 91.01))));
}

float smoothmin(float a, float b, float k){
	float f = clamp(0.5 + 0.5 * ((a - b) / k), 0., 1.);
    return (1. - f) * a + f  * b - f * (1. - f) * k;
}

float smoothmax(float a, float b, float k){
	return -smoothmin(-a, -b, k);
}

float smoothabs(float p, float k){
	return sqrt(p * p + k * k) - k;
}

float noise2(vec2 p){
	vec2 c = floor(p);
    vec2 f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash2(c), hash2(c + vec2(1., 0.)), f.x), mix(hash2(c + vec2(0., 1.)), hash2(c + vec2(1., 1.)), f.x), f.y);
}

float noise3(vec3 p){
	vec3 c = floor(p);
    vec3 f = fract(p);
    f = f * f * (3. - 2. * f);
    vec3 o = vec3(1., 0., 0.);
    return mix(mix(mix(hash3(c + o.yyy), hash3(c + o.xyy), f.x), mix(hash3(c + o.yxy), hash3(c + o.xxy), f.x), f.y),
               mix(mix(hash3(c + o.yyx), hash3(c + o.xyx), f.x), mix(hash3(c + o.yxx), hash3(c + o.xxx), f.x), f.y), 
               f.z);
}

float fbm2(vec2 p){
	return 0.5 * noise2(p) + 0.25 * noise2(2. * rot(2.) * (p + 1.)) + 0.125 * noise2(4. * rot(4.) * (p + 2.)) + 0.0625 * noise2(8. * rot(6.) * (p + 3.)) + 0.0625 * noise2(16. * rot(8.) * (p + 4.));
}


float fbm3(vec3 p){
	return 0.5 * noise3(p) + 0.25 * noise3(2. * (p + 1.)) + 0.125 * noise3(4. * (p + 2.)) + 0.0625 * noise3(8. * (p + 3.)) + 0.0625 * noise3(16. * (p + 4.));
}

float distEllipsoid(vec3 p, vec3 r){
    float lg = length(p /(r * r));
	return (length(p / r) - 1.) * (length(p / r)) / lg;
	//return (length(p / r) - 1.) * (r.x + r.y + r.z) / 3.;//max(max(r.x, r.y), r.z);

}

float distScene(vec3 pos, out float colorVariation){
    pos.xz = rot(1.5 * sin(0.25 * iTime)) * pos.xz;
    pos.y += 0.35;
    colorVariation = 0.;
    
    //main sphere
    vec3 p = pos;
    p.y -= 0.5;
    float dist = length(p) - 0.13;
    
    //hair + back of the head
    p = pos;
    p.y -= 0.51;
    p.z += 0.04;
    dist = smoothmin(dist, length(p) - 0.14, 0.02);
    
    p.yz = rot(0.3) * p.yz;
    float f = acos(p.z / 0.16);
    float angle = atan(p.y, p.x);
    float hair = -100. * (length(p) - 0.16) - noise2(50. * vec2(angle + 0.01 * sin(50. * f), 0.25 * f));
    colorVariation += smoothstep(0.25, 0.75, hair);
    dist -= 0.002 * smoothstep(0., 1., 0.5 * hair);
    
    p.z += 0.15;
    float div = 2. * PI / 18.;
    angle += 0.5 * PI + 0.5 * div;
    float c = floor((angle) / div);
    angle = mod(angle, div) - 0.5 * div;
    float r = length(p);
    p.x = r * cos(angle);
    p.y = r * sin(angle);
    
    p.xz = rot(1.) * p.xz;
    p.xy = rot(35. * p.z + 3.5 * hash2(vec2(c))) * p.xy;
    p.xy = abs(p.xy);
    float att = 0.3 * p.z * p.z;
    float distHair = length(p.xy - vec2(0.01 - 1. * att, 0.01 - 1. * att)) - 0.01 + att;
    distHair = smoothmax(distHair, length(p - vec3(0., 0., -0.06)) - 0.055, 0.02) - 0.02 * noise3(50. * p);
    dist = smoothmin(dist, distHair, 0.01);
    if(dist == distHair) colorVariation = 1.;
    
    //chin
    dist = smoothmin(dist, length(pos - vec3(0., 0.3, 0.105)) - 0.01, 0.2);
    
    //nose
    p = pos;
    p.y -= 0.41;
    p.z -= 0.135;
    p.yz = rot(-0.65) * p.yz;
    dist = smoothmin(dist, distEllipsoid(p, vec3(0.01, 0.035, 0.0075)), 0.04);
    
    //neck
    p = pos;
    p.z += 0.05;
    float distNeck = length(p.xz) - 0.05;
    distNeck = max(distNeck, p.y - 0.4);
    dist = smoothmin(dist, distNeck, 0.05);
    
    //torso
    p = pos;
    p.y -= 0.05;
    dist = smoothmin(dist, length(p) - 0.15, 0.05);
    
    //shoulders
    p = pos;
    p.x = smoothabs(p.x, 0.01);
    dist = smoothmin(dist, length(p - vec3(0.15, 0.15, -0.04)) - 0.055, 0.15);
    
    //eye sockets
    p = pos;
    p.x = smoothabs(p.x, 0.01);
    p -= vec3(0.05, 0.44, 0.15);
    dist = smoothmax(dist, -(length(p) - 0.045), 0.02);
    
    //brow bone
    p.z += 0.045;
    p.y -= 0.055;
    p.xz = rot(-0.25) * p.xz;
    p.yz = rot(1.2) * p.yz;
    p.xy = rot(-8. * (p.x + 0.04)) * p.xy;
    dist = smoothmin(dist, distEllipsoid(p, vec3(0.03, 0.01, 0.01)), 0.035);
    
    //eyebrow
    p = pos;
    p.x = abs(p.x) - 0.0725;
    p.z -= 0.13;
    p.y -= 0.495;
    p.xy = rot(-10. * p.x - 0.25) * p.xy;
    p.x += 0.0275;
    p.xz = rot(-10. * p.x) * p.xz;
    float distEyebrow = distEllipsoid(p, vec3(0.025, 0.007, 0.01));
    p.x -= 0.025;
    distEyebrow = smoothmin(distEyebrow, distEllipsoid(p, vec3(0.04, 0.005, 0.01)), 0.01);
    p.y /= 3.;
    float eyebrow = -100. * (distEyebrow - 0.004) + 0.5 * noise2(400. * p.xy);
    eyebrow = smoothstep(0.3, 0.7, eyebrow);
    colorVariation += eyebrow;
    dist -= 0.001 * eyebrow;
    
    //eyes
    p = pos;
    p.x = abs(p.x);
    p -= vec3(0.05, 0.45, 0.095);
    dist = smoothmin(dist, length(p) - 0.02, 0.01);
    p.z -= 0.02;
    p.x -= 0.005;
    float eyeColor = -50. * (length(p) - 0.025);
    colorVariation += smoothstep(0.4, 0.6, eyeColor);
    colorVariation -= smoothstep(0.45, 0.55, -25. * (length(p - vec3(sign(pos.x) * 0.01, -0.0075, 0.)) - 0.025));
    
    //eyelids
    p.x += 0.0045;
    p.y -= 0.016;
    p.xy = rot(-20. * p.x + 0.3) * p.xy;
    p.xz = rot(-20. * p.x) * p.xz;
    float distEyelids = distEllipsoid(p, vec3(0.035, 0.005, 0.01));
    float distEyelashes = abs(p.y + 0.003);
    p.x -= 0.005;
    distEyelashes = smoothmax(distEyelashes, length(p) - 0.036, 0.01);
	dist = smoothmin(dist, distEyelids, 0.005);
    colorVariation += smoothstep(0.4, 0.6, -60. * (distEyelashes - 0.01) + 0.15 * noise2(600. * p.xy));
    
    //cheeks
    p = pos;
    p.x = abs(p.x);
    dist = smoothmin(dist, length(p - vec3(0.05, 0.385, 0.08)) - 0.01, 0.1);
    
    //jaw
    p = pos;
    p.x = abs(p.x);
    dist = smoothmin(dist, length(p - vec3(0.03, 0.34, 0.045)) - 0.005, 0.1);
    
    //nose part 2
    p = pos;
    p.y -= 0.385;
    p.z -= 0.155;
    dist = smoothmin(dist, length(p) - 0.003, 0.025);
    p.z += 0.01;
    p.y += 0.004;
    dist = smoothmin(dist, length(p) - 0.006, 0.01);
    p.x = abs(p.x) - 0.015;
    dist = smoothmin(dist, length(p) - 0.006, 0.0125);
    
    //ears    
    p = pos;
    p.x = abs(p.x);
    p -= vec3(0.11, 0.4, -0.03);
    p.xz = rot(0.3) * p.xz;
    p.yz = rot(-0.4) * p.yz;
    p.xy = rot(-0.5) * p.xy;
    dist = smoothmin(dist, distEllipsoid(p, vec3(0.0075, 0.04, 0.025)), 0.015);
    p -= vec3(0.0175, -0.01, 0.01);
    dist = smoothmax(dist, -(length(p) - 0.015), 0.02);
    
    //mouth    
    dist = smoothmin(dist, distEllipsoid(pos - vec3(0., 0.345, 0.115), vec3(0.04, 0.03, 0.02)), 0.015);
    p = pos;
    p.y -= 0.345;
    p.z -= 0.14;
    p.yz = rot(-0.9) * p.yz;
    p.xz = rot(-15. * p.x) * p.xz;
    float distLips = distEllipsoid(p, vec3(0.03, 0.0075, 0.0075));
    p.y -= 0.009;
    p.z -= 0.001;
    distLips = smoothmax(distLips, -(length(p) - 0.008), 0.01);
    
    p = pos;
    p.y -= 0.325;
    p.z -= 0.126;
    p.yz = rot(0.25) * p.yz;
    p.xz = rot(-10. * p.x) * p.xz;
    distLips = smoothmin(distLips, distEllipsoid(p, vec3(0.035, 0.0125, 0.02)), 0.00003);
    dist = smoothmin(dist, distLips, 0.0075);
    
    p = pos;
    p.x = abs(p.x);
    p -= vec3(0.036, 0.33, 0.1275);
    dist = smoothmax(dist, -(length(p) - 0.001), 0.02);
    
    //cut
    p = pos;
    p.x = abs(p.x);
    p.xy = rot(0.3) * p.xy;
    dist = smoothmax(dist, -p.y + 0.075, 0.01); 
    dist = smoothmin(dist, max(pos.y - 0.055, length(pos.xz) - 0.075) + 0.005 * sin(100. * pos.y), 0.1);
    
    return dist;
}

vec3 getNormal(vec3 p){
    float c;
	return(normalize(vec3(distScene(p + vec3(EPSN, 0., 0.), c) - distScene(p - vec3(EPSN, 0., 0.), c),
               			distScene(p + vec3(0., EPSN, 0.), c) - distScene(p - vec3(0., EPSN, 0.), c),
               			distScene(p + vec3(0., 0., EPSN), c) - distScene(p - vec3(0., 0., EPSN), c))));
}

float getShadow(vec3 pos, vec3 light, vec3 normal){
	vec3 shadowRay = normalize(light - pos);
    pos += 3. * EPS * normal;
    float totDist = 3. * EPS;
    float prevDist = totDist;
    float shadow = 1.;
    float dist, c;

    for(float s = 0.; s < STEPS_SHADOW; s++){
        dist = distScene(pos, c);
        shadow = min(shadow, 4. * dist / totDist);
        if(abs(dist) < EPS){
            shadow = 0.;
            break;
        }
        dist = 0.997 * dist + 0.003 * hash3(pos + sin(iTime));
        pos += shadowRay * dist;
        totDist += dist;
        if(totDist > 2.) break;
    }
    return clamp(shadow, 0., 1.);
}

vec3 render(vec2 uv){
	vec3 col = 0.95 - 0.025 * vec3(smoothstep(0.6, 0.3, fbm2(75. * uv)));
    vec3 ink = vec3(0.15, 0.2, 0.3);
    
    //camera
    vec3 eye = vec3(0., 0., 5.);
    vec3 ray = normalize(vec3(uv, 1.) - eye);
    ray.yz = rot(0.12) * ray.yz;
    eye.yz = rot(0.12) * eye.yz;
    
   	//raymarch
    vec3 pos = eye;
    float s, colorVariation, prevDist, totDist = 0., outline = 1.;
    bool hit = false;
    float dist = distScene(pos, colorVariation);
    float maxDist = 7.;
        
    for(float s = 0.; s < STEPS; s++){
        prevDist = dist;
    	dist = distScene(pos, colorVariation);
        if(dist > prevDist && dist < EPSOUT){
        	outline = min(outline, dist);
        }
        if(abs(dist) < EPS || totDist > maxDist){
            break;
        }
        pos += ray * dist;
        totDist += dist;
    }
    
    if(totDist < maxDist) hit = true;
    float f = fbm3(10. * pos);
    float sf = smoothstep(0.5, 0.6, f);
    
    vec3 normal = getNormal(pos);
    
    //col = 0.75 * vec3(s / STEPS)  + 0.25 * (0.5 + normal);
    if(hit) col = mix(col, ink, colorVariation);
    
    //outline
    outline = clamp(outline / EPSOUT, 0., 1.);
	outline = smoothstep(0.5, 0.7, outline + 0.5 * f);
    col = mix(ink, col, outline);
    
    vec3 light = vec3(5., 7., 10.);
    light.yz = rot(0.3) * light.yz;
    
    //white highlight
    float shine = 10.;
    vec3 refl = reflect(normalize(pos - light), normal);
    float spec = pow(clamp(dot(normalize(eye - pos), refl), 0., 1.), shine);
    spec = smoothstep(0.45, 0.55, spec - 0.5 * f);
    if(hit) col = mix(col, vec3(1.), (1. - 0.5 * colorVariation) * spec);
    
    //shadows
    float shadow = getShadow(pos, light, normal);
    shadow = smoothstep(0.5, 0.7, shadow + 0.5 * f);
    if(length(pos) < 1.)col = mix(ink, col, shadow);

    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.x;
    vec3 col = render(uv);
	
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
