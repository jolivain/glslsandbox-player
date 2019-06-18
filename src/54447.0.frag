/*
 * Original shader from: https://www.shadertoy.com/view/tll3zB
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

// Emulate a black texture
#define textureLod(s, uv, lod) vec4(0.0)
#define texelFetch(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
const float pi = acos(-1.);
const float innerR = 1.;
const float outerR = 12.;

float globalTime = 0.;

float dot2( in vec3 v ) { return dot(v,v); }

// Adapted from IQ's iCappedCone: https://www.shadertoy.com/view/llcfRf
// Simplified with the assumption that the cone's axis is always the Z axis, and
// that the caps are not needed.
// Also, it automatically returns either the near or far intersection depending on
// the Z order of the endpoints.
float intersectCone( in vec3  ro, in vec3  rd, 
                    in float ra, in float rb,
                    in float  paz, in float pbz)
{
    float ba = pbz - paz;
    vec3  oa = ro - vec3(0, 0, paz);
    vec3  ob = ro - vec3(0, 0, pbz);

    float m0 = ba * ba;
    float m1 = oa.z * ba;
    float m2 = ob.z * ba; 
    float m3 = rd.z * ba;

    // body
    float m4 = dot(rd,oa);
    float m5 = dot(oa,oa);
    float rr = ra - rb;
    float hy = m0 + rr*rr;

    float k2 = m0*m0    - m3*m3*hy;
    float k1 = m0*m0*m4 - m1*m3*hy + m0*ra*(rr*m3*1.0        );
    float k0 = m0*m0*m5 - m1*m1*hy + m0*ra*(rr*m1*2.0 - m0*ra);

    float h = k1*k1 - k2*k0;
    if( h<0.0 ) return -1.0;

    float t0 = (-k1-sqrt(h))/k2;
    float t1 = (-k1+sqrt(h))/k2;

    float y0 = m1 + t0*m3;
    float y1 = m1 + t1*m3;

    if(paz>pbz)
        return ( y0>0.0 && y0<m0 ) ? (-k1-sqrt(h))/k2 : -1.;
    else
        return ( y1>0.0 && y1<m0 ) ? (-k1+sqrt(h))/k2 : -1.;
}


float trace(vec3 ro, vec3 rd, out vec3 nearN, out vec2 nearUV)
{
    const int N = 6;

    float minT = 1e4;
    float outTh0 = 0., outTh1 = 0.;

    float twist = globalTime / 2.5;

    // Make a torus from cones
    
    for(int i = 0; i < N; ++i)
    {
        float th0 = pi * 2. / float(N) * float(i + 0) + twist;
        float th1 = pi * 2. / float(N) * float(i + 1) + twist;

        float z0 = sin(th0) * innerR;
        float z1 = sin(th1) * innerR;

        float r0 = outerR + cos(th0) * innerR;
        float r1 = outerR + cos(th1) * innerR;

        float t = intersectCone(ro, rd, r0, r1, z0, z1);

        if(t > 0. && t < minT)
        {
            // Save only the pertinent data for later construction
            // of shading inputs.
            outTh0 = th0;
            outTh1 = th1;
            minT = t;
        }
    }

    if(minT > 1e3)
        return -1.;

    float th0 = outTh0;
    float th1 = outTh1;
    float th2 = (th0 + th1) / 2.;

    vec3 rp = ro + rd * minT;

    float phi = atan(rp.y, rp.x);

    // Get the surface differentials and a reference point for texturing
    
    vec3 tangent = 	normalize(vec3(cos(phi) * cos(th1), sin(phi) * cos(th1), sin(th1)) -
                              vec3(cos(phi) * cos(th0), sin(phi) * cos(th0), sin(th0)));

    float incircleRadius = innerR * cos(pi / float(N));

    vec3 midPoint = vec3(cos(phi) * (outerR + cos(th2) * incircleRadius),
                         sin(phi) * (outerR + cos(th2) * incircleRadius), sin(th2) * incircleRadius);

    nearUV.x = (phi + pi) / pi * 16.;
    nearUV.y = dot(rp - midPoint, tangent);

    nearN = vec3(cos(phi) * cos(th2), sin(phi) * cos(th2), sin(th2));

    return minT;
}

mat3 rotX(float a)
{
    return mat3(1., 0., 0.,
                0., cos(a), sin(a),
                0., -sin(a), cos(a));
}

mat3 rotY(float a)
{
    return mat3(cos(a), 0., sin(a),
                0., 1., 0.,
                -sin(a), 0., cos(a));
}

mat3 rotZ(float a)
{
    return mat3(cos(a), sin(a), 0.,
                -sin(a), cos(a), 0.,
                0., 0., 1.);
}


vec4 render(vec2 fragCoord)
{    
    vec4 jitter = texelFetch(iChannel0, ivec2(fragCoord * 2.) & 1023, 0);

    // Motion blur jitter
    globalTime = iTime + jitter.x * 1. / 50.;
    
    jitter = jitter.yzxw;

    // Set up primary ray, including ray differentials

    vec2 p = fragCoord / iResolution.xy * 2. - 1.;
    p.x *= iResolution.x / iResolution.y;

    vec3 ro = vec3(outerR, sin(globalTime / 7.) * .3, cos(globalTime / 5.) * .3);
    vec3 rd = normalize(vec3(p, -1.5));
    
    // Rotation transformation. There is no translation here, because the tunnel
    // motion is faked with texture scrolling.

    mat3 m = rotZ(globalTime / 2.) * rotX(cos(globalTime / 4.) * .2) * rotY(sin(globalTime / 3.) * .2);

    m = rotX(pi/2.)*m;

    rd = m * rd;

    vec3 nearN = vec3(0);
    vec2 nearUV = vec2(0);

    vec3 transfer = vec3(1);    
    vec4 fragColor = vec4(0);

    // Trace ray bounces
    for(int j = 0; j < 3; ++j)
    {
        float t0 = trace(ro, rd, nearN, nearUV);

        if(t0 < 0.)
            break;

        vec3 rp = ro + rd * t0;

        vec3 c = vec3(0);

        // Fake motion-blurred camera motion by blurring the
        // surface shading. Note that the non-jittered time value
        // is used here as a base time for the blur offset.
        
        const int motionBlurSamples = 5;

        for(int i = 0; i < motionBlurSamples; ++i)
        {
            // Tunnel surface shading
            float time = iTime + (float(i) + jitter.x) / float(motionBlurSamples) * (1. / 60.);
            vec2 uv = nearUV;
            uv.x += time * 5.;
            c += vec3(pow(1. - smoothstep(0.1, .4, length(fract(uv + vec2(.25, .5)) - .5)),8.)) * vec3(.3, .5, 1.) * 2.;
            c += vec3(1. - smoothstep(0.1, .11, length(fract(uv + vec2(.25, .5)) - .5))) * vec3(.3, .5, 1.) * 4.;
            c += vec3(step(.9, fract(uv.x - .3))) / 2. * vec3(.4, .4, 1.) * 3.;
            c += vec3(step(.95, fract(uv.x - .3))) / 2. * vec3(.4, .4, 1.) * 6.;
            c += step(abs(textureLod(iChannel1, uv / 15. + time / 10. * vec2(1, 0), 0.).r - .6), .2) / 4. * vec3(.4, .4, 1.);
            c += step(abs(textureLod(iChannel1, uv / 15. + time / 10. * vec2(1, 0), 0.).r - .6), .02) * 2. * vec3(.4, .4, 1.);
            c += step(abs(uv.y), .01) * 1.5;
            c += step(abs(uv.y - .5), .01) * 1.5;
        }

        c /= float(motionBlurSamples);

        // Fog
        c = mix(vec3(1) * vec3(.5,.5,1), c, exp2(-t0 / 13.));

        // Tint
        c *= vec3(.6, .6, 1) / 1.3;

        // Accumulate
        fragColor.rgb += c * transfer;
        
        // Reflection amount
        transfer *= .8 * pow(clamp(1. - dot(-nearN, -rd), 0., 1.), 4.);

        if(max(max(transfer.x, transfer.y), transfer.z) < 1e-3)
            break;
        
        // Reflect
        ro = rp + nearN * 1e-4;
        rd = reflect(rd, nearN);

        jitter = jitter.yzxw;
    }

    fragColor.a = 1.;

    return fragColor;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragColor = vec4(0);

    vec3 backg = vec3(.07);

    // Anti-aliasing loop

    for(int y = 0; y < 2; ++y)
        for(int x = 0; x < 2; ++x)
        {
            vec4 r = render(fragCoord + vec2(x,y) / 2.);
            r.rgb = mix(backg, r.rgb, r.a);
            fragColor.rgb += clamp(r.rgb, 0., 1.);
        }

    fragColor /= 4.;

	// Tonemap and "colourgrade"
    
    fragColor /= (fragColor + .4) / 1.2;
    fragColor.rgb = pow(fragColor.rgb, vec3(1,1.4,1.8));

    // Gamma correction
    
    fragColor.rgb = pow(clamp(fragColor.rgb, 0., 1.), vec3(1. / 2.2));
    fragColor.a = 1.;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
