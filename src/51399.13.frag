// EURO TUNNEL
#ifdef GL_ES
precision highp float;
#endif
 
uniform float time;
uniform vec2 resolution;

#define PI 3.141519
#define TAU 6.283185
 
vec2 rot(vec2 v, float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c)*v;
}

// mercury sdf
// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions)
{
	float angle = 2.0*PI/repetitions;
	float a = atan(p.y, p.x) + angle/2.;
	float r = length(p);
	float c = floor(a/angle);
	a = mod(a,angle) - angle/2.;
	p = vec2(cos(a), sin(a))*r;
	// For an odd number of repetitions, fix cell index of the cell in -x direction
	// (cell index would be e.g. -5 and 5 in the two halves of the cell):
	if (abs(c) >= (repetitions/2.0)) c = abs(c);
	return c;
}

float pMod1(inout float p, float size)
{
	float halfsize = size*0.5;
	float c = floor((p + halfsize)/size);
	p = mod(p + halfsize, size) - halfsize;
	return c;
} 

float star5( in vec2 p, float a, float size )
{
    p = rot(p,a);
    float fa = (mod( atan(p.y,p.x)*5.0 + PI/2.0, 2.0*PI ) - PI)/5.0;
    p = length(p)*vec2( sin(fa), cos(fa) );
    const vec2 k3 = vec2(0.951056516295,  0.309016994375); // pi/10
    return dot( vec2(abs(p.x)-size,p.y), k3);
}


float map( in vec3 pos )
{
    pos.z -= time*0.4;
    float c1 = pMod1(pos.z,0.33);
    pos.xy = rot(pos.xy,c1*0.22+time*0.1);
	
    vec2 uv = pos.xy;
    float c = pModPolar(uv,12.0);
    uv.x -= 1.05;
    float d = star5(uv, time*0.6+(TAU/12.0)*-c, 0.04);	// Pos,Ang,Size
    float dep = 0.02;
    vec2 e = vec2( d, abs(pos.z) - dep );
    d = min(max(e.x,e.y),0.0) + length(max(e,0.0));
	d-= 0.015;
	
	
    return d;
}
 
// http://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal( in vec3 pos )
{
    vec2 e = vec2(1.0,-1.0)*0.5773;
    const float eps = 0.0005;
    return normalize( e.xyy*map( pos + e.xyy*eps ) + 
					  e.yyx*map( pos + e.yyx*eps ) + 
					  e.yxy*map( pos + e.yxy*eps ) + 
					  e.xxx*map( pos + e.xxx*eps ) );
}
 
vec3 render( vec2 p )
{
     // camera movement	
    float an = 0.25*(time-10.0);
    vec3 ro = vec3( 3.0*cos(an), 0.0, 3.0*sin(an) );
    vec3 ta = vec3( 0.0, 0.0, 0.0 );
    // camera matrix
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    
    vec3 tot = vec3(0.0);
 
    // create view ray
    vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );
 
    // raymarch
    const float tmax = 20.0;
    float t = 0.0;
    for( int i=0; i<140; i++ )
    {
        vec3 pos = ro + t*rd;
        float h = map(pos);
        if( h<0.0001 || t>tmax ) break;
        t += h*0.75;
    }
 
    // shading/lighting	
	vec3 col0 = vec3(0,0,.7);
	vec3 col1 = vec3(1,.8,0);
	
    vec3 col = col0;
    if( t<tmax )
    {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal(pos);
        float dif = clamp( dot(nor,vec3(0.57703)), 0.0, 1.0 );
        float amb = 0.1 + 0.5*dot(nor,vec3(0.0,1.0,0.0));
        col = vec3(0.1,0.1,0.0)*amb + (col1)*dif;
	float dis = t;
	float m = exp(-0.01*dis*dis);
	col = mix(col0,col,m);
    }
 
    // gamma        
    col = sqrt( col );
    tot += col;
    return tot;
}

void main( void )
{
	vec2 p = (-resolution.xy + 2.0*gl_FragCoord.xy)/resolution.y;
	vec3 col = render(p);
	gl_FragColor = vec4( col, 1.0 );
}
