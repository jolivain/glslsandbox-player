/*
 * Original shader from: https://www.shadertoy.com/view/4lcBWX
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

// Protect glslsandbox uniform names
#define time        stemu_time

// Emulate a black texture
#define texture(s, uv) vec4(0.0)
#define texelFetch(s, a, b) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Here is analytic intersection and traversal of packed Gyrobifastigium polytopes.
// The Gyrobifastigium is also known as J26. More info: https://en.wikipedia.org/wiki/Gyrobifastigium

// This ray traversal works by finding the nearest J26 in a regular tiling
// and testing the ray against the inner sides of that J26. There are some scalings by sqrt(3)
// because the voxel traversal is done on 1x1x1 cells, but the J26 with an edge length of 1
// has a height of sqrt(3). Normalising to 1x1x1 first makes the math easier to manage.

// Other shaders that use the same general approach to traversal non-cuboid voxels:
//
// https://www.shadertoy.com/view/4lcfDB - Octahedral Voxel Tracing by fizzer
// https://www.shadertoy.com/view/XdSyzK - Hex grid traversal by mattz
// https://www.shadertoy.com/view/XdS3DG - Escher's Planaria by mattz
// https://www.shadertoy.com/view/XssfDN - Truncated Octohedron Voxel Scene by culdevu
//

#define AA 2 // Anti-aliasing factor

float time = 0.;

// Camera path
vec2 path(float z)
{
    vec2 p = vec2(0);
    p.x += cos(z / 4.) * 2. * sin(z / 6.) * .7 + cos(z / 2. + sin(z * .5) / 2.) * 3. * sin(z / 5.);
    p.y += sin(z / 3.) * 2. + cos(z / 5.) / 3. + sin(z / 5. + cos(z * 1.) / 3.) * 3.;
    return p;
}

// Voxel solid/empty function
float f(vec3 p)
{
    // Unscale to put p in to worldspace
    p.y *= sqrt(3.);
    
    vec3 op = p;
    p.xy += path(p.z);
    float d = -(length(p.xy) - 4.);
    op.z = mod(op.z, 21.) - 10.5;
    return d + cos(p.x * 80.) + cos(p.y * 180.);
}

// Ray intersection with inner sides of J26 (scaled in Y by 1 / sqrt(3))
float traceJ26int(vec3 o, vec3 r, float mint)
{
    // Intersect with XY and ZY planes of a cuboid. This gives
    // the intersections for the axis-aligned sides of the J26.
    
    vec2 bt1 = (step(vec2(0), r.xz) - .5 - o.xz) / r.xz;
    float bt = min(bt1.x, bt1.y);

    // Intersect with the other 4 (slanted) sides.
    
    float t0 = (.5 - o.x - o.y) / (r.x + r.y);

    if(t0 > mint)
        bt = min(bt, t0);

    float t1 = (.5 - o.y + o.x) / (r.y - r.x);

    if(t1 > mint)
        bt = min(bt, t1);

    float t2 = (.5 - o.z + o.y) / (r.z - r.y);

    if(t2 > mint)
        bt = min(bt, t2);   

    float t3 = (.5 + o.z + o.y) / (-r.z - r.y);

    if(t3 > mint)
        bt = min(bt, t3);

    return bt;
}

// Snap to the nearest J26 in the tiling, and orient the given ray direction
// to the local space of that J26. Also returns the ray origin in local space as oc,
// and the center of the J26 as c.
void classifyJ26(vec3 o, inout vec3 r, vec3 p, out vec3 c, out vec3 oc)
{
    // First quantise to the first grid
    
    vec3 fp = fract(p - mod(floor(p.y), 2.) * vec3(.5, 0, .5));

    c = p - fp + .5;
    oc = o - c;

    vec2 sv = fp.y < .5 ? (fp.zy - vec2(.5, 0)) : (fp.xy - vec2(.5, 1));

    if(abs(sv.x) > abs(sv.y))
    {
        // The query point is outside the J26 aligned to the first grid,
        // so use the second grid. The query point is guaranteed to be within the
        // J26 aligned to this second grid.
        
    	fp = fract(p + vec3(0, .5, .5) + mod(floor(p.y + .5), 2.) * vec3(.5, 0, .5));

        c = p - fp + .5;
        oc = (o - c).zyx;
        r = r.zyx;
        fp = fp.zyx;
    }
}

// Returns the surface normal of the nearest J26 at point p, scaled in Y
// by 1 / sqrt(3).
vec3 getNormalJ26(vec3 p)
{
    vec3 n;

    vec3 fp = fract(p - mod(floor(p.y), 2.) * vec3(.5, 0, .5));
    vec3 cp = fp - .5;

    // This normal vector calculation is similar to the calculation that would be done for
    // a cube, except that the separating planes are slanted, hence the addition of vec2(cp.y, 0).

    vec2 acp = abs(cp.xz) + vec2(cp.y, 0);
    vec2 ss = step(acp.yx, acp);

    n.xz = ss * sign(cp.xz);
    n.y = abs(fp.y > .5 ? n.x : n.z) * sign(cp.y);

    vec2 sv = fp.y < .5 ? (fp.zy -vec2(.5, 0)) : (fp.xy - vec2(.5, 1));

    if(abs(sv.x) > abs(sv.y))
    {
    	fp = fract(p + vec3(0, .5, .5) + mod(floor(p.y + .5), 2.) * vec3(.5, 0, .5));

        fp = fp.zyx;
        vec3 cp = fp - .5;

        vec2 acp = abs(cp.xz) + vec2(cp.y, 0);
        vec2 ss = step(acp.yx, acp);

        n.xz = ss * sign(cp.xz);
        n.y = abs(fp.y > .5 ? n.x : n.z) * sign(cp.y);
        n = n.zyx;
    }

    return n;
}

// Traces a ray
float trace(vec3 ro, vec3 rd, float maxt, out vec3 c)
{
    vec3 p = ro;

    float t0 = 0., t1;

    for(int i = 0; i < 64; ++i)
    {
        vec3 r = rd, oc;
        classifyJ26(ro, r, p, c, oc);

        t1 = traceJ26int(oc, r, t0);

        if(f(c) < 0.)
            break;

        p = ro + rd * (t1 + 1e-3);
        t0 = t1 + 1e-3;

        if(t0 > maxt)
            break;
    }

    return t0;
}

// Procedural 3D surface texture.
float tx(vec3 p)
{
    // Edge darkening.
    vec3 fp = vec3(1) - abs(fract(p) - .5) * 1.;
    fp *= fp * fp * fp;
    float s = 1. - fp.x * fp.y * fp.z * 4.;
    
    // Distortion
    for(int i = 0; i < 3; ++i)
        p += cos(p.yzx * 10.) * .1;
    
    // Noise
    return mix(.5, .8, smoothstep(texture(iChannel0, p / 1.5).r +
                                  texture(iChannel0, p * 1.5).r / 2., .1, .4)) * s;
}

vec3 image(vec2 fragCoord)
{
    vec4 fragColor;

    // Set up primary ray direction
    vec2 uv = fragCoord / iResolution.xy * 2. - 1.;
    vec2 t = uv.xy;
    t.x *= iResolution.x / iResolution.y;

    vec3 ro = vec3(0., 0., -time) + 1e-3, rd = normalize(vec3(t, 1.1));
    vec3 targ = ro;

    targ.z -= 4.;

    // Offset ray origin and camera target by path displacement
    ro.xy -= path(ro.z);
    targ.xy -= path(targ.z);

    // Camera coordinate system
    vec3 dir = normalize(targ - ro);
    vec3 left = normalize(cross(dir, vec3(0, 1, 0)));
    vec3 up = normalize(cross(left, dir));

    rd = rd.z * dir + rd.x * left + rd.y * up;

    // Scale the whole scene so each J26 fits in a 1x1x1 cell. This makes
    // the whole raytracing algorithm easier to manage.
    ro.y /= sqrt(3.);
    rd.y /= sqrt(3.);

    vec3 c;

    // Trace primary ray
    float dist = trace(ro, rd, 100., c);
    vec3 p = ro + rd * dist;

    vec3 n = getNormalJ26(p);
    
    // Unscale the normal to put it back in to worldspace.
    n.y *= sqrt(3.);
    n = normalize(n);

    // Directional shadow ray direction
    vec3 ld = normalize(vec3(1, 2, 3)) * 1.5;

    fragColor.a = 1.;

    // Distance darkening and directional light cosine term
    fragColor.rgb = vec3(exp(-dist / 5.) * pow(.5 + .5 * dot(n, normalize(ld)), 2.));

    // Colour selection
    float cs = (.5 + cos(c.z * 4. + 5. + c.x + c.y * 17.) * .5);

    // Apply colour
    fragColor.rgb *= mix(vec3(.1),
                         mix(vec3(0.1,0.1,1.), vec3(1,1,.1), step(.75, cs)), step(.1,cs));

    // Texture map
    float ts = tx(p - c);
    fragColor.rgb *= ts;
    fragColor.rgb += vec3(pow(ts, 4.)) * .03;

    // Trace directional shadow ray
    float st = trace(p + n * 2e-3, ld, length(ld) * 2., c);

    // Apply (attenuated) directional shadow
    fragColor.rgb *= mix(.2, 1., clamp(st / length(ld), 0., 1.));

    // Fake AO
    fragColor.rgb *= 1. - smoothstep(2., 5.8, distance(p.xy, -path(p.z)));

    // Specular highlight
    fragColor.rgb *= 1. + pow(clamp(dot(normalize(ld), reflect(rd,n)), 0., 1.), 4.) * 16.;

    // Fog
    fragColor.rgb = mix(vec3(.5), fragColor.rgb, exp(-dist / 1000.));

    return fragColor.rgb;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy * 2. - 1.;

    fragColor.rgb = vec3(0);

    // Multisampling loop
    for(int y = 0; y < AA; ++y)
        for(int x = 0; x < AA; ++x)
        {
            // Jittered time for motionblur
            time = iTime - texelFetch(iChannel1, ivec2(mod(fragCoord * float(AA) + vec2(x, y), 1024.)), 0).r * .02;
            fragColor.rgb += image(fragCoord + vec2(x, y) / float(AA));
        }

    fragColor.rgb /= float(AA * AA);

    // Vignette
    fragColor.rgb *= 1. - (pow(abs(uv.x), 5.) + pow(abs(uv.y), 5.)) * .3;

    // Tonemapping
    fragColor.rgb /= (fragColor.rgb + vec3(.4)) * .5;

    // Gamma
    fragColor.rgb = pow(clamp(fragColor.rgb, 0., 1.), vec3(1. / 2.2));
}




// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
