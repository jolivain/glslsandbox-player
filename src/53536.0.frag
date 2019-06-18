/*
 * Original shader from: https://www.shadertoy.com/view/3s2XWR
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

// --------[ Original ShaderToy begins here ]---------- //
#define PI              3.14159265359
#define TWO_PI          6.28318530718
#define HALF_PI         1.57079632679
#define JOINTS_COUNT    12.0
#define JOINTS_GLOW     0.16
#define EYES_GLOW       0.014
#define TENTACLES_COUNT 8.0
#define PUPIL_OFFSET    0.01

mat2 scale(vec2 _scale){
    return mat2(_scale.x, 0.0, 0.0, _scale.y);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle), cos(_angle));
}

float triangle(
    in vec2 ps,
    in float size
) {
   	float N = 3.0;
    float a = atan(ps.x,ps.y)+PI;
    float r = TWO_PI/floor(N);
    float d = cos(floor(.5+a/r)*r-a)*length(ps);
    return 1.-smoothstep(size,size+JOINTS_GLOW,d);
}

float circle(
    in vec2 ps,
    in float radius,
    in float glow
) {
    return 1.-smoothstep(radius,radius+glow,length(ps));
}

float joint(
    in vec2 ps,
    in vec2 tr,
    in float s,
    in float a
) {
    return triangle((ps+tr)*scale(vec2(s))*rotate2d(a),.1);
}

float tentacle(
    in vec2 ps,
    in float timeScale,
    in float c
) {
    float tr = 0.;
    float t = sin(iTime);
    float a = 0.;
    float d = mod(iTime*timeScale*PI,PI*2.);
    vec2 p = vec2(0.);
    for (float i = .0; i < JOINTS_COUNT; i++) {
        tr += .1+t*.005;
        p = vec2(-tr*.7,sin(d+PI*-tr)*.2*tr);
        a = HALF_PI+(cos(d)*.5)*HALF_PI*tr;
        c += joint(ps*scale(vec2(1.+i*.1)),p,3.+tr*2.,a)*(1.-tr*.5);
    }
    return c;
}

float ttentacle(
    in vec2 position, 
    in float timeScale, 
    in float scaleRatio, 
    in float angle,
    in float color
) {
    return tentacle(
        position*scale(vec2(scaleRatio))*rotate2d(angle),
        timeScale,
        color
    );
}

float eye(
    in vec2 st, 
    in float timeOffset,
    in float timeScale,
    in float size, 
    in float c
) {
    float t = timeOffset+iTime*timeScale;
    float o = floor(abs(sin(t*.4))/(1./3.));
    vec2 pst = vec2(
        st.x+size*.1+(step(1.,o)-step(2.,o)*2.)*PUPIL_OFFSET,
        st.y-size*.2+step(1.,o)*PUPIL_OFFSET
    );
    return circle(st,size,EYES_GLOW) - 
        circle(st,size*.5,0.03)*.2 -
        circle(pst,size*.05+.0005*sin(t),.01)*.7;
}

float tentacles(in vec2 st, in float c) {
    float color = c;
    for (float i = .0; i < TENTACLES_COUNT; i++) {
        c += ttentacle(
            st,
            1.+i*.01,
            1.+mod(i,4.)*.01,
            PI*2./TENTACLES_COUNT*i + mod(i,3.)*.16,
            color
        );
    }
    return c;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord ) {
    vec2 st = gl_FragCoord.xy / iResolution.xy;
  	st.y *= iResolution.y / iResolution.x;
    
    st -= vec2(.5,.3);

    float s = sin(iTime*2.)*2.;
    float body = circle(vec2(st.x,st.y+s*.01),.1,.02);
    float eyes = 
        eye(vec2(st.x+.05,st.y-.05+s*.005),1.,1.2,.020,.01) +
        eye(vec2(st.x-.06,st.y-.01+s*.005),2.,1.4,.032,.01) +
        eye(vec2(st.x+.03,st.y+.06+s*.005),3.,1.0,.024,.01) + 
        eye(vec2(st.x+.01,st.y-.01+s*.005),4.,1.6,.016,.01) +
        eye(vec2(st.x-.04,st.y+.06+s*.005),5.,1.8,.022,.01) +
        eye(vec2(st.x-.02,st.y-.06+s*.005),5.,1.8,.014,.01) +
        eye(vec2(st.x+.07,st.y+.01+s*.005),6.,1.2,.020,.01);

    // Output to screen
    fragColor = vec4(
        vec3(.0,.0,.1)+
        (
            vec3(.65+.15*s,.6+.3*s,.3)*body +
            vec3(.7+.1*s,.65+.25*s,.3)*tentacles(st*rotate2d(s*.1),0.)*.75
        )*(1.-eyes),
        1.
    );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
