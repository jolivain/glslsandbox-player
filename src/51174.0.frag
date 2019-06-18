/*
 * Original shader from: https://www.shadertoy.com/view/WdsGzM
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
#define PI 3.14159265359

vec2 rotate2d(vec2 uv,float _angle){return mat2(cos(_angle),-sin(_angle),sin(_angle),cos(_angle)) * uv;}
vec2 scale2d(vec2 uv,float _scale){return  uv * mat2(_scale,0.0,0.0,_scale);}

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(20.,100.)))*10000.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord/iResolution.xy;
    uv.x *= iResolution.x / iResolution.y;
    uv=rotate2d(uv,1.+fract(iTime*0.02)*2.*PI);
    uv*=5.+0.4*sin(iTime/2.);
    
        
    vec2 pos = vec2(0.5)-fract(uv);
    pos=rotate2d(pos,fract(iTime*0.4+random(floor(uv)))*2.*PI);
    pos=scale2d(pos,0.5+sin(random(uv+fract(iTime)*2.*PI)));
    
    
    float r = length(pos)*2.0;
    float a = atan(pos.y,pos.x);
	float f = smoothstep(-.0,1., cos(a*max(3.,floor(abs(uv.x))*floor(abs(uv.y)))))*0.3+0.5;
    vec3 color = vec3( 1.-smoothstep(f,f+0.02,r) );
    fragColor = vec4(color*vec3(0.1,0.5*random(floor(uv)),0.8+0.1*sin(2.*PI*fract(iTime*0.3))),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
