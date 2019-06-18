/*
 * Original shader from: https://www.shadertoy.com/view/3dBXWt
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
#define PI 3.1415
const float period = 5.;


vec2 rotate(vec2 p, vec2 piv, float angle)
{
    p -= piv;
    return vec2(p.x*cos(angle)-p.y*sin(angle) + piv.x,
                p.y*cos(angle)+p.x*sin(angle) + piv.y);
}

// Returns value in [0,1], on time interval [offset, offset+duration]
// mode changes how value changes
float window( int mode, float t)
{
    // 0 is linear
    if (mode == 1) // fast end maintain 1
        t *= t;
    else if (mode == 2) // fast start maintain 1
        t = 1. - (1. - t)*(1. - t);
    else
        t = .5 + .5*cos( -PI + 2.*PI*t);

    return t;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Time controls
    float t[6];
    t[0] = window( 3, mod(iTime, 5.)/5.);
   	t[1] = window( 3, mod(iTime, 10.)/10.);
    t[2] = window( 0, mod(iTime, 2.)/2.);
    t[3] = window( 3, mod(iTime, 1.)/1.);
    t[4] = window( 2, clamp(mod(iTime,2.) - .7, 0.,1.8)/1.8);
    t[5] = window( 2, clamp(mod(iTime,3.) - 1.5, 0.,1.8)/1.8);
    
    // Normalized pixel coordinates (from 0 to 1)
    float r = iResolution.x/iResolution.y;
    vec2 uv = fragCoord/iResolution.y - vec2(r/2.,.5);
    
    // move web center
    uv += vec2(.4,-0.2);
    
    
    float wavy = .1*sin(30.*length(uv));
	float spiralCW = length(uv);
    uv = rotate(uv, vec2(0), iTime*.4
                
                + t[0]*wavy
                + t[1]*spiralCW
               ); 
    
    vec2 pol = vec2(length(uv), (atan(uv.y,uv.x))/(2.*PI) + .5 );
    
   	// caleidoscope
    vec2 polOld = pol;
    pol.y = mod(pol.y, .059);
    
	float web = 1.- smoothstep(0.0, 0.008, pol.y * pol.x*3.);
	// radial
    web += smoothstep(0.0565, 0.058, pol.y );
    // arcs curvature
    float modul = (pol.y - 0.*t[1]*.1*sin(polOld.y*21.2)) * (pol.y - .05);
    float pulse = 1. - smoothstep(.05, .3 ,abs(pol.x - mix(0.,2.,max(t[4], t[5])*1.5 - .5  )));
    
    float arcs = smoothstep(.57,
                            .76,
                            sin((pol.x + pulse*.1 - pol.x*modul*140.) * (60.+ floor(polOld.y/.059)*2.))-.3);
    web += arcs;

    vec3 col = mix(
        			vec3( window(3, pol.y/.059) *(.5+.5*sin(pol.x*40.*polOld.y) + t[1]) )*t[1]*.2,
        			mix(
                        mix(
                        vec3(pol.y*5.,pol.x + 4.*pulse, t[1]),
                        vec3(pol.x*20.*t[1] + pulse,pol.y*2., t[3]),
                        arcs),
                        vec3(1),
                        1.-t[1]),
        			web);
//  vec3 col = vec3(web);

    fragColor = vec4(col,1.);
    //fragColor = vec4(pulse);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
