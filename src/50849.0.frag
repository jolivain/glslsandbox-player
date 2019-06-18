/*
 * Original shader from: https://www.shadertoy.com/view/4lVBDV
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define BLUE vec4(48./255., 182./255., 243./255., 1.)
#define GREY vec4(36./255., 44./255., 44./255., 1.)
#define TONGUE_CLR vec4(223./255., 24./255., 96./255., 1.)
#define SHADOW_CLR vec3(40./255., 153./255., 200./255.)
#define A (5./iResolution.y)
#define OUTER_S(x, y) smoothstep(x, x+A, y)
#define INNER_S(x, y) smoothstep(x+A, x, y)

vec4 shadows(vec2 uv, float m){
	vec4 clr = vec4(1.);
    {//chin
        vec2 uv = vec2(uv.x + m * .25, uv.y + m * .4);
        clr = vec4(SHADOW_CLR, INNER_S(.2 - m*.075 , distance(vec2(.025, -.15), uv)));	
    	clr.a *= OUTER_S(.35, distance(vec2(.02, .13), uv));
    }
    
    {//eyes
        vec2 uv = vec2(abs(uv.x + .1), uv.y + m * .5);
        clr = mix(clr, vec4(SHADOW_CLR, 1.), INNER_S(.26, distance(vec2(.33, .6), uv)));
        clr.a *= step(uv.y - .4, 0.);
    }
    
    {//forehead
        vec2 uv = vec2(abs(uv.x + .1), uv.y + m * .5);
    	float cutoff = OUTER_S(.125 - .05*m, uv.y - .4) * INNER_S(cos(uv.x * 1.85) * .175, uv.y - .4);
        clr = mix(clr, vec4(SHADOW_CLR, m), cutoff);
    }
    
    return clr;
}

vec4 mouth(vec2 uv, float m){
    uv *= 1. + (m*.6 - .2);
    
	vec2 shifted_uv = vec2(uv.x + .2 * m, uv.y + .9 * m);
    vec4 clr = GREY;
    
    {//tongue
        vec2 shifted_uv = vec2(uv.x + .1 * m, uv.y + .6 * m);
    	clr = mix(GREY, TONGUE_CLR, INNER_S(.3, distance(vec2(.2, -.25), shifted_uv)));
    }
    
    {//cheek
        vec2 shifted_uv = vec2(uv.x + .2 * m, uv.y + .9 * m);
    	clr.a *= OUTER_S(.3, distance(vec2(-.4, .15), shifted_uv));
    }
	
    {//teeth
        vec2 st = vec2(mod(uv.x, .15), uv.y + .275*m) * 1.1;
        vec4 teeth = vec4(vec3(1.), INNER_S(.07, distance(vec2(.075, .16), st)));
        teeth.a *= step(abs(uv.x), .3);
        teeth.rgb *= .8 + .2 * INNER_S(.125, st.y);
    	clr = mix(clr, teeth, teeth.a);
    }
	
    {//lips
        vec2 st = shifted_uv * 5.;
		float curve = pow(cos(st.x) * .075, .5);
        
        clr = mix(clr, vec4(GREY.rgb, .3*pow(m, 4.)),
                  (1.-clr.a) * INNER_S( -curve+curve*m, shifted_uv.y - .2 + abs(uv.x)*.075));
        
        clr.a *= INNER_S(curve-curve*(1.-m), shifted_uv.y - .15);
    	clr.a *= OUTER_S(-curve+curve*m, shifted_uv.y - .15);
    	clr.a *= INNER_S(.31415, abs(shifted_uv.x));
    }
	return clr;
}

vec4 eyes(vec2 uv, vec2 m){
    float sx = sign(uv.x);
	uv.x = abs(uv.x + .1);
    uv.y += (1.-m.y) * .5;
    vec4 main = vec4(vec3(1.), INNER_S(.12, distance(vec2(.33, .4), uv)));
	m = m*2.-1.;
    vec2 eyeCenter = vec2(.33, .4);
    eyeCenter += normalize(m - vec2(eyeCenter.x*sx, eyeCenter.y)) * vec2(sx, 1.) * .06;
    eyeCenter.y = max(eyeCenter.y, .4);
    vec4 pupil = vec4(GREY.rgb, INNER_S(.06, distance(eyeCenter, uv)));
    pupil.a *= OUTER_S(.025, distance(eyeCenter + normalize(vec2(-.5*sx, .5)) * .065, uv));
	
    main = mix(main, pupil, pupil.a);
    return main * vec4(vec3(1.), step(0., uv.y - .4));
}

vec4 bg(vec2 uv, float m){
    uv *= vec2(.5, 2.);
	return GREY * (.6 + .4 * smoothstep(.1 + .15*m, .3+A, distance(uv, vec2(0., -1.65))));
}

vec4 makeBall(vec2 uv){
	vec2 m = iMouse.xy/iResolution.xy;
    vec4 bg = bg(uv, 1.-m.y);
    uv.y += .1 + (-.2*m.y);
    vec4 eyes = eyes(uv, m);
    vec4 mouth = mouth(uv, 1. - m.y);
    vec4 shadows = shadows(uv, 1. - m.y);
    vec4 headClr = mix(BLUE, eyes, eyes.a);
    headClr = mix(headClr, mouth, mouth.a);
    headClr = mix(headClr, shadows, shadows.a);
    
    return mix(bg, headClr, INNER_S(.75, length(uv)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = (fragCoord*2.-iResolution.xy)/iResolution.y;
    fragColor = makeBall(uv);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 1.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
