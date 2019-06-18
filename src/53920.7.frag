// @machine_shaman
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

mat2 rotate(float a) {
	float c = cos(a);
	float s = sin(a);
	return mat2(c, s, -s, c);
}

// exponential smooth min (k = 32);
float smin( float a, float b, float k )
{
    float res = exp2( -k*a ) + exp2( -k*b );
    return -log2( res )/k;
}

float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
}


float circle(vec2 uv, float r) {
	return length(uv) - r;
}

float face(vec2 uv) {

	float col = 0.;
		float d = 1e9;
	vec2 p = uv;
	
	// face
	float r = .5;
	d = smin(d, circle(p, r), 15.);
	
	// chin
	p = uv;
	p.y += .61 + .005 * sin(time * 5. + abs(p.x * 2.));
	r = .2;
	d = smin(d, circle(p, r), 15.);
	
	// eyes
	p = uv;
	p.x *= .7;
	p.x = abs(p.x) - .14;
	p.y += .12;
	p.x = p.x - p.y * .2;
	r = .1;
	d = smax(d, -circle(p, r), 20.);
		
	// nostrils
	p = uv;
	p.y += .2;
	p.x *= .7;
	p.x = abs(p.x) - .02;
	p.y += .12;
	p.x = p.x - p.y * .2;
	r = .01;
	d = smax(d, -circle(p, r), 32.);
	
	// mouth
	p = uv;
	
	p.y += .5;
	p.x *= .1;
	p.x = abs(p.x);
	p.x += -p.y * .1;
	d = smax(d, -circle(p, r), 128.);
	
	d = smax(d, -circle(p, r), 128.);
	
	
	
	col += d;
	return col;
	
}

float faces(vec2 uv) {

	uv *= rotate(time / 10.);
	float col = 0.;
		
	
	float a = atan(uv.x, uv.y) + 3.14/ 2.;
	float m = 6.28 / 12.;
	a = mod(a, m) - m / 2.;
	float l = length(uv);
	vec2 p = l * vec2(cos(a), sin(a));
	p.x -= 2.;
		
	
	p *= rotate(-3.14 / 2.);
	col = face(p);
	
	return col;
}

void main() {
	vec2 uv = (2. * gl_FragCoord.xy - resolution) / resolution.y;
	vec3 col = vec3(0.);
	vec2 st = uv;

	uv *= 20.;
	float d = 0.;
	uv *= rotate(time / 10.);
	for (float i = 0.; i < 1.; i += .1) {
		float t = fract(time / 10. + i);
		float s = smoothstep(.8, 0., t);
		float fc =faces(uv * s);
		d = smoothstep(.2 + .05 * cos(time), .0, fc);
		col += d;
		col += abs(.09 /fc);
		col *= .5 + .5 * cos(time + d * 5. + vec3(23, 21, 0));
	}
	col *= smoothstep(.07, .7, length(st));

	gl_FragColor = vec4(col, 1.);
}
