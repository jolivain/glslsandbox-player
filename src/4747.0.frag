#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159
#define TAU 6.28318

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float arc(vec2 pos,vec4 btrir,float ang,vec2 p);

void main( void ) {

	vec2 p = gl_FragCoord.xy;

	float color = 0.0;
	
	color += arc(resolution/2.,vec4(0.0,PI/2.,32,48),time*1.25,p);
	color += arc(resolution/2.,vec4(0.0,PI/2.,48,64),time,p);
	color += arc(resolution/2.,vec4(0.0,PI/2.,64,80),time/2.25,p);
	color += arc(resolution/2.,vec4(0.0,PI/2.,80,96),time/2.5,p);
	color += arc(resolution/2.,vec4(0.0,PI/2.,96,112),time/1.75,p);
	color += arc(resolution/2.,vec4(0.0,PI/2.,112,128),time/2.0,p);
	
	gl_FragColor = vec4(vec3(color),1.0);
}

float arc(vec2 pos,vec4 btrir,float ang,vec2 p)
{
	vec2 c = resolution/2.;
	
	float d = distance(p,vec2(c));
	
	float a = atan(p.x-c.x,p.y-c.y)+PI+ang;
	
	a = mod(a,TAU);
	
	float color = 0.0;
	
	if(a > btrir.x && a < btrir.y && d > btrir.z && d < btrir.w)
	{
		float diff = d-btrir.z;
		float rtrn = smoothstep(0.0,1.0,pow(sin(diff/16.*PI),0.25));
		
		float eb = 32.0;
		if(a < btrir.x+(PI/eb))
		{
			rtrn *= smoothstep(0.0,1.0,a/(PI/eb));
		}
				
		if(a > btrir.y-(PI/eb))
		{
			float ad = a - (btrir.y-(PI/eb));
			rtrn *= smoothstep(1.0,0.0,ad/(PI/eb));
		}
		return rtrn;
	}
	
	return 0.0;
}


