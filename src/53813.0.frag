/*
 * Original shader from: https://www.shadertoy.com/view/tdjSDw
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
#define iTime time
#define iResolution resolution
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
// "Comme un poisson dans l'Ourcq"
// Tribute to the grapher Da Cruz
// Copyright (c) March 2019 - Alt144 (Elie Michel)
// License: CC 3.0 BY - Please notify me when using it

#define PI 3.14159265

vec2 rand2(vec2 seed) {
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
		fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

vec2 noise2(vec2 uv) {
    vec2 e = vec2(1., 0.);
    vec2 i = floor(uv);
    vec2 t = fract(uv);
    t = t*t*(3.-2.*t);
    vec2 r00 = rand2((i + e.yy)*.0254);
    vec2 r10 = rand2((i + e.xy)*.0254);
    vec2 r01 = rand2((i + e.yx)*.0254);
    vec2 r11 = rand2((i + e.xx)*.0254);
    return mix(
    	mix(r00, r10, t.x),
        mix(r01, r11, t.x),
        t.y
    );
}
float noise(vec2 uv) { return noise2(uv).x; }

vec2 moda(vec2 uv, float repeat, out float iter) {
    float a = atan(uv.y, uv.x);
    float s = PI/repeat;
    iter = mod(a/2./s, repeat);
    a = mod(a, 2.*s) - s;
    return length(uv) * vec2(cos(a), sin(a));
}

vec2 elbow(vec2 uv) {
    vec2 tuv = vec2(-uv.y+.295, uv.x);;
    float a = atan(uv.x, uv.y);
    vec2 ruv = vec2(2.*PI*a*.03, length(uv));
    return mix(tuv, mix(uv, ruv, step(0., uv.x)), step(0., uv.y));
}

float smin( float a, float b, float k )
{
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*k*(1.0/4.0);
}

float circleRing(vec2 uv, float steps, float minr, float maxr, float angleJitter, float angularSpeed, float rotation) {
    float iter;
    float a = atan(uv.y, uv.x);
    a += rotation + iTime * angularSpeed;
    uv = length(uv) * vec2(cos(a), sin(a));
    uv = moda(uv, steps, iter);
    vec2 r = rand2(vec2(floor(iter)*.0354, 0.21));
    float d = length(uv - vec2(.3+mix(maxr, minr, r.x),mix(-1.,1.,r.y)*.08*angleJitter)) - mix(minr, maxr, r.x);
    return -d;
}

float shape1(vec2 uv, float steps, float angleJitter, float angularSpeed) {
    float d = length(uv) - .4;
    d = min(d, -circleRing(uv, steps, .05, .08, angleJitter, angularSpeed, .0));
    return -d;
}

struct StripesOpt {
    float distorsion;
    float spacing;
    float bump;
};
float stripes(vec2 uv, StripesOpt opt) {
    vec2 ouv = uv;
    float s = 10.;
    float iter = floor(uv.x*s+.25);
    uv.x = mod(uv.x, 1./10.) - 1./10./2.;
    vec2 r = rand2(vec2(iter*.0234, iter*0.8913));
    float ax = mix(-1.,1.,r.x)*.05*opt.distorsion;
    float d = sin(2.*PI*(uv.x+uv.y*ax)*10.);
    d += mix(-.5+opt.spacing, .5+opt.spacing, r.x);
    d *= .03;
    
    float sides = .47-abs(uv.y);
    
    // bumps
    float nobump = (1. - step(.5, opt.bump)) * 99999.;
    uv = ouv;
    s = 2.;
    uv.x = mod(uv.x, s) - s/2.;
    sides = min(sides, length(uv-vec2(0.,.9)) - 0.6 + nobump);
    sides = min(sides, length(uv-vec2(0.5,-.85)) - 0.55 + nobump);
    
    d = smin(d, sides, mix(0.10, 0.05, r.y));
    return d;
}

float fill(float d) {
    return smoothstep(0., .003, d);
}

float fit01(float a, float b, float x) {
    return (clamp(x, a, b) - a) / (b - a);
}

struct StripesCircleOpt {
    float minRadius;
    float maxRadius;
    float kappa;
    float omega;
    float phi;
};
float stripesCircle(vec2 uv, StripesCircleOpt opt, StripesOpt sopt) {
    uv = vec2(atan(uv.y, uv.x)/PI*opt.kappa+iTime*opt.omega+opt.phi, fit01(opt.minRadius, opt.maxRadius, length(uv))*2.-1.);
    return stripes(uv, sopt);
}

float stripesCircle1(vec2 uv, float distorsion) {
    return stripesCircle(uv, StripesCircleOpt(.25, .385, 3., -.05, 0.), StripesOpt(distorsion, 0., 1.));
}

float stripesCircle2(vec2 uv, float distorsion) {
    return stripesCircle(uv, StripesCircleOpt(.354, .395, 3.5, -.01, 112.2), StripesOpt(distorsion, .5, 1.));
}

float stripesCircle3(vec2 uv, float distorsion) {
    return stripesCircle(uv, StripesCircleOpt(.45, .9, 7.5, -.03, 57.3), StripesOpt(distorsion, 0., 1.));
}

float stripesCircle4(vec2 uv, float distorsion) {
    return stripesCircle(uv, StripesCircleOpt(.4, .95, 6.5, -.03, 32.7), StripesOpt(distorsion, 0., 1.));
}

float circle(vec2 uv, float r) {
    return -(length(uv) - r);
}

float contours(float shape, float thickness) {
    return thickness - abs(shape);
}

float capsule(vec2 uv, float r, float h) {
    uv = abs(uv);
    return max(circle(uv-vec2(.0, h), r), min(r - uv.x, h - uv.y));
}

mat2 rot(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat2(c, s, -s, c);
}

void solveCircle(in float width, in float aperture, out float radius, out float offset) {
    offset = (width*width/aperture-aperture)/2.;
    radius = offset + aperture;
}

vec3 drawMainEye(vec3 col, vec2 uv, vec2 mouse, out float dist) {
    float outerCircle = shape1(uv*.99, 8., 1., .1);
    float blueCircle = -(length(uv) - 0.392);
    float blueCircle2 = -(length(uv) - mix(0.355, 0.36, noise(uv*15.)));
    float ring1 = stripesCircle1(uv, .5);
    float ring2 = stripesCircle2(uv, .5);
    float upperEyelidRing = stripesCircle3(uv-vec2(0.,-.5), .5);
    float lowerEyelidRing = stripesCircle4(uv+vec2(0.,-.5), .5);
    vec2 innerCircleNoise = (noise2(uv*2.+iTime)-.5)*.05;
    float innerCircle = shape1((uv+innerCircleNoise)*1.4, 9., .25, -.07);
    
    float open = fit01(.0, .005, sin(iTime*2.)*.5+.5);
    
    float upperEyeAperture = mix(.15, .23, max(0., mouse.y)*2.);
    float lowerEyeAperture = mix(.1, .23, clamp(max(0., -mouse.y+.3)*3., 0., 1.));
    
    float c = .28; // eye radius
    float b = mix(.001, upperEyeAperture, open);
    float a, r;
    solveCircle(c, b, r, a);
    float upperEye = -(length(uv+innerCircleNoise - vec2(0.,.01-a)) - r);
    float upperEyelid = -(length(uv+innerCircleNoise) - mix(0.27, 0.28, noise(uv*15.+3.4)));
    upperEyelid = min(upperEyelid, -upperEye);
    
    b = mix(.001, lowerEyeAperture, open);
    solveCircle(c, b, r, a);
    float lowerEye = -(length(uv+innerCircleNoise + vec2(0.,-.01-a)) - r);
    float lowerEyelid = -(length(uv+innerCircleNoise) - mix(0.27, 0.275, noise(uv*15.+3.464)));
    lowerEyelid = min(lowerEyelid, -lowerEye);
    
    b = lowerEyeAperture;
    solveCircle(c, b, r, a);
    vec2 eyeCenter = -vec2(0.,-.025-a);
    float eye = 1.;
    eye = min(eye, upperEye-.01);
    eye = min(eye, lowerEye-.01);
    
    ring1 = smin(ring1, -innerCircle-mix(.0, .03, noise(uv*12.+iTime*.5)), 0.02);
    
    upperEyelidRing = smin(upperEyelidRing, upperEyelid-.01, 0.01);
    lowerEyelidRing = min(lowerEyelidRing, lowerEyelid);
    
    vec2 eyeOffset = mouse*vec2(.2,.5)+vec2(.0,-.1);
    eyeOffset.y = min(eyeOffset.y, 0.03);
    float eyeRing = stripesCircle(uv-eyeCenter-eyeOffset, StripesCircleOpt(.05, .36, 2.5, -.05, 0.), StripesOpt(.5, 0., 0.));
    float pupille = -(length(uv-eyeCenter-eyeOffset) - .09);
    
    eyeRing = min(eyeRing, -.03-upperEyelid) * .2;
    
    float eyeRingFade = clamp((-upperEyelid*7.)*(-lowerEyelid*7.) + .2, 0., .9);
    float eyeWhite = length(uv+innerCircleNoise-eyeCenter)-mix(.325, .31, noise(uv*8.+45.1+iTime*.5))*3.4*pow(r,1.1);
    
    vec3 eyeLayer = vec3(.0, .3, .6);
    eyeLayer = mix(eyeLayer, vec3(1., .292, .173), fill(eyeRing)*eyeRingFade);
    eyeLayer = mix(eyeLayer, vec3(1.), fill(pupille));
    eyeLayer = mix(eyeLayer, vec3(1.), fill(eyeWhite));
    
    col = mix(col, vec3(.14, .21, .3), fill(outerCircle));
    col = mix(col, vec3(.1, .3, .5), fill(blueCircle));
    col = mix(col, vec3(.7, .8, .85), fill(blueCircle2));
    col = mix(col, vec3(0.65, 0.3, 0.6), fill(ring1*.3));
    col = mix(col, vec3(0.9, 0.8, 0.2), fill(ring2*.25));
    col = mix(col, vec3(.14, .21, .3), fill(innerCircle));
    col = mix(col, eyeLayer, fill(eye));
    col = mix(col, vec3(1., .292, .173), fill(upperEyelid));
    col = mix(col, vec3(.75, .102, .073), fill(upperEyelidRing));
    col = mix(col, vec3(.292, .85, .653), fill(lowerEyelid));
    col = mix(col, vec3(.75), fill(lowerEyelidRing));
    
    dist = outerCircle;
        
    return col;
}

vec3 smallEye(vec2 uv, vec2 mouse, vec2 seed, vec3 eyeColor, out float dist) {
    vec2 innerCircleNoise = (noise2(seed+uv*3.+iTime*.2+uv.y*3.)-.5)*.03;
    
    vec2 r = rand2(seed);
    float freq = mix(.5,1.,r.x);
    float phi = r.y * 2. * PI;
    float open = fit01(.0, .002, sin(iTime*freq+phi)*.5+.5);
    
    float upperRadius, upperOffset, lowerRadius, lowerOffset, innerRadius, innerOffset;
    solveCircle(.175, mix(.001, .12, open), upperRadius, upperOffset);
    solveCircle(.175, mix(.001, .085, open), lowerRadius, lowerOffset);
    solveCircle(.175, .085, innerRadius, innerOffset);
    vec2 eyeCenter = -vec2(0.,-.025-innerOffset);
    
    vec2 eyeOffset = mouse*vec2(.1,.5)+vec2(.0,-.1);
    eyeOffset.y = min(eyeOffset.y, 0.03);
    eyeOffset = vec2(0.); // DEACTIVATE
    
    float pupille = circle(uv-eyeCenter-eyeOffset, .08);
    
    float upperEye = circle(uv+innerCircleNoise - vec2(0.,.01-upperOffset), upperRadius);
    float lowerEye = circle(uv+innerCircleNoise + vec2(0.,-.01-lowerOffset), lowerRadius);
    
    float eyeRing = stripesCircle(uv-eyeCenter-eyeOffset, StripesCircleOpt(.05, .25, 2., -.05, 0.), StripesOpt(.5, 0., 0.));
    float eyeRingFade = clamp((-upperEye*7.)*(-lowerEye*7.) + .2, 0., .9);
    
    float eyeWhite = -circle(uv+innerCircleNoise-eyeCenter, mix(.95, .99, noise(seed+uv*8.+45.1+iTime*.5))*innerRadius);
    
    float eye = 1.;
    eye = min(eye, upperEye-.01);
    eye = min(eye, lowerEye-.01);
    
    vec3 col = vec3(.0, .3, .6);
    col = mix(col, eyeColor, fill(eyeRing)*eyeRingFade);
    col = mix(col, vec3(1.), fill(pupille));
    col = mix(col, vec3(1.), fill(eyeWhite));
    
    dist = eye;
    return col;
}

// Animation around the small eyes
// Pb: How to do a kind of temporal modulo on this to clone along path at low cost?
vec2 anim1(float anim) {
    float len = PI*.14+.11*2.+PI*.14+.11*2.;
    vec2 cc = vec2(.14,.11);
    float theta;
    float a1 = fit01(.0, .22/len, fract(anim));
    float a2 = fit01(.22/len, (.22+PI*.14)/len, fract(anim));
    float a3 = fit01((.22+PI*.14)/len, (.44+PI*.14)/len, fract(anim));
    float a4 = fit01((.44+PI*.14)/len, 1., fract(anim));
    theta = PI*a2;
    vec2 cc2 = vec2(.0,.11) + .14 * vec2(cos(theta), sin(theta));
    theta = PI+PI*a4;
    vec2 cc4 = vec2(.0,-.11) + .14 * vec2(cos(theta), sin(theta));
    vec2 cc1 = vec2(.14,-.11) + a1 * vec2(0.,.22);
    vec2 cc3 = vec2(-.14,.11) + a3 * vec2(0.,-.22);
    cc = mix(cc1, cc2, step(0.01, a2));
    cc = mix(cc, cc3, step(0.01, a3));
    cc = mix(cc, cc4, step(0.01, a4));
    return cc;
}

vec3 drawSubEyes(vec3 col, vec2 uv, vec2 mouse, out float dist) {
    uv -= vec2(-.7,-.065);
    mouse -= vec2(-.7,-.065);
    uv.x *= 1.+uv.y*uv.y*1.5;
    float mask = capsule(uv, .17, .11);
    
    float topEyeDist, bottomEyeDist;
    vec3 topEyeLayer =    smallEye(uv-vec2(.0,.085), mouse-vec2(.0,.085), vec2(.12,.7896), vec3(.7, .2, .5), topEyeDist);
    vec3 bottomEyeLayer = smallEye(uv-vec2(.0,-.11), mouse-vec2(.0,-.11), vec2(8.1,54.16), vec3(1., .15, .14), bottomEyeDist);
    float eyesMask = max(topEyeDist, bottomEyeDist);
    
    // Inter eyes
    float h1Stripes = stripes(uv*vec2(3.5,1.)+vec2(iTime*.08,.0), StripesOpt(0.,0.,0.));
    float h1InnerMask = min(mask, -eyesMask)-.01;
    h1InnerMask = min(h1InnerMask, -max(abs(uv.x)-.2, abs(uv.y)-.1));
    float h1StripesMask = h1InnerMask-.005;
    h1Stripes = smin(h1Stripes, h1StripesMask, .01);
    
    // Top of eyes
    float h2Stripes = stripes(uv*vec2(3.5,1.)+vec2(iTime*.08,.0), StripesOpt(0.,0.,0.));
    float h2InnerMask = min(mask, -eyesMask)-.01;
    h2InnerMask = min(h2InnerMask, uv.y-.1);
    float h2StripesMask = h2InnerMask-.005;
    h2Stripes = smin(h2Stripes, h2StripesMask, .01);
    
    // Bottom of eyes
    float h3Stripes = stripesCircle(uv-vec2(.0,.3), StripesCircleOpt(.3, .7, 4.5, -.03, 32.7), StripesOpt(0.,0.,0.));
    float h3InnerMask = min(mask, -eyesMask)-.01;
    h3InnerMask = min(h3InnerMask, -uv.y-.1);
    float h3StripesMask = h3InnerMask-.005;
    h3Stripes = smin(h3Stripes, h3StripesMask, .01);
    
    for (float i = 0. ; i < 1. ; i += .15) {
        vec2 r = rand2(vec2(i,.167));
        vec2 cc = anim1(iTime*.05+i+.01*(r.x-.5));
        mask = max(mask, circle(uv-cc, mix(.045, .05, r.y)));
    }
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(1., .32, .17), fill(h1InnerMask));
    col = mix(col, vec3(.75, .8, .84), fill(h1Stripes));
    col = mix(col, vec3(.83, .88, .7), fill(h2InnerMask));
    col = mix(col, vec3(.75, .8, .84), fill(h2Stripes));
    col = mix(col, vec3(.83, .88, .7), fill(h3InnerMask));
    col = mix(col, vec3(0.6, 0.3, 0.6), fill(h3Stripes*.5));
    
    col = mix(col, topEyeLayer, fill(topEyeDist));
    col = mix(col, bottomEyeLayer, fill(bottomEyeDist));
    
    dist = mask;
    return col;
}

vec3 horn1(vec3 col, vec2 uv, float mainEye, float dh4, out float dist) {
    vec2 uv2 = (uv-vec2(-.32,.1))*vec2(1.,1.1);
    float mask = circle(uv2, .7);
    mask = min(mask, -circle(uv-vec2(-.7,.3), .7));
    mask = min(mask, circle(uv-vec2(-.45,-.2), .7));
    
    float cr1 = circleRing(uv2*.47, 10., .055, .065, .0, .08, .0);
    float cr2 = circleRing(uv2*.445, 5., .045, .05, .0, .08, .27);
    float cr3 = circleRing((uv-vec2(-.7,.3))*.66, 10., .14, .05, .0, -.08, .0);
    
    float innerMask = mask-mix(.008,.015,noise(uv*8.));
    innerMask = min(innerMask, -cr2);
    innerMask = min(innerMask, -dh4);
    
    float s = stripes(uv*vec2(3.,1.5)+vec2(iTime*.12,.7), StripesOpt(0.5, .3, 0.5));
    float stripesMask = innerMask-mix(.005,.015,noise(uv*15.));
    stripesMask = min(stripesMask, -cr1);
    stripesMask = min(stripesMask, -cr3);
    s = smin(s, stripesMask, .02);
    s = min(s, -mainEye-.008);
    s*=.7;
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.95,.9,.6), fill(innerMask));
    col = mix(col, vec3(1.,.292,.173), fill(s));
    dist = mask;
    return col;
}

vec3 horn2(vec3 col, vec2 uv, float mainEye, float dh4, out float dist) {
    uv -= vec2(-.33, .23);
    uv = rot(3.0) * uv;
    vec2 muv = uv;
    muv += noise2(uv*10.)*.01;
    
    float mask = circle(muv, .3);
    float innerMask = mask-.013;
    innerMask = min(innerMask, -circle(muv, .1));
    innerMask = min(innerMask, -dh4);
    
    float cr1 = circleRing(uv*1.2, 10., .05, .065, .0, -.12, .0);
    
    float stripesMask = innerMask-.01;
    stripesMask = min(stripesMask, -cr1);
    stripesMask = min(stripesMask, -mainEye-.008);
    
    float c = stripesCircle(uv, StripesCircleOpt(.0, .5, 2.0, -.12, 32.7), StripesOpt(.5, 0.3, 1.));
    c = smin(c, stripesMask, .02);
    
    float redRing = contours(circle(muv, .1), .01);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.95,.9,.6), fill(innerMask));
    col = mix(col, vec3(1.,.292,.173), fill(c));
    col = mix(col, vec3(.7,.232,.273), fill(redRing));
    dist = mask;
    return col;
}

vec3 horn3(vec3 col, vec2 uv, float mainEye, float subEyes) {
    uv -= vec2(0., .31);
    uv.xy = uv.yx;
    vec2 muv = uv;
    muv += noise2(uv*10.-iTime*.5)*.01;
    
    vec2 buv = uv;
    float bending = max(0., -(uv.y+.5)*1.4);
    bending += max(0., (uv.y+.4)*.7);
    bending = bending * bending;
    buv.x += bending;
    float s = stripes(buv*vec2(3.,1.5)+vec2(iTime*.12,.7), StripesOpt(0.5, .3, 0.));
    
    float mask = circle(muv-vec2(-.3,-.5), .5);
    float bending2 = max(0., -(uv.y+.5)*1.8);
    bending2 += max(0., (uv.y+.5)*.7);
    bending2 = bending2 * bending2;
    mask = min(mask, -(uv.x+bending2));
    mask = min(mask, uv.x+.66+uv.y*.2);
    mask = min(mask, uv.y+.7);
    
    float innerMask = mask-mix(.017, .012, fit01(-.2, -.1, uv.x));
    innerMask = smin(innerMask, -subEyes, mix(0.1, 0.01, uv.x+1.3));
    
    float stripesMask = innerMask-.01;
    float eyes = max(mainEye, subEyes);
    stripesMask = min(stripesMask, -eyes-mix(.0, .05, pow(noise(uv*10.-iTime*.1), 4.)));
    
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.292, .8, .653), fill(innerMask));
    col = mix(col, vec3(.4,.7,1.), fill(s));
    
    return col;
}

vec3 horn4(vec3 col, vec2 uv, float subEyes, out float dist) {
    vec2 cuv = rot(-.1)*(uv-vec2(-.55,-.03))+vec2(uv.y*uv.y,.0)*.7;
    vec2 nuv = cuv + noise2(uv*7.+.2*iTime)*.015;
    
    float cr1 = circleRing(nuv*.85, 8., .08, .09, .0, -.12, .0);
    float cr2 = circleRing(rot(-.42)*nuv*.85, 4., .08, .09, .0, -.12, .0);
    
    float mask = circle(nuv, .42);
    float innerMask = mask-.015;
    innerMask = min(innerMask, -circle(nuv, .1));
    innerMask = min(innerMask, -subEyes);
    float stripesMask = innerMask-.01;
    
    stripesMask = min(stripesMask, -cr1);
    innerMask = min(innerMask, -cr2+.02);
    
    float c = stripesCircle(cuv, StripesCircleOpt(.0, .7, 2.9, .1, 32.7), StripesOpt(.5, 0.5, 1.));
    c = smin(c, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.85, .202, .173), fill(innerMask));
    col = mix(col, vec3(1., .32, .17), fill(c));
    dist = mask;
    return col;
}

vec3 horn5(vec3 col, vec2 uv, float dh4, out float dist) {
    uv -= vec2(-.65, .32);
    uv *= 1.5;
    uv = rot(3.0) * uv;
    vec2 muv = uv;
    muv += noise2(uv*10.)*.01;
    
    float mask = circle(muv, .3);
    float innerMask = mask-.017;
    innerMask = min(innerMask, -circle(muv, .1));
    innerMask = min(innerMask, -dh4);
    
    float cr1 = circleRing(uv*1.25, 10., .05, .065, .0, -.12, .0);
    
    float stripesMask = innerMask-.01;
    stripesMask = min(stripesMask, -cr1);
    
    float c = stripesCircle(uv, StripesCircleOpt(.0, .5, 1.3, -.1, 32.7), StripesOpt(.5, 0.2, 1.));
    c = smin(c, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.55,.3,.55), fill(innerMask));
    col = mix(col, vec3(.75,.15,.25), fill(c));
    dist = mask;
    return col;
}

vec3 horn6(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.62, -.25);
    uv *= 1.5;
    uv = rot(3.0) * uv;
    vec2 muv = uv;
    muv += noise2(uv*6.)*.02;
    
    float mask = circle(muv, 1.5);
    mask = min(mask, -circle(muv, 1.1));
    
    float cr1 = circleRing(uv*.21, 16., .03, .035, .5, -.12, .0);
    float cr2 = circleRing(rot(.5)*uv*.335, 6., .04, .045, .8, .12, .0);
    float cr3 = circleRing(uv*.335, 6., .04, .045, .8, .09, .0);
    
    float innerMask = mask-.017;
    innerMask = min(innerMask, -cr3);
    
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.));
    stripesMask = min(stripesMask, -cr1);
    stripesMask = min(stripesMask, -cr2-.01);
    stripesMask = min(stripesMask, -mainEye-.002);
    
    float s = stripes(rot(-.5)*uv*vec2(1.3,1.)-vec2(-iTime*.03,-1.2), StripesOpt(.5, 0.5, 1.));
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(1., .32, .17), fill(innerMask));
    col = mix(col, vec3(.85,.8,.25), fill(s));
    dist = mask;
    return col;
}

vec3 horn7(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.75, .25);
    uv = uv.yx;
    vec2 muv = uv;
    muv += noise2(uv*6.)*.01;
    
    muv = abs(muv);
    float mask = -max(muv.x-.5, muv.y-.12);
    
    vec2 cruv = uv;
    cruv -= vec2(iTime*.05, -.085);
    float iter = floor(cruv.x / .3);
    cruv.x = mod(cruv.x, .3)-.3/2.;
    vec2 r = rand2(vec2(iter, .127));
    vec2 offset = vec2(mix(-.1,.1,r.y), .0);
    float cr1 = circle(cruv-offset, mix(.05, .06, r.x));
    
    float innerMask = mask-.017;
    mask = max(mask, cr1);
    mask = min(mask, -(muv.x-.5));
    
    float stripesMask = innerMask-mix(.005, .015, noise(uv*10.));
    stripesMask = min(stripesMask, -mainEye-.002);
    
    float s = stripes(uv*vec2(3.,4.)-vec2(-iTime*.03,-.0), StripesOpt(.5, 0.5, 0.));
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.99, .96, .73), fill(innerMask));
    col = mix(col, vec3(.95,.82,.22), fill(s));
    dist = mask;
    return col;
}

vec3 horn8(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.75, -.5);
    vec2 muv = uv;
    muv += noise2(uv*6.)*.01;
    
    muv.x += -.5*muv.y;
    muv = abs(muv);
    float mask = -max(muv.x-.26, muv.y-.11);
    
    float innerMask = mask-.017;
    
    float stripesMask = innerMask-mix(.002, .025, noise(uv*15.));
    stripesMask = min(stripesMask, -mainEye-.002);
    
    float s = stripes(uv*vec2(4.,7.)-vec2(-iTime*.03,.16), StripesOpt(.5, 0.2, 0.))*.25;
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.0, .3, .6), fill(innerMask));
    col = mix(col, vec3(.65,.4,.65), fill(s));
    dist = mask;
    return col;
}

vec3 horn9(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv = uv * 1.5 - vec2(1., -.7);
    uv = vec2(uv.y, -uv.x);
    vec2 cruv = uv;
    uv = elbow(uv);
    uv.y += -.23;
    
    vec2 muv = uv;
    muv += noise2(uv*6.)*.01;
    muv = abs(muv);
    float mask = -max(muv.x-.7, muv.y-.16);
    
    cruv -= vec2(.13,.13);
    cruv = elbow(cruv);
    cruv += vec2(-.1*iTime, -.26);
    float iter = floor(cruv.x/ .3);
    cruv.x = mod(cruv.x, .3)-.3/2.;
    float cr1 = circle(cruv, mix(.07, .09, rand2(vec2(iter, .127)).x));
    
    float cr2 = circle(cruv+vec2(.1,.12), mix(.07, .09, rand2(vec2(iter, .127)).x));
    
    float innerMask = mask-mix(.023, .015, noise(uv*8.));
    innerMask = min(innerMask, -cr1);
    mask = max(mask, cr2);
    
    float stripesMask = innerMask-mix(.01, .02, noise(uv*10.));
    
    
    float s = stripes(uv*vec2(2.,3.)-vec2(iTime*.05,-.0), StripesOpt(.65, 0.5, 0.))*.25;
    float s2 = stripes(uv*vec2(1.,3.)-vec2(iTime*.025+.1*uv.y,-.0), StripesOpt(0., -1.3, 0.));
    s = min(s, -s2);
    s = smin(s, stripesMask, .01);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.75, .8, .84), fill(innerMask));
    col = mix(col, vec3(1., .32, .17), fill(s));
    
    dist = mask;
    return col;
}

vec3 horn10(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.85, .25);
    uv = uv.yx;
    vec2 muv = uv;
    muv += noise2(uv*6.)*.01;
    
    muv = abs(muv);
    float mask = -max(muv.x-.5, muv.y-.12);
    
    float innerMask = mask-.017;
    
    float stripesMask = innerMask-mix(.005, .015, noise(uv*10.));
    stripesMask = min(stripesMask, -mainEye-.002);
    
    float s = stripes(uv*vec2(4.,4.)-vec2(iTime*.02,-.0), StripesOpt(1.5, 0.5, 0.));
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.292, .8, .653), fill(innerMask));
    col = mix(col, vec3(.4,.7,1.), fill(s));
    dist = mask;
    return col;
}


vec3 horn11(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.0, -.3);
    uv = rot(0.3) * uv;
    vec2 muv = uv;
    muv += noise2(uv*10.)*.01;
    
    float mask = circle(muv, .38);
    float innerMask = mask-.017;
    innerMask = min(innerMask, -circle(muv, .1));
    
    float cr1 = circleRing(uv*.95, 10., .05, .065, .0, -.12, .0);
    float cr2 = circleRing(uv*1.023, 8., .05, .065, .5, .12, .0);
    
    mask = max(mask, cr2);
    
    float stripesMask = innerMask-.01;
    stripesMask = min(stripesMask, -cr1);
    stripesMask = min(stripesMask, -mainEye-.005);
    
    float c = stripesCircle(uv, StripesCircleOpt(.0, .55, 2.1, -.1, 32.7), StripesOpt(.5, .5, 1.));
    
    float s = stripes((rot(-1.1)*uv)*vec2(2.,3.)+vec2(-iTime*.1,.6), StripesOpt(.5, .5, 1.));
    float limit = uv.x+uv.y*2. - .1;
    c = mix(s, c, step(0., limit));
    stripesMask = smin(stripesMask, -contours(limit, .015), .02);
    
    c = smin(c, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.75, .8, .84), fill(innerMask));
    col = mix(col, vec3(1., .32, .17), fill(c));
    dist = mask;
    return col;
}


vec3 horn12(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(-.1, -.25);
    uv = uv.yx;
    vec2 muv = uv;
    muv += noise2(uv*6.)*.01;
    
    muv = abs(muv);
    float mask = -max(muv.x-.5, muv.y-.12);
    
    vec2 cruv = uv;
    cruv -= vec2(iTime*.05, .08);
    float iter = floor(cruv.x / .3);
    cruv.x = mod(cruv.x, .3)-.3/2.;
    float cr1 = circle(cruv, mix(.05, .06, rand2(vec2(iter, .127)).x));
    
    float innerMask = mask-.017;
    mask = max(mask, cr1);
    mask = min(mask, -(muv.x-.5));
    
    float stripesMask = innerMask-mix(.005, .015, noise(uv*10.));
    stripesMask = min(stripesMask, -mainEye-.002);
    
    float s = stripes(uv*vec2(4.,4.)-vec2(iTime*.02,-.0), StripesOpt(.7, 0.5, 1.));
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(1., .37, .3), fill(innerMask));
    col = mix(col, vec3(.5,.9,.3), fill(s*.5));
    
    dist = mask;
    return col;
}

vec3 horn13(vec3 col, vec2 uv, float bg, out float dist) {
    uv -= vec2(.0,.3);
    float innerMask = -bg+.004;
    innerMask = min(innerMask, uv.x);
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.+iTime));
    float s = stripes(uv*vec2(3.,1.)+vec2(-iTime*.05,0.), StripesOpt(.9,.5,.0));
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(1., .37, .3), fill(innerMask));
    col = mix(col, vec3(.65,.4,.65), fill(s));
    
    dist = innerMask;
    return col;
}

vec3 horn14(vec3 col, vec2 uv, float mainEye, float dh15, out float dist) {
    uv -= vec2(.445,.0);
    float mask = circle(uv+vec2(.0,-.7*uv.x*uv.x)-noise2(uv*10.+iTime*.1)*.01, .2);
    float innerMask = mask-.013;
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.+iTime));
    float s = stripes(uv*vec2(3.3,1.)+vec2(iTime*.03,0.), StripesOpt(.9,.3,.0));
    stripesMask = min(stripesMask, -mainEye-.005);
    stripesMask = min(stripesMask, -dh15-.005);
    s = smin(s, stripesMask, .02);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.1, .3, .5), fill(innerMask));
    col = mix(col, vec3(0.9, 0.8, 0.2), fill(s));
    
    dist = mask;
    return col;
}

vec3 horn15(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.445,-.1);
    float mask = circle(uv+vec2(.0,-.7*uv.x*uv.x)+noise2(uv*9.-iTime*.15)*.02, .2);
    float innerMask = mask;//-.013;
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.+iTime));
    
    float bending = max(0., uv.y-.0);
    bending = bending * bending * smoothstep(.05, .15, uv.x);
    uv.x += -1.*bending;
    
    float s = stripes(uv*vec2(3.8,1.)+vec2(-iTime*.03,0.), StripesOpt(.9,.3,.0))*.5;
    stripesMask = min(stripesMask, -mainEye-.005);
    s = smin(s, stripesMask, .01);
    
    col = mix(col, vec3(1., .9, .65), fill(innerMask));
    col = mix(col, vec3(1., .37, .3), fill(s));
    
    dist = innerMask;
    return col;
}

vec3 horn16(vec3 col, vec2 uv, float mainEye, out float dist) {
    uv -= vec2(.525,-.15);
    vec2 cuv = uv+vec2(.0,-.7*uv.x*uv.x)+noise2(uv*9.-iTime*.15)*.01;
    float mask = circle(cuv, .12);
    
    mask = max(mask, -max(abs(cuv.x+.12)-.12, abs(cuv.y)-.12));
    mask = max(mask, -max(abs(cuv.x)-.12, abs(cuv.y+.12)-.12));
    
    float innerMask = mask-.013;
    mask = -smin(-mask, -mainEye, .05);
    
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.+iTime));
    innerMask = smin(innerMask, -mainEye, .01);
    
    float s = stripes(uv*vec2(3.8,1.)+vec2(-iTime*.03,0.), StripesOpt(.9,.3,.0))*.5;
    stripesMask = min(stripesMask, -mainEye-.005);
    s = smin(s, stripesMask, .01);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.292, .8, .653), fill(innerMask));
    col = mix(col, vec3(.4,.7,1.), fill(s));
    
    dist = mask;
    return col;
}

vec3 horn17(vec3 col, vec2 uv, float mainEye, float dh11, float dh9, out float dist) {
    uv -= vec2(.525,-.25);
    vec2 cuv = uv+vec2(.0,-.7*uv.x*uv.x)+noise2(uv*9.-iTime*.15)*.005;
    float mask = circle(cuv, .12);
    
    mask = max(mask, -max(abs(cuv.x+.12)-.12, abs(cuv.y)-.12));
    mask = max(mask, -max(abs(cuv.x)-.12, abs(cuv.y+.12)-.12));
    mask = max(mask, -max(abs(cuv.x)-.25, abs(cuv.y+.2)-.2));
    
    float innerMask = mask-.013;
    mask = -smin(-mask, -mainEye, .05);
    
    float stripesMask = innerMask-mix(.005, .015, noise(uv*10.+iTime));
    innerMask = smin(innerMask, -mainEye, .01);
    
    float s = stripes((rot(-.3)*uv)*vec2(3.4,1.)+vec2(-iTime*.03,0.), StripesOpt(.9,.5,.0))*.25;
    stripesMask = min(stripesMask, -mainEye-.005);
    float sides = max(dh11, dh9);
    stripesMask = min(stripesMask, -sides-mix(.0, .01, noise2(uv*10.).x));
    s = smin(s, stripesMask, .005);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.8, .2, .15), fill(innerMask));
    col = mix(col, vec3(.95,.8,.1), fill(s));
    
    dist = mask;
    return col;
}

vec3 horn18(vec3 col, vec2 uv, out float dist) {
    uv -= vec2(.965,-.12);
    vec2 cuv = uv+vec2(.0,-.7*uv.x*uv.x)+noise2(uv*9.-iTime*.15)*.01;
    float mask = circle(cuv, .12);
    
    mask = max(mask, -max(abs(cuv.x-.12)-.12, abs(cuv.y)-.12));
    mask = max(mask, -max(abs(cuv.x)-.12, abs(cuv.y+.12)-.12));
    
    float innerMask = mask-.013;
    
    float stripesMask = innerMask-mix(.005, .02, noise(uv*10.+iTime));
    
    float s = stripes(uv*vec2(3.8,1.)+vec2(-iTime*.03,0.), StripesOpt(.9,.3,.0))*.5;
    s = smin(s, stripesMask, .01);
    
    col = mix(col, vec3(.14, .21, .3), fill(mask));
    col = mix(col, vec3(.75, .8, .84), fill(innerMask));
    col = mix(col, vec3(.4,.7,1.), fill(s));
    
    dist = mask;
    return col;
}

vec3 dots(vec3 col, vec2 uv, out float dist) {
    vec2 n = noise2(uv*5.+iTime*.4)*.01;
    dist = circle(uv+noise2(uv*10.+.5)*.05+n-vec2(-.82,.33), .045);
    dist = max(dist, circle(uv-vec2(-.9,.2), .1));
    dist = max(dist, circle(uv+noise2(uv*10.+1.7)*.02+n-vec2(-.5,.49), .045));
    dist = max(dist, circle(uv+noise2(uv*10.+2.7)*.02+n-vec2(-.1,.46), .042));
    col = mix(col, vec3(.14, .21, .3), fill(dist));
    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord/iResolution.xy-.5)*iResolution.xy/iResolution.y;
    vec2 mouse = (iMouse.xy/iResolution.xy-.5)*iResolution.xy/iResolution.y;
    
    if (iMouse.xy == vec2(0.)) {
        mouse = vec2(0.,0.17);
    }
    
    float mainEye, subEyes;
    vec3 mainEyeLayer = drawMainEye(vec3(0.), uv, mouse, mainEye);
    vec3 subEyesLayer = drawSubEyes(vec3(0.), uv, mouse, subEyes);
    
    float backgroundRing = stripesCircle(uv, StripesCircleOpt(.4, .95, 6.5, -.1, 32.7), StripesOpt(.5, 0., 1.));
    
    float d, dist = -999.;
    float dh15, dh11, dh9, dh4;
    
    vec3 horn15Layer = horn15(vec3(0.), uv, mainEye, dh15);
    vec3 horn11Layer = horn11(vec3(0.), uv, mainEye, dh11);
    vec3 horn9Layer = horn9(vec3(0.), uv, mainEye, dh9);
    vec3 horn4Layer = horn4(vec3(0.), uv, subEyes, dh4);
    
    vec3 col = vec3(1.);
    col = dots(col, uv, d); dist = max(dist, d);
    col = horn14(col, uv, mainEye, dh15, d); dist = max(dist, d);
    col = mix(col, horn15Layer, fill(dh15)); dist = max(dist, dh15);
    col = horn16(col, uv, mainEye, d); dist = max(dist, d);
    col = horn17(col, uv, mainEye, dh11, dh9, d); dist = max(dist, d);
    col = horn6(col, uv, mainEye, d); dist = max(dist, d);
    col = mix(col, horn11Layer, fill(dh11)); dist = max(dist, dh11);
    col = horn12(col, uv, mainEye, d); dist = max(dist, d);
    col = horn1(col, uv, mainEye, dh4, d); dist = max(dist, d);
    col = horn5(col, uv, dh4, d); dist = max(dist, d);
    col = horn2(col, uv, mainEye, dh4, d); dist = max(dist, d);
    col = mix(col, horn4Layer, fill(dh4)); dist = max(dist, dh4);
    col = horn3(col, uv, mainEye, subEyes);
    col = horn10(col, uv, mainEye, d); dist = max(dist, d);
    col = horn18(col, uv, d); dist = max(dist, d);
    col = mix(col, horn9Layer, fill(dh9)); dist = max(dist, dh9);
    col = horn8(col, uv, mainEye, d); dist = max(dist, d);
    col = horn13(col, uv, dist, d); dist = max(dist, d);
    col = horn7(col, uv, mainEye, d); dist = max(dist, d);
    col = mix(col, mainEyeLayer, fill(mainEye)); dist = max(dist, mainEye);
    col = mix(col, subEyesLayer, fill(subEyes)); dist = max(dist, subEyes);
    
    col = mix(col, vec3(.14, .21, .3), fill(-dist-mix(.005, .02, noise(uv*10.))));
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
