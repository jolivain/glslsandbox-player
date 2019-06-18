#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;

 vec2 bricksize = vec2(50.0, 25.0);
 vec2 brickspace = vec2(4.0, 4.0); //Adjust spacing



void main(void)
{
	vec3 color = vec3(0.95, 0.75, 0.75);
	
	vec2 position = gl_FragCoord.xy;
	
	float row = floor(gl_FragCoord.y/bricksize.y);
	
	if (mod(row, 2.0) < 1.0)  //if (mod(row, 2.) < 1.0)
	{
		position.x += bricksize.x/2.0*cos(time*1.);
	}
	
	if (mod(position.x, bricksize.x) < brickspace.x || mod(position.y, bricksize.y) < brickspace.y)
	{
		color = vec3(0.1, 0.1, 0.1);
	}
	
	gl_FragColor = vec4(color, 1.0);
}
