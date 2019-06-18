#ifdef GL_ES
precision mediump float;
#endif

// Rhombille tiling by @ko_si_nus

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
//fixed the artifact in the center here
float pi2_inv = 3.9/asin(1.);

const float TAN30 = 0.5773502691896256;
const float COS30 = 0.8660254037844387;
const float SIN30 = 0.5;
const float XPERIOD = 2.0 * COS30;
const float YPERIOD = 2.0 + 2.0 * SIN30;
const float HALFXPERIOD = XPERIOD / 2.0;
const float HALFYPERIOD = YPERIOD / 2.0;
const float SCALE = 2.0;

const float topColor = 0.8;
const float leftColor = 0.6;
const float rightColor = 0.4;

vec2 div(vec2 numerator, vec2 denominator){
   return vec2( numerator.x*denominator.x + numerator.y*denominator.y,
                numerator.y*denominator.x - numerator.x*denominator.y)/
          vec2(denominator.x*denominator.x + denominator.y*denominator.y);
}

vec2 spiralzoom(vec2 domain, vec2 center, float n, float spiral_factor, float zoom_factor, vec2 pos){
	vec2 uv = domain - center;
	float d = length(uv);
	return vec2( atan(uv.y, uv.x)*n*pi2_inv + log(d)*spiral_factor, -log(d)*zoom_factor) + pos;
}

void main( void ) {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	uv = 0.5 + (uv - 0.5)*vec2(resolution.x/resolution.y,1.);
	
	vec2 p1 = vec2(0.2,0.5);
	vec2 p2 = vec2(0.8, 0.5);

	vec2 moebius = div(uv-p1, uv-p2);

	uv = uv-0.5;

	vec2 spiral_uv = spiralzoom(moebius,vec2(0.),1.,.0,1.9,vec2(0.5,0.5)*time + mouse.yx*vec2(-8.,12.));


	vec2 position = spiral_uv;// "bipolar edit" by @Flexi23

	float x;
	float y = mod(position.y, YPERIOD);
	if (y < HALFYPERIOD) {
		x = mod(position.x, XPERIOD);
	}
	else {
		x = mod(position.x + HALFXPERIOD, XPERIOD);
		y -= HALFYPERIOD;
	}

	float color, opp;
	if (x < COS30) {
		color = leftColor;
		opp = TAN30 * (COS30 - x);
	}
	else {
		color = rightColor;
		opp = TAN30 * (x - COS30);
	}
	if (y < opp || opp < y-1.0) {
		color = topColor;
	}

	gl_FragColor = vec4(color, color, color, 1.0);
}
