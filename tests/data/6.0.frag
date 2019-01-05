// by @DanielPettersso

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 resolution;

float wave(float size, float speed, float strength, vec2 pos)
{
	return cos(length(pos*size)-time*speed)*(strength*max(0.,(1.-length(pos))));
}

float wavein(float size, float speed, float strength, vec2 pos)
{
	return cos(length(pos*size*(sin(time*2.)*0.3+1.))+time*speed)*(strength*max(0.,(1.-length(pos))));
}

float sinpp(float a)
{
	return (sin(a)+1.)*0.5;
}

float cospp(float a)
{
	return (cos(a)+1.)*0.5;
}

void main(void)
{
	vec2 p = -1.0 + 2.0 * gl_FragCoord.xy / resolution.xy;
	vec2 pp = (p + 1.0)*0.5;
	vec3 col = vec3(pp.x, pp.y, (pp.x*pp.y)*sinpp(time*3.) + (pp.x+pp.y)*cospp(time*4.));
	
	col += wave(17.0, 7.0, 0.4, p);
	col += wave(27.0, 8.0, 0.4, p+0.03);
	col += wavein(100.0, 8.0, 0.4, p-0.02);
	
	gl_FragColor = vec4(col,1.0);
}
