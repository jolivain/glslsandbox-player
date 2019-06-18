// Fractals: MRS
// by Nikos Papadopoulos, 4rknova / 2015
// Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
//
// Adapted from https://www.shadertoy.com/view/4lSSRy by J.

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {

    vec2 uv = .275 * gl_FragCoord.xy / resolution.y;
    float t = time*.03, k = cos(t), l = sin(t);        
    
    float s = .2;
    for(int i=0; i<64; ++i) {
        uv  = abs(uv) - s;    // Mirror
        uv *= mat2(k,-l,l,k); // Rotate
        s  *= .95156;         // Scale
    }
    
    float x = .5 + .5*cos(6.28318*(40.*length(uv)));
    gl_FragColor = vec4(vec3(x),1);
}
