/*
 * Original shader from: https://www.shadertoy.com/view/3dSGDR
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
const vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)
#define texelFetch(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Similarly to IQ's procedural BVH (https://www.shadertoy.com/view/4tKBWy), here is
// a raytraced procedural Octree. This one is stackless, it traverses from the root on every
// node intersection.
// 
// Because it's an octree, the number of leaf nodes increases as 8^N where N is the tree depth, so
// a lot of boxes can be rendered with a small tree-descending loop.
//

// Ray-box intersection.
vec2 box(vec3 ro,vec3 rd,vec3 p0,vec3 p1)
{
    vec3 t0 = (mix(p1, p0, step(0., rd * sign(p1 - p0))) - ro) / rd;
    vec3 t1 = (mix(p0, p1, step(0., rd * sign(p1 - p0))) - ro) / rd;
    return vec2(max(t0.x, max(t0.y, t0.z)),min(t1.x, min(t1.y, t1.z)));
}

// Box surface normal.
vec3 boxNormal(vec3 rp,vec3 p0,vec3 p1)
{
    rp = rp - (p0 + p1) / 2.;
    vec3 arp = abs(rp) / (p1 - p0);
    return step(arp.yzx, arp) * step(arp.zxy, arp) * sign(rp);
}

float traceFirst(vec3 ro, vec3 rd, inout vec3 outn, inout float id)
{
	// Scene AABB.
    vec2 ob = box(ro, rd, vec3(-1), vec3(1));

    if(ob.y < ob.x || ob.x < 0.)
    {
        return -1.0;
    }

    float tt = max(0., ob.x);
    vec3 n = vec3(0, 1, 0);

    // March through the octree, one leaf node per step.
    for(int j = 0; j < 64; ++j)
    {
        if(tt > ob.y - 1e-5)
            break;

        vec3 p2 = ro + rd * tt;
        vec3 p = p2 + sign(rd) * 1e-4;
        vec3 p0 = vec3(-1), p1 = vec3(+1);

        id = 0.;

        // Traverse the octree from root, to classify the current march point.
        for(int i = 0; i < 4; ++i)
        {
            // Get centre point of node in worldspace.
            vec3 c = p0 + (p1 - p0) * (.5 + vec3(.4, .4, .4) * cos(id * vec3(1, 2, 3)));

            if(i < 2)
                c = p0 + (p1 - p0) * .5;

            // Classify the point within this node.
            vec3 o = step(c, p);

            // Concatenate the relative child index.
            id = id * 8. + dot(o, vec3(1, 2, 4));

            p0 = p0 + (c - p0) * o;
            p1 = p1 + (c - p1) * (vec3(1) - o);
        }

        // Test the leaf node for solidity.
        if(cos(id) < -.7)
        {
            n = (p2 - (p0 + p1) / 2.) / (p1 - p0);
            break;
        }
        
        vec2 b = box(ro, rd, p0, p1);
        tt = b.y;
    }

    // Get a 'bevelled' normal.
    outn = normalize(pow(abs(n), vec3(16)) * sign(n));

    return tt;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1 to +1)
    vec2 uv = fragCoord / iResolution.xy * 2. - 1.;

    // Aspect correction.
    uv.x *= iResolution.x / iResolution.y;

    // Primary ray.
    vec3 ro = vec3(0, -.1, 3.), rd = normalize(vec3(uv, -2.));

    float a;
    mat2 m;

    a = iMouse.z > 0. ? 1.7 - 1.7 * iMouse.y / iResolution.y : cos(iTime / 7.) / 3. + .5;
    m = mat2(cos(a), sin(a), -sin(a), cos(a));

    ro.yz *= m;
    rd.yz *= m;

    a = iMouse.z > 0. ? 0. - 2. * iMouse.x / iResolution.x : cos(iTime / 4.) + .5;
    m = mat2(cos(a), sin(a), -sin(a), cos(a));

    ro.xz *= m;
    rd.xz *= m;

	// Scene AABB.
    vec2 ob = box(ro, rd, vec3(-1), vec3(1));

    fragColor.rgb = vec3(.1);

    float id = 0.;
    vec3 n = vec3(0, 1, 0);
    float tt = traceFirst(ro, rd, n, id);

    float pt = (-1. - ro.y) / rd.y;
    vec3 ld = normalize(vec3(1, 3, 1));

    if(ob.y < ob.x || tt >= ob.y - 1e-5)
    {
        tt = pt;
        id = -1.;

        // Fake shadow.
        fragColor.rgb *= smoothstep(0., 2., length((ro + rd * tt).xz));
    }

    vec3 rp = ro + rd * tt;
    vec3 r = reflect(rd, n);

    if(id >= 0. && ob.x < ob.y)
    {
        fragColor.rgb = vec3(.5 + .5 * dot(ld, n));
        fragColor.rgb += pow(.5 + .5 * n.y, 2.) / 3.;

        if(id < 0.)
        {
            // Floor.
            fragColor.rgb *= .5;
        }
        else
        {
            // Cuboid.
            fragColor.rgb *= mix(mix(vec3(1, 1, .25), vec3(.25, .5, 1.), .5 + .5 * cos(id * 8.)),
                                 	vec3(.6), pow(.5 + .5 * cos(id * 19.), 4.));
        }

        // Envmap.
        fragColor.rgb = mix(fragColor.rgb, texture(iChannel0,r).rgb, mix(.02, .6, pow(1. - clamp(dot(-rd, n), 0., 1.), 2.)));

        // Fake shadow.
        fragColor.rgb *= pow(smoothstep(-.5, 1.4, length(rp)), 2.);
    }

    // Gamma.
    fragColor.rgb = pow(fragColor.rgb, vec3(1./2.2));
    
    // Dither.
    fragColor.rgb += texelFetch(iChannel1, ivec2(fragCoord) & 1023, 0).rgb / 200.;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
