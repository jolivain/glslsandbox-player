/*
 * Original shader from: https://www.shadertoy.com/view/lsGcRV
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
const float INFINITY = 1.e20;
const float PI       = 3.1415;

// scene globals
vec3 light_pos;
vec3 origin;
vec3 target;
vec3 up;

// update scene
vec3 path(float time) {
    float x = time * 8.;
    return vec3(x, -2. - 1.5 * cos(x / 7. * PI), sin(iTime / 2.) * 2.);
}

void update_world() {
    light_pos = vec3(3.5 * cos(iTime / 3.), 3.5 * sin(iTime / 3.), 4.);
    origin = path(iTime);
    up = normalize(vec3(0., cos(origin.x / 7. * PI), 6.));
    light_pos = path(iTime + 1. + 0.8 * cos(iTime / 3.));
    light_pos.z = light_pos.z * 2.;
    target = light_pos;
    target.yz = mix(origin.yz, target.yz, 0.2);
}


// operations

float smootherstep(float e0, float e1, float x) {
    x = clamp((x - e0) / (e1 - e0), 0., 1.);
    return x * x * x * (x * (x * 6. - 15.) + 10.);
}

float smin(float a, float b, float k) {
    float h = smootherstep(0., 1., 0.5+0.5*(b-a)/k);
    return mix( b, a, h ) - k*h*(1.0-h);
}

vec3 repeat(vec3 pos, vec3 distance) {
    return mod(pos + 0.5 * distance, distance) - 0.5 * distance;
}

// produces n-1 steps of a staircase
float stairs(float a, float b, float r, float n) {
	float s = r/n;
	float u = b-r;
	return min(min(a,b), 0.5 * (u + a + abs ((mod (u - a + s, 2. * s)) - s)));
}

// primitives

float plane(vec3 pos) {
    return pos.z;
}

float sphere(vec3 pos, float radius) {
    return length(pos) - radius;
}

float cylinder(vec3 pos, vec3 axis, float radius) {
    return length(cross(pos, axis)) - radius;
}

// map function

vec2 map(vec3 pos) {
    vec3 abspos = pos;
    pos.z = -abs(pos.z);
    
    pos.y += 4. * pos.x / 7.;
    pos = repeat(pos, vec3(7., 8., 100.));
    
    return vec2(smin(
        stairs(
            cylinder(pos, vec3(0., 0., 1.), 1.),
            sphere(pos, 2.),
            2., 8.
        ),
        plane(pos + vec3(0., 0., 6. + cos(pos.x / 7. * PI * 4.) * cos(pos.y / 8. * PI * 4.) * 0.5)),
        3.
    ) * 0.8, 1.);
}

// rendering

vec2 march_ray_enhanced(vec3 origin, vec3 direction, float pixel_radius) {
    // see http://erleuchtet.org/~cupe/permanent/enhanced_sphere_tracing.pdf for details
    // ray marching parameters
    const float min_distance = .1;
    const float max_distance = 500.;
    const int max_iter = 50;
    const int max_smooth_iter = 4;
    
    // initial conditions
    float omega = 1.2;
    float distance = min_distance;
    float candidate_error = INFINITY;
    float candidate_distance = 0.;
    float candidate_material = 0.;
    float previous_radius = 0.;
    float advance_size = 0.;
    
    for (int i = 0; i < max_iter; i++) {
        // determine distance and material of closest-by object
        vec2 dist_mat = map(origin + direction * distance);
        
        // determine absolute radius for over-relaxation and error checks
        float radius = abs(dist_mat.x);
        
        // checks if we were progressing over-relaxed and if it failed
        bool failed_over_relaxed_advance = omega != 1.0 && (radius + previous_radius) < advance_size;

        // update the previous radius 
        previous_radius = radius;
        
        // calculate error as a screen space angle
        float error = radius / distance;
        
        // determines how far we should advance
        if (failed_over_relaxed_advance) {
            // if we failed, we have to step back to where normal advancement would've brought us
            advance_size -= advance_size * omega;
            omega = 1.;

        } else {
            advance_size = dist_mat.x * omega;
            
            // was this a better hit than the previous one?
            if (error < candidate_error) {
                candidate_distance = distance;
                candidate_error = error;
                candidate_material = dist_mat.y;
            }
            
            // did we hit something or the end of the ray
            if (error < pixel_radius || distance > max_distance) {
                break;
            }
        }
        
        // advance
        distance += advance_size;
    }
    
    if (distance > max_distance) {
        return vec2(INFINITY, -1.);
    }

    // post-processing on the hit point: a few iteration steps to get smooth coordinates
    for (int j = 0; j < max_smooth_iter; j++) {
        float allowable_error = pixel_radius * candidate_distance;
        candidate_distance += map(origin + direction * candidate_distance).x - allowable_error;
    }

    return vec2(candidate_distance, candidate_material);
}

vec3 estimate_normal(vec3 pos) {
    vec2 e = vec2(1.0,-1.0)*0.5773*0.05;
    
    // for four points on a cube, none of them
    // next to another, calculate the change
    // basically in any axis there are two points at +e and two points at -e
    // note that length(e) is sqrt(3 * e) for any point to get the actual change
    // in that axis you should divide by sqrt(3) (1/sqrt(3) = 0.5773)
    return normalize( e.xyy*map( pos + e.xyy ).x + 
					  e.yyx*map( pos + e.yyx ).x + 
					  e.yxy*map( pos + e.yxy ).x + 
					  e.xxx*map( pos + e.xxx ).x );
}

float hash( vec2 p ) {
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}

float shadow(vec3 p, vec3 light_dir, float mind, float maxd) {
    float d = mind;
    float dist;
    float res = 1.;

    for (int i = 0; i < 10; i++) {
        vec2 dist_mat = map(p + d * light_dir);
        dist = dist_mat.x;
        res = min(res, 4. * dist / d);
        d += clamp(dist, mind, mind * 10.);

        if (dist < 0.001 || d > maxd) {
          break;
        }
 
    }

    return clamp(res, 0., 1.);
}

// really cheap occlusion
// 0.0 = occluded, 1.0 = not occluded
float occlude(vec3 p, vec3 norm, float fewaf) {
    float dist = .1;
    float tot = 0.;
    
    for (int i = 1; i < 7; i++) {
        float try_dist = dist * float(i);
        float d = map(p + norm * try_dist).x;
        tot += (d / try_dist);
    }
    return clamp((tot - 2.) / 4., 0.0, 1.0);
    
}

vec3 render(vec3 origin, vec3 direction, float pixel_radius) {
    // cast our initial ray to determine what we'll hit
    vec2 dist_mat = march_ray_enhanced(origin, direction, pixel_radius);
    float distance = dist_mat.x;
    float material = dist_mat.y;
    
    vec3 hit = origin + direction * distance;
    
    // calculate a normal vector around the hit point and a reflection vector
    vec3 normal = estimate_normal(hit);
    vec3 reflect_dir = reflect(direction, -normal);
    
    // return the color (currently just based on total distance travelled through 2 reflections.
    //return (material > -0.5) ? vec3(10. / (dist_mat.x + reflect_dist_mat.x + rreflect_dist_mat.x)) : vec3(0.);
    if (material < 0.) {
        return vec3(0.02, 0.015, 0.01) * 0.5;
    }
    
    // basic phong shading
    vec3 light_dir = hit - light_pos;
    vec3 reflect_light_dir = reflect(normalize(light_dir), -reflect_dir);

    float diff = max(0.0, -dot(normal, normalize(light_dir)));
    float spec = pow(max(0.0, -dot(direction, reflect_light_dir)), 4.) * smoothstep(0., 1., diff * 10.);

    float occ = shadow(hit, -light_dir, 0.01, length(light_dir));
    float light_intensity = 40. * occ * pow(1. / length(light_dir), 2.);

    vec3 color = vec3(0.01) +
                 vec3(0.04) * diff * light_intensity +
                 vec3(0.8)  * spec * light_intensity;
    
    // occlusion
    color *= vec3(occlude(hit, normal, 0.04));
    
    // particle effect
    float z_plane = floor(hit.z * 100.) / 100.;

    float angle = atan(normal.y, normal.x) * ((hash(vec2(z_plane, 8.)) > .5) ? -1. : 1.);
    float expected_angle = hash(vec2(z_plane, 5.)) * 2. * PI + iTime * 2. * pow(hash(vec2(z_plane, 4.)), 2.);
    
    float h = hash(vec2(z_plane, 1.));
    float angle_from_lead = mod((angle - expected_angle + sin(hit.x * 0.1 * h) - cos(hit.y * 0.13 * h)) / 2. / PI, 1.);
    
    float brightness = pow(max(angle_from_lead - 0.9, 0.0) * 10., 4.);
    float fade = max(0.0, min(1.0, 5. * cos(iTime * 0.1 * hash(vec2(z_plane, 2.))) - 2. + 5. * hash(vec2(z_plane, 3.)) ));

    if (length(normal.xy) > 0.01) {
        color += brightness * fade * vec3(0.8, 0.5, 0.1) * length(normal.xy) * 2.;
    }
    
    // fog
    color = mix(vec3(0.02, 0.015, 0.01) * 0.5, color, exp(-distance * 0.1));
    
    // sphere glow
    vec3 sphere_diff = light_pos - origin;
    float sphere_dist = length(sphere_diff - direction * dot(sphere_diff, direction));
    color += smoothstep(-3.5, 0., distance - length(sphere_diff)) * min(1.0, exp(-(sphere_dist - 0.6) * 4.)) * vec3(1.);
    
    return color;
}

mat3 look_at(vec3 origin, vec3 target, vec3 reference_up, float tilt) {
    // note: I'm using a reference frame where Z is upwards, and X/Y a groundplane
    // direction the camera is looking at.
    // this function returns a transformation matrix that takes X/Y screenpos + Z depth into that reference frame
    vec3 direction = normalize(target - origin);

    // construct upwards pointing direction aligned frame
    vec3 side = normalize(cross(direction, reference_up));
    vec3 up   = cross(side, direction);
    
    // rotate around direction
    vec3 up_rotated   = cos(tilt) * up   - sin(tilt) * side;
    vec3 side_rotated = cos(tilt) * side + sin(tilt) * up;
    
    // construct reference frame.
    return mat3(side_rotated, up_rotated, direction);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // calculate scene
    update_world();
    
    // anti-aliasing oversampling
    const int AA = 1;
    // screen height / screen distance. 2 = 90deg, 1.15 = 60deg
    const float FOV_scale = 4.;
    
    // normalized cursor location
    //vec2 cursor = (2. * iMouse.xy - iResolution.xy) / iResolution.y;
            
    // approximate normalized projected pixel size. multiply by distance to get local projected pixel radius
    // Note that this is only really true for the center pixel, the sphere that fits in pixels further to the
    // outside gets smaller
    float pixel_radius = FOV_scale / iResolution.y / 2.;
    
    // camera location
    //vec3 origin = vec3(-10. * cos(cursor.x), -10. * sin(cursor.x), cursor.y * 5.);
    
    // camera to world transform matrix
    mat3 camera = look_at(origin, target, up, 0.);
    
    vec3 color = vec3(0.);
    for (int i = 0; i < AA; i++) {
        for (int j = 0; j < AA; j++) {
            
            // subpixel coordinates for anti-aliasing
            vec2 subpixel_coord = -0.5 + (0.5 + vec2(float(i), float(j))) / float(AA);   

            // map pixel location to a -1 to 1 field on the y axis, and an appropriately scaled x axis.
            // Scale this to control FoV (currently 90 deg)
            vec2 pixel_coord = FOV_scale * (fragCoord + subpixel_coord - 0.5 * iResolution.xy) / iResolution.y;
    
            // translate screenspace to worldspace and normalize pixel coordinate position
            vec3 direction = normalize(camera * vec3(pixel_coord, 1.));

            // render in that direction
            color += render(origin, direction, pixel_radius);
            
        }
    }
    
    color /= pow(float(AA), 2.);
    
    // gamma correct and write to output
    fragColor = vec4(pow(color, vec3(1. / 2.2)), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
