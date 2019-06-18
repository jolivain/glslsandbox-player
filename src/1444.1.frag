// "Cobweb" by Kabuto 
// Based on @ahnqqq's blob raymarcher

# ifdef GL_ES
precision mediump float;
# endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const vec3 diffuse = vec3( .5, .75, 1. );
const vec3 eps = vec3( .001, 0., 0. );
const int iter = 128;
float sq = sqrt(2.0)*0.5;

float c( vec3 p )
{
	vec3 q = abs(mod(p+vec3(cos(p.z*0.5), cos(p.x*0.5), cos(p.y*0.5)),2.0)-1.0);
	float a = q.x + q.y + q.z - min(min(q.x, q.y), q.z) - max(max(q.x, q.y), q.z);
	q = vec3(p.x+p.y, p.y+p.z, p.z+p.x)*sq;
	q = abs(mod(q,2.0)-1.0);
	float b = q.x + q.y + q.z - min(min(q.x, q.y), q.z) - max(max(q.x, q.y), q.z);
	return min(a,b);
}

vec3 n( vec3 p )
{
	float o = c( p );
	return normalize( o - vec3( c( p - eps ), c( p - eps.zxy ), c( p - eps.yzx ) ) );
}

void main()
{
	float r = resolution.x / resolution.y;
	vec2 p = gl_FragCoord.xy / resolution * 2. - 1.;
	vec2 m = mouse + vec2(0.5,-0.5);
	p.x *= r;
	m.x *= r;
	
	vec3 o = vec3( 0., 0., time );
	vec3 s = vec3( m, 0. );
	vec3 b = vec3( 0., 0., 0. );
	vec3 d = vec3( p, 1. ) / 32.;
	vec3 t = vec3( .5 );
	vec3 a;
	
	for( int i = 0; i < iter; ++i )
	{
		float h = c( b + s + o );
		//if( h < 0. )
		//	break;
		b += h * 10.0 * d;
		t += h;
	}
	t /= float( iter );
	a = n( b + s + o );
	float x = dot( a, t );
	t = ( t + pow( x, 4. ) ) * ( 1. - t * .01 ) * diffuse;

	gl_FragColor = vec4( t, 1. );
}

