// by @eddbiddulph
// autumn trees at night, from hiding in the grass
// PLEASE view in 0.5 mode!!
// ** MODIFIED ** - by @eddbiddulph (follow me on twitter!) and an unknown other

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float circle(vec2 p, vec2 o, float r)
{
	p -= o;
	return step(dot(p, p), r);
}

vec2 rotate(vec2 v, float angle)
{
	return vec2(v.x * cos(angle) - v.y * sin(angle),
		    v.y * cos(angle) + v.x * sin(angle));
}

float tree(vec2 p, vec2 o, float a)
{
	p -= o;

	float m = step(p.y, 0.5) * step(abs(p.x), 0.01 / ((p.y + 0.3)));

	vec2 bo = vec2(0.0, 0.5);

	// make the branches and leaves with some circles
	m = max(m, circle(p, bo + rotate(vec2(0.0, 0.0), a), 0.01));
	m = max(m, circle(p, bo + rotate(vec2(0.1, 0.1), a), 0.011));
	m = max(m, circle(p, bo + rotate(vec2(-0.06, 0.05), a), 0.008));
	m = max(m, circle(p, bo + rotate(vec2(-0.02, 0.12), a), 0.008));

	return m;
}

float rowOfTrees(vec2 p)
{
	float a = cos(floor(p.x) * 20.6) * 3.1415926, b = 1.0 + cos(floor(p.x) * 10.0) * 0.2;
	p.x = mod(p.x, 1.0);
	return tree(p * b, vec2(0.5, 0.0) * b, a);
}

float grass(vec2 p)
{
	p *= vec2(10.0, 1.0) * 2.5;
	float a = floor(p.x) * 12.0, b = 1.0 + sin(floor(p.x)) * cos(floor(p.x) * 0.3) * 0.1;
	p.x = mod(p.x, 1.0) - 0.5;
	return step(abs(p.x + cos(a) * p.y ), 0.5 - p.y * b);
}

float starPattern(vec2 p)
{
	return 0.1 / (abs(cos(p.x)) + 0.01) * 0.1 / (abs(sin(p.y)) + 0.01) * abs(sin(p.x)) * abs(cos(p.y));
}

vec3 stars(vec2 p)
{
	p -= 0.5;

	float a = starPattern(rotate(p / 26.0, 0.1)) * max(0.0, 1.3 + cos(p.x + time)) +
		starPattern(rotate(p * 50.0, 0.2)) * max(0.0, 1.2 + cos(p.x * 0.4 + time * 2.0));

	return vec3(a * 0.1 * (1.0 + (2.0 + sin(time * 30.0)) * 0.2));
}

void main(void)
{
	vec2 p = gl_FragCoord.xy / resolution.xy * vec2(resolution.x / resolution.y, 1.0),
		scroll = vec2(time * 0.05, 0.0);

	vec3 col = vec3((1.0 - p.y) * 0.1, (1.0 - p.y) * 0.1, 0.1); // backdrop

	col += stars(p) * max(0.0, p.y - 1000.6);

  	for(int i = 0; i < 10; ++i)
    {
        float fi = float(i) + 1.0;
        
        if(rowOfTrees(p * fi + scroll + vec2(fi * 20.0, 0.0)) > 0.0)
        {
            col = vec3(0.4, 0.7, 0.1) / fi;
            break;
        }
    }

	gl_FragColor.a = 1.0;
	gl_FragColor.rgb = col;
}
