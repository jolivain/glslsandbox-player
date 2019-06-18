//check board by uggway

// yay faux perspective -jz
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;
//#define CM 

vec3 check(vec2 p, float y, float s)
{
	float c = clamp(floor(mod(p.x/s+floor(p.y/s),2.0))*s,0.1,0.9)*2.0;
	c *= c;
	return vec3(0.3+0.5*c, 0.4+0.6*c, 0.5+0.2*c);
}

vec3 px( vec2 pos ) {

	vec2 p = -1.0 + 2.0 * ( pos / resolution.xy  );
	p.x *=  resolution.x/resolution.y;

	vec3 col = vec3(1.0);
	
	float y = p.y + (p.y + (cos((cos(time*0.2+p.y)-time+p.x))*0.5));
	vec2 uv;
	uv.x = p.x/y;
	uv.y = 1.0/abs(y)+time/3.0;
	col = check(uv, y, 0.50)*pow(length(y), 0.15);
	return col;
}

void main( void ) {
	const float Xsamples = 10.0;
	const float Ysamples = 10.0;
	float blur = 1.5 + resolution.y * 0.075 * pow((1.0-cos(time*0.38625))/2.0, 3.0);

	vec3 col = vec3(0.0, 0.0, 0.0);
	for (float x=0.0; x<Xsamples; x++) {
		for (float y=0.0; y<Ysamples; y++) {
			float seed = sin(time * 413.5324) + cos(gl_FragCoord.x * 742.5894) - sin(gl_FragCoord.y * 314.732);
			float xo = x - 0.5 + mod(seed * 7274.2345, 1.0);
			float yo = y - 0.5 + mod(seed * 5193.5932, 1.0);
			col += px(vec2(gl_FragCoord.x + (xo/Xsamples-0.5) * blur,
				       gl_FragCoord.y + (yo/Ysamples-0.5) * blur));
		}
	}
	
	gl_FragColor = vec4( col / Xsamples / Ysamples, 1.0 );
}
