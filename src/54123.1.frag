/*
 * Original shader from: https://www.shadertoy.com/view/XlXSWB
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

// --------[ Original ShaderToy begins here ]---------- //
#define ENABLE_JOHNNY
#define ENABLE_LISA
// | Pretty big impact on performance! Disable if too slow or speech too intelligible
// V
#define ENABLE_CLOSED_CAPTIONS

#define PI     3.141592
#define TWO_PI 6.283185

#define MAX_ALPHA .9
#define NORMAL_EPSILON .001

// Compensate for distorted distance fields
#define STEP_SCALE 0.8

#define LOOP_DURATION 30.

// Globals!
float time_remapped = 0.;
vec3 johnny_pos = vec3(0.), johnny_dir = vec3(1.);
vec3   lisa_pos = vec3(0.),   lisa_dir = vec3(1.);

vec2 cursor_pos = vec2(4.);
float line_appear_time = 0.;
float new_lat = 1000.;
#define MAX_GLYPHS 35
vec4 glyphs[MAX_GLYPHS];
float glyph_count = 0.;

//#define GL(

vec4 _sp = vec4(0);
vec4 _A = vec4(0xc3c3c3,0xffffc3,0xe7c3c3,0x183c7e);
vec4 _B = vec4(0xe37f3f,0x7fe3c3,0xc3e37f,0x3f7fe3);
vec4 _C = vec4(0xe77e3c,0x303c3,0xc30303,0x3c7ee7);
vec4 _D = vec4(0xe37f3f,0xc3c3c3,0xc3c3c3,0x3f7fe3);
vec4 _E = vec4(0x3ffff,0x3f0303,0x3033f,0xffff03);
vec4 _F = vec4(0x30303,0x3f0303,0x3033f,0xffff03);
vec4 _G = vec4(0xe77e3c,0xf3c3c3,0xc303f3,0x3c7ee7);
vec4 _H = vec4(0xc3c3c3,0xffc3c3,0xc3c3ff,0xc3c3c3);
vec4 _I = vec4(0x187e7e,0x181818,0x181818,0x7e7e18);
vec4 _J = vec4(0x637f3e,0x606063,0x606060,0xf0f060);
vec4 _K = vec4(0x73e3c3,0xf1f3b,0x3b1f0f,0xc3e373);
vec4 _L = vec4(0x3ffff,0x30303,0x30303,0x30303);
vec4 _M = vec4(0xc3c3c3,0xdbc3c3,0xffffdb,0xc3c3e7);
vec4 _N = vec4(0xc3c3c3,0xf3e3c3,0xcfdffb,0xc3c3c7);
vec4 _O = vec4(0xe77e3c,0xc3c3c3,0xc3c3c3,0x3c7ee7);
vec4 _P = vec4(0x30303,0x3f0303,0xc3e37f,0x3f7fe3);
vec4 _Q = vec4(0x77fedc,0xc3dbfb,0xc3c3c3,0x3c7ee7);
vec4 _R = vec4(0x73e3c3,0x3f1f3b,0xc3e37f,0x3f7fe3);
vec4 _S = vec4(0xe77e3c,0x7ce0c3,0xc3073e,0x3c7ee7);
vec4 _T = vec4(0x181818,0x181818,0x181818,0xffff18);
vec4 _U = vec4(0xe77e3c,0xc3c3c3,0xc3c3c3,0xc3c3c3);
vec4 _V = vec4(0x7e3c18,0xc3c3e7,0xc3c3c3,0xc3c3c3);
vec4 _W = vec4(0xff7e24,0xdbdbdb,0xc3c3db,0xc3c3c3);
vec4 _X = vec4(0xc3c3c3,0x3c7ee7,0xe77e3c,0xc3c3c3);
vec4 _Y = vec4(0x181818,0x7e3c18,0xc3c3e7,0xc3c3c3);
vec4 _Z = vec4(0x3ffff,0x1c0e07,0xe07038,0xffffc0);
vec4 _gt = vec4(0x1c0e06,0xe07038,0x3870e0,0x60e1c);
vec4 _ap = vec4(0x0,0x0,0x60000,0x60606);
vec4 _co = vec4(0xc0e06,0xc,0x0,0x0);
vec2 glyph_spacing = vec2(10., 14.);

float get_bit(float data, float bit) {
    return step(1., mod(data / pow(2., bit), 2.));
}

vec4 glyph(vec4 data, float glyph_number, float scale, vec2 fragCoord) {
    fragCoord /= scale;
    fragCoord.x -= glyph_number * glyph_spacing.x;
    fragCoord -= vec2(8.);
    
    float transition_fac = smoothstep(new_lat - .1, new_lat, time_remapped);
    float alpha = step(abs(fragCoord.x - 4.), 6.) * step(fragCoord.y, 14.) * step(transition_fac * glyph_spacing.y - 2., fragCoord.y);;
    fragCoord.y -= transition_fac * glyph_spacing.y;
    fragCoord = floor(fragCoord);
    
    float bit = fragCoord.x + fragCoord.y * 8.;
    
    float bright;
    bright =  get_bit(data.x, bit      );
    bright += get_bit(data.y, bit - 24.);
    bright += get_bit(data.z, bit - 48.);
    bright += get_bit(data.w, bit - 72.);
    bright *= 1. - step(8., fragCoord.x);
    bright *= step(0., fragCoord.x);
    
    return vec4(vec3(bright), alpha);
}

void draw_glyphs(vec2 fragCoord, float scale, float a, inout vec3 col) {
    vec3 total = vec3(0.);
    float total_alpha = 0.;
    for(int i = 0; i < MAX_GLYPHS; i++) {
        float i_float = float(i);
        vec4 glyphcol = glyph(glyphs[i], i_float, scale, fragCoord);
        float alpha = step(line_appear_time + .05 * i_float, time_remapped);
        alpha *= glyphcol.a;
        alpha *= step(i_float, glyph_count - 1.);
        total = mix(total, glyphcol.rgb, alpha);
        total_alpha = max(total_alpha, alpha);
    }
    col = mix(col, total, total_alpha * a);
}

vec2 normalize_pixel_coords(vec2 pixel_coords) {
    return (pixel_coords * 2. - iResolution.xy) / iResolution.x;
}

float box_map(vec3 p, vec3 size, float radius) {
    size *= .5;
    vec3 temp = clamp(p, -size, size);
    return distance(p, temp) - radius;
}
float sphere_map(vec3 p, vec3 center, float radius) {
    return distance(p, center) - radius;
}

float walls_map(vec3 p, vec2 size) {
    p.xy = abs(p.xy) - size * .5;
    return -max(p.x, p.y);
}
float pillar_map(vec3 p, float radius) {
    return length(p.xy) - radius;
}
float shelf_map(vec3 p) {
    p.xy = mix(p.xy, vec2(-p.y, p.x), step(p.y, -p.x));
    
    float shelf_spacing = .33;
    float shelf_height = floor(p.z / shelf_spacing + .5) * shelf_spacing;
    
    float shelf_radius = .48 - .2 * p.z;
    float l = length(p.xy);
    vec3 shelf_point = vec3((p.xy / l) * min(l, shelf_radius), shelf_height);
    float shelf_distance = distance(p, shelf_point);
    
    float support_distance = distance(p.xy, vec2(clamp(p.x, shelf_radius - .04, shelf_radius), 0.));
    float back_distance    = distance(p.xy, vec2(min(p.x, .04), 0.));
    
    return min(shelf_distance, min(support_distance, back_distance)) - .02;
}
float couch_map(vec3 p) {
    
    // Seat
    vec2 seat_near_center = vec2(clamp(p.x, -.75, .75), -.0);
    seat_near_center.y += .2 / (pow(p.x, 2.) * 2. + 1.);
    
    vec2 p_rel = p.xy - seat_near_center;
    float l = length(p_rel);
    vec2 seat_edge = seat_near_center + (p_rel / l) * min(l, .42);
    float seat_distance = distance(p, vec3(seat_edge, min(p.z, .33 - l*l*.3))) - .02;
    
    // Back rest
    vec3 p_transf = p;
    p_transf.y += pow(p_transf.x, 2.) * .15;
    p_transf.x *= 1. - p_transf.y * .2;
    
    vec3 back_near_center = vec3(clamp(p_transf.x, -.86, .86), .6 + .15 * p_transf.z, min(p_transf.z, .72));
    p_rel = p_transf.yz - back_near_center.yz;
    l = length(p_rel);
    vec3 back_edge = vec3(back_near_center.x, back_near_center.yz + (p_rel / l) * min(l, .11));
    float back_distance = distance(p_transf, back_edge) - .03;
    
    // Back rest wrinkles
    
    p.x += .2;
    float wrinkle_skew = p.z - .6*p.x*p.x/p.z;
    float wrinkle = (sin((wrinkle_skew) * 60.) + 1.) * .005;
    wrinkle *= 1. / (pow(wrinkle_skew - .5, 2.) * 8. + 1.);
    wrinkle /= (pow(p.x, 4.)*5. + 1.);
    wrinkle *= smoothstep(.85, .7, p.z);
    wrinkle = smoothstep(-.05, .1, wrinkle) * .06;
    back_distance += wrinkle;
    
    return min(seat_distance, back_distance);
}
float curtain_map(vec3 p) {
    vec3 temp = vec3(clamp(p.x, -.6, .6), 0., p.z);
    float dist = distance(p, temp) - .2;
    dist += sin(p.x * 20. + sin(p.x * 6.2) * (5. + sin(p.z * 2.) * 3.)) * .03;
    return dist;
}
// These two are by the one and only iq
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h ) - r;
}
    
float person_map(vec3 p, float lisaness, out vec4 mat) {
    p.x = abs(p.x); // Symmetrical
    
    // Head
    float dist = distance(p, vec3(.0, .01, .0)) - .08;
    dist = smin(dist, distance(p, vec3(.0, .06, -.05)) - .01, .08);
    float jaw_dist = sdCapsule(p, vec3(.04, .02, -.10), vec3(0., .08, -.11), .005);
    dist = smin(dist, jaw_dist, .1);
    float cheek_dist = distance(p, vec3(.04, .04, -.04)) - .01;
    dist = smin(cheek_dist, dist, .05);
    float nose_dist = sdCapsule(p, vec3(.0, .09, -.03), vec3(0., .11, -.06), .002);
    dist = smin(dist, nose_dist, .04);
    
    float neck_dist = sdCapsule(p, vec3(.0, .0, -.06), vec3(.0, .0, -.20), .04);
    dist = smin(dist, neck_dist, .02);
    
    float mult = 3.;
    mat = vec4(1. * mult, .77 * mult, .65 * mult, 1.7);
    
    float eye_dist = length((p - vec3(.025, .10, -.02)) * vec3(1., 1., .8)) - .005;
    mat = mix(mat, vec4(0., 0., 0., 0.5), step(eye_dist, dist));
    dist = min(dist, eye_dist);
    
    float body_top = -.14;
    float body_radius = (p.z - body_top) * -.15 + .045;
    float l = length(p.xy);
    vec3 body_near = vec3(p.xy / l * min(l, body_radius), clamp(p.z, -.45, body_top));
    float body_dist = distance(p, body_near) - .005;
    body_dist = smin(body_dist, sdCapsule(p, vec3(.0, .0, -.15), vec3(.2, .0, -.3), .04), .02);
    
    vec4 body_mat = mix(vec4(.30, .25, .21, 2.9), vec4(2., .5, .6, 2.9), lisaness);
    mat = mix(mat, body_mat, step(body_dist, dist));
    dist = min(dist, body_dist);
    
    float stick_dist = distance(p, vec3(0., 0., clamp(p.z, mix(-.9, -1.4, lisaness), -.4))) - .02;
    mat = mix(mat, vec4(.9, .52, .3, .6), step(stick_dist, dist));
    dist = min(dist, stick_dist);

    return dist;
}
vec3 get_pos(vec3 p, vec3 dir_y) {
    vec3 dir_x = normalize(cross(dir_y, vec3(0., 0., 1.)));
    vec3 dir_z = normalize(cross(dir_x, dir_y));
    return vec3(dot(p, dir_x), dot(p, dir_y), dot(p, dir_z));
}
float anim_fac(float time, float start, float len) {
    return smoothstep(start, start + len, time);
}

// Material data: 3 channels & index
//   Index [0, 1) = smoothness; RGB = albedo
float map(in vec3 p, out vec4 mat) {
    float dist = walls_map(p - vec3(-.55, -.6, 0.), vec2(5.5, 5.8));
    mat = vec4(.77, .15, .16, 0.8);
    
    // Floor
    float new_dist;
    new_dist = p.z;
    mat = mix(mat, vec4(.5, .27, .14, 0.4), step(new_dist, dist));
    dist = min(dist, new_dist);
    
    
    // Pillars
    new_dist = min(pillar_map(p - vec3(.7, 2.3, 0.), .12), pillar_map(p - vec3(-2.14, 2.3, 0.), .12));
    mat = mix(mat, vec4(1.1, 1., .85, 0.5), step(new_dist, dist));
    dist = min(dist, new_dist);

    // Shelf
    new_dist = shelf_map(p - vec3(-3.3, 2.3, 0.));
    mat = mix(mat, vec4(0.2, 0.2, 0.2, 1.8), step(new_dist, dist));
    dist = min(dist, new_dist);
    
    // Door
    new_dist = box_map(p - vec3(-3.3, 1.3, 1.09), vec3(.05, .98, 2.16), .01);
    mat = mix(mat, vec4(.9, .8, .65, 0.5), step(new_dist, dist));
    dist = min(dist, new_dist);
    
    // Painting
    new_dist = box_map(p - vec3(-3.3, -.4, 1.5), vec3(.05, .8, .97), .01);
    mat = mix(mat, vec4(.9, .8, .65, 0.8), step(new_dist, dist));
    dist = min(dist, new_dist);
    
    // Couch
    new_dist = couch_map(p - vec3(.3, 1.0, 0.));
    mat = mix(mat, vec4(.76, .52, .33, .9), step(new_dist, dist));
    dist = min(dist, new_dist);

    // Curtains
    new_dist = curtain_map(p - vec3(-.8, 2.3, 1.5));
    mat = mix(mat, vec4(1., 1., 1., 3.), step(new_dist, dist));
    dist = min(dist, new_dist);

    // Johnny
    #ifdef ENABLE_JOHNNY
    vec4 new_mat = vec4(0.);
    new_dist = person_map(get_pos(p - johnny_pos, normalize(johnny_dir)), 0., new_mat);
    mat = mix(mat, new_mat, step(new_dist, dist));
    dist = min(dist, new_dist);
    #endif
    
    // Lisa
    #ifdef ENABLE_LISA
    new_dist = person_map(get_pos(p - lisa_pos, normalize(lisa_dir)), 1., new_mat);
    mat = mix(mat, new_mat, step(new_dist, dist));
    dist = min(dist, new_dist);
    #endif
    
    return dist;
}

vec3 map_normal(vec3 p, float map_dist, float epsilon) {
    vec4 mat;
    vec2 offset = vec2(epsilon, 0.);
    vec3 diff = vec3(
        map(p + offset.xyy, mat),
        map(p + offset.yxy, mat),
        map(p + offset.yyx, mat)
    ) - map_dist;
    return normalize(diff);
}

float coc_kernel(float width, float dist) {
    return smoothstep(width, -width, dist);
}

float soft_shadow(vec3 p, vec3 dir, float softness, float start_len) {
    float brightness = 1.;
    float len = start_len;
    vec4 mat;
    for (int i = 0; i < 10; i++) {
        float map_dist = map(p + dir * len, mat);
        float coc2 = len * softness;
        brightness *= 1. - coc_kernel(coc2, map_dist);
        len += map_dist * STEP_SCALE;
    }
    return clamp(brightness, 0., 1.);
}

float ao(vec3 p, vec3 normal) {
    float ao_size = .5;
    float brightness = 1.;
    float len = .05;
    vec4 mat;
    for (int i = 0; i < 3; i++) {
        float map_dist = map(p + normal * len, mat);
        brightness *= clamp(map_dist / len + len * ao_size, 0., 1.);
        len += map_dist;
    }
    return pow(brightness, .3);
}

vec3 shade_standard(vec3 albedo, float roughness, vec3 normal, vec3 light_dir, vec3 ray_dir) {
    
    float F0 = .5;
    float diffuse_specular_mix = .3;
    
    float nl = dot(normal, light_dir);
    float nv = dot(normal, -ray_dir);
    
    vec3 haf = normalize(light_dir - ray_dir);
    float nh = dot(normal, haf); 
    float vh = dot(-ray_dir, haf);

    vec3 diffuse = albedo*nl;

    // Cook-Torrance
    float a = roughness * roughness;
    float a2 = a * a;
    float dn = nh * nh * (a2 - 1.) + 1.;
    float D = a2 / (PI * dn * dn);

    float k = pow(roughness + 1., 2.0) / 8.;
    float nvc = max(nv, 0.);
    float g1v = nvc / (nvc * (1. - k) + k);
    float g1l = nl  / (nl  * (1. - k) + k);
    float G = g1l * g1v;

    float F = F0 + (1. - F0) * exp2((-5.55473 * vh - 6.98316) * vh);

    float specular = (D * F * G) / (4. /* * nl */ * nv);

    return mix(vec3(specular), diffuse, diffuse_specular_mix) * step(0., nl);
}

float length_pow(vec3 d, float p) {
    return pow(pow(d.x, p) + pow(d.y, p) + pow(d.z, p), 1. / p);
}

vec3 window_light_pos = vec3(-1., 1.8, 1.2);
vec3 light_standard(vec3 p, vec3 albedo, float roughness, vec3 normal, vec3 ray_dir, out float shadow) {
    vec3 surface_color = vec3(0.);
    vec3 light_pos;

    light_pos = window_light_pos;
    vec3 light_dir = normalize(light_pos - p);
    vec3 light_intensity;
    shadow = soft_shadow(p, light_dir, .1, .1);
    light_intensity = shade_standard(albedo, roughness, normal, light_dir, ray_dir) * shadow;
    surface_color += light_intensity * vec3(0.85, 0.8, 0.9) * .8;

    light_pos = vec3(-3., -.57, 1.6);
    light_dir = normalize(light_pos - p);
    light_intensity = shade_standard(albedo, roughness, normal, light_dir, ray_dir);
    surface_color += light_intensity * vec3(.4, .6, .8) * .1;

    light_pos = vec3(2., -1.17, 1.25);
    light_dir = normalize(light_pos - p);
    light_intensity = shade_standard(albedo, roughness, normal, light_dir, ray_dir);
    surface_color += light_intensity * vec3(1., 0.7, 0.5) * .4;
    
    return surface_color;
}

// Now branchless!
vec3 color_at(vec3 p, vec3 ray_dir, vec3 normal, vec4 mat) {
    
    // Standard shading
    float shadow = 1.;
    vec3 surface_color = light_standard(p, mat.rgb, fract(mat.a), normal, ray_dir, shadow);
    surface_color *= ao(p, normal);
    
    // Subsurface scattering
    vec3 light_dir = normalize(window_light_pos - p);
    float soft = .04;
    vec4 temp_mat;
    float light = smoothstep(-soft, soft, map(p + light_dir * soft, temp_mat));
    vec3 subsurface_color = pow(vec3(.7,.3,.1), vec3(1. / light));
    
    // Curtain (i.e. outrageously fake) shading
    vec3 wall_color = vec3(.3, .1, .1) * .3;
    float shade_fac = pow(dot(normal, vec3(0., -1., 0.)), 2.);
    shade_fac *= -dot(ray_dir, normal);
    float power = 2.;
    float windowness = pow(length_pow((p - vec3(-.8, 2.2, 2.)) * vec3(2., 1., 1.), 4.), 3.);
    vec3 transmission_color = pow(vec3(.3, .25, .2), vec3(windowness)) * 2.;
    vec3 curtain_color = mix(wall_color, transmission_color, shade_fac);

    float stripe = smoothstep(-.3, .3, sin((p.z + cos(p.x * 11.) * .02) * 200.)) * .8;
    vec3 stripe_color = vec3(.08, .05, .06) * shade_fac;
    stripe_color = mix(stripe_color, wall_color, .5 * pow(1. - shade_fac, 5.));
    curtain_color = mix(curtain_color, stripe_color, stripe);

    vec3 result = mix(surface_color, subsurface_color, .3 * step(1., mat.a));
    result = mix(result, mix(surface_color, subsurface_color, .05), step(2., mat.a));
    return mix(result, curtain_color, step(3., mat.a));
}

void animate() {
    // JOHNNY
    
    johnny_pos = vec3(-.41, 1.11, 1.24);
    johnny_dir = vec3(1., .5, .3);
    
    float fac = anim_fac(time_remapped, 0., .8);
    johnny_pos = mix(johnny_pos, vec3(-0.41,  1.16,   .86), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.20, -0.20), fac);
    
    fac = anim_fac(time_remapped, .7, .8);
    johnny_pos = mix(johnny_pos, vec3(-0.45,  1.15,  0.87), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.30, -0.20), fac);
    
    fac = anim_fac(time_remapped, 1.9, .7);
    johnny_pos = mix(johnny_pos, vec3(-0.48,  1.16,  0.85), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.30, -0.30), fac);
    
    fac = anim_fac(time_remapped, 2.8, .5);
    johnny_pos = mix(johnny_pos, vec3(-0.48,  1.16,  0.82), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.35, -0.15), fac);
    
    fac = anim_fac(time_remapped, 3.3, .6);
    johnny_pos = mix(johnny_pos, vec3(-0.48,  1.16,  0.84), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.37, -0.14), fac);
    
    fac = anim_fac(time_remapped, 4.6, .7);
    johnny_pos = mix(johnny_pos, vec3(-0.44,  1.16,  0.86), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.37, -0.20), fac);
    
    fac = anim_fac(time_remapped, 5.2, .8);
    johnny_pos = mix(johnny_pos, vec3(-0.46,  1.16,  0.85), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.30, -0.16), fac);
    
    fac = anim_fac(time_remapped, 5.9, .9);
    johnny_pos = mix(johnny_pos, vec3(-0.46,  1.16,  0.86), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.10, -0.18), fac);
    
    fac = anim_fac(time_remapped, 7.0, .6);
    johnny_pos = mix(johnny_pos, vec3(-0.48,  1.16,  0.87), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.30, -0.05), fac);
    
    fac = anim_fac(time_remapped, 7.9, .5);
    johnny_pos = mix(johnny_pos, vec3(-0.44,  1.16,  0.85), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.30, -0.10), fac);
    
    fac = anim_fac(time_remapped, 8.5, .6);
    johnny_pos = mix(johnny_pos, vec3(-0.44,  1.16,  0.86), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.35, -0.08), fac);
    
    fac = anim_fac(time_remapped, 9.0, 2.2);
    johnny_pos = mix(johnny_pos, vec3(-0.44,  1.15,  0.86), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00,  0.25, -0.06), fac);
    
    // You're lying; cut at 11.6
    
    fac = anim_fac(time_remapped, 11.5, 1.2);
    johnny_pos = mix(johnny_pos, vec3(-0.65, 0.66,  1.55), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 0.5, -0.02), fac);
    
    fac = anim_fac(time_remapped, 11.9, 1.2);
    johnny_pos = mix(johnny_pos, vec3(-0.66, 0.43, 1.55), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.7,  0.03), fac);
    
    fac = anim_fac(time_remapped, 13.3, .5);
    johnny_pos = mix(johnny_pos, vec3(-0.63, 0.46, 1.54), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.7,  -0.04), fac);
    
    // YOU'RE TEARING ME APART LISA
    
    fac = anim_fac(time_remapped, 14.4, .5);
    johnny_pos = mix(johnny_pos, vec3(-0.69, 0.47, 1.52), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, .6,  0.50), fac);
    
    fac = anim_fac(time_remapped, 15.0, .8);
    johnny_pos = mix(johnny_pos, vec3(-0.69, 0.47, 1.56), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, .5,  0.4), fac);
    
    fac = anim_fac(time_remapped, 15.7, .4);
    johnny_pos = mix(johnny_pos, vec3(-0.69, 0.47, 1.46), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.2,  0.3), fac);
    
    fac = anim_fac(time_remapped, 16.2, .7);
    johnny_pos = mix(johnny_pos, vec3(-0.70, 0.49, 1.54), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.3,  -.02), fac);
    
    // Do you understand life?
    
    fac = anim_fac(time_remapped, 18.8, 1.1);
    johnny_pos = mix(johnny_pos, vec3(-0.55, 0.70, 1.52), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.3,  -.10), fac);
    
    fac = anim_fac(time_remapped, 19.8, 1.2);
    johnny_pos = mix(johnny_pos, vec3(-0.50, 0.60, 1.28), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, 1.3,  -.3), fac);
    
    fac = anim_fac(time_remapped, 20.4, 1.);
    johnny_pos = mix(johnny_pos, vec3(-0.50, 1., 1.0), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, .2,  -.5), fac);
    
    // Do you?
    
    fac = anim_fac(time_remapped, 21.5, .8);
    johnny_pos = mix(johnny_pos, vec3(-0.45, 1., 1.0), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, .45,  -.6), fac);
    
    fac = anim_fac(time_remapped, 22.3, 1.);
    johnny_pos = mix(johnny_pos, vec3(-0.45, .995, 1.0), fac);
    johnny_dir = mix(johnny_dir, vec3( 1.00, .4,  -.7), fac);
    
    fac = anim_fac(time_remapped, 31., 5.);
    johnny_dir = mix(johnny_dir, vec3( -.7, -1., .8), fac);
    
    // LISA
    
    lisa_pos = vec3(.082, 1.37, .8);
    lisa_dir = vec3(-.9, -1., .5);
    
    fac = anim_fac(time_remapped, 3.2, .8);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.37, .8), fac);
    lisa_dir = mix(lisa_dir, vec3(-.7, -1., .5), fac);
    
    fac = anim_fac(time_remapped, 5., .9);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.35, .8), fac);
    lisa_dir = mix(lisa_dir, vec3(-.9, -1., .45), fac);
    
    fac = anim_fac(time_remapped, 6.4, .9);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.33, .8), fac);
    lisa_dir = mix(lisa_dir, vec3(-1., -1., .45), fac);
    
    fac = anim_fac(time_remapped, 8.8, .9);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.35, .8), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., .5), fac);
    
    fac = anim_fac(time_remapped, 9.7, .6);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.30, .83), fac);
    lisa_dir = mix(lisa_dir, vec3(-.4, -1., .35), fac);
    
    fac = anim_fac(time_remapped, 10.1, 1.1);
    lisa_pos = mix(lisa_pos, vec3(.082, 1.20, .75), fac);
    lisa_dir = mix(lisa_dir, vec3(-.3, -1., .10), fac);
    
    fac = anim_fac(time_remapped, 10.7, 1.0);
    lisa_pos = mix(lisa_pos, vec3(.08, .90, 1.00), fac);
    lisa_dir = mix(lisa_dir, vec3(-.7, -1., .10), fac);
    
    // Get up
    
    fac = anim_fac(time_remapped, 11.8, 1.2);
    lisa_pos = mix(lisa_pos, vec3(-.49, .83, 1.54), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., .05), fac);
    
    fac = anim_fac(time_remapped, 12.8, 1.5);
    lisa_pos = mix(lisa_pos, vec3(-.50, .82, 1.52), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., .05), fac);
    
    fac = anim_fac(time_remapped, 15.3, .7);
    lisa_pos = mix(lisa_pos, vec3(-.53, .82, 1.52), fac);
    lisa_dir = mix(lisa_dir, vec3(-.5, -1., .04), fac);
    
    fac = anim_fac(time_remapped, 16.0, 1.2);
    lisa_pos = mix(lisa_pos, vec3(-.54, .83, 1.52), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., .04), fac);
    
    // Why are you so hysterical?
    
    fac = anim_fac(time_remapped, 17.2, .5);
    lisa_pos = mix(lisa_pos, vec3(-.53, .85, 1.52), fac);
    lisa_dir = mix(lisa_dir, vec3(-.3, -1., .12), fac);
    
    fac = anim_fac(time_remapped, 18.0, .4);
    lisa_pos = mix(lisa_pos, vec3(-.53, .85, 1.51), fac);
    lisa_dir = mix(lisa_dir, vec3(-.4, -1., .15), fac);
    
    fac = anim_fac(time_remapped, 18.3, .7);
    lisa_pos = mix(lisa_pos, vec3(-.53, .85, 1.52), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., .12), fac);
    
    // Pushed
    
    fac = anim_fac(time_remapped, 19.3, 1.);
    lisa_pos = mix(lisa_pos, vec3(.34, 1.39, .75), pow(vec3(fac), vec3(1., 1., 2.)));
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., 2.2), fac);
    
    fac = anim_fac(time_remapped, 20.3, .7);
    lisa_pos = mix(lisa_pos, vec3(.34, 1.39, .80), fac);
    lisa_dir = mix(lisa_dir, vec3(-.6, -1., 2.0), fac);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float tiime = iTime;
    float small = step(iResolution.x, 400.);
    tiime = mix(tiime, tiime - 7., small);
    time_remapped = mix(tiime, tiime - LOOP_DURATION, step(LOOP_DURATION, tiime));
    vec2 mouse_normalized = normalize_pixel_coords(iMouse.xy);
    
    float camera_switch = 0.;
    camera_switch = mix(camera_switch, 1., step( 2.8, time_remapped));
    camera_switch = mix(camera_switch, 0., step( 7.2, time_remapped));
    camera_switch = mix(camera_switch, 1., step( 9.7, time_remapped));
    camera_switch = mix(camera_switch, 0., step(11.6, time_remapped));
    camera_switch = mix(camera_switch, 1., step(13.2, time_remapped));
    camera_switch = mix(camera_switch, 0., step(14.5, time_remapped));
    camera_switch = mix(camera_switch, 1., step(17.2, time_remapped));
    camera_switch = mix(camera_switch, 0., step(18.9, time_remapped));
    camera_switch = mix(camera_switch, 1., step(19.4, time_remapped));
    camera_switch = mix(camera_switch, 0., step(21.6, time_remapped));
    camera_switch = mix(camera_switch, 2. + .2 * (time_remapped - 24.), step(24.0, time_remapped));
    camera_switch = mix(camera_switch, mouse_normalized.x * 1.5 + .5, step(-.95, mouse_normalized.x));
    
    float camera1_transition  = anim_fac(time_remapped, 10.0, 0.1);
    float camera1_transition2 = anim_fac(time_remapped, 20.5, 0.1);
    float camera2_transition  = anim_fac(time_remapped, 12.5, 0.1);
    float camera2_transition2 = anim_fac(time_remapped, 19.4, 1.0);
    
    vec3 camera_pos = vec3(0., 0., 4.) + vec3(mouse_normalized.x * 2., 0., mouse_normalized.y * 8.);
    vec3 camera1_pos = mix(vec3(.832, .892, 0.90), vec3(.23, .79, 1.32), camera1_transition);
    camera1_pos = mix(camera1_pos, vec3(.6, .7, 0.90), camera1_transition2);
    vec3 camera2_pos = mix(vec3(-.67, .11, 1.12), vec3(-.22, .00, 1.45), camera2_transition);
    camera_pos = mix(camera1_pos, camera2_pos, camera_switch);

    vec3 camera_target = vec3(0., .5, 1.);
    vec3 camera1_target = mix(vec3(-1.62, 1.82, .64), vec3(-1.01, 0.47, 1.57), camera1_transition);
    camera1_target = mix(camera1_target, vec3(-0.55, 1.1, .95), camera1_transition2);
    vec3 camera2_target = mix(vec3(-0.17, 1.31, .70), vec3(-0.8, 1.06, 1.5), camera2_transition);
    camera2_target = mix(camera2_target, vec3(-0.17, 1.21, .70), camera2_transition2);
    camera_target = mix(camera1_target, camera2_target, camera_switch);
    
    vec3 camera_dir = normalize(camera_target - camera_pos);
    vec3 camera_right = normalize(cross(camera_dir, vec3(0., 0., 1.)));
    vec3 camera_up    = normalize(cross(camera_right, camera_dir));
    
    vec2 uv = normalize_pixel_coords(fragCoord);
    float fov = 80.;
    float camera1_fov = 33.4;
    float camera2_fov = 47.3;
    fov = mix(camera1_fov, camera2_fov, camera_switch);
    
    float ray_spread = tan((fov / 360. * TWO_PI) / 2.);
    vec3 ray_dir = camera_dir + ((uv.x * camera_right) + (uv.y * camera_up)) * ray_spread;
    ray_dir = normalize(ray_dir);
    
    animate();

    vec3 col = vec3(0., 1., 0.);
    
    float ray_len = 0.;
    float map_dist = 123.;
    int iters = 0;
    
    vec3 point;
    vec3 normal;
    vec4 mat;
    for (int i = 0; i < 100; i++) {
        if (ray_len > 100. || map_dist < .001) continue; 
        point = camera_pos + ray_len * ray_dir;
        map_dist = map(point, mat);
        ray_len += map_dist * STEP_SCALE;
    }
    
    normal = map_normal(point, map_dist, NORMAL_EPSILON);
    col = color_at(point, ray_dir, normal, mat);
    // Floor darkening
    col *= smoothstep(0., 2., point.z) * .8 + .2;
    // Ceiling darkening
    col *= smoothstep(3., 2., point.z);
    // Back darkening
    col *= smoothstep(-1.5, .5, point.y) * .8 + .2;
    // Behind couch darkening
    col *= smoothstep(.6, 0., dot(point.xy - vec2(1., 2.), normalize(vec2(1., 3.))));
    // Shelf corner darkening
    col *= smoothstep(1.3, 0., dot(point.xy - vec2(-2.5, 1.8), normalize(vec2(-1., 1.))));
    // Vignette
    col *= 1. - length_pow(vec3(uv, 0.), 4.) * .7;
    
    col *= 1.8;
    
    col *= smoothstep(0., 2., abs(tiime - LOOP_DURATION));
    col *= .7 * smoothstep(LOOP_DURATION * 2., LOOP_DURATION * 2. - 2., tiime) + .3;

    col.rgb = clamp(col.rgb, vec3(.015), vec3(.8));
    col.rgb = pow(col.rgb, vec3(.95, 1.07, 1.05) / 2.);
    
    #ifdef ENABLE_CLOSED_CAPTIONS
    
    glyphs[0] = _gt;
    glyphs[1] = _gt;
    glyphs[2] = _sp;
    glyphs[3] = _W;
    glyphs[4] = _H;
    glyphs[5] = _Y;
    glyphs[6] = _sp;
    glyphs[7] = _L;
    glyphs[8] = _I;
    glyphs[9] = _S;
    glyphs[10] = _A;
    glyphs[11] = _co;
    glyphs[12] = _sp;
    glyphs[13] = _W;
    glyphs[14] = _H;
    glyphs[15] = _Y;
    glyphs[16] = _sp;
    glyphs[17] = _L;
    glyphs[18] = _I;
    glyphs[19] = _S;
    glyphs[20] = _A;
    glyph_count = 21.;
    
    line_appear_time = 0.1;
    
    new_lat = 1.7;
    if (time_remapped > new_lat) {
        glyphs[0] = _P;
        glyphs[1] = _L;
        glyphs[2] = _E;
        glyphs[3] = _A;
        glyphs[4] = _S;
        glyphs[5] = _E;
        glyphs[6] = _sp;
        glyphs[7] = _T;
        glyphs[8] = _A;
        glyphs[9] = _L;
        glyphs[10] = _K;
        glyphs[11] = _sp;
        glyphs[12] = _T;
        glyphs[13] = _O;
        glyphs[14] = _sp;
        glyphs[15] = _M;
        glyphs[16] = _E;
        glyphs[17] = _co;
        glyphs[18] = _sp;
        glyphs[19] = _P;
        glyphs[20] = _L;
        glyphs[21] = _E;
        glyphs[22] = _A;
        glyphs[23] = _S;
        glyphs[24] = _E;
        glyph_count = 25.;
        line_appear_time = new_lat;
        new_lat = 4.4;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _Y;
        glyphs[1] = _O;
        glyphs[2] = _U;
        glyphs[3] = _ap;
        glyphs[4] = _R;
        glyphs[5] = _E;
        glyphs[6] = _sp;
        glyphs[7] = _P;
        glyphs[8] = _A;
        glyphs[9] = _R;
        glyphs[10] = _T;
        glyphs[11] = _sp;
        glyphs[12] = _O;
        glyphs[13] = _F;
        glyphs[14] = _sp;
        glyphs[15] = _M;
        glyphs[16] = _Y;
        glyphs[17] = _sp;
        glyphs[18] = _L;
        glyphs[19] = _I;
        glyphs[20] = _F;
        glyphs[21] = _E;
        glyph_count = 22.;
        line_appear_time = new_lat;
        new_lat = 5.7;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _Y;
        glyphs[1] = _O;
        glyphs[2] = _U;
        glyphs[3] = _sp;
        glyphs[4] = _A;
        glyphs[5] = _R;
        glyphs[6] = _E;
        glyphs[7] = _sp;
        glyphs[8] = _E;
        glyphs[9] = _V;
        glyphs[10] = _E;
        glyphs[11] = _R;
        glyphs[12] = _Y;
        glyphs[13] = _T;
        glyphs[14] = _H;
        glyphs[15] = _I;
        glyphs[16] = _N;
        glyphs[17] = _G;
        glyph_count = 18.;
        line_appear_time = new_lat;
        new_lat = 6.9;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _I;
        glyphs[1] = _sp;
        glyphs[2] = _C;
        glyphs[3] = _O;
        glyphs[4] = _U;
        glyphs[5] = _L;
        glyphs[6] = _D;
        glyphs[7] = _sp;
        glyphs[8] = _N;
        glyphs[9] = _O;
        glyphs[10] = _T;
        glyphs[11] = _sp;
        glyphs[12] = _G;
        glyphs[13] = _O;
        glyphs[14] = _sp;
        glyphs[15] = _O;
        glyphs[16] = _N;
        glyphs[17] = _sp;
        glyphs[18] = _W;
        glyphs[19] = _I;
        glyphs[20] = _T;
        glyphs[21] = _H;
        glyphs[22] = _O;
        glyphs[23] = _U;
        glyphs[24] = _T;
        glyphs[25] = _sp;
        glyphs[26] = _Y;
        glyphs[27] = _O;
        glyphs[28] = _U;
        glyphs[29] = _co;
        glyphs[30] = _sp;
        glyphs[31] = _L;
        glyphs[32] = _I;
        glyphs[33] = _S;
        glyphs[34] = _A;
        glyph_count = 35.;
        line_appear_time = new_lat;
        new_lat = 10.;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _gt;
        glyphs[1] = _gt;
        glyphs[2] = _sp;
        glyphs[3] = _Y;
        glyphs[4] = _O;
        glyphs[5] = _U;
        glyphs[6] = _ap;
        glyphs[7] = _R;
        glyphs[8] = _E;
        glyphs[9] = _sp;
        glyphs[10] = _S;
        glyphs[11] = _C;
        glyphs[12] = _A;
        glyphs[13] = _R;
        glyphs[14] = _I;
        glyphs[15] = _N;
        glyphs[16] = _G;
        glyphs[17] = _sp;
        glyphs[18] = _M;
        glyphs[19] = _E;
        glyph_count = 20.;
        line_appear_time = new_lat;
        new_lat = 12.2;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _gt;
        glyphs[1] = _gt;
        glyphs[2] = _sp;
        glyphs[3] = _Y;
        glyphs[4] = _O;
        glyphs[5] = _U;
        glyphs[6] = _ap;
        glyphs[7] = _R;
        glyphs[8] = _E;
        glyphs[9] = _sp;
        glyphs[10] = _L;
        glyphs[11] = _Y;
        glyphs[12] = _I;
        glyphs[13] = _N;
        glyphs[14] = _G;
        glyph_count = 15.;
        line_appear_time = new_lat;
        new_lat = 13.;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _I;
        glyphs[1] = _sp;
        glyphs[2] = _N;
        glyphs[3] = _E;
        glyphs[4] = _V;
        glyphs[5] = _E;
        glyphs[6] = _R;
        glyphs[7] = _sp;
        glyphs[8] = _H;
        glyphs[9] = _I;
        glyphs[10] = _T;
        glyphs[11] = _sp;
        glyphs[12] = _Y;
        glyphs[13] = _O;
        glyphs[14] = _U;
        glyph_count = 15.;
        line_appear_time = new_lat;
        new_lat = 14.5;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _Y;
        glyphs[1] = _O;
        glyphs[2] = _U;
        glyphs[3] = _ap;
        glyphs[4] = _R;
        glyphs[5] = _E;
        glyphs[6] = _sp;
        glyphs[7] = _T;
        glyphs[8] = _E;
        glyphs[9] = _A;
        glyphs[10] = _R;
        glyphs[11] = _I;
        glyphs[12] = _N;
        glyphs[13] = _G;
        glyphs[14] = _sp;
        glyphs[15] = _M;
        glyphs[16] = _E;
        glyphs[17] = _sp;
        glyphs[18] = _A;
        glyphs[19] = _P;
        glyphs[20] = _A;
        glyphs[21] = _R;
        glyphs[22] = _T;
        glyphs[23] = _co;
        glyphs[24] = _sp;
        glyphs[25] = _L;
        glyphs[26] = _I;
        glyphs[27] = _S;
        glyphs[28] = _A;
        glyph_count = 29.;
        line_appear_time = new_lat;
        new_lat = 17.2;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _gt;
        glyphs[1] = _gt;
        glyphs[2] = _sp;
        glyphs[3] = _W;
        glyphs[4] = _H;
        glyphs[5] = _Y;
        glyphs[6] = _sp;
        glyphs[7] = _A;
        glyphs[8] = _R;
        glyphs[9] = _E;
        glyphs[10] = _sp;
        glyphs[11] = _Y;
        glyphs[12] = _O;
        glyphs[13] = _U;
        glyphs[14] = _sp;
        glyphs[15] = _S;
        glyphs[16] = _O;
        glyphs[17] = _sp;
        glyphs[18] = _H;
        glyphs[19] = _Y;
        glyphs[20] = _S;
        glyphs[21] = _T;
        glyphs[22] = _E;
        glyphs[23] = _R;
        glyphs[24] = _I;
        glyphs[25] = _C;
        glyphs[26] = _A;
        glyphs[27] = _L;
        glyph_count = 28.;
        line_appear_time = new_lat;
        new_lat = 18.9;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _gt;
        glyphs[1] = _gt;
        glyphs[2] = _sp;
        glyphs[3] = _D;
        glyphs[4] = _O;
        glyphs[5] = _sp;
        glyphs[6] = _Y;
        glyphs[7] = _O;
        glyphs[8] = _U;
        glyphs[9] = _sp;
        glyphs[10] = _U;
        glyphs[11] = _N;
        glyphs[12] = _D;
        glyphs[13] = _E;
        glyphs[14] = _R;
        glyphs[15] = _S;
        glyphs[16] = _T;
        glyphs[17] = _A;
        glyphs[18] = _N;
        glyphs[19] = _D;
        glyphs[20] = _sp;
        glyphs[21] = _L;
        glyphs[22] = _I;
        glyphs[23] = _F;
        glyphs[24] = _E;
        glyph_count = 25.;
        line_appear_time = new_lat;
        new_lat = 21.7;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _D;
        glyphs[1] = _O;
        glyphs[2] = _sp;
        glyphs[3] = _Y;
        glyphs[4] = _O;
        glyphs[5] = _U;
        glyph_count = 6.;
        line_appear_time = new_lat;
        new_lat = 24.;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _gt;
        glyphs[1] = _gt;
        glyphs[2] = _sp;
        glyphs[3] = _T;
        glyphs[4] = _H;
        glyphs[5] = _E;
        glyphs[6] = _sp;
        glyphs[7] = _T;
        glyphs[8] = _O;
        glyphs[9] = _M;
        glyphs[10] = _M;
        glyphs[11] = _Y;
        glyphs[12] = _sp;
        glyphs[13] = _W;
        glyphs[14] = _I;
        glyphs[15] = _S;
        glyphs[16] = _E;
        glyphs[17] = _A;
        glyphs[18] = _U;
        glyphs[19] = _sp;
        glyphs[20] = _P;
        glyphs[21] = _U;
        glyphs[22] = _P;
        glyphs[23] = _P;
        glyphs[24] = _E;
        glyphs[25] = _T;
        glyphs[26] = _sp;
        glyphs[27] = _S;
        glyphs[28] = _H;
        glyphs[29] = _O;
        glyphs[30] = _W;
        glyph_count = 31.;
        line_appear_time = new_lat;
        new_lat = 28.;
    }
    
    if (time_remapped > new_lat) {
        glyphs[0] = _T;
        glyphs[1] = _H;
        glyphs[2] = _A;
        glyphs[3] = _N;
        glyphs[4] = _K;
        glyphs[5] = _S;
        glyphs[6] = _sp;
        glyphs[7] = _F;
        glyphs[8] = _O;
        glyphs[9] = _R;
        glyphs[10] = _sp;
        glyphs[11] = _W;
        glyphs[12] = _A;
        glyphs[13] = _T;
        glyphs[14] = _C;
        glyphs[15] = _H;
        glyphs[16] = _I;
        glyphs[17] = _N;
        glyphs[18] = _G;
        glyph_count = 19.;
        line_appear_time = new_lat;
        new_lat = 1e100;
    }

    draw_glyphs(fragCoord, mix(2., 1., small), mix(.5, .0, small), col);
    
    #endif
    
	fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
