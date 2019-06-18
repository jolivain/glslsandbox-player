#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float pi = 3.14159;

vec3 rotate(vec3 v,vec2 r) 
{
	mat3 rxmat = mat3(1,   0    ,    0    ,
			  0,cos(r.y),-sin(r.y),
			  0,sin(r.y), cos(r.y));
	mat3 rymat = mat3(cos(r.x), 0,-sin(r.x),
			     0    , 1,    0    ,
			  sin(r.x), 0,cos(r.x));
	
	
	return (v*rxmat)*rymat;
	
}

vec3 norm(vec3 v)
{
	//box made of 6 planes
	float tp = dot(v,vec3(0,-1,0))*3.;
	float bt = dot(v,vec3(0,1,0))*3.;
	float lf = dot(v,vec3(1,0,0))*3.;
	float rt = dot(v,vec3(-1,0,0))*3.;
	float fr = dot(v,vec3(0,0,1))*3.;
	float bk = dot(v,vec3(0,0,-1))*3.;
	
	return v/min(min(min(min(min(tp,bt),lf),rt),fr),bk);
}

float grid(vec3 v)
{
	float g;
	g = abs((mod(v.x*4.,0.25)*4.)-0.5);
	g = max(g,abs((mod(v.y*4.,0.25)*4.)-0.5));
	g = max(g,abs((mod(v.z*4.,0.25)*4.)-0.5));
	
	g = smoothstep(0.5+length(v)*0.25,0.5,1.-g);
	return g;
}

void main( void ) {

	vec2 res = vec2(resolution.x/resolution.y,1.0);
	vec2 p = ( gl_FragCoord.xy / resolution.y ) -(res/2.0);
	
	p = p / (1.0-dot(p,p)*1.5);
	
	vec2 m = (mouse-0.5)*pi*vec2(2.,1.);
	
	vec3 color = vec3(0.0);
	
	vec3 pos = norm(rotate(vec3(p,0.5),vec2(m)));
	
	color = vec3((.5+.5*pos)*(grid(pos)));
		
	gl_FragColor = vec4(  color , 3.0 );

}



