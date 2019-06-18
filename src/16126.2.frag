#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

void main( void ) {
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 aspect = vec2( resolution.x / resolution.y, 1.0 );
	vec2 p = ( uv * 2.0 - 1.0 ) * aspect;
	p*=1.0;
	vec2 mt = (mouse * 2.0 - 1.0) * aspect;	
	vec3 c = vec3(0.0);
	float t2 = time*0.01+200.0;
	
	for(float i = 0.0; i < 100.0; i++)
	{
		float r = sin(i * 10000.0);	
		vec2 cp = vec2(r + sin(t2*(r+0.5)*0.5), (cos(t2*0.5*(r+0.5)))*1.1);
		float d = distance(cp, p) / (0.08+distance(cp, mt)*0.1);
		float a = pow(sin(t2*48.0 + r)+1., 0.66);
		float e = smoothstep(-a*0.3, 0.1, 1.0 - d)-0.001;
		c += (e) * mix(vec3(0.0, 0.8, 0.5), vec3(0.3, 0.8, 0.3), a);
	}
	
	c *= 0.5;
	c *= smoothstep(-1.5, 1.0, 1.0 - length(p))*0.9;
	c = pow(c, vec3(0.7, 0.7, 1.0));
	c -= 0.05;
	//c+= fract(sin(dot(p, vec2(344.4324, 864.0))*5.3543)*2336.65)*0.02;
	gl_FragColor = vec4( c, 1.0 );

}
