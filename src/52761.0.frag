/*
 * Original shader from: https://www.shadertoy.com/view/wsfXzH
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
// Author: Krab	
// Title: Functions

#define PI 3.14159265359

#ifdef GL_ES
precision mediump float;
#endif


float cubicPulse( float c, float w, float x )
{
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
}

const float F3 =  0.3333333;
const float G3 =  0.1666667;
float snoise(vec3 p) {
    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));
    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e*(1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy*(1.0 - e);
    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0*G3;
    vec3 x3 = x - 1.0 + 3.0*G3;
    vec4 w, d;
    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);
    w = max(0.6 - w, 0.0);
    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);
    w *= w;
    w *= w;
    d *= w;
    return dot(d, vec4(52.0));
}

//  Function from Iñigo Quiles
//  https://www.shadertoy.com/view/MsS3Wc
vec3 rgb( in vec3 hsb){
    vec3 rgb = clamp(abs(mod(hsb.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return hsb.z * mix(vec3(1.0), rgb, hsb.y);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    float t = iTime;
    vec2 uv = fragCoord.xy/iResolution.xy;
    uv.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.);
        
    float noiseScl = 10.5;
    float n = snoise(vec3(uv.x*noiseScl, uv.y*noiseScl, t));
    
    uv += .08*n;
    
    float modScl = .05;
    uv = mod(uv, modScl);
    float pulseX = cubicPulse(modScl*.5, 0.012, uv.x);
    float pulseY = cubicPulse(modScl*.5, 0.012, uv.y);
    
    float pct = 0.;
    pct += n*pulseX;
    pct += n*pulseY;
    pct = smoothstep(0., 1.0, pct);
    pct = clamp(pct, .0, 1.);
    
    color += rgb(vec3(.6+pct*0.6, 1., pct));
    
    fragColor = vec4(color,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
