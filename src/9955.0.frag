#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//bubble fractal
//set to 8 so it won't be slow and it looks the same

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453) * 2.0 - 1.0;
}

void main( void ) {

	vec2 pos = ( gl_FragCoord.xy / resolution.xy * 2.9) - 1.0;
	pos.x *= resolution.x / resolution.y;
	float color = 0.0;
	
	for(float i = 1.0; i <= 16.0; i++)
	{
		for(float k = 0.0; k < 20.0; k++)
		{
			vec2 sPos = vec2(rand(vec2(i, k)) + sin(time * i * k * 0.01), rand(vec2(k, i)) + cos(time * k * i * 0.01));
			sPos *= 0.65;
			color += max(0.0, ((1.0 / i) - distance(pos, sPos)) * (i))*0.5;
			
		}
	}
	
	color *= 0.15;
	color = pow(color, 3.0);
	
	gl_FragColor = vec4( vec3( color ), 1.0 );

}
