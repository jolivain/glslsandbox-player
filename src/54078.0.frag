/*
 * Original shader from: https://www.shadertoy.com/view/3llGzH
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define thick   0.04
#define smooth  (16.0 / iResolution.x)
#define PI      3.1415926535
#define S(x) smoothstep(-smooth, smooth, x)
#define SR(x, y) smoothstep(-smooth * y, smooth * y, x)
#define scalex 5.
#define scaley 5.
#define scx (scalex * PI * 2.)

//Palettes by Inigo Quilez http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 pal1(in float t){
    return pal(t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67)) ;
}

float rand(vec3 v){
    return fract(cos(dot(v,vec3(13.46543,67.1132,123.546123)))*43758.5453);
}

float rand(vec2 v){
    return fract(sin(dot(v,vec2(5.11543,71.3177)))*43758.5453);
}

float rand(float v){
    return fract(sin(v * 71.3132)*43758.5453);
}

vec2 rand2(vec2 v){
    return vec2(
        fract(sin(dot(v,vec2(5.11543,71.3132)))*43758.5453),
        fract(sin(dot(v,vec2(7.3113,21.5723)))*31222.1234)
        );
}
vec2 rotate(vec2 st, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * st;
}
float smrand(float v){
    float vv = floor(v);
    return mix(rand(vv),rand(vv+1.0),fract(v));
}

vec3 eye(vec2 fst, vec2 cst, vec2 mouse){
    float mouseDown = clamp(iMouse.z, 0.0, 1.0);
    float noise = rand(cst);
    
    float nt = iTime*2.0 * (noise + 0.8 ) +noise * 100.0;
    float fnt = floor(nt);
    vec2 noise2 = rand2(cst + vec2(fnt));
    vec2 noise22 = rand2(cst + vec2(fnt + 1.));
    float pinoise = noise2.x * PI * 2.0;
    float pinoise2 = noise22.x * PI * 2.0;
    float move = 1.0 - (cos(fract(nt)*PI)+1.0) /2.0;
    move = pow(move,4.0);
    
    float eyeOpen = (sin(iTime*2.0 + noise * 100.0) + 1.0) / 2.0;
    eyeOpen = mix(eyeOpen,0.0, mouseDown);
    eyeOpen = 1.0 - pow(eyeOpen, 3.0);
    
    float col = (sin(fst.x) + 1.)/2.0;
    //col = pow(col,0.9);
    float col2 = col* eyeOpen + fst.y*2.1 - 0.1;
    col = col* eyeOpen - fst.y*2.1 - 0.1;
    float cs1 = min(col - 0.1, col2- 0.1);
    float cs2 = S(cs1);
    col = S(min(col, col2));
    
    float grad = min(eyeOpen * 1.2, 1.);
    //float grad = min(1.0 - pow(1.0 -abs(fst.y),10.) + 0.3,1.0);
    
    vec2 loc = vec2(fract(fst.x/PI/2.0 + PI*2.0) - 0.53,fst.y*iResolution.y/iResolution.x);
    
    vec2 pin2 = mix(vec2(cos(pinoise),sin(pinoise))*((noise2.y +1.0) / 2.0),
                    vec2(cos(pinoise2),sin(pinoise2))*((noise22.y +1.0) / 2.0),move);
    pin2 *= 0.25;
    pin2 =  mix(pin2, mouse, max(mouseDown - 0.05,0.));
    
    float lloc = length(loc);
    float irisn = mix(1.0,mix(noise2.x, noise22.x, move),0.25);
    float iris = length(loc - pin2 * (0.5 -lloc) );
    float irisWhite = length(loc - pin2 * (0.2 -lloc) );
    float irisDark = SR(length(loc - pin2 * (0.4 -lloc) ) - 0.05 * irisn,0.5);
    float irisShadow = SR(-irisWhite + 0.07,15.);
    irisWhite = SR(-irisWhite + 0.03,1.4);
    
    vec3 irisColor = irisDark *pal1( irisShadow + nt/10.0);
    irisColor = max(irisColor, irisWhite*0.9);
    vec3 baseCol = vec3(SR(-lloc+ .25,15.));
    baseCol = baseCol + 0.25*pal1( baseCol.x + nt/10.0);
    
    vec3 finCol = mix(baseCol, irisColor, S(-iris + 0.15));
    finCol = mix(pal1(noise + nt/10.0) * grad,finCol, cs2);
    finCol = min(finCol, col);
    
    return finCol;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    vec2 st = (fragCoord.xy)/ iResolution.xy;
    vec2 mouse = (iMouse.xy)/ iResolution.xy;
    
    float fsty = fract(st.y * scaley) - 0.5;
    float fsty2 = fract(st.y * scaley  + 0.5) - 0.5;
    float csty = floor(st.y * scaley);
    float csty2 = floor(st.y * scaley + 0.5);
    float cstx = floor(st.x * scalex);
    float cstx2 = floor(st.x * scalex + 0.5);
    vec2 cst = vec2(cstx,csty);
    vec2 cst2 = vec2(cstx2,csty2 + 1234.);
    vec2 fst = vec2(st.x * scx - 0.5 * PI, fsty);
    vec2 fst2 = vec2(st.x * scx + 0.5 * PI, fsty2);

    
    vec2 m1 = mouse - vec2((cstx + 0.5)/scalex, (csty + 0.5)/scaley);
    vec2 m2 = mouse - vec2((cstx2 + 0.5)/scalex, (csty2 + 0.5)/scaley);
    
    vec3 col = eye(fst, cst, m1);
    vec3 col2 = eye(fst2, cst2, m2);
    col = max(col,col2);
    col += 0.1 * (rand(fragCoord.xy/3.0 + iTime)-0.5);
    //col -= 0.1 * (rand(fragCoord.xy/3.0 + iTime + 100.0));
  
    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
