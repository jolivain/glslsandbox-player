/*
 * Original shader from: https://www.shadertoy.com/view/4sfcz2
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution
const vec4  iMouse = vec4(0.0);

// Emulate a texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
#define NOISY_PETALS 0
#define SPEED .1
#define FOV 2.7

#define MAX_STEPS 100
#define SHADOW_STEPS 100
#define SHADOW_SOFTNESS 50.
#define EPS .0001
#define RENDER_DIST 5.
#define AO_SAMPLES 5.
#define AO_RANGE 20.
#define LIGHT_COLOR vec3(1, .9, .8)

#define PI 3.14159265359
#define saturate(x) clamp(x, 0., 1.)

// simple hash function
float hash(vec3 uv) {
    float f = fract(sin(dot(uv, vec3(.08123898, .0131233, .0432234))) * 1e5);
    return f;
}

// 3d noise function (linear interpolation between hash of integer bounds)
float noise(vec3 uv) {
    vec3 fuv = floor(uv);
    vec4 cell0 = vec4(
        hash(fuv + vec3(0, 0, 0)),
        hash(fuv + vec3(0, 1, 0)),
        hash(fuv + vec3(1, 0, 0)),
        hash(fuv + vec3(1, 1, 0))
    );
    vec2 axis0 = mix(cell0.xz, cell0.yw, fract(uv.y));
    float val0 = mix(axis0.x, axis0.y, fract(uv.x));
    vec4 cell1 = vec4(
        hash(fuv + vec3(0, 0, 1)),
        hash(fuv + vec3(0, 1, 1)),
        hash(fuv + vec3(1, 0, 1)),
        hash(fuv + vec3(1, 1, 1))
    );
    vec2 axis1 = mix(cell1.xz, cell1.yw, fract(uv.y));
    float val1 = mix(axis1.x, axis1.y, fract(uv.x));
    return mix(val0, val1, fract(uv.z));
}

// fractional brownian motion
float fbm(vec3 uv) {
    float f = 0.;
    float r = 1.;
    for (int i = 0; i < 4; ++i) {
        f += noise((uv + 10.) * r) / (r *= 2.);
    }
    return f / (1. - 1. / r);
}

// rotate 2d space with given angle
void tRotate(inout vec2 p, float angel) {
    float s = sin(angel), c = cos(angel);
	p *= mat2(c, -s, s, c);
}

// divide 2d space into s chunks around the center
void tFan(inout vec2 p, float s) {
    float k = s / PI / 2.;
    tRotate(p, -floor((atan(p.y, p.x)) * k + .5) / k);
}

// box distance
float sdBox(vec3 p, vec3 r) {
    p = abs(p) - r;
	return min(max(p.x, max(p.y, p.z)), 0.) + length(max(p, 0.));
}

// sphere distance
float sdSphere(vec3 p, float r) {
	return length(p) - r;
}

// cylinder distance r - radius, l - height
float sdCylinder(vec3 p, float r, float l) {
    p.xy = vec2(abs(p.y) - l, length(p.xz) - r);
    return min(max(p.x, p.y), 0.) + length(max(p.xy, 0.));
}

// union
float opU(float a, float b) {
    return min(a, b);
}

// smooth union
float opSU(float a, float b, float k)
{
    float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
    return mix(b, a, h) - k * h * (1. - h);
}

// one big petal distance
float sdPetal(vec3 p) {
    float h = .0;
    float r = .02;
    return opU(sdBox(p, vec3(.2, h, .2)), sdCylinder(p + vec3(.2, 0, .2), .4, h)) - r * (.8 - length(p.xz));
}

// distance to 3 of those petals
float sd3Petals(vec3 p) {
    tFan(p.xz, 3.);
    p.z *= 1.5;
    p.x -= .2;
    tRotate(p.xz, -PI * 3. / 4.);
    return sdPetal(p) / 2.;
}

// two layers of petals on top of each othere
float sdAllPetals(vec3 p) {
    #if NOISY_PETALS
    vec3 q = p * 10. / length(p.xz * 5.);
    p.y += fbm(q) * .1 - .05;
    #endif
    p.y -= .05;
    float curve = dot(p.xz, p.xz) * 2.;
    p.y -= (curve * exp(-curve)) * .5;
    float d = sd3Petals(p);
    tRotate(p.xz, PI / 3.);
    p.y += .02;
    d = opU(d, sd3Petals(p));
    return d;
}

// distance to one of those little yellow things in the middle
float sdStyle(vec3 p) {
    return sdCylinder(p, 0., .2) - .015;
}

// all of those little yellow things together
float sdPistil(vec3 p) {
    tRotate(p.xz, -length(p.xz) * 4.);
    float d = sdStyle(p);
    tFan(p.xz, 6.);
    tRotate(p.xy, .5);
    d = opU(d, sdStyle(p));
    tFan(p.xz, 6.);
    tRotate(p.xy, .25);
    d = opU(d, sdStyle(p));
    return d;
}

// distance to one of those long tentacle things
float sdFilament(vec3 p) {
    float d = sdCylinder(p, 0., .4) - .005;
    p.x = abs(p.x) - .015 + p.y * .1 -.04;
    return opU(d, sdCylinder(p - vec3(0, .4, 0), .0, .02) - .015);
}

// distance to all of those long tentacle things
float sdStamen(vec3 p) {
    p.y -= dot(p, p) * .2;
    tRotate(p.xz, p.y * .5 + .1);
    tFan(p.xz, 6.);
    tRotate(p.xy, .8);
    tRotate(p.xz, PI / 3.);
    tFan(p.xz, 3.);
    tRotate(p.xy, .25);
    float d = sdFilament(p);
    return d;
}

// distance to one of those little petal like things at the base
float sdSepal(vec3 p) {
    float h = .0;
    float r = .01;
    return sdCylinder(p + vec3(.1, 0, .1), .2, h) - r;
}

// the base of the flower
float sdSepals(vec3 p) {
    tFan(p.xz, 3.);
    p.z *= 2.;
    p.x -= .2;
    tRotate(p.xz, -PI * 3. / 4.);
    return sdSepal(p) / 2.;
}

// distance to the base + the pedicel
float sdPedicel(vec3 p) {
    tRotate(p.xz, PI / 6.);
    return opSU(sdSepals(p - vec3(0, dot(p.xz, p.xz) * .6, 0)), sdCylinder(p + vec3(0, 2, 0), .1, 2.), .1);
}

// distance to the skybox
float sdSky(vec3 p) {
    return - sdSphere(p, 3.);
}

// distance estimation of everything together
float map(vec3 p) {
    float d = sdAllPetals(p);
    d = opU(d, sdPistil(p));
    d = opU(d, sdStamen(p));
    d = opU(d, sdPedicel(p));
    return opU(d, sdSky(p));
}

// trace the scene from ro (origin) to rd (direction, normalized)
// until hit or reached maxDist, outputs distance traveled and the number of steps
float trace(vec3 ro, vec3 rd, float maxDist, out float steps) {
    float total = 0.;
    steps = 0.;
    
    for (int i = 0; i < MAX_STEPS; ++i) {
        ++steps;
        float d = map(ro + rd * total);
        total += d;
        if (d < EPS || maxDist < total) break;
    }
    
    return total;
}

// get the soft shadow value
float softShadow(vec3 ro, vec3 rd, float maxDist) {
    float total = 0.;
    float s = 1.;
    
    for (int i = 0; i < SHADOW_STEPS; ++i) {
        float d = map(ro + rd * total);
        if (d < EPS) {
            s = 0.;
            break;
        }
        if (maxDist < total) break;
        s = min(s, SHADOW_SOFTNESS * d / total);
        total += d;
    }
    
    return s;
}

// calculate the normal vector
vec3 getNormal(vec3 p) {
    vec2 e = vec2(.0001, 0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
	));
}

// ambient occlusion
float calculateAO(vec3 p, vec3 n) {
    
    float r = 0., w = 1., d;
    
    for (float i = 1.; i <= AO_SAMPLES; i++){
        d = i / AO_SAMPLES / AO_RANGE;
        r += w * (d - map(p + n * d));
        w *= .5;
    }
    
    return 1.-saturate(r * AO_RANGE);
}

// use the distances to determine which material to use
int getMaterial(vec3 p) {
    int mat = -1;
    float dist = 5.;
    
    float currentDist = sdSky(p);
    if (currentDist < dist) {
        dist = currentDist;
        mat = 0;
    }
    currentDist = sdAllPetals(p);
    if (currentDist < dist) {
        dist = currentDist;
        mat = 1;
    }
    currentDist = sdPistil(p);
    if (currentDist < dist) {
        dist = currentDist;
        mat = 2;
    }
    currentDist = sdStamen(p);
    if (currentDist < dist) {
        dist = currentDist;
        mat = 3;
    }
    currentDist = sdPedicel(p);
    if (currentDist < dist) {
        dist = currentDist;
        mat = 4;
    }
    
    return mat;
}

// texture function
vec3 _texture(vec3 p, int mat) {
    vec3 q = p * 10. / length(p.xz * 4.);
    vec2 r = p.xz;
    tFan(r, 6.);
    r.y *= 2.;
    float petalGrad = smoothstep(.2, .4, distance(r, vec2(.5, 0)));
    		// sky
    vec3 t = (mat == 0) ? texture(iChannel0, p).rgb :
    		// petals
    		 (mat == 1) ? vec3(.8, 1, 2.)
                          - smoothstep(.0, .5, abs(.5 - fbm(q + fbm(q * 10.)))) * .5
                          - fbm(q * 10.) * .5
                          + dot(p.xz, p.xz) * .1
                          - petalGrad * .4:
    		// pistils
    		 (mat == 2) ? mix(vec3(2, 2, .7), vec3(5, 5, 3), smoothstep(.18, .25, length(p))) + fbm(p * 100.) * .1 :
    		// stamen
    		 (mat == 3) ? mix(vec3(.7, .7, 2.), vec3(2, 1.5, 2), smoothstep(.35, .42, length(p))) : 
    		// pedicel
    		 (mat == 4) ? mix(vec3(.2, .3, .1), vec3(.3, .2, .1), smoothstep(.0, .8, fbm(p * vec3(20., 5., 20.) + fbm(p * 50.)))) * .5
                 		  - fbm(p * vec3(50, 100, 50) + fbm(p * 200.) * 5.) * .2 : vec3(0);
    return (t);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // transform screen coordinates
	vec2 uv = fragCoord.xy / iResolution.xy * 2. - 1.;
    uv.x *= iResolution.x / iResolution.y;
    
    // transform mouse coordinates
	vec2 mouse = iMouse.xy / iResolution.xy * 2. - 1.;
    mouse.x *= iResolution.x / iResolution.y;
    mouse *= 10.;
    
    // set up camera position
    vec3 ro =  vec3(0, 0, -2);
    vec3 rd = normalize(vec3(uv, FOV));
    
    // set up light position
    vec3 light = vec3(-2, .4, 0);
    
    // rotate the camera
    vec2 rot = vec2(0);
    float tRot = iTime + mouse.x;
    rot = vec2(tRot * SPEED * PI, .7 + sin(tRot * SPEED * PI) * .3);
    
    tRotate(rd.yz, rot.y);
    tRotate(rd.xz, rot.x);
    tRotate(ro.yz, rot.y);
    tRotate(ro.xz, rot.x);
    
    // march
    float steps, dist = trace(ro, rd, RENDER_DIST, steps); 
    
    // calculate hit point coordinates
    vec3 p = ro + rd * dist;
    
    // calculate matetial
    int mat = getMaterial(p);
    
    // calculate normal
    vec3 normal = getNormal(p);
    
    // light direction
    vec3 l = normalize(light - p);
    
    // calculate shadow
    vec3 shadowStart = p + normal * EPS * 10.;
    float shadowDistance = distance(shadowStart,light);
    float shadow = (mat == 0) ? 1. : softShadow(shadowStart, l, shadowDistance);
    
    // ambient light
    float ambient = .5;
    
    // diffuse light
    float diffuse = max(0., dot(l, normal));
    
    // specular light
    float specular = pow(max(0., dot(reflect(-l, normal), -rd)), 4.);
    
    // "ambient occlusion"
    float ao = calculateAO(p, normal) * .5 + .5;
    
    // calculate texture
    vec3 tex = _texture(p, mat);
    
    // add this all up
    if (mat != 0)
		fragColor.rgb = (ao * tex * (ambient * (2. - LIGHT_COLOR) * .5 + (specular + diffuse) * shadow * LIGHT_COLOR));
    else
    	fragColor.rgb = tex;
    
    // add the cheesy dreamy glow
    fragColor += (steps / float(MAX_STEPS)) * (smoothstep(.0, 1., length(p)) + .5) * vec4(1., .9, .6, 1.);
    
    // gamma correction
    fragColor = pow(fragColor, vec4(1. / 2.2));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
