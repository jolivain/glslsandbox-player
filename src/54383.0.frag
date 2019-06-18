/*
 * Original shader from: https://www.shadertoy.com/view/3tfGW7
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
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float pi = acos(-1.);
    float zoom = 5.;
    vec2 p = fragCoord / iResolution.y * zoom;

    float th = mod(iTime * pi / 5., pi * 2.);
    float gridsize = (.5 + abs(sin(th * 2.)) * (sqrt(2.) / 2. - .5)) * 2.;

    bool flip = false;

    if(fract(th / pi + .25) > .5)
    {
        p -= .5;
        flip = true;
    }

    p *= gridsize;

    vec2 cp = floor(p / gridsize);

    p = mod(p, gridsize) - gridsize / 2.;

    p *= mod(cp, 2.) * 2. - 1.;

    p *= mat2(cos(th), sin(th), -sin(th), cos(th));

    float w = zoom / iResolution.y * 1.5;
    
    float a = smoothstep(-w, +w, max(abs(p.x), abs(p.y)) - .5);

    if(flip)
        a = 1. - a;

    if(flip && a < .5 && (abs(p.x) - abs(p.y)) * sign(fract(th / pi) - .5) > 0.)
        a = .4;

    if(!flip && a < .5 && (mod(cp.x + cp.y, 2.) - .5) > 0.)
        a = .4;

    fragColor.rgb = pow(vec3(a), vec3(1. / 2.2));
    fragColor.a = 1.;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
