/*
 * Original shader from: https://www.shadertoy.com/view/ttlGD4
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

// Emulate a texture
#define texture(s, uv) (BACK_COL)

// --------[ Original ShaderToy begins here ]---------- //
#define BACK_COL vec3(150,206,208)/255.
#define BROWN_COL vec3(213,126,127)/255.
#define PURPLE_COL vec3(150,117,168)/255.
#define BLACK_COL vec3(81,66,84)/255.
#define PINK_COL vec3(218,114,175)/255.
#define PINK_L_COL vec3(220,174,209)/255.

#define SF (1./min(iResolution.x,iResolution.y))
#define SS(l,s) smoothstep(SF,-SF,(l)-(s))

float neck(vec2 p){
    
    vec2 pp = p;
    
    pp.x +=.25;    
    float l = length(pp);            
    float d = SS(l, .945); 
    
    pp = p;
    
    p.x += .8;
    p.y -= .15;    
    l = length(p);
    d *= SS(l, .8);
    
    pp = p;
    
    p.x -= 0.8; // top heck
    p.y += .9;    
    l = length(p);
    d *= SS(l, 1.0);
    
    pp = p;   
    pp *= mat2(cos( sin(-.25) + cos(iTime*2.)*.05 + vec4(0,33,11,0)));
    pp.x *= .2;
    pp.x += .43;    
    pp.y -= .38;   
    l = length(pp);
    d += SS(l, .5) * SS(p.x, -.2 + cos(iTime*5.)*.035);

    return d;      
}

float head(vec2 p){
	vec2 pp = p;
    pp.x-=.0;
    pp *= mat2(cos( sin(-.1) + vec4(0,33,11,0)));
    float d = SS(pp.x, .15);
    
    pp = p; // face
    pp *= mat2(cos( sin(-.25) + vec4(0,33,11,0)));
    d *= SS(-.1, pp.x);    
    pp = p; 
    pp.y += .05;
    float l = length(pp);
    d *= SS(l, .3);
    
    pp = p; // nose
    pp.y += .29;
    pp.x -= .07;
    l = length(pp);
    d += SS(l, .12);
    
    pp = p; //ear l
    pp.y -= .29;
    pp.y *= .5;
    pp.x += .07;
    l = length(pp);
    d += SS(l, .05);
    
    pp = p; // ear r
    pp *= mat2(cos( sin(+.5) + vec4(0,33,11,0)));
    pp.y -= .29;
    pp.y *= .5;        
    l = length(pp);
    d += SS(l, .05);
    
    
    return d;
}

float earLInner(vec2 p){
    
    vec2 pp = p;
	
    pp.y -= .29;
    pp.y *= .5;
    pp.x += .07;
    float l = length(pp);
    float d = SS(l, .03);
    
    d *= SS(-.02, pp.y);
       
    return d;
}

float mane(vec2 p){
	vec2 pp = p + vec2(.04, -.1) + vec2(cos(iTime*1.5), sin(iTime*3.))*.02;
    
    pp.x +=.28;
    float l = length(pp);
    float d = SS(l, .2);
    
    pp = p + vec2(cos(iTime), sin(iTime*3.))*.01;
    
    pp.x +=.48;
    pp.y +=.02;
    l = length(pp);
    d += SS(l, .25);
    
    pp = p + vec2(cos(iTime*2.), sin(iTime))*.01;
    
    pp *= (cos(pp.x*20.1)*.5+.5)*.1+1.;
    pp.x += .05;
    pp.y += .02;
    
    d *= neck(pp*.9);
    
    pp = p + vec2(cos(iTime), sin(iTime))*.01;
    
    pp.x +=.28;
    pp.y -=.10;
    l = length(pp);
    d += SS(l, .15);
    
    pp = p + vec2(cos(iTime*.8), sin(iTime*3.))*.01;
    
    pp.x +=.18;
    pp.y -=.18;
    l = length(pp);
    d += SS(l, .10);
    
    return d;
}

float face(vec2 p){    
    vec2 pp = p;
        
    pp.y += .35;
    pp.x -= .07;
    
    float l = length(pp);
    float d = SS(l, .1);
       
    pp = p;       
    pp.y += .33;
    pp.x -= .09;
    
    l = length(pp);
    d -= SS(l, .1 + (clamp(sin(iTime*2.)*.5+1., .0, 1.))*0.001);    
    
    for(float i=-1.;i<=1.;i+=2.){
        pp = p; // nose
        pp.y += .31;
        pp.x -= .10 + i*.03;
        l = length(pp);
        d += SS(l, .01);	
    }
    

    pp = p; // main contour
    pp.y += .29;
    pp.x -= .07;
    l = length(pp);
    d *= SS(l, .12);
    
    
    
    return  d;
}

float glass(vec2 p){
    
    float d = 0.;
    p.x -= .075;
    p.y -= .01;
    for(float i=-1.;i<=1.;i+=2.){
        vec2 pp = p;
    
        pp.x += i*.075;
        pp.y -= abs(pp.x*.75);
        pp.y *= 1.2;
        
        float l = length(pp);

        d += SS(l, .07);
    }
    
    vec2 pp = p;
    pp.y -= .05;
    float dd = SS(abs(pp.y), .008);
    dd *= SS(abs(pp.x), .1);
    d+=dd;
    
    pp = p;
    pp *= mat2(cos( sin(.5) + vec4(0,33,11,0)));
    pp.y += .02;
    pp.x += .2;
    dd = SS(abs(pp.y), .008);
    dd *= SS(abs(pp.x), .1);
    d+=dd;
	
    
    return d;
}

float glassHighlight(vec2 p){
    float d = 0.;
    p.x -= .075;
    p.y -= .01;
    
	for(float i=-1.;i<=1.;i+=2.){
        vec2 pp = p;
        pp.x += i*.075 + sin(iTime*5.)*.05;
        pp *= mat2(cos( sin(.5) + vec4(0,33,11,0)));
        float dd = SS(abs(pp.x), .02);
        pp = p;    
        pp.x += i*.075;
        pp.y -= abs(pp.x*.75);
        pp.y *= 1.2;
        
        float l = length(pp);

        dd *= SS(l, .07);
        
        dd *= cos(iTime*5.);
        
        d+=dd;
    }
    
    return d;
}

float bang(vec2 p){
    vec2 pp = p + vec2(cos(iTime*2.), sin(iTime*1.))*.005;
    pp.y -= .3;
    pp.x -= .17;
    pp.x += sin(p.y*40.+2.)*.01;
    float l = length(pp);
    
	float d = SS(l, .2);
    
    pp = p;
    pp.y -= .05;        
    pp.x += sin(p.y*40.+2.)*.015 + sin(p.y*40.+2. + iTime*10.)*.005;    
    l = length(pp);    
	d *= SS(l, .2);
    
    return d;
}

float horn (vec2 p){
    vec2 pp = p + vec2(.25,0.);
    
    pp *= mat2(cos( sin(+.5) + vec4(0,33,11,0)));
    float d = SS(.1, pp.x);
    
    pp = p + vec2(.11,0.);    
    pp *= mat2(cos( sin(+.25) + vec4(0,33,11,0)));
    d *= SS(pp.x, .1);
    
    pp = p;
    pp *= mat2(cos( sin(.1) + vec4(0,33,11,0)));
    d *= SS(.245, pp.y);
    
    return d;
	
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 ouv = fragCoord/iResolution.xy;
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    
    uv.x -= .15 + sin(iTime*1.) * .05; // move head    
    uv.y += sin(iTime*5.) * .025;
    uv *= mat2(cos( sin(iTime*2.5)*.1 + vec4(0,33,11,0)));

    // head    
    float m = neck(uv);
    m+=head(uv);
    m = clamp(m, .0, 1.);
    vec3 col = mix(texture(iChannel0, ouv).rgb, vec3(1.), m);
    
    // ear L inner
    m = earLInner(uv);
    col = mix(col, BROWN_COL, m);       
    
    // face
    m = face(uv);
    m = clamp(m, .0, 1.); 
    col = mix(col, BLACK_COL, m);
    
    // glass
    m = glass(uv);
    m = clamp(m, .0, 1.);
    col = mix(col, PINK_COL, m);
    
    // glass highlight
    m = glassHighlight(uv);
    m = clamp(m, .0, 1.);
    col = mix(col, PINK_L_COL, m);
    
    // mane
    m = mane(uv + vec2(.02, 0.));
    m = clamp(m, .0, 1.);
    col = mix(col, PURPLE_COL, m);
    
    // bang
    m = bang(uv);
    m = clamp(m, .0, 1.);
    col = mix(col, PURPLE_COL, m);
    
    // horn
    m = horn(uv);
    m = clamp(m, .0, 1.);
    col = mix(col, BROWN_COL, m);

    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
