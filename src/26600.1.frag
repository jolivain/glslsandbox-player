#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float k_e = 8.99E9;

float charge_a = 1E-11;
vec2 point_a = vec2(0.5, 0.5);

float charge_b = -1E-11;

vec4 hue(float angle)
{
	float alpha = mod(angle, 60.0)/60.0;
	vec4 from = vec4(1.0, 0.0, 0.0, 1.0);
	vec4 to = vec4(1.0, 1.0, 0.0, 1.0);
	if(angle > 60.0)
	{
		from = vec4(1.0, 1.0, 0.0, 1.0);
		to = vec4(0.0, 1.0, 0.0, 1.0);
	}
	if(angle > 120.0)
	{
		from = vec4(0.0, 1.0, 0.0, 1.0);
		to = vec4(0.0, 1.0, 1.0, 1.0);
	}
	if(angle > 180.0)
	{
		from = vec4(0.0, 1.0, 1.0, 1.0);
		to = vec4(0.0, 0.0, 1.0, 1.0);
	}
	if(angle > 240.0)
	{
		from = vec4(0.0, 0.0, 1.0, 1.0);
		to = vec4(1.0, 0.0, 1.0, 1.0);
	}
	if(angle > 300.0)
	{
		from = vec4(1.0, 0.0, 1.0, 1.0);
		to = vec4(1.0, 0.0, 0.0, 1.0);
	}
	return mix(from, to, alpha);
}
	
vec2 coulomb(float q, vec2 source, vec2 test)
{
	vec2 diff = test - source;
	float dist = length(diff);
	return (k_e * q /(dist * dist)) * diff;
}

void main( void ) {

	vec2 position = ( gl_FragCoord.xy / resolution.xy );

	vec2 field = coulomb(charge_a, point_a, position) + coulomb(charge_b, mouse, position);
	
	vec4 base_color = vec4(0.0, 0.5, 0.5, 1.0);

	gl_FragColor = length(field) * hue(degrees(atan(field.y, field.x)) + 180.0);

}
