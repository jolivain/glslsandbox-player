/*

Copyright © 2017 Turtle1331 (Turtle1331.github.io)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software
and associated documentation files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
	vec2 p = (gl_FragCoord.xy - resolution / 2.) / resolution.x;
	p *= 10.;
	
	float c = 0.;
	float t = fract(time);
	t *= t;
	t *= 2. - t;
	
	p *= mat2(1., -t, t, 1.) / (t * t + 1.);
	vec2 q = floor(p + .5);
	p -= q;
	p *= mat2(1., t, -t, 1.);
	
	float d = 10.;
	for (int i = 0; i < 4; i++) {
		d = min(d, max(abs(p.x - .5 - t * .5), abs(p.y - .5 + t * .5)) - t * .5);
		p *= mat2(0., 1., -1., 0.);
	}
	
	c = (.5 - t * .5) * mod(floor(q.x) + floor(q.y) + ceil(sign(max(abs(p.x), abs(p.y)) - .5) * .5), 2.);
	c += (c - 1. + t * .5) * floor(sign(d) * .5);
	gl_FragColor = vec4(c);
}
