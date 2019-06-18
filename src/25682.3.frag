#ifdef GL_ES  /* Nice little tunnel...  any idea ?  -Harley */
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec2 Offset;
vec2 Scale=vec2(0.002,0.002);
float Saturation = 0.8; // 0 - 1;


vec3 lungth(vec2 x,vec3 c){
       return vec3(length(x+c.r),length(x+c.g),length(c.b));
}

void main( void ) {
	
	vec2 position = (gl_FragCoord.xy - resolution * 0.9) / resolution.yy;
	float th = atan(position.y, position.x) / (1.0 * 3.1415926);
	float dd = length(position) + 0.005;
	float d = 0.5 / dd + time;
	
    	vec2 x = gl_FragCoord.xy;
    	vec3 c2=vec3(0,0,0);
   	x=x*Scale*resolution/resolution.x;
    	x+=sin(x.yx*sqrt(vec2(1,9)))/10.0;
    	c2=lungth(sin(x*sqrt(vec2(3,43))),vec3(5,6,7)*Saturation * d);
	x+=sin(x.yx*sqrt(vec2(73,5)))/5.0;
    	c2=2.*lungth(sin(time+x*sqrt(vec2(33.,23.))),c2/9.0);
    	x+=sin(x.yx*sqrt(vec2(93,7)))/3.0;
    	c2=lungth(sin(x*sqrt(vec2(3.,1.))),c2/2.0);
    	c2=.5+.5*sin(c2*8.);
	
	vec3 uv = vec3(th + d, th - d, th + sin(d) * 0.45);
	float a = 0.5 + cos(uv.x * 3.1415926 * 2.0) * 0.5;
	float b = 0.5 + cos(uv.y * 3.1415926 * 2.0) * 0.5;
	float c = 0.5 + cos(uv.z * 3.1415926 * 6.0) * 0.5;
	vec3 color = 	mix(vec3(0.1, 0.5, 0.5), 	vec3(0.1, 0.1, 0.2),  pow(a, 0.2)) * 3.;
	color += 	mix(vec3(0.1, 0.2, 1.0), 	vec3(0.1, 0.1, 0.2),  pow(b, 0.1)) * 0.75;
	color += 	mix(c2, 			vec3(0.1, 0.2, 0.2),  pow(c, 0.1)) * 0.75;

	gl_FragColor = vec4( (color * dd), 1.0);
}
