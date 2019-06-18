#ifdef GL_ES
precision mediump float;
#endif

// quadratic bezier curve evaluation
// posted by Trisomie21

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

int solveCubic(in float a, in float b, in float c, out float r[3])
{
	float  p = b - a*a / 3.0;
	float  q = a * (2.0*a*a - 9.0*b) / 27.0 + c;
	float p3 = p*p*p;
	float  d = q*q + 4.0*p3 / 27.0;
	float offset = -a / 3.0;
	if(d >= 0.0) { // Single solution
		float z = sqrt(d);
		float u = (-q + z) / 2.0;
		float v = (-q - z) / 2.0;
		u = sign(u)*pow(abs(u), 1.0/3.0);
		v = sign(v)*pow(abs(v), 1.0/3.0);
		if(abs(p) < abs(q)*0.005) {
			if(q <0.0) v = p / (3.0 * -pow(-q, 1.0/3.0));
			else u = p / (3.0 * pow(q, 1.0/3.0));	
		}			
		r[0] = offset + u + v;
		return 1;
	}
	float u = sqrt(-p / 3.0);
	float v = acos(-sqrt( -27.0 / p3) * q / 2.0) / 3.0;
	float m = cos(v), n = sin(v)*1.732050808;
	r[0] = offset + u * (m + m);
	r[1] = offset - u * (n + m);
	r[2] = offset + u * (n - m);
	return 3;
}


float DistanceToQBSpline(in vec2 P0, in vec2 P1, in vec2 P2, in vec2 p)
{
	float dis = 1e20;
	
	vec2  sb = (P1 - P0) * 2.0;
	vec2  sc = P0 - P1 * 2.0 + P2;
	vec2  sd = P1 - P0;
	float sA = 1.0 / dot(sc, sc);
	float sB = 3.0 * dot(sd, sc);
	float sC = 2.0 * dot(sd, sd);
	
	vec2  D = P0 - p;

	float a = sA;
	float b = sB;
	float c = sC + dot(D, sc);
	float d = dot(D, sd);

    	float res[3];
	int n = solveCubic(b*a, c*a, d*a, res);

	float t = clamp(res[0],0.0, 1.0);
	vec2 pos = P0 + (sb + sc*t)*t;
	dis = min(dis, length(pos - p));
	
    	if(n>1) {
	t = clamp(res[1],0.0, 1.0);
	pos = P0 + (sb + sc*t)*t;
	dis = min(dis, length(pos - p));
	    
	t = clamp(res[2],0.0, 1.0);
	pos = P0 + (sb + sc*t)*t;
	dis = min(dis, length(pos - p));	    
    	}

    	return dis;
}

void main(void)
{
	vec2 position = gl_FragCoord.xy;
	const int pointCount = 4;
	vec2 p[2 * pointCount + 1];
	
	p[0] = vec2(resolution.x*0.5,resolution.y*.2);
	p[1] = mouse*resolution;
	p[2] = vec2(resolution.x*0.4,resolution.y*.8);
	p[4] = vec2(resolution.x*0.6,resolution.y*.8);
	p[6] = vec2(resolution.x*0.6,resolution.y*.6);
	p[8] = vec2(resolution.x*0.7,resolution.y*.2);
	
	float d = 9999.0;
	for (int i = 0; i < pointCount; ++i)
	{
		if (i > 0)
			p[2*i+1] = 2.0 * p[2*i] - p[2*i - 1];
		d = min(d, DistanceToQBSpline(p[2*i], p[2*i + 1], p[2*i + 2], position));
	}
	
	float lineThickness = 12.0;
	float lineSoftness = 1.0;
	float outline = 1.0;
	d = (d - (lineThickness-1.0)) / lineSoftness;
	if(outline>0.0) d = abs(d)-outline;
	
	// Curve Control point
	
	d = clamp(d, 0.0, 1.0);
	d = mix(0.8, 0.5, d);
	gl_FragColor = vec4(d,d,d, 1.0);
}
