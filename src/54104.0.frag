/*
 * Original shader from: https://www.shadertoy.com/view/wtXGzr
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
vec2 random2(vec2 st){
    st = vec2( dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123 );
}

// Value Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/lsf3WH
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}
mat2 rot(float a)
    {
    float cs = cos(a);
    float si = sin(a);
    mat2 mat = mat2(cs, si, -si, cs);
    return mat;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 st = fragCoord.xy / iResolution.xy;

	float u_time = iTime;//because I was using a glsl editor that names time "u_time
    //vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= iResolution.x/iResolution.y;
    st = st*2.-1.;
    //st.x-=0.75+sin(iTime);//not sure why I have to add this now to shift the thing but I do.
    st.x -= smoothstep(sin(iTime), sin(iTime)+0.92, sin(iTime*2.)*2.)*2.;
    st.x += smoothstep(sin(iTime/3.), sin(iTime/3.)+0.92, sin(iTime*2.)*4.)/12.;
    st.y -= smoothstep(cos(iTime/2.), cos(iTime/2.)+0.92, cos(iTime*2.+3.)*4.)/4.+sin(iTime);
    st.y += smoothstep(cos(iTime/3.), cos(iTime/3.)+0.92, cos(iTime*5.+10.)*1.)/5.;
    st*= 1.+smoothstep(cos(iTime+9.), cos(iTime+9.)+0.92, cos(iTime*2.+9.)*4.)*1.;
    st*= 1.5-fract(abs(sin(iTime/10.)))*1.2;
 
    vec4 color;
    //floor creates an "id" because floor(length(st*10)) means 0, 1, 2, 3, 4 ect id's for anything 
    //within the ranges of those numbers. 0 to 1 is on id, 3 tp 4 is one id, etc
    st*=rot(floor(length(st*10.)));//initial rotation of each ring based on it's id
    
    //same thing but this time to rotate the rings in time
    st*=rot(floor(length(st*1.))-(u_time*cos(floor(length(st*10.)))) );
  	float a = atan(st.y, st.x)+3.14159;//add pi so it's 0 - 2pi not -pi to pi
    
    
    //get length for whole circle
    float l = length(st/3.);
    
    //I end up multiplying the length by this smoothsteps for some reason
    //l*=smoothstep(0., 0.1, l)*(1.0-smoothstep( 0.8,0.8, l));// commented out to keep all lines the same length
    float i = floor(l*30.);
    
    
    //then for each id, make a cell within that cell that is a bit smaller.
    //cell has length span and angle span. cell length span is j
    float j = fract(l*30.);
    //cell width span is b
    
    //here I smoothstep the inner and outer edges of each ring to get like an outline
    float ls =smoothstep(0.1, 0.14, j)*(1.0-smoothstep( 0.9,0.94, j));

    //here I change the span of each arc based on time in noise so it's more random
    //a-=(noise(i+vec2(u_time))*2.);
    a = smoothstep(3.1, 3.14, a);
    
    //I attemped to smoothstep the arcs edges 
    float b = smoothstep(.2, 0.8, a)*(1.0-smoothstep(3.0, 3.14, a));
    
       //here I use iq's procedural palette technique based on b and ls
    //and modulated by time
    vec3 cc = (0.5+0.5*sin(vec3(0.9, 0.41, 0.2)+i/2.+b*ls/2.));//<--- the new edit has cool gradient instead of colors.
    
    
    //and I top it off with a pulsating light in the middle.
        cc+=pow(1.0-l, 50.+sin(u_time*5.)*20.);
    

    
 	fragColor = vec4(cc,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
