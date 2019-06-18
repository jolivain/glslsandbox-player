/*
 * Original shader from: https://www.shadertoy.com/view/wdlSDX
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
const vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
#define PI 3.14
#define TAU 6.28

float udLine(in vec2 p, in vec2 a, in vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa,ba)/dot(ba, ba), 0.0, 1.0);
    return length(pa - ba*h);
}

float pModPolar(inout vec2 p, float repetitions) {
    float angle = TAU/repetitions;
    float r = length(p);
    float a = atan(p.y, p.x) + (.5+.5*cos(iTime))*angle/2. + .25 * cos(5. * iTime - 1.5 * r);
	float c = floor(a/angle);
	a = mod(a,angle) - angle/2.;
	p = vec2(cos(a), sin(a))*r;
	if (abs(c) >= (repetitions/2.)) c = abs(c);
	return c;
}

#define rot(x) mat2(cos(x),-sin(x),sin(x),cos(x))

void mainImage( out vec4 O, in vec2 u ) {
    vec2 R = iResolution.xy;
    vec3 p = vec3((u+u-R)/R.y,1);
    O -= O++;
    
    float vignette = 1.-.75*pow(clamp(length((u+u-R)/R)-.5,0.,1.),2.5);
    
    float alpha = 1.;

    const float N = 8.;
    for(float i = -1.; i < N; i++) {
        float x = (i+.5)/N;
        
        float angle = pModPolar(p.xy, 3.);
        //p.xy*=rot(TAU/N*.3*sin(x-iTime));
    	
        float t = udLine(p.xy, vec2(0), vec2(.5,0)) / p.z  - (.009+.011*pow(1.-x,2.5));
    	
        // Anti-aliasing
        float s = smoothstep(3./R.y, 0., t);
        vec4 col = vec4(mix(vec3(.35,.28,.07), vec3(.45,.97,.1), x), pow(1.-x,1.2)*s*alpha);
        
        // Ambient occlusion
        //O.rgb *= 1.-.3*exp(-.25*clamp(t,0.,1.)*R.y)*(1.-s);
        O.rgb *= 1.-.4*pow(1.-x,3.5)*exp(-(.2-.15*x)*clamp(t,0.,1.)*R.y);
        
        // Alpha blending
        O = (1.-col.a)*O + col.a*col;
        
        p += p;
        //p.x -= scale+.1*texture(iChannel0, vec2(.5)).r;
        p.x--;
        //p.x-=fract(iTime);
    }
    
    O.rgb = clamp(O.rgb,0.,1.);
    //O.rgb *= vignette;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
