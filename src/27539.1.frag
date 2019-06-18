#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float opU( float d1, float d2 )
{
    return min(d1,d2);
}

float opS( float d1, float d2 )
{
    return max(-d1,d2);
}

float opI( float d1, float d2 )
{
    return max(d1,d2);
}

float sdCircle(float r, vec2 p)
{
	return length(p) - r;
}

float sdBox(vec2 s, vec2 p)
{
    p = abs(p) - s / 2.0;
    return max(p.x,p.y);
}

float map(vec2 p)
{
	float dist = 1e6;
	
	vec2 p1 = mod(p, vec2(0.25)) - 0.125;
	vec2 p2 = mod(p - 0.125, vec2(0.25)) - 0.125;
	
	dist = opU(dist, sdBox(vec2(0.04), p1));
	dist = opU(dist, sdCircle(0.04, p2));
	
	return dist;
}

float shadow(vec2 p, vec2 l)
{
	vec2 dir = normalize(l - p);
	float dist = distance(p, l);
	float t = 0.0;
	float s = 1.0;
	for(int i = 0;i < 96;i++)
	{
		float sd = map(p + dir * t);
		t += sd * 0.25;
		
		s = min(s, 16.0*sd/t);
		
		if(sd < 0.0001 || t > dist)
		{
			break;	
		}
	}
	
	return (t < dist) ?  0.0 : s;
}

void main( void ) 
{
	vec2 aspect = resolution.xy / resolution.y;
	vec2 uv = ( gl_FragCoord.xy / resolution.y ) - aspect/2.0;
	vec2 mo = mouse * aspect - aspect/2.0;
	
	vec3 color = vec3(0.0);
	
	float d = map(uv);
	
	vec2 li = mo;//vec2(0.06,0.05);
	
	vec3 bg = vec3(0.5);
	bg *= smoothstep(-0.02,0.02,d);
	bg *= (shadow(uv, li) * max(0.0, 1.0 - distance(uv,li) * 2.5))*0.75+0.125;
	
	vec3 fg = vec3(1.0,0.5,0.0);
	
	color = mix(fg, bg, smoothstep(0.000,0.001,map(uv)));
	
	gl_FragColor = vec4( vec3( color ), 1.0 );

}
