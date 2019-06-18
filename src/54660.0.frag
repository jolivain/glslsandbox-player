/*
 * Original shader from: https://www.shadertoy.com/view/tls3WB
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
#define PI 3.1415926
#define fdist 0.3
#define iters 40
#define tol 0.005
#define maxdist 5.
#define gradient_eps 0.01

//shape parameters
//#define ring_count 7
//#define ringdiff 5.
#define min_rings 3.
#define max_rings 10.
#define levels 4
#define ratio 0.4
#define ring_offset 1.5
#define offsetdiff 0.8
#define indent 0.2
#define base_radius 2.
#define ao_radius 0.05
#define ao_min 0.2
#define repeat_offset 8.
#define laplace_factor 100.
#define reflections 1
#define reflection_eps 0.01
#define reflection_albedo 0.3
#define light_dir vec3(0.436436,0.872872,0.218218)
#define n1 1.0
#define n2 1.0
#define plane_height -2.
#define shadow_step 0.05
#define shadow_eps 0.01
#define shadow_iters 10
#define shadow_maxdist 1.5
#define shadow_sharpness 2.
#define ambient 0.2


float R0 = (n1-n2)/(n1+n2);

vec3 viridis_quintic( float x )
{
	x = clamp( x, 0.,1. );
	vec4 x1 = vec4( 1.0, x, x * x, x * x * x ); // 1 x x2 x3
	vec4 x2 = x1 * x1.w * x; // x4 x5 x6 x7
	return vec3(
		dot( x1.xyzw, vec4( +0.280268003, -0.143510503, +2.225793877, -14.815088879 ) ) + dot( x2.xy, vec2( +25.212752309, -11.772589584 ) ),
		dot( x1.xyzw, vec4( -0.002117546, +1.617109353, -1.909305070, +2.701152864 ) ) + dot( x2.xy, vec2( -1.685288385, +0.178738871 ) ),
		dot( x1.xyzw, vec4( +0.300805501, +2.614650302, -12.019139090, +28.933559110 ) ) + dot( x2.xy, vec2( -33.491294770, +13.762053843 ) ) );
}

vec2 sdTorus( vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    float d = length(q)-t.y;
    
    float theta = atan(p.x, p.z); //outer angle
    return vec2(d, theta);
}

float delay_sin(float t) {
    return cos(PI*((abs(mod(t, 2.)-1.)+t)*0.5-0.5));
}
float map(vec3 p) {
    //p = mod(p+0.5*repeat_offset, repeat_offset)-0.5*repeat_offset;
    //time-varying parameters (maybe replace with some inputs, or remove)
    float textureoffset = iTime*0.25;
    float final_offset;
    if (iMouse.w < 1.)
        final_offset = offsetdiff*delay_sin(iTime*0.5+1.) + ring_offset;
    else
        final_offset = (iMouse.y/iResolution.y-0.5)*3.+2.;
    float final_ratio = ratio/final_offset;
    
    float ringdiff = (max_rings-min_rings)*0.5;
    float ring_count = (max_rings+min_rings)*0.5;
    float final_ringcount;
    if (iMouse.z < 1.)
    	final_ringcount = ringdiff*delay_sin(iTime*0.5)+ring_count;
    else
    	final_ringcount = ringdiff*(iMouse.x/iResolution.x-0.5)*2. + ring_count;
    float sector = 2.*PI/(final_ringcount);
    float outerrad = base_radius;
    float innerrad = outerrad*final_ratio;
    vec2 h = sdTorus(p, vec2(outerrad, innerrad));
    float currindent = indent;
    vec2 minh = h;
    
    for (int i=0; i<levels; i++) {
        
        //mod polar coordinates
        float theta = mod(abs(h.y), sector)-sector/2.;
        
        //new cartesian coords
        float s = length(p.zx);
        p.z = cos(theta)*s - outerrad;
        p.x = sin(theta)*s;
        p = p.zxy;
        
        //new torus
        outerrad = innerrad*final_offset;        
        innerrad = outerrad*final_ratio;
        h = sdTorus(p, vec2(outerrad, innerrad));
        
        minh.x = max(minh.x, currindent-h.x);
        if (h.x < minh.x) {
            minh = h;
        }
        
        currindent = currindent * final_ratio * final_offset;
    }
    return minh.x;
}

vec4 gradient(in vec3 pos) {
    vec3 offset = vec3(-gradient_eps, 0.0, gradient_eps);
    float dx0 = map(pos+offset.xyy);
    float dxf = map(pos+offset.zyy);
    float dy0 = map(pos+offset.yxy);
    float dyf = map(pos+offset.yzy);
    float dz0 = map(pos+offset.yyx);
    float dzf = map(pos+offset.yyz);
    float ddd = map(pos);
    return vec4(normalize(vec3(dxf - dx0, dyf - dy0, dzf - dz0)), dx0+dxf+dy0+dyf+dz0+dzf-6.*ddd);
}

vec2 raymarch(vec3 pos, vec3 dir) {
    float d = 0.;
    float dist;
    for (int i=0; i<iters; i++) {
        dist = map(pos+d*dir);
        d += dist;
        if (dist < tol) {
            return vec2(d, 2.);
        } else if (dist > maxdist) {
            d = (plane_height-pos.y) / dir.y;
            return vec2(d, step(-d, 0.)*step(length((pos+d*dir).zx), 50.));
        }
    }
	return vec2(d,2.);
}

//softer soft shadows
//see https://www.shadertoy.com/view/4tBcz3
float shadowtrace(vec3 pos, vec3 dir) {
    float d = shadow_eps;
    float dist = map(pos+d*dir);
    float fac = 1.0;
    for (int i=0; i<shadow_iters; i++) {
        d += max(0.01, dist);
        dist = map(pos+d*dir);
        fac = min(fac, dist * shadow_sharpness / d);
    }
    return mix(mix(0.5, 0., -fac), mix(0.5, 1., fac), step(fac, 0.));
}

vec3 skycol(vec3 rd) {
    return vec3(0.6, 0.7, 0.8)*(1.+pow(max(dot(rd, light_dir), 0.), 2.)) + pow(max(0.,dot(rd, light_dir)), 5.);
}

float schlick(vec3 rd, vec3 n) {
    return 1.-(R0+(1.-R0)*pow(max(dot(n.xyz, -rd), 0.), 5.0));
}

vec3 material(vec3 ro, vec3 rd, vec4 n, vec2 record) {
    if (record.y > 1.5) {
        float edgefac = abs(n.w*laplace_factor);
        vec3 color = 1.-viridis_quintic(edgefac).yxz*0.5;
        float fac = max(ambient, dot(light_dir, n.xyz));
        //float ao = min(1.,ao_min+(record.z > ao_radius ? 1. : record.z/(ao_radius)));
        return fac*color;
    } else if (record.y > 0.5) {
        vec2 uv = (ro+rd*record.x).zx;
        uv = abs(mod(uv, 4.)-2.);
        float checker = abs(step(uv.x, 1.) - step(uv.y, 1.));
        return vec3(light_dir.y*(0.5+0.5*checker));
    } else {
        return skycol(rd);
    }
}

//materials with reflections
vec3 shade(vec3 ro, vec3 rd, vec4 n, vec2 record) {
    vec3 shadedcolor = material(ro, rd, n, record);
    if (record.y > 0.5) {
        float fac = shadowtrace(ro+rd*record.x, light_dir);
        shadedcolor *= max(ambient, fac);
    }
    if (record.y > 1.5) {
        float final_albedo = reflection_albedo;
        for (int i=0; i<reflections; i++) {
            if (record.y < 1.5) break;
            final_albedo *= schlick(rd, n.xyz);
            ro = ro+rd*record.x;
            rd = reflect(rd, n.xyz);
            ro += reflection_eps*rd;
            record = raymarch(ro, rd);
            n = gradient(ro+rd*record.x);
            shadedcolor += final_albedo * material(ro, rd, n, record);
        }
        //compute last reflections with just envmap
        if (record.y > 1.5) {
            final_albedo *= schlick(rd, n.xyz);
            shadedcolor += final_albedo * skycol(reflect(rd, n.xyz));
        }
    }
    return shadedcolor;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{    
    R0*=R0;
    //camera position
    float s = sin(iTime*0.5);
    float ww = iTime*0.2;
    vec3 ro = (3.-s)*vec3(cos(ww),0.5+0.5*s,sin(ww));
    vec3 w = normalize(vec3(0.,-1.5-s,0.)-ro);
    vec3 u = normalize(cross(w, vec3(0., 10., 0.)));
    vec3 v = cross(u, w);
    vec3 rd = normalize(w*fdist+(fragCoord.x/iResolution.x-0.5)*u+(fragCoord.y-iResolution.y/2.0)/iResolution.x*v);
	
    vec2 record = raymarch(ro, rd);
    vec4 n = gradient(ro+rd*record.x);
    vec3 shadedcolor = shade(ro, rd, n, record);
    
    fragColor = vec4(shadedcolor, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
