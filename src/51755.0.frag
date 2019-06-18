/*
 * Original shader from: https://www.shadertoy.com/view/WdfGzj
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
#define texelFetch(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// Here is a method to do a sort of physics "simulation" without needing to store anything
// between frames. The ball paths are split in to parabolic arcs, one arc for each sphere-disc
// collision.
//
// This allows for cool effects such as making time go backwards. Change the GO_BACKWARDS
// macro to 1 to see this in action.
//
// This approach was used in this 4kb demo too: http://www.pouet.net/prod.php?which=71550

#define NUM_SPHERES		18
#define GO_BACKWARDS	0

float time = 0.;

vec4 discP[5];
vec3 discN[5];
vec4 spheres[NUM_SPHERES];

// Ray vs. sphere intersection
vec2 intersectSphere(vec3 ro, vec3 rd, vec3 org, float rad)
{
    float a = dot(rd, rd);
    float b = 2. * dot(rd, ro - org);
    float c = dot(ro - org, ro - org) - rad * rad;
    float desc = b * b - 4. * a * c;
    
    if (desc < 0.)
        return vec2(1, 0);

    return vec2((-b - sqrt(desc)) / (2. * a), (-b + sqrt(desc)) / (2. * a));
}

vec3 traceSpherePath(int index, out float radscale)
{
    // Set up initial position and velocity
    vec3 origin = vec3(0, 2, 0);
    vec3 initial_velocity = vec3(.6, 1.5 + cos(float(index)) * .4, 0);

    // Rotate velocity
    float ya = float(index);
    initial_velocity.xz *= mat2(cos(ya), sin(ya), -sin(ya), cos(ya));
    
    // Gravity
    vec3 acceleration = vec3(0, -1.2, 0) * 3.;

    vec3 pos, norm;

    float tt = time + float(index)*.2;

    float lifetime = 2.5;
    tt = mod(tt, lifetime);
    radscale = 1.;
    radscale = smoothstep(0., .1, tt) - smoothstep(lifetime - .1, lifetime, tt);

    float rad;

    // Go through the whole particle motion up to the current timepoint, one parabolic arc at a time.
    // Gravity is kept constant, so acceleration is not changed.
    for(int j = 0; j < 3; ++j)
    {
        float minq = tt;

        // Candidate arc resulting from a collision
        vec3 new_origin, new_initial_velocity;

        for(int i = 0; i < 5; ++i)
        {
            pos = discP[i].xyz;
            rad = discP[i].w;
            norm = discN[i];

            // Set up a quadratic equation representing the intersection of the current
            // parabolic arc with the plane which this disc lies on.
            // This works because the arc of motion lies in a plane. The intersection of that
            // plane with the disc's plane is a line. This line can be projected back in to the
            // arc's plane and the intersection test then becomes a test for intersection between
            // a parabola and a line in 2D, which is a quadratic equation.
            float b = initial_velocity.y + dot(initial_velocity.xz, norm.xz) / norm.y;      
            float d = b * b - acceleration.y * dot(origin - pos, norm) / norm.y * 4.;            
            float q = (-b - sqrt(d)) / acceleration.y / 2.;

            if(d > 0.)
            {
                // The equation has a real root
                vec3 o = origin + initial_velocity * q + acceleration * q * q;

                if(q > 0.&& q < minq && length(o - pos) < rad)
                {
                    // The intersection timepoint is valid, and the intersection point is
                    // contained by the disc. So, update the collision candidate.
                    new_origin = o;
                    new_initial_velocity = reflect(initial_velocity + acceleration * q * 2., norm) * .6;
                    minq = q;
                }
            }
        }

        if(tt>minq)
        {
            // The current arc collided with a disc, so replace it
            // with a new arc representing the deflected particle motion.
            origin = new_origin;
            initial_velocity = new_initial_velocity;
            tt -= minq;
        }
        else
            break;
    }

    // Calculate the final particle position by evaluating the final parabola.
    pos = origin + initial_velocity * tt + acceleration * tt * tt;

    return pos;
}

// Returns an attentuated shadow amount and intersection distance of ray
vec2 traceDiscs(vec3 ro, vec3 rd, float cone, out vec3 mn, float time)
{
    float l = 1.;
    float mt = 1e4, t, w, d;
    float rad;
    vec3 pos, norm;
    for(int i = 0; i < 5; ++i)
    {
        pos = discP[i].xyz;
        rad = discP[i].w;
        norm = discN[i];
        t = dot(pos - ro, norm) / dot(rd, norm);
        if(t > 0.)
        {
            w = t * cone;
            d = length(ro + rd * t - pos) - rad;
            l *= smoothstep(-w, w, d);
            if(t < mt && d < 0.)
            {
                mt = t;
                mn = norm * -sign(dot(norm, rd));
            }
        }
    }
    return vec2(l, mt);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy * 2. - 1.;

    uv.x *= iResolution.x / iResolution.y;

    time = iTime;
    
    // Set up disc positions, orientations, sizes
    discP[0] = vec4(1, -.8, 0, 1);
    discN[0] = normalize(vec3(.3, -1, 0));

    discP[1] = vec4(-1, -.4, 0, 1);
    discN[1] = normalize(vec3(-.3, -1, 0.4));

    discP[2] = vec4(0, -.8, 1.4, 1.1);
    discN[2] = normalize(vec3(0, -1, .3));

    discP[3] = vec4(.4, 0.1, .1, .4);
    discN[3] = normalize(vec3(0, -1, 0.1));

    discP[4] = vec4(0, -1.5, 0, 1);
    discN[4] = normalize(vec3(.0, -1, 0));

    // Motion jitter
    time += texelFetch(iChannel0, ivec2(mod(fragCoord.xy, 1024.)), 0).x * .015;

    // Set up primary ray
    float an = 1. + time / 2.;
    an = 2.3 + sin(time / 2.);

    vec3 ro = vec3(0., 0., 4.4);
    vec3 rd = normalize(vec3(uv.xy, -1.9));

    rd.xz = mat2(cos(an), sin(an), sin(an), -cos(an)) * rd.xz;
    ro.xz = mat2(cos(an), sin(an), sin(an), -cos(an)) * ro.xz;


#if GO_BACKWARDS
    time = -time;
#endif

    vec3 norm;
    float t = 1e4;

    vec3 hitcol = vec3(1);

    // Test intersection with spheres
    for(int j = 0; j < NUM_SPHERES; ++j)
    {
        float radscale;
        vec3 p = traceSpherePath(j, radscale);
		float r = 1.2 * radscale * mix(.06, .1, .5 + .5 * cos(float(j)));
        
        spheres[j] = vec4(p, r);
        
        vec2 i = intersectSphere(ro, rd, p, r);
        
        if(i.x > 0. && i.x < i.y && i.x < t)
        {
            t = i.x;
            norm = ro + rd * t - p;
            hitcol = mix(vec3(1, .4, .05), vec3(.3, 1, .1), .5 + .5 * cos(float(j) * 8.));
        }

    }

    // Test intersection with discs
    vec3 dn;
    vec2 dt = traceDiscs(ro, rd, 0., dn, time);

    if(dt.y < t)
    {
        t = dt.y;
        norm = dn;
        hitcol = vec3(1);
    }

    if(t > 1e3)
    {
        // Background
        fragColor.rgb = vec3(.05 - length(uv) / 40.);
    }
    else
    {
        // Intersected with sphere or disc
        vec3 hitp = ro + rd * t;
        float l = 1.;

        norm = normalize(norm);

        vec3 ld = normalize(vec3(1, 1, 1));
        vec3 r = reflect(rd, norm);

        // Do some soft shadowing
        l *= mix(.125, 1., traceDiscs(hitp + norm * 1e-4, ld, .2, dn, time).x);
        l *= mix(.25, 1., traceDiscs(hitp + norm * 1e-4, vec3(0, 1, 0), .53, dn, time).x);

		// Trace hard sphere shadows
        for(int j = 0; j < NUM_SPHERES; ++j)
        {
            vec4 sph = spheres[j];

            vec2 i = intersectSphere(hitp + norm * 1e-4, ld, sph.xyz, sph.w);
            
            if(i.x > 0. && i.x < i.y)
            {
                l *= 0.5;
                break;
            }

        }

        // Shading
        vec3 h = normalize(ld - rd);

        float fr = (1. - dot(-rd, norm)) * .3;

        fragColor.rgb = l * (vec3(max(0., dot(norm, ld))) * hitcol + vec3(fr * .7 + pow(max(0., dot(norm,h)), 64.)) / 2.);
        fragColor.rgb += .01;
    }
    
    fragColor.rgb = clamp(fragColor.rgb, 0., 1.);
    
    // Gamma
    fragColor.rgb = pow(fragColor.rgb, vec3(1. / 2.2));

    // Dither
    fragColor.rgb += texelFetch(iChannel0, ivec2(mod(fragCoord.xy, 1024.)), 0).y / 100.;
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
