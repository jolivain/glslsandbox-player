/*
 * Original shader from: https://www.shadertoy.com/view/3djSWK
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

// --------[ Original ShaderToy begins here ]---------- //
struct vec16 // 4x vec4
{
    vec4 x, y, z, w;
};

struct vec8 // 2x vec4
{
    vec4 x, y; 
    // Used to hold the values of noise and the derivative of the alpha channel
};

vec16 hash (vec4 p) // uh
{
    p = floor(p+0.5); // Just a hardware issue on my computer, you probably don't need this
    vec4 a = -1. + 2.*fract(
        vec4(4825.39872, 5978.23875, 2938.69837, 7981.19439)*
        sin(p.x*29.847 + p.y*74.947 + 
            p.z*34.684 + p.w*91.234));
    vec4 b = -1. + 2.*fract(
        vec4(8274.84872, 8763.17864, 5763.89345, 7185.87917)*
        sin(p.x*22.398 + p.y*93.478 + 
            p.z*93.239 + p.w*25.252));
    vec4 c = -1. + 2.*fract(
        vec4(9287.29472, 6782.62067, 9872.75203, 4987.28734)*
        sin(p.x*74.973 + p.y*63.289 + 
            p.z*34.428 + p.w*50.982));
    vec4 d = -1. + 2.*fract(
        vec4(3287.97291, 9247.82436, 2874.38254, 6298.92293)*
        sin(p.x*43.834 + p.y*78.934 + 
            p.z*48.934 + p.w*48.729));
    return vec16(a, b, c, d);
}

vec4 dott (vec16 f, vec4 v) //"No matching overload function found"
{
    return vec4(
    dot(f.x, v),
    dot(f.y, v),
    dot(f.z, v),
    dot(f.w, v));
}

vec8 perlin4x4 (vec4 p)
{
    // Address and interpolation values
    vec4 f = fract(p),
    m = f*f*f*(f*f*6. - f*15. + 10.),
    md = 30.*f*f*(f*(f-2.)+1.);
    p -= f;

    // Interpolating the gradients for noise
    vec4 noise = mix(mix(mix(
        mix(dott(hash(p + vec4(0,0,0,0)), f - vec4(0,0,0,0)), 
            dott(hash(p + vec4(1,0,0,0)), f - vec4(1,0,0,0)), m.x), 
        mix(dott(hash(p + vec4(0,1,0,0)), f - vec4(0,1,0,0)), 
            dott(hash(p + vec4(1,1,0,0)), f - vec4(1,1,0,0)), m.x), m.y), mix(
        mix(dott(hash(p + vec4(0,0,1,0)), f - vec4(0,0,1,0)), 
            dott(hash(p + vec4(1,0,1,0)), f - vec4(1,0,1,0)), m.x), 
        mix(dott(hash(p + vec4(0,1,1,0)), f - vec4(0,1,1,0)), 
            dott(hash(p + vec4(1,1,1,0)), f - vec4(1,1,1,0)), m.x), m.y), m.z), mix(mix(
        mix(dott(hash(p + vec4(0,0,0,1)), f - vec4(0,0,0,1)), 
            dott(hash(p + vec4(1,0,0,1)), f - vec4(1,0,0,1)), m.x), 
        mix(dott(hash(p + vec4(0,1,0,1)), f - vec4(0,1,0,1)), 
            dott(hash(p + vec4(1,1,0,1)), f - vec4(1,1,0,1)), m.x), m.y), mix(
        mix(dott(hash(p + vec4(0,0,1,1)), f - vec4(0,0,1,1)), 
            dott(hash(p + vec4(1,0,1,1)), f - vec4(1,0,1,1)), m.x), 
        mix(dott(hash(p + vec4(0,1,1,1)), f - vec4(0,1,1,1)), 
            dott(hash(p + vec4(1,1,1,1)), f - vec4(1,1,1,1)), m.x), m.y), m.z), m.w);
    // Interpolating the values of the gradients for the first derivative normal
    // (of the alpha channel)
    // It's faster to recalculate the hashes by the way
    vec4 derivative = mix(mix(mix(
        mix(hash(p + vec4(0,0,0,0)).w, 
            hash(p + vec4(1,0,0,0)).w, m.x), 
        mix(hash(p + vec4(0,1,0,0)).w, 
            hash(p + vec4(1,1,0,0)).w, m.x), m.y), mix(
        mix(hash(p + vec4(0,0,1,0)).w, 
            hash(p + vec4(1,0,1,0)).w, m.x), 
        mix(hash(p + vec4(0,1,1,0)).w, 
            hash(p + vec4(1,1,1,0)).w, m.x), m.y), m.z), mix(mix(
        mix(hash(p + vec4(0,0,0,1)).w, 
            hash(p + vec4(1,0,0,1)).w, m.x), 
        mix(hash(p + vec4(0,1,0,1)).w, 
            hash(p + vec4(1,1,0,1)).w, m.x), m.y), mix(
        mix(hash(p + vec4(0,0,1,1)).w, 
            hash(p + vec4(1,0,1,1)).w, m.x), 
        mix(hash(p + vec4(0,1,1,1)).w, 
            hash(p + vec4(1,1,1,1)).w, m.x), m.y), m.z), m.w);
    return vec8(noise, derivative);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;
    
    float a = iTime/2.;
    
    vec3 ro = -vec3(sin(a), 0, cos(a))*7.5;
    vec3 rs = normalize(vec3(uv, 1));
    rs.xz *= mat2(cos(-a),-sin(-a),sin(-a),cos(-a));
    
    vec3 p;
    
    fragColor = vec4(0.);
    if (uv.x < cos(iTime/2.))
    {
        for (float d = 9.; d >= 5.; d -= .25)
        {
            vec3 p = ro + rs*d;
            vec8 n = perlin4x4(vec4(p*1.25, iTime/2.));
            n.x = n.x*.5 + .5;
            fragColor = mix(fragColor, n.x*.75+.25,
                        pow(n.x.a, 6.)*smoothstep(3., 2.7, length(p)));
        }
        fragColor *= 2.;
    }else{
	    float d = 5.;
        vec8 noise;
        float m;
        vec3 norm;
        for (int ii=0; ii<100;ii++)
        {
            noise = perlin4x4(vec4((ro+rs*d)*1.25, iTime/2.));
            m = max(length(ro+rs*d)-2.8, -noise.x.w*.5+.05);
            if (m <= .01)
            {
                p = ro+rs*d; 
                fragColor = noise.x*.5+.5;
                norm = normalize((length(p) < 2.8)? noise.y.xyz : p);
                fragColor += .7*max(pow(dot(reflect(rs, norm), vec3(.577)), 9.), 0.);
                fragColor *= dot(norm, vec3(.577))*.25+.75;
                break;
            }
            d += m;
            if (d > 8.)
                break;
	}
    }
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
