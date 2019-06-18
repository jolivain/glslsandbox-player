/*
 * Original shader from: https://www.shadertoy.com/view/MlfXzN
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
// Author @patriciogv - 2015
// http://patriciogonzalezvivo.com

float random(in float x){
    return fract(sin(x)*43758.5453);
}

float random(in vec2 st){
    return fract(sin(dot(st.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float randomChar(in vec2 outer,in vec2 inner){
    float grid = 5.;
    vec2 margin = vec2(.2,.05);
    float seed = 23.;
    vec2 borders = step(margin,inner)*step(margin,1.-inner);
    return step(.5,random(outer*seed+floor(inner*grid))) * borders.x * borders.y;
}

vec3 matrix(in vec2 st){
    float rows = 50.0;
    vec2 ipos = floor(st*rows)+vec2(1.,0.);

    ipos += vec2(.0,floor(iTime*20.*random(ipos.x)));

    vec2 fpos = fract(st*rows);
    vec2 center = (.5-fpos);

    float pct = random(ipos);
    float glow = (1.-dot(center,center)*3.)*2.0;

    return vec3(randomChar(ipos,fpos) * pct * glow);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 st = fragCoord.xy / iResolution.xy;
    st.y *= iResolution.y/iResolution.x;

	fragColor = vec4(matrix(st),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
