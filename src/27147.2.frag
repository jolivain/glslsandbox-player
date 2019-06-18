#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//Isometric ray marching

float x_angle = -35.264;
float y_angle = 45.0;

mat3 rotate(vec3 u,float a)
{
    float c = cos(a);
    float s = sin(a);
    u = normalize(u);
    
    vec3 c0 = vec3(c + (u.x*u.x) * (1.0-c), (u.y*u.x) * (1.0-c) + (u.z*s), (u.z*u.x) * (1.0-c) - (u.y*s));    
    vec3 c1 = vec3((u.x*u.y) * (1.0-c) - (u.z*s), c + (u.y*u.y) * (1.0-c), (u.z*u.y) * (1.0-c) + (u.x*s)); 
    vec3 c2 = vec3((u.x*u.z) * (1.0-c) + (u.y*s), (u.y*u.z) * (1.0-c) - (u.x*s), c + (u.z*u.z) * (1.0-c));
    
    return mat3(c0,c1,c2);
}

float cube(vec3 pos, float s)
{
	return max(max(abs(pos.x),abs(pos.y)),abs(pos.z)) - s;	
}

float sphere(vec3 pos, float s)
{
	return length(pos) - s;	
}

float plane(vec3 pos)
{
	return pos.y;
}

float scene(vec3 pos)
{
	float dist = 1e6;
	
	float ground = plane(pos - vec3( 0.0,-1.0, 0.0));
	
	vec3 odom = pos;
	
	odom.xz = mod(odom.xz + 1.0, vec2(2.0)) - 1.0;
	
	float t1 = mod(time*0.8 - 0.0, 2.0);
	float t2 = mod(time*0.8 - 1.0, 2.0);
	
	float object = cube(odom, 0.5);
	object = max(object, -sphere(odom, 0.6));
	
	object = min(object, sphere(odom - vec3(t1 - 0.0,0,0), 0.2));
	object = min(object, sphere(odom - vec3(t1 - 2.0,0,0), 0.2));
	object = min(object, sphere(odom - vec3(0,0,t2 - 0.0), 0.2));
	object = min(object, sphere(odom - vec3(0,0,t2 - 2.0), 0.2));
	
	dist = min(dist, ground);
	dist = min(dist, object);
	
	return dist;
}

vec3 normal(vec3 pos)
{
	vec2 offs = vec2(0.02,0);
	return normalize(vec3(scene(pos + offs.xyy) - scene(pos - offs.xyy), scene(pos + offs.yxy) - scene(pos - offs.yxy), scene(pos + offs.yyx) - scene(pos - offs.yyx)));
}

void main( void ) 
{
	vec2 aspect = resolution.xy / min(resolution.x, resolution.y);
	vec2 uv = gl_FragCoord.xy / min(resolution.x, resolution.y);
	vec2 cen = aspect/2.0;
	
	vec3 color = vec3(0.0);
	
	mat3 rot = rotate(vec3(1,0,0),radians(x_angle));
	rot *= rotate(vec3(0,1,0),radians(y_angle));
	
	vec3 dir = vec3(0,0,1) * rot;
	vec3 pos = (vec3((uv - cen) * 4.0,-8.0)) * rot;
	
	for(int i = 0;i < 64;i++)
	{
		float dist = scene(pos);
		pos += dir * dist;
		
		if(dist < 0.001){break;}
	}
	
	vec3 norm = normal(pos);
	
	color = (norm * 0.5 + 0.5) * max(0.0,-dot(norm, dir));
	
	gl_FragColor = vec4( vec3( color ), 1.0 );

}
