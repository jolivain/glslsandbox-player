// Stella by JvB. 

// + antialiasing


#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


float ear(vec2 p, float r)
{
	r = (r - sin(p.y)+sin(-p.x-0.5*p.y)*0.2); 
	return smoothstep(-0.01, 0.01, r-length(p));
}
float head(vec2 p, float r)
{
	float px = abs(p.x)*(1.0 + 0.1*p.y);
	float py = abs(p.y);
	float d = pow(pow(px,4.0) + pow(py,4.0), 1.0/4.0); 
	return smoothstep(-0.01, 0.01, r-d); 
}
float circle(vec2 p, float r)
{
	return smoothstep(-0.01, 0.01, r-length(p)); 
}
float ring(vec2 p, float i, float o) 
{
	return circle(p,i)-circle(p,o);
}

void main( void ) 
{

	float aspect = resolution.x/resolution.y; 
	vec2 p = 2.0 * ( gl_FragCoord.xy / resolution.xy ) - 1.0;
	p.x *= aspect; 
	
	vec3 color = vec3(0.5);
	p.y *= 1.2;
	color = min(color, (1.0-circle(p-vec2(0,-0.60), 0.30))*vec3(1.0)); // body
	color = max(color, circle(p-vec2(+0.25,-0.50), 0.10)*vec3(0.91)); // right hand
	color = max(color, circle(p-vec2(-0.25,-0.50+sin(time*2.0)*0.05), 0.10)*vec3(0.91)); //left hand
	color = max(color, circle(p*vec2(1.0,1.5)-vec2(-0.25,-1.20), 0.20)*vec3(0.91)); // left foot
	color = max(color, circle(p*vec2(1.0,1.5)-vec2(+0.25,-1.20), 0.20)*vec3(0.91)); // right foot
	p.y += sin(time*2.2)*0.005; 
	color = max(color, circle(p*vec2(2.0,8.0)-vec2(+0.0,-2.65), 0.30)*vec3(0.71,0.0,0.0));  // collar
	color = min(color, (1.0-head(p*vec2(1.0,1.25)+vec2(0.0,-0.07), 0.5))*vec3(1.0)); // head
	color = min(color, (1.0-ear(p*vec2( 3.1,4.3)+vec2(0.75,-2.5), 0.1))*vec3(1.0)); // left ear
	color = min(color, (1.0-ear(p*vec2(-3.1,4.3)+vec2(0.75,-2.5), 0.1))*vec3(1.0)); // right ear
	color = max(color, ring(p-vec2(-0.28,+0.0), 0.1,0.085)*vec3(1.0,1.0,0.0)); // left eye
	color = max(color, ring(p-vec2(+0.28,+0.0), 0.1,0.085)*vec3(1.0,1.0,0.0)); // right eye
	color = max(color, circle(p*vec2(2.0,5.0)-vec2(+0.0,-0.45), 0.1)*vec3(0.4)); // nose

	gl_FragColor = vec4(color, 1.0); 
}
