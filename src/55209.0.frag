/*
 * Original shader from: https://www.shadertoy.com/view/ttB3RV
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
const float PI = 3.1415926;
const float E = 0.003;


mat2 rotate2D(float r)
{
    return mat2(cos(r), -sin(r), sin(r), cos(r));
}

vec2 de(vec3 p)
{
    vec2 o = vec2(100.0, 0.0);
    vec3 p_ = p;
    
    // trasition
    float trasition = smoothstep(0.0, 1.0, mod((iTime - 3.0), 4.0)) + floor((iTime - 3.0) * 0.25);
    trasition *= PI * 0.5;
    p.xy *= rotate2D(trasition * 2.0);
    p.yz *= rotate2D(trasition);
    p.xz *= rotate2D(iTime * 0.35);

    // y-axis repetition
    p.y += atan(p.z, p.x) * 0.5 * 4.0;
    p.y = mod(p.y, PI) - PI * 0.5;

    // many torus !
    float r = atan(p.x, p.z) * 4.0;
    const int ite = 23;
    for (int i = 0; i < ite; i++)
    {
        r += 1.0 / float(ite) * PI * 2.0;
        float s = 0.5 + sin(float(i) * 1.618 * PI * 2.0) * 0.25;
        s += sin(iTime + float(i)) * 0.2;

        vec2 q = vec2(length(p.xz) + cos(r) * s - 3.0, p.y + sin(r) * s);
        float d = length(q) - 0.06;
        
        if (d < o.x)
        {
            o.x = d;
            o.y = float(i);
        }
    }

    return o;
}

// iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 normal(vec3 p)
{
    float h = E;
    vec2 k = vec2(1.0, -1.0);
    return normalize(
            k.xyy * de(p + k.xyy * h).x + 
            k.yyx * de(p + k.yyx * h).x + 
            k.yxy * de(p + k.yxy * h).x + 
            k.xxx * de(p + k.xxx * h).x
        );
}

void trace(vec3 ro, vec3 rd, inout vec3 color)
{
    vec3 ro_ = ro;
    
    float ad = 0.0;
    for (int i = 0; i < 128; i++)
    {
        vec2 res = de(ro) * 0.5;
        ro += rd * res.x;
        ad += res.x;
        
        if (res.x < E)
        {
            // light direction
            vec3 ld = normalize(vec3(1.0, 1.0, 0.5));
            
            // normal
            vec3 n = normal(ro);
            
            // albedo
            color = mix(vec3(1.0, 0.5, 0.2), vec3(0.2, 0.6, 1.0) * 2.5, fract(res.y * 1.618));
            color = mix(color, vec3(10.0, 0.0, 0.0), pow(fract((res.y + 10.5) * 1.618), 10.0));
            
            // diffuse
            color *= pow(dot(n, ld) * 0.5 + 0.5, 3.0);
            
            // specular
            vec3 h = normalize(ld + normalize(ro_ - ro));
            color += pow(max(dot(h, n), 0.0), 20.0) * 2.5;
            
            // ao
            float rim = float(i) / (128.0 - 1.0);
            color *= exp(-rim * rim * 30.0) * 0.5;
            
            // fog
            color *= exp(-ad * ad * 0.01);

            return;
        }
        else if (ad > 25.0)
        {
            break;
        }
    }
    
    // background
//    color = vec3(1.0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec3 color = vec3(0.0);

    // ray
    vec3 ro = vec3(0.0, 0.0, 8.5);
    vec3 rd = normalize(vec3(p, -1.5));

    // ray marching
    trace(ro, rd, color);
    
    // gamma correction
    color = pow(color, vec3(0.454545));
    
    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
