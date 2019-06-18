/*
 * Original shader from: https://www.shadertoy.com/view/3d2XzR
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
#define PI 3.14159265359
#define HALF_PI 1.57079632675
#define TWO_PI 6.283185307

#define SECONDS 6.0

vec2 random2(vec2 st)
{
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(29.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float random(vec2 st)
{
    return fract(sin(dot(st.yx,vec2(14.7891,43.123)))*312991.41235);
}

float random (in float x)
{
    return fract(sin(x)*43758.5453123);
}

// iq
float v_noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

mat2 rotate(float angle)
{
    return mat2( cos(angle),-sin(angle),sin(angle),cos(angle) );
}

vec2 center(vec2 st)
{
    float aspect = iResolution.x/iResolution.y;
    st.x = st.x * aspect - aspect * 0.5 + 0.5;
    return st;
}

vec3 mytime()
{
    float period = mod(iTime,SECONDS);
    vec3 t = vec3(fract(iTime/SECONDS),period, 1.0-fract(period));
    return t;       // return fract(length),period,period phase
}

float scene(vec2 st, vec3 t)
{
    st = st * 2.0 - 1.0;

    float seed = 29192.173;
    float center = length(st-0.5) - 0.5;

    float n_scale = 0.12;

    float n_1 = v_noise(st + sin(PI*t.x)) * n_scale;
    float n_2 = v_noise(st+seed - sin(PI*t.x)) * n_scale;


    const int COUNT = 32;

    float d = 1.0;
    for(int i = 1; i <= COUNT; i++)
    {
        float spread = 1.0 / float(i);
        float speed = ceil(3.0*spread);
        float r = random(float(i)*5.0 + seed);
        float r_scalar = r * 2.0 - 1.0;

        vec2 pos = st - vec2(0.0);
            pos += vec2(0.01) * rotate(TWO_PI * r_scalar + TWO_PI * t.x * speed * sign(r_scalar));
            pos *= rotate(TWO_PI * r_scalar + TWO_PI * t.x * speed * sign(r_scalar));
            pos += mix(n_1,n_2,0.5+0.5*sin(TWO_PI*t.x*speed));

        float s = .45 + .16 * r;

        float a = atan(pos.y,pos.x)/PI;
            a = abs(a);
            a = smoothstep(0.0,1.0,a);

        float c = length(pos);
            c = abs(c-s);
            c -= 0.0004 + .01 * a;

        d = min(d,c);
    }

    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // timing
    vec3 t = mytime();

    // space
    vec2 st = fragCoord/iResolution.xy;
    st = center( st );

    st = st * 2.0 - 1.0;
    st = st * (1.0 + .03 * sin(TWO_PI*t.x));
    st = st * 0.5 + 0.5;

    // scene
    float s = scene(st, t);

    // aa
    float aa = 1.0/iResolution.x*4.0;

    // color
    vec3 color = vec3(0.08);
        color = mix(color,vec3(1.0),1.0-smoothstep(0.0,aa,s));
        color = 1.0 - color;

    // vignette
    float size = length(st-.5)-1.33;
    float vignette = (size) * 0.75 + random(st) *.08;        
    color = mix(color,vec3(0.0, 0.0, 0.0),vignette+.5);

    fragColor = vec4(color, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
