/*
 * Original shader from: https://www.shadertoy.com/view/XtyfDG
 */

// Title: Life (TokyoDemoFest 2018 GLSL Graphics Compo 2nd place)
// Copyright (c) 2018 setchi
// License: Attribution-NonCommercial-ShareAlike (http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US)

precision highp float;

#define SHADERTOY 0
#define PI 3.141592654
#define saturate(a) clamp(a, 0., 1.)
#define range(a, b) (step(a, floor(time2)) * step(floor(time2), b))

const int maxIteration = 128;
const float fmaxIteration = float(maxIteration);

uniform float time;
uniform vec2 resolution;

float time0 = 0., time1 = 0., time2 = 0., zoom = 0., a = 0.;
int iter = 0;

float box(vec3 p, float b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

vec3 hue(float hue) {
    vec3 rgb = fract(hue + vec3(0., 2. / 3., 1. / 3.));
    rgb = abs(rgb * 2. - 1.);
    return clamp(rgb * 3. - 1., 0., 1.);
}

float hash11(float p) {
    vec3 p3 = fract(vec3(p) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

mat2 rot1 = mat2(0.), rot2 = mat2(0.), rot3 = mat2(0.), rot4 = mat2(0.);

vec2 ifs(vec3 p) {
    float d1 = 999., d2 = 999.;
    float range = .8, radius = .5 * (1. + zoom);

    const float maxIter = 8.;
    for (int i = int(maxIter); i > 0; i--) {
        if (i <= iter) {
            break;
        }

        float ratio = float(i) / maxIter;
        float bx = box(p, radius * ratio);
        d1 = mix(d1, min(d1, bx), float(i > iter + 1));
        d2 = min(d2, bx);

        ratio *= ratio;

        p.xz = abs(p.xz) - range * ratio * .7;
        p.xz *= rot1;
        p.yz *= rot3;
        p.yx *= rot2;

        p.yz = abs(p.yz) - range * ratio * .7;
        p.xz *= rot1;
        p.yz *= rot4;
        p.yx *= rot2;
    }

    return vec2(d1, d2);
}

float map(vec3 p) {
    vec2 d = ifs(p);
    return mix(mix(d.y, d.x, a), mix(d.x, d.y, a), step(time0, 5.5));
}

float calcAo(vec3 p, vec3 n) {
    float sca = 1.0, occ = 0.0;

    for (float i = 0.; i < 5.; i++) {
        float hr = 0.05 + i * 0.08;
        float dd = map(n * hr + p);
        occ += (hr - dd) * sca;
        sca *= 0.5;
    }

    return saturate(1.0 - occ);
}

vec3 intersect(vec3 ro, vec3 ray) {
    float t = 0.0;
    
    for (int i = 0; i < maxIteration; i++) {
        float res = abs(map(ro + ray * t));
        if (res < 0.005) return vec3(t, res, i);
        t += res;
    }

    return vec3(-1.0);
}

vec3 normal(vec3 pos, float e) {
    vec2 eps = vec2(1.0, -1.0) * 0.5773 * e;

    return normalize(eps.xyy * map(pos + eps.xyy) +
                     eps.yyx * map(pos + eps.yyx) +
                     eps.yxy * map(pos + eps.yxy) +
                     eps.xxx * map(pos + eps.xxx));
}

mat3 createCamera(vec3 ro, vec3 ta, float cr) {
    vec3 cw = normalize(ta - ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize(cross(cw, cp));
    vec3 cv = normalize(cross(cu, cw));
    
    return mat3(cu, cv, cw);
}

float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(vec2 x) {
	vec2 i = floor(x), f = fract(x);

	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
	const mat2 m2 = mat2(0.8, -0.6, 0.6, 0.8);

	p.xy += 0.1 * time1;

	float f = 0.5000 * noise(p); p = m2 * p * 2.02;
	f += 0.2500 * noise(p); p = m2 * p * 2.03;
	f += 0.1250 * noise(p); p = m2 * p * 2.01;
	f += 0.0625 * noise(p);
	return f / 0.9375;
}

vec3 sky(vec3 ro, vec3 ray) {
    vec3 col = vec3(0.);

    float rd = ray.y + 0.3;
    col = mix(col, vec3(2.0, 0.25, 2.0), 0.5 * smoothstep(0.5, 0.8, fbm((ro.xz + ray.xz * (250000.0 - ro.y) / rd) * 0.000008)));
    col = mix(col, vec3(0.), pow(1.0 - max(rd, 0.0), 4.0));
    
    col = mix(vec3(0.), col, saturate(time1 * 3. - 4.));
    col = mix(col, vec3(0.), saturate(time1 - 5.25));
    return col * 1.3;
}

#define edge(start, end, sStart, sEnd, ecol) if (range(start, end) > 0.) { showEdge = 1.; float offs = pos.y - mix(sStart, sEnd, 0.025 + saturate(time2 - start)); edgeColor = ecol; edgeIntensity = mix(0., edgeIntensity, saturate(1. - abs(offs))); col = mix(col, objectColor, saturate(1. - (offs + 1.5))); }

vec3 render(vec2 p) {
    float t = time0 * 0.7 - 1.;
    float offs = mix(1., hash11(max(1., floor(t * 4.))), smoothstep(0., .5, time0));
    vec3 ro = vec3(cos(t * 3.5) * 11., sin(t * 3.9) * 4.5, sin(t * 1.5) * 10.) * 0.7;

    t = time1 * 0.7;
    offs = mix(mix(1., hash11(max(1., floor(t * 4.))), step(0., time1)), 1., step(4.6, time1));
    ro = mix(ro, vec3(cos(t * 1.5) * 11. * offs, sin(t * 2.) * 4. * offs * 2., sin(t * 1.5) * 20. * offs) * 0.9, smoothstep(0.7, 1., time1));
    ro = mix(ro, vec3(cos(t * 1.5) * 11., sin(t * 3.9) * 4., sin(t * 1.5) * 10.), smoothstep(4.6, 5.5, time1));
    ro = mix(ro, vec3(5., 3., 5.), saturate(time1 - 6.7));

    vec3 ta = vec3(0.0, 0.0, (sin(t * 0.55) * 0.5 + 0.5) * 2.0);
    ta = mix(ta, vec3(0.), saturate(time1 - 6.7));

    mat3 cm = createCamera(ro, ta, 0.);
    vec3 ray = cm * normalize(vec3(p, 4.0));

    vec3 res = intersect(ro, ray);
    if (res.y < -0.5) {
        return sky(ro, ray);
    }

    vec3 pos = ro + ray * res.x;
    vec3 nor = normal(pos, 0.008);

    float glowIntensity = saturate(pow(abs(1. - abs(dot(nor, ray))), 1.));
    vec3 objectColor = (vec3(.003, .001, .0095)
            * pow(1. / res.z * 1.5, -1.8) + glowIntensity * vec3(.1, .25, .3)) * res.x * 0.3
            * calcAo(pos, nor)
            + sky(ro, normalize(reflect(ray, nor))) * .4 * (1. - zoom);

    float a = smoothstep(0.3, 0.7, pow(fract(time0 * 3.), 0.4));
    float edgeThreshold = mix(0.02, 0.03, (1. - a) * (1. - zoom));
    float edgeIntensity = smoothstep(edgeThreshold - 0.01, edgeThreshold, length(nor - normal(pos, .015)));

    float noShade = range(-10., 3.);
    vec3 col = mix(objectColor, vec3(0.), noShade);

    float showEdge = 0.;
    vec3 edgeColor = vec3(1.);
    vec3 rainbow = hue(pos.z / 2.);
    edge(3., 3.5, -2., 2.2, hue(abs(offs) / 5. + .5) * 2.)
    edge(6., 6.5, -3.5, 2., rainbow)
    edge(5., 5.5, -3.5, 2., rainbow)
    edge(10., 10.5, -3.5, 2., rainbow)
    edge(11.5, 12., -3.5, 2.4, rainbow)

    if (time2 > 16.5) {
        showEdge = 1.;
        offs = pos.y - mix(-3.5, 4., saturate(time2 - 16.5));
        col = mix(objectColor, vec3(0.), saturate(1. - offs));
        edgeIntensity = mix(0., edgeIntensity, saturate(1. - (offs + .6)));
    }

    col += edgeColor * edgeIntensity * step(1., zoom + noShade + showEdge);
    col = mix(col, 1. - col, zoom);
    return col;
}

vec2 shake(float t) {
    float s = t * 50.0;
    return (vec2(hash11(s), hash11(s + 11.0)) * 2.0 - 1.0) * exp(-5.0 * t) * 0.2;
}

vec3 vignette(vec2 p) {
    p *= 1.0 - p.yx;
    return vec3(1.2, 1.1, .85) * pow(16. * p.x * p.y * (1. - p.x) * (1. - p.y), 0.125);
}

void entryPoint(in vec2 coord, in vec2 resolution, in float time, out vec4 color) {
    vec2 p = (coord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

    time0 = mod(time * 0.4, 11.);
    time1 = time0 - 11. / 4.;
    time2 = time1 * 0.7 * 4.;

    float t = time0 * 3.;
    iter = int(mix(clamp(14. - floor(t), 0., 7.), min(8., floor(t) - 24.), step(24., floor(t))));
    a = mix(1., smoothstep(0.3, 0.7, pow(fract(t), 0.4)), step(7.5, t));

    t = time1 * 3.;
    float angle = step(1.2, time1) * (floor(t + 0.5) + smoothstep(0.3, 0.7, pow(fract(t + 0.5), 0.4)));

    rot1 = rot(0.785397);
    rot2 = rot(1.7079);
    rot3 = rot(angle * 1.2 + 424. + step(7.035716, time0) * 3.);
    rot4 = rot(angle * 1.2 + 226.);

    zoom = range(8., 9.) + range(11., 11.5);

    p = mix(p, vec2(1. + hash11(p.y) * 10., p.y), saturate(time0 - 10.33) * 5.);
    p += shake(fract(time1 * 2.)) * 0.10;
    p *= 1.0 + 5. * pow(length(p), 1.5) * zoom;

    vec3 col = render(p);
    col *= vignette(coord.xy / resolution.xy);
    col = mix(col, vec3(0.), saturate(time0 - 10.33) * 10. + step(time, 0.));

    color = vec4(col, 1.0);
}

void
#if SHADERTOY == 1
mainImage(out vec4 fragColor, in vec2 fragCoord) { entryPoint(fragCoord.xy, iResolution.xy, iTime, fragColor); }
#else
main(void) { entryPoint(gl_FragCoord.xy, resolution.xy, time, gl_FragColor); }
#endif
