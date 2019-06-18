/*
 * Original shader from: https://www.shadertoy.com/view/3tf3D4
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
#define TAU 6.28318530718

const float grid = 8.;
#define pixel_width 3./iResolution.y*grid
#define t iTime/5.

float easeInOut(float time) {
    if ((time *= 2.0) < 1.0) {
        return 0.5 * time * time;
    } else {
        return -0.5 * ((time - 1.0) * (time - 3.0) - 1.0);
    }
}

float stroke(float d, float size, float width) {
	return smoothstep(pixel_width,0.0,abs(d-size)-width/2.);
}

float fill(float d, float size) {
	return smoothstep(pixel_width,0.0,d-size);
}

float circleSDF(vec2 uv) {
	return length(uv);
}

vec2 rotate(vec2 _uv, float _angle){
    _uv =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _uv;
    return _uv;
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord.xy-iResolution.xy*.5)/iResolution.y;
    uv *= grid;
    uv.y += mod(grid,2.)* .5;
    vec2 id = floor(uv);
    vec2 gv = fract(uv)*2.-1.;
    
    float a = floor(random(id*floor(t))*8.)/8.;
    float next_a = floor(random(id*(floor(t)+1.))*8.)/8.;
    float angle = mix(a,next_a,easeInOut(fract(t)));
    gv = rotate(gv,angle*TAU);
    
    float col = fill(circleSDF(gv), .9);
    col = min(col,smoothstep(pixel_width,0.,gv.x-.6));
    col = min(col, step(uv.x,grid-1.));
    col = min(col, 1.-step(uv.x,-grid+1.));
    
    // Output to screen
    fragColor = vec4(vec3(col),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
