/*
 * Original shader from: https://www.shadertoy.com/view/MljBDG
 */

#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

void main( void ) {
	vec2 U = 8.*gl_FragCoord.xy/resolution.y, V; U.x -= time; V = floor(U);
	U.y = dot( cos( (2.*(time+V.x)+7.-V.y) * max(0.,.5-length(U = fract(U)-.5)) - vec2(33,0) ), U);
	gl_FragColor = vec4(smoothstep(-1.,1.,U/fwidth(U)).y);
}
