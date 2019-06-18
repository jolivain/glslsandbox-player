#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

/*
Original code: https://www.shadertoy.com/view/XltXWN
Collapsing Architecture
*/

#define SPEED .5
#define FOV 1.5

#define MAX_STEPS 100
#define EPS .00001
#define RENDER_DIST 10.
#define AO_SAMPLES 5.
#define AO_RANGE 10.

#define PI acos(-1.0)
#define saturate(x) clamp(x, 0., 1.)

float _twist = 0.;

// simple hash function
float hash(vec3 uv) {
  float f = fract(sin(dot(uv ,vec3(.009123898,.00231233, .00532234)))* 111111.5452313);
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
    for (int i = 0; i < 5; ++i) {
        f += noise((uv + 10.) * r) / (r *= 2.);
    }
    return f / (1. - 1. / r);
}

// rotate 2d space with given angle
void tRotate(inout vec2 p, float angel) {
    float s = sin(angel), c = cos(angel);
	p *= mat2(c, -s, s, c);
}

// dangerous distance-field invalidating space twisting function
void tTwist(inout vec3 p, float a) {
    tRotate(p.xy, p.z * a);
}

// repeat space along a single axis
float tRepeat1(inout float p, float r) {
    float id = floor((p + r * .5) / r);
    p = mod(p + r * .5, r) - r * .5;
    return id;
}

// repeat space along 2 axis
vec2 tRepeat2(inout vec2 p, vec2 r) {
    vec2 id = floor((p + r * .5) / r);
    p = mod(p + r * .5, r) - r * .5;
    return id;
}

// rectangle distance
float sdRect(vec2 p, vec2 r) {
    p = abs(p) - r;
	return min(max(p.x, p.y), 0.) + length(max(p, 0.));
}

// circle distance
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// union
float opU(float a, float b) {
    return min(a, b);
}

// substraction
float opS(float a, float b) {
    return max(a, -b);
}

// distance estimation of the scene
float map(vec3 p)
{
    // distort the scene
    tTwist(p, _twist);
    
    // repeat the scene along x and z axis
    tRepeat2(p.xz, vec2(.7, 1.));
    
    // mirror along x
    p.x = abs(p.x);
    
    // lower everything by .5
    p.y += .5;
    
    // add the wall
    float d = abs(p.z) - .15;
    
    // carve out the window
    float w = opU(sdCircle(p.xy - vec2(0, .75), .25), sdRect(p.xy - vec2(0, .375), vec2(.25, .375)));
    d = opS(d, w);
    
    // make space for the columns
    d = opS(d, sdRect(p.xy - vec2(0,.35), vec2(.45,.3)));
    
    // add the colums
    d = opU(d, sdCircle(p.xz - vec2(.35, 0), .075));
    
    // mirror along z
    p.z = abs(p.z);
    
    // remove extra wall at the column base and top
    d = opS(d, sdRect(p.yz - vec2(.6, .5), vec2(.6,.4)));
    
    // add the ceiling and the floor
    d = opU(d, -abs(p.y - .5) + .8);
    return d;
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

// calculate the normal vector
vec3 getNormal(vec3 p) {
    vec2 e = vec2(.0001, 0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
	));
}

// actually there is some mold in the corners of my room that I wanted to show,
// but for hygenic reasons I'm going to call this effect "ambient occlusion"
// algorithm from Shane
float calculateAO(vec3 p, vec3 n) {
    
    float r = 0., w = 1., d;
    
    for (float i = 1.; i <= AO_SAMPLES; i++){
        d = i / AO_SAMPLES / AO_RANGE;
        r += w * (d - map(p + n * d));
        w *= .5;
    }
    
    return 1.-saturate(r * AO_RANGE);
}

// check if the poin in question belongs to a column or the wall
bool isWall(vec3 p) {
    p.x += .35;
    tRepeat2(p.xz, vec2(.7, 1));
    return .375 < abs(p.y + .15) + length(p.xz);
}

// texture function
vec3 texture(vec3 p) {
    vec3 t;
    
    // apply the twist, so we don't use world coordinates
    tTwist(p, _twist);
    bool wall = isWall(p);
    
    // if we're in a column, apply distortion to the fbm space
    t = fbm((p + (wall ? 0. : .1 + .9 * fbm(p * 5.))) * vec3(5., 20., 5.)) * vec3(1., .7, .4) * .75
        + fbm(p * vec3(2., 10., 2.)) * vec3(1., .8, .5) * .25;
    
    // make the walls whiter
    if (wall) t = mix(t, vec3(1), .5);
    return saturate(t);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // transform screen coordinates
	vec2 uv = fragCoord.xy / resolution.xy * 2. - 1.;
    uv.x *= resolution.x / resolution.y;
    
    float time = time * SPEED;
    
    // the degree of distortion
    _twist = sin(time) * .4;
    
    // the camera follow a sinusoid path
    vec3 ro = vec3(sin(time * PI / 2. + 1.) * 1., 0, time);
    vec3 rd = normalize(vec3(uv, FOV));
    
    // the light source is two steps ahead of the camera
    time += 2.;
    vec3 light = vec3(sin(time * PI / 2. + 1.) * 1., 0, time);
    time -= 2.;
    
    // rotate camea and light to compensate for the twist
    tRotate(rd.xz, -cos(time * PI / 2. + 1.) * .5);
    tRotate(ro.xy, -ro.z * _twist);
    tRotate(light.xy, -light.z * _twist);
    tRotate(rd.xy, -ro.z * _twist);
    
    // march
    float steps, dist = trace(ro, rd, RENDER_DIST, steps); 
    
    // calculate hit point coordinates
    vec3 p = ro + rd * dist;
    
    // calculate normal
    vec3 normal = getNormal(p);
    
    // light direction
    vec3 l = normalize(light - p);
    
    // calculate shadow
    vec3 shadowStart = p + normal * EPS * 10.;
    float shadowDistance = distance(shadowStart,light);
    float shadowSteps, shadow = float(trace(shadowStart, l, shadowDistance, shadowSteps) > shadowDistance);
    
    // the fewer steps to march, the brighter the light
    // probably no basis in light theory, but I thought it looked good 
    shadow *= 1. - sqrt(shadowSteps / float(MAX_STEPS));
    
    // ambient light
    float ambient = .25;
    
    // diffuse light
    float diffuse = max(0., dot(l, normal));
    
    // specular light
    float specular = pow(max(0., dot(reflect(-l, normal), -rd)), 8.);
    
    // "ambient occlusion"
    float ao = calculateAO(p, normal);
    
    // add this all up
	fragColor.rgb = (ao * texture(p)) * (ambient + (specular + diffuse) * shadow);
    
    // edge glow
    fragColor *= sqrt(steps / float(MAX_STEPS));
    
    // fog
    fragColor = mix(fragColor, vec4(.9, .8, .7, 1.), saturate(dist * dist * .03));
    
    // gamma correction
    fragColor = pow(fragColor, vec4(1. / 2.2));
}

void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}  
