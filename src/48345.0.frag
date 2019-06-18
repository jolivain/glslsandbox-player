/*
 * Original shader from: https://www.shadertoy.com/view/ldBBWd
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
#define c30     (1.0 / 0.86602540378)	
#define thick   0.04
#define smooth  0.001
#define PI      3.14159265359
#define grid    30.0
#define timeScale 0.1
#define rt      (iTime / timeScale)
#define gears   (20.0 * PI)
#define gears2  (12.0 * PI)
#define size    4.0
#define size2   2.0

float rand(vec3 v){
    return fract(cos(dot(v,vec3(13.46543,67.1132,123.546123)))*43758.5453);
}
float rand(vec2 v){
    return fract(sin(dot(v,vec2(5.11543,71.3132)))*43758.5453);
}

float layer(float col, vec2 st, float scale, float lcol){
    st = st * scale;
    float r = rand(floor(st));
    vec2 st2 = fract(st + 0.5) - 0.5;
    float r2 = rand(floor(st  + 0.5)+ 12345.);
    st = fract(st) - 0.5;
    float a = (atan(st.x,st.y) + PI) /PI /2.;
    float l = length(st);
    
    float col1 = smoothstep(smooth*700.0,-smooth*700.0,cos(a*gears - rt)) * 0.025 * size + 0.1* size;
    col1 = smoothstep(col1,col1 + smooth,l) + smoothstep(smooth*2.0,-smooth*2.0,l-0.03 * size);;
    
    float a2 = (atan(st2.x,st2.y) + PI) /PI /2.;
    float l2 = length(st2);
    
    float col2 = smoothstep(smooth*700.0,-smooth*700.0,cos(a2*gears2 + rt + PI)) * 0.05 * size2 + 0.1* size2;
    col2 = smoothstep(col2,col2 + smooth,l2) + smoothstep(smooth*2.0,-smooth*2.0,l2-0.03 * size2);
    float fin = mix(step(r,0.5),1.0,col1);
    fin  = mix(step(r2,0.5), fin,col2);
   	fin = mix(lcol,col,fin);
    return fin;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 st = gl_FragCoord.xy/iResolution.x;
    
    float fin = layer(0.0,st + 25.,11.0,0.25);
    fin = layer(fin,st + 11.,23.0,0.5);
    fin = layer(fin,st + 23.,21.0,0.75);
    fin = layer(fin,st,16.0,1.);
    fragColor = vec4(fin);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
