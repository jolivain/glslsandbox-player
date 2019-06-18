/*
 * Original shader from: https://www.shadertoy.com/view/4lVfzd
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
#define PI 3.141592

float h(vec2 uv)
{
    float a = acos(cos(clamp(mod((atan(uv.x, -uv.y)+PI)*10., 14.*PI)-2.*PI, 0., 2.*PI)))/PI;

    return smoothstep(.0075, .015, abs(length(uv)-(.4+a*.2)));
}

float e(vec2 uv, vec2 p)
{
    uv += p;
    uv /= vec2(.2, .1);
    float d = smoothstep(.625, .7, length(uv));

    uv += vec2(.3, -.25);

    d += smoothstep(.175, .1, length(uv));

    uv += vec2(-.2, .2);

    d += smoothstep(.1, .05, length(uv));

    return d;
}

float n(vec2 uv)
{
    return smoothstep(0.04, 0.055, abs(uv.x)+mix(-uv.y, 1., smoothstep(-.01, .2, uv.y)));
}

float m(vec2 uv, vec2 p)
{
    uv += p;

    float h = 0.01;

    float d = mix(1., smoothstep(.001, .0075, abs(uv.y-(abs(uv.x)*.1+cos(uv.x*70.)*h))), step(-0.08, uv.x)*(1.-step(0.08, uv.x)));

    d *= mix(1., smoothstep(0.002, 0.007, abs(uv.x)), step(h, uv.y)*(1.-step(p.y, uv.y)));

    return d;
}

vec2 rot(vec2 v, float a)
{
    return mat2(cos(a), sin(a), -sin(a), cos(a))*v;
}

float s(vec2 uv, vec2 p, float r, float inv)
{
    uv += p;
    uv = rot(uv, r*(2.*inv-1.));

    float f1 = mix(1.-step(-0.05, uv.x), step(0.05, uv.x), inv);
    float f2 = mix(step(-0.25, uv.x), 1.-step(0.25, uv.x), inv);

    return mix(1., smoothstep(0., 0.007, abs(uv.y+uv.x*uv.x)), f1*f2);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    
  	vec3 co = vec3(1.);

  	vec2 eOffset = vec2(.2, -.1);
  	vec2 sOffset = vec2(0., .05);
  	vec2 mOffset = vec2(0., .1);
  	vec2 fOffset = vec2(0., .1);

  	uv.y *= 1.5;

  	uv = rot(uv, .2);

    co *= h(uv);

    uv += fOffset;

    co *= e(uv, eOffset);
    co *= e(uv, eOffset*vec2(-1., 1.));

    co *= n(uv);
    co *= m(uv, mOffset);
    co *= s(uv, sOffset, -.20, 1.);
    co *= s(uv, sOffset, -.10, 1.);
    co *= s(uv, sOffset,  .10, 1.);
    co *= s(uv, sOffset, -.25, 0.);
    co *= s(uv, sOffset, -.15, 0.);
    co *= s(uv, sOffset,  .10, 0.);

    fragColor = vec4(co, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
