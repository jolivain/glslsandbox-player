/*
 * Original shader from: https://www.shadertoy.com/view/4lSfRD
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
#define RED vec3(1., 0., 0.)
#define PI 3.14
#define TAU 6.28

float drawLine(vec2 uv, vec2 p1, vec2 p2, float thickness) {
  float a = abs(distance(p1, uv));
  float b = abs(distance(p2, uv));
  float c = abs(distance(p1, p2));
  
  float d = sqrt(pow(c, 2.) + pow(thickness, 2.));

  if ( a >= d || b >= d )
  {
  	if (distance(p1, uv) <= thickness ||
        distance(p2, uv) <= thickness)
        return 1.0;
    else
        return 0.0;
  }

  float p = (a + b + c) * 0.5;
  float h = 2.0 / c * sqrt( p * ( p - a) * ( p - b) * ( p - c));
    
  if (h <= thickness)
  {
      return 1.0;
  }
  else
  {
      return 0.0;
  }
}

vec2 rotate2D (vec2 _st, vec2 center, float _angle) {
    _st -= center;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += center;
    return _st;
}

float bl(vec2 p){
	float outer;
	{
		vec2 uv = p;
		uv *= 2.; uv -= 1.;
		uv.x -= uv.y * .1;
		float curve = sin(uv.x * PI * 2. - 1.6) * .11;
		float s = sign(curve);
		outer = step(pow(abs(curve), .6) * s - .25, uv.y) * (1. - step(0., uv.y)) * (1. - step(.5, abs(uv.x)));	
	}

	vec2 uv = p;
	uv *= 2.; uv -= 1.;
	uv.x -= uv.y * .1;
	uv *= 1.5;
	uv.x += .045;
	float curve = sin(uv.x * PI * 2. - 1.6) * .11;
	float s = sign(curve);
	return (1. - step(pow(abs(curve), .6) * s - .25, uv.y) * (1. - step(0., uv.y)) * (1. - step(.5, abs(uv.x)))) * outer;
}

float tl(vec2 p){
	float inner;
	{
		vec2 uv = p;
		uv *= 2.; uv -= 1.;
		float curve = cos(uv.x * PI * 8. + PI) * .05 - .5;
		curve -= pow(abs(uv.x), 1.7) * step(0., uv.x);
		float l = 1. - step(1.05 * p.x + .14, p.y);
		inner = 1. - step(pow(abs(curve), 4.), -uv.y + .18) * (1. - step(.27, uv.x)) * step(-.32, uv.x) * l;
	}
    
    vec2 uv = p;
	uv *= 2.; uv -= 1.;
	uv.x -= uv.y * .15;
	uv.x *= 1. - pow(p.y, 4.);
	float multiplier = .235 - step(0., uv.x) * 0.005;
	float curve = sin(abs(uv.x) * PI * 2.9 + .75) * multiplier + (multiplier + .1);
	return (1. - step(pow(curve, 2.), uv.y)) * step(0., uv.y) * (1. - step(.4, abs(uv.x))) * inner;
}

float t(vec2 p){
	vec2 uv = p;
	uv.y *= 2.; uv.y -= 1.;
	uv.x -= pow(abs(uv.y + .5), 2.) * step(-.5, uv.y) * (.4 + smoothstep(-.2, .2, uv.y) * .25);
	float curve = sin(uv.x * TAU * 1.9 - .1) * .15;
	float s = sign(curve);
	float t = step(pow(abs(curve), .25) * s, uv.y);
	t *= (1. - step(sin(p.x * (TAU * .75) - .7) * .1, p.y - .425)) * (1. - step(.75, p.x)) * step(.25, p.x);
	
	return clamp(t, 0., 1.);
}

float c(vec2 p, float t){
	{
		vec2 c = p * 2. - 1.;
		c.x /= 1.25;
		t *= clamp(step(.1, length(c - vec2(.0175, .07))) + step(.075, c.y), 0., 1.);
	}
	
	{
		vec2 c = p * 2. - 1.;
		c.x += .22; c.y += .405;
		float curve = sin(c.x * TAU) * .15;
		float s = sign(curve);
		float r = step(pow(abs(curve), .5) * s, c.y);

		c = p * 2. - 1.;
		c.x += .225; c.y += .38;
		curve = sin(c.x * TAU) * .15;
		s = sign(curve);
		r *= 1. - step(pow(abs(curve), .5) * s, c.y);
		r *= step(.3, p.y);
		r *= 1. - step(.5, p.x);

		t -= r;
	}

	{
		vec2 uv = p;
		uv.y *= 2.; uv.y -= 1.;
		uv.x -= pow(abs(uv.y + .5), 2.) * step(-.5, uv.y) * (.4 + smoothstep(-.2, .2, uv.y) * .25);
		float curve = sin(uv.x * TAU * 1.9 - .1) * .15;
		float s = sign(curve);
		float x = step(pow(abs(curve), .25) * s, uv.y);
		
		curve = sin(uv.x * TAU * 1.9 - .2) * .15;
		s = sign(curve);
		x += 1. - step(pow(abs(curve), .25) * s, uv.y);
		x += 1. - step(.25, uv.x);
		x += step(-.02, uv.y);
		
		t *= clamp(x, 0., 1.);
	}

	{
		vec2 uv = p;
		uv.y *= 2.; uv.y -= 1.;
		t -= clamp((1. - step(1. - uv.x * .875 - .4375, uv.y)) * step(1. - uv.x * .875 - .45, uv.y) - (1. - step(-.02, uv.y)) - step(.05, uv.y), 0., 1.);
	}

	return t;
}

float ff(vec2 p){
	float outer = 0.;
	{
		vec2 uv = p;
		uv *= 2.; uv -= 1.;
		float curve = cos(uv.x * PI * 8. + PI) * .05 - .5;
		curve -= pow(abs(uv.x), 1.7) * step(0., uv.x);
		outer = step(pow(abs(curve), 4.), -uv.y + .18) * (1. - step(.27, uv.x)) * step(-.32, uv.x);
	
		uv = p;
		uv.y *= 2.; uv.y -= 1.;
		curve = cos(uv.x * 15. * PI) * .5;
		float s = sign(curve);
		outer *= step(-pow(abs(curve), .75), (uv.y * 15. - .75) - pow(abs((.5 - uv.x) * (1. - step(.5, p.x)) * 10.), 2.5));
	}

	{
		vec2 uv = p;
		uv.x -= pow(abs((uv.y - .32)/.14 * .25), 2.);
		outer += drawLine(uv, vec2(.345, .32), vec2(.345, .46), .007 + .007 * (1. - (uv.y - .32)/.14));
	}

	{
		vec2 uv = p;
		uv.x -= sign(uv.y - .365) * pow(abs((uv.y - .265)/.2 - .4), 3.) * .15 + (uv.y - .265)/.2  * .1;
		outer += drawLine(uv, vec2(.45, .265), vec2(.435, .455), .01 + .01 * (1. - (uv.y - .265)/.2));
	}

	{
		vec2 uv = p;
		float xNorm = (uv.x - .45)/.03;
		uv = rotate2D(uv, vec2(.455, .61), (-xNorm + 1.5)/2.);
		outer += drawLine(uv, vec2(.455, .625), vec2(.475, .62), .0125 + .005 * xNorm);
	}

	{
		vec2 uv = p;
		float xNorm = (uv.x - .56)/.03;
		uv = rotate2D(uv, vec2(.56, .61), (-xNorm + 1.5)/2.);
		outer += drawLine(uv, vec2(.56, .625), vec2(.58, .62), .01 + .01 * xNorm);
	}

	return outer;
}

vec3 m(vec2 p){
	float teath = ff(p);
	float mouth = c(p, clamp(tl(p) + bl(p) + t(p), 0., 1.));
	return mix(teath * vec3(1.), mouth * vec3(.925, .109, .141), 1. - teath);
}

//TODO: clean up the code. it's extremely messy now
//TODO: add antialiasing
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy/iResolution.xy;
    uv *= .6;
    uv.x *= iResolution.x/iResolution.y; uv.y += .15; uv.x -= .05;
	fragColor = vec4(vec3(m(uv)), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
