#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;



float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sdFloor(vec3 p, vec3 b) {
  return length(max(abs(p)-b,0.0));
}

float sdCylinder( vec3 p, vec3 c )
{
  return length(p.xz-c.xy)-c.z;
}

void main()
{


	vec2 coords = gl_FragCoord.xy / resolution;
	#define time time*0.1 + pow(coords.y, 1.-sin(coords.x+time))
	vec3 ray_dir = normalize( vec3( coords.x-sin(time*0.5)*0.1, coords.y - 0.5, -1.0 +sin(time*0.5)*0.1) );
	vec3 ray_orig = vec3((time*0.05)*cos(time*0.05)*20.0,5.0,100.0);
	float offs = 0.0;
	float j;
	for( float i = 0.0; i < 500.0;i += 1.0 ) {
		vec3 pos = vec3(ray_orig+ray_dir*offs);
			
		vec3 c = vec3(100.0,100.0,100.0);
		vec3 q = mod(pos,c)-0.5*c;
		
		float dist = sdCylinder(q, vec3(0.0,0.0,5.0));
		
		dist = min(dist, sdFloor(q, vec3(50.0,1.0,50.0)));
		
		offs+=dist;
	        j = i+(i*sin(time))/50.;
		if(abs(dist)<0.0001) break;
		
	}
	
	float c=j/50.0;
	gl_FragColor=vec4(c*(0.2+vec3(cos(time*0.1 - time*0.2),sin(time*0.2 - time*0.45),sin(time*0.3 - time*0.117))), 8.0);
	
}
