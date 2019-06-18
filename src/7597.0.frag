#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
varying vec2 surfacePosition;

vec2 random2f( vec2 seed ) {
	float t = sin(seed.x+seed.y*1e3);
	return vec2(fract(t*1e5), fract(t*1e6));
}

float cvoronoi( in vec2 x )
{
    vec2 p = floor( x );
    vec2  f = fract( x );

    float res = 1.0;
    for( int j=-1; j<=1; j++ )
    for( int i=-1; i<=1; i++ )
    {
        vec2 b = vec2( i, j );
	vec2 o = random2f( p + b );
        vec2 r = vec2( b ) - f + o;
        float d = dot( r,r );
	res = min(res,(abs(fract(d*6.0-time*0.5 +o.x*8.)-.5)*8.+d*.8)/sqrt(d*d+1.));
    }	
    return res;
}

void main( void )
{
	gl_FragColor = vec4(vec3(.2+cvoronoi(surfacePosition*3.*(sin(time*.15)+1.2))*.5),1.0);
}
