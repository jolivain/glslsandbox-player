#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

vec3 color( const float a ) 
{
	float r = -1. + min( mod( a     , 6. ), 6. - mod( a     , 6. ) );
	float g = -1. + min( mod( a + 2., 6. ), 6. - mod( a + 2., 6. ) );
	float b = -1. + min( mod( a + 4., 6. ), 6. - mod( a + 4., 6. ) );
	
	r = clamp( r, 0., 1. );
	g = clamp( g, 0., 1. );
	b = clamp( b, 0., 1. );
	
	return vec3( r,g,b );
}

vec2 toPolar( vec2 uv )
{
	float a = atan( uv.y, uv.x );
	float l = length( uv );
	
	uv.x = a / 3.1415926;
	uv.y = l;
	
	return uv;
}

void main( void ) {
	vec2 p = ( gl_FragCoord.xy / resolution.xy ) * 2. - 1.;
	p.x *= resolution.x/resolution.y;
	float f = length(p);
	
	p = toPolar(p);
	p.x += sin(time - f) * clamp( -cos(time*.1) * 4. + 3., 0., 1.);
	
	gl_FragColor = vec4( color(p.x*3.), 1.) * (smoothstep( .01,.0,f -1.));
	gl_FragColor = mix( gl_FragColor, vec4(1.), 1.-f);
}
