#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//GLSL noise
//done by ML!
highp float rand(vec2 co)
{
   return fract(sin(mod(dot(co.xy,vec2(12.9898,78.233)),3.14) * 43758.5453));
}
void main( void ) {
	highp float random =rand(vec2(rand(gl_FragCoord.xy),rand(gl_FragCoord.xy*time)));
	gl_FragColor = vec4(random,random,random, 1.0 );
}
