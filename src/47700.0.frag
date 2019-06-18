/*
 * Original shader from: https://www.shadertoy.com/view/4dGfDy
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
float circle(vec2 uv, vec2 position, float radius, float blur) {
    uv -=0.5;										// position of the circle || to make (0,0) center of the screen 
    uv.y*=iResolution.y/iResolution.x;				//to make it a circle 
    float d = length(uv-position);
    float c = smoothstep(radius,radius-blur,d);		//if(d<radius){d=1} else{d=0} and also adds blur on the edges
    return c;
}

float oval(vec2 uv, vec2 position, float radius, float blur) {
    uv -=0.5;										// position of the circle || to make (0,0) center of the screen 
    float d = length(uv-position);
    float c = smoothstep(radius,radius-blur,d);		//if(d<radius){d=1} else{d=0} and also adds blur on the edges
    return c;
}

float verticalOval(vec2 uv, vec2 position, float radius, float blur, float thickness) {
    uv -=0.5;
    uv.x*= uv.y+thickness;
    uv.y*=iResolution.y/iResolution.x;				// position of the circle || to make (0,0) center of the screen 
    float d = length(uv-position);
    float c = smoothstep(radius,radius-blur,d);		//if(d<radius){d=1} else{d=0} and also adds blur on the edges
    return c;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2  uv = fragCoord/iResolution.xy;
      
    float c = circle(uv,vec2(0.),.1,.003);
    float c2 =  circle(uv,vec2(.1),.06,.003);
    float c3 =  circle(uv,vec2(-.1,.1),.06,.003);
    float c4 =  oval(uv,vec2(0.,-.08),.04,.005);
    float c5 =  oval(uv,vec2(0.025,-0.06),.04,.05);
    float c6 =  verticalOval(uv,vec2(-0.1,.025),.04,.005,2.5);
    float c7 =  verticalOval(uv,vec2(0.1,.025),.04,.005,2.5);
    float c8 =  oval(uv,vec2(-0.05,0.07),.015,0.006);
    float c9 =  oval(uv,vec2(0.03,0.07),.015,.006);
    
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    vec3 sumAppear = vec3 (c+c2+c3+c5+c8+c9-c6-c7-c4);
    vec3 makeAppear = col * sumAppear ;
    
    fragColor = vec4(makeAppear,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
