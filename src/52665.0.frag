/*
 * Original shader from: https://www.shadertoy.com/view/wsj3Wc
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

// --------[ Original ShaderToy begins here ]---------- //
mat2 rot(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

float heart(vec2 p)
{
    p.x = abs(p.x);
    p.y *= 1.5;
    p.x *= 1.2;
    p.y -= p.x;
    float c =(length(p) - .3);
    return c / 2.;
}

float map(vec3 p)
{
    p.z -= iTime;
    vec3 cell = floor(p*.5);
    p.y += sin(cell.z);
    p.xy *= rot(cell.z+iTime*.09);
    p = mod(p, 2.)-vec3(.8);
    
    float ay = abs(p.z) - .01;
    float h = max(sqrt(pow(heart(p.xy)+.2, 2.) + pow(p.z, 2.)) - .2, ay);
    
    return h;
}

float march(vec3 ro, vec3 rd)
{
    float t = 0.;
    for(int i=0; i<128; ++i)
    {
        float d = map(ro+rd*t);
        if(d < .001+t*.03) break;
        if(t > 30.) return -1.;
        t += d*.6;
    }
    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy - vec2(.5);
    uv.x *= iResolution.x/iResolution.y;

    vec3 cam = vec3(0, 0, 3.);
    vec3 dir = normalize(vec3(uv.x, uv.y, -1.));
    float d = march(cam, dir);
    float h = heart(uv);
    vec3 col;
    
    if(d < 0.) {
        col = vec3(1., .6, .85);
    } else {
    	col = vec3(clamp(d*.05, .6, 1.));
		col *= vec3(1., .3, .35) * clamp(d, 5., 100.) *.2;
   		col.gb = pow(col.gb, vec2(1.4, 1.));
    }
    
    fragColor = vec4(sqrt(col),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
