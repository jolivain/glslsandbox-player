// water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07
// Altered
// Studied by cheery in 2014-06-20
// 
// realy need a comment feature without forking
// anyways i did a commented version with checkerboard texture. http://glsl.heroku.com/e#9824.2
// @joltz0r

#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif

uniform float time;
varying vec2 surfacePosition;

#define MAX_ITER 10
void main( void ) {
	vec2 sp = surfacePosition;
	vec2 p = sp*8.0- vec2(30.0);
	vec2 i = p;
	float c = 1.0;
	float inten = .01; // toned down intensity

	for (int n = 0; n < MAX_ITER; n++) 
	{
		// forms a fractal of sort. t is slightly higher for every iteration,
		// in range: -2.0, -0.5, 0.0, +0.25, +0.4, +0.5, slowly approaches 1.0
		float t = time * (1.0 - 3.0 / float(n+1));
		
		// try just plain i=p; to see what the effect is. It's recursively distorting the grid coordinates.
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		
		// rewrote and removed the +t from i.x, i.y.
		c += 1.0/length(p.xy / (vec2(sin(i.x), cos(i.y)) / inten));
	}
	c /= float(MAX_ITER); // the thing accumulates and then averages.
	
	// removed few of the effects achieved by pow(1.5 - sqrt(c), 7.0) and scaled it down a bit more.
	c = 1.0-sqrt(c);
	gl_FragColor = vec4(pow(c, 1.0) * 0.8) + vec4(0.1, 0.15, 0.25, 1.0); // must change the color of course. :->
}
