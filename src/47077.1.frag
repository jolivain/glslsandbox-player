/*
 * Original shader from: https://www.shadertoy.com/view/4tKXzm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec3 iMouse = vec3(0.);

// --------[ Original ShaderToy begins here ]---------- //
#define SPEED .1
#define FOV 3.
#define SLICES 12.
#define CAKE_POS .15

#define MAX_STEPS 100
#define SHADOW_STEPS 100
#define SHADOW_SOFTNESS 50.
#define EPS .0001
#define RENDER_DIST 5.
#define AO_SAMPLES 5.
#define AO_RANGE 20.
#define LIGHT_COLOR vec3(1.,.5,.3)

#define PI 3.14159265359
#define saturate(x) clamp(x, 0., 1.)

// simple hash function
float hash(vec3 uv) {
    float f = fract(sin(dot(uv, vec3(.09123898, .0231233, .0532234))) * 1e5);
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

// repeat space along an axis
float tRepeat1(inout float p, float r) {
    float id = floor((p + r * .5) / r);
    p = mod(p + r * .5, r) - r * .5;
    return id;
}

// divide 2d space into s chunks around the center
void tFan(inout vec2 p, float s) {
    float k = s / PI / 2.;
    tRotate(p, -floor((atan(p.y, p.x)) * k + .5) / k);
}

// rectangle distance
float sdRect(vec2 p, vec2 r) {
    p = abs(p) - r;
	return min(max(p.x, p.y), 0.) + length(max(p, 0.));
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

// intersection
float opI(float a, float b) {
    return max(a, b);
}

// substraction
float opS(float a, float b) {
    return max(a, -b);
}

// smooth union
float opSU(float a, float b, float k)
{
    float h = clamp(.5 + .5 * (b - a) / k, 0., 1.);
    return mix(b, a, h) - k * h * (1. - h);
}

// the icing on the cake
float sdIcingOnTheCake(vec3 p) {
    
    // twist
    tRotate(p.xz, p.y * 3.);
    
    // add an infinite box
    float d = sdRect(p.xz, vec2(.4));
    
    // add another box, rotated by 45 degrees, smoothly
    tRotate(p.xz, PI / 4.);
    d = opSU(d, sdRect(p.xz, vec2(.4)), .1);
    
    // add a slope
    d += p.y + .2;
    
    // divide the distance, because by now it has been ruined, then intersect smoothly with a sphere
    d = -opSU(-d * .5, -sdSphere(p, .5), .1);
    return d;
}

// distance estimation of everything together
float map(vec3 p) {
    vec3 q = p;
    
    // rounded cylinder for the cake
    float r = .02;
    float d = sdCylinder(p, .5 - r, .2 -r) - r;
    
    // blend in the icing
    tFan(q.xz, SLICES);
	d = opSU(d, sdIcingOnTheCake((q - vec3(.4, .28, 0)) * 5.) / 5., .04);
    
    // cut the cake
    tRotate(p.xz, PI / SLICES);
    float slice = p.z;
    float a = fract((floor(iTime * SPEED * SLICES)) / SLICES - .5) * PI * 2.;
    tRotate(p.xz, a);
    slice = (a < PI) ? opU(slice, p.z) : opI(slice, p.z);
    return opS(d, slice);
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

// texture function
vec3 _texture(vec3 p) {
    vec3 q = p;
    q.y += .05;
    tRepeat1(q.y, .095);
    vec3 t = mix(fbm(fbm(p * 10.) + p * 10.) * vec3(.5) + vec3(.5),
                fbm(p * 100.) * vec3(.5, .0, .0),1. - 
                saturate((opI(sdCylinder(p, .5, .175),sdCylinder(q, .48, .035)) + (fbm(p * 100.)- .5) * .02 ) * 100.));
    return saturate(t);
}

// texture used for bump mapping
float bumpTexture(vec3 p) {
    vec3 q = p;
    q.y += .05;
    tRepeat1(q.y, .095);
    float t = mix(fbm(fbm(p * 20.) + p * 10.) * .5 + .25,
                fbm(p * 100.), 1. - 
                saturate((opI(sdCylinder(p, .5, .175),sdCylinder(q, .48, .035)) + (fbm(p * 100.)- .5) * .02 ) * 100.));
    return saturate(t);
}

// bump mapping from Shane
vec3 doBumpMap(vec3 p, vec3 nor, float bumpfactor) {
    
    vec2 e = vec2(.0001, 0);
    float ref = bumpTexture(p);                 
    vec3 grad = vec3(bumpTexture(p - e.xyy) - ref,
                     bumpTexture(p - e.yxy) - ref,
                     bumpTexture(p - e.yyx) - ref) / e.x;
             
    grad -= nor * dot(nor, grad);          
                      
    return normalize(nor + grad * bumpfactor);
	
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // transform screen coordinates
	vec2 uv = fragCoord.xy / iResolution.xy * 2. - 1.;
    uv.x *= iResolution.x / iResolution.y;
    
    // transform mouse coordinates
	vec2 mouse = iMouse.xy / iResolution.xy * 2. - 1.;
    mouse.x *= iResolution.x / iResolution.y;
    mouse *= 2.;
    
    // set up camera position
    vec3 ro =  vec3(0, 0, -2);
    vec3 rd = normalize(vec3(uv, FOV));
    
    // light is relative to the camera
    vec3 light = ro + vec3(-.6, .1, -.1);
    
    vec2 rot = vec2(0);
    if (iMouse.z > 0.) {
    	// rotate the scene using the mouse
        rot = -mouse;
    } else {
        // otherwise rotate constantly as time passes
        rot = vec2(-iTime * SPEED * PI + .3, .5);
    }
    
    tRotate(rd.yz, rot.y);
    tRotate(rd.xz, rot.x);
    tRotate(light.yz, rot.y);
    tRotate(light.xz, rot.x);
    tRotate(ro.yz, rot.y);
    tRotate(ro.xz, rot.x);
    
    // march
    float steps, dist = trace(ro, rd, RENDER_DIST, steps); 
    
    // calculate hit point coordinates
    vec3 p = ro + rd * dist;
    
    // calculate normal
    vec3 normal = getNormal(p);
    normal = doBumpMap( p, normal, .01);
    
    // light direction
    vec3 l = normalize(light - p);
    
    // calculate shadow
    vec3 shadowStart = p + normal * EPS * 10.;
    float shadowDistance = distance(shadowStart,light);
    float shadow = softShadow(shadowStart, l, shadowDistance);
    
    // ambient light
    float ambient = .25;
    
    // diffuse light
    float diffuse = max(0., dot(l, normal));
    
    // specular light
    float specular = pow(max(0., dot(reflect(-l, normal), -rd)), 4.);
    
    // "ambient occlusion"
    float ao = calculateAO(p, normal) * .5 + .5;
    
    // add this all up
	fragColor.rgb = (ao * _texture(p)) * (ambient * (2. - LIGHT_COLOR) * .5 + (specular + diffuse) * shadow * LIGHT_COLOR);
    
    // fog
    vec4 fogColor = vec4(vec3(0,.01,.014) * (2. - length(uv)), 1.);
    fragColor = mix(fragColor, fogColor, saturate(dist * dist * .05));
    
    // if we passed the cake, then apply a dark glow, this makes the cake pop out
    if (length(p) > .6) 
        fragColor *= saturate(1. - sqrt(steps / float(MAX_STEPS)) * 1.5);
    
    // gamma correction
    fragColor = pow(fragColor, vec4(1. / 2.2));
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec3(mouse * resolution, 1.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
