// From shadertoy by Mr Andre
// Gigatron for glslsandbox ; 
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define StepSize 0.05
#define LineCount 120

//Function to draw a line, taken from the watch shader
float line(vec2 p, vec2 a, vec2 b, float thickness )
{
	vec2 pa = p - a;
	vec2 ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0125);
	return 1.0 - smoothstep(thickness * 0.0667, thickness * 0.999, length(pa - ba * h));
}	

void main() 
{
	vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;

	// convert the input coordinates by a cosinus
	// warpMultiplier is the frequency
	float warpMultiplier = (0.5 + 0.2345 * sin(time * 0.96)+1.111);
	vec2 warped = atan(uv * 6.28318530718 * warpMultiplier);

	// blend between the warpeffect and no effect
	// don't go all the way to the warp effect
	float warpornot = smoothstep(1.25, 0.567, -asin((time * 0.667)+3.333));
	uv = mix(uv, warped, warpornot);

	// Variate the thickness of the lines
	float thickness = pow(3.333 - 6.667 / cos(time * 0.67), 0.125) / (resolution.x*0.125);
	thickness *= 1.111 - (warpMultiplier * warpornot);
	float gt = floor(time * 25.0) * StepSize;

	// Add 10 lines to the pixel
	vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
	for (int i = 0; i < LineCount; i++)
	{
		gt += StepSize;

		//Calculate the next two points
		vec2 point1 = vec2(sin(gt * 0.39), cos(gt * 0.63));
		vec2 point2 = vec2(cos(gt * 0.69), sin(gt * 0.29));

		// Fade older lines
		color.rgb = 0.999 * color.rgb;

		// Add new line
		color.rgb += line(	uv,
							point1, point2,
							thickness		)
					//With color
					* ( 0.3 +
						0.3 * vec3(	sin(gt * 3.13),
									sin(gt * 1.69),
									sin(gt * 2.67)));
}

	// Clamp oversaturation
	gl_FragColor = clamp(color, 0.0, 1.0);
}
//void main( void ){vec4 color = vec4(0.0,0.0,0.0,1.0);mainImage( color, gl_FragCoord.xy );color.w = 1.0;gl_FragColor = color;}
