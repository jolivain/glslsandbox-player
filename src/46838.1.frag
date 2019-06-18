#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
#define saturate(x) clamp(x,0.,1.)
#define rgb(r,g,b) (vec3(r,g,b)/255.)

float rand(float x) { return fract(sin(x) * 71523.5413291); }

float rand(vec2 x) { return rand(dot(x, vec2(13.4251, 15.5128))); }

float noise(vec2 x)
{
    vec2 i = floor(x);
    vec2 f = x - i;
    f *= f*(3.-2.*f);
    return mix(mix(rand(i), rand(i+vec2(1,0)), f.x),
               mix(rand(i+vec2(0,1)), rand(i+vec2(1,1)), f.x), f.y);
}

float fbm(vec2 x)
{
    float r = 0.0, s = 1.0, w = 1.0;
    for (int i=0; i<5; i++)
    {
        s *= 2.0;
        w *= 0.5;
        r += w * noise(s * x);
    }
    return r;
}

float cloud(vec2 uv, float scalex, float scaley, float density, float sharpness, float speed)
{
    return pow(saturate(fbm(vec2(scalex,scaley)*(uv+vec2(speed,0)*time))-(1.0-density)), 1.0-sharpness);
}

vec3 render(vec2 uv)
{
    // sky
    vec3 color = mix(rgb(255,212,166), rgb(204,235,255), uv.y);
    // sun
    vec2 spos = uv - vec2(0., 0.4);
    float sun = exp(-20.*dot(spos,spos));
    vec3 scol = rgb(255,155,102) * sun * 0.7;
    color += scol;
    // clouds
    vec3 cl1 = mix(rgb(151,138,153), rgb(166,191,224),uv.y);
    float d1 = mix(0.9,0.1,pow(uv.y, 0.7));
    color = mix(color, cl1, cloud(uv,2.,8.,d1,0.4,0.04));
    color = mix(color, vec3(0.9), 8.*cloud(uv,14.,18.,0.9,0.75,0.02) * cloud(uv,2.,5.,0.6,0.15,0.01)*uv.y);
    color = mix(color, vec3(0.8), 5.*cloud(uv,12.,15.,0.9,0.75,0.03) * cloud(uv,2.,8.,0.5,0.0,0.02)*uv.y);
    // post
    color *= vec3(1.0,0.93,0.81)*1.04;
    color = mix(0.75*rgb(255,205,161), color, smoothstep(-0.1,0.3,uv.y));
    color = pow(color,vec3(1.3));
    return color;
}
void main( void ) {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv.x -= 0.5;
    uv.x *= resolution.x / resolution.y;
    
	gl_FragColor = vec4(render(uv),1.0);
}
