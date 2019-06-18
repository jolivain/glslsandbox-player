#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}

float getLine(vec2 p, float y){
	float margin = 0.15;
	
	vec2 pos = p;
	float a = time * 100. + y * 31.;
	vec2 lineCenter = vec2(0.5, y);
	
	pos -= lineCenter;
	pos *- mat2(cos(a), -sin(a), sin(a), cos(a));
	pos += lineCenter;
	
	
	float marginb = 0.005;
	float b = 0.004;
	float t = y;
	
	const float N = 5.;
	for(float i = 0.; i <= N; i += 1.0001){
		float scale = 0.03/(N+-0.9*i+y*y*24.+sin(10.*t));
		t += noise(t+(pos.x + y+time*0.1*y) * (100.+20.*i*i-y*250.)) * scale;
		
	}
	float f = (smoothstep(t - b, t, pos.y) - smoothstep(t, t + b, pos.y));	
	f *= smoothstep(margin - marginb, margin, pos.x) - smoothstep(1. - margin, 1. -  margin + marginb, pos.x);
	f *= 0.8;
	
	float light = 0.5 + 0.5 * sin(time * .2);
	vec2 point = vec2(margin + light * (1. - margin * 2.), t);
	f += .008 / distance(pos, point);
	return f;
}

void main( void ) {
	vec2 p = gl_FragCoord.xy / resolution.xy;
	float f = 0.;
	
	for(int i = 0; i < 10; i++){
		f += getLine(p, 0.1 + (0.8) / 10. * float(i)); 
	}
	
	vec3 color = vec3(0., .4, .6) * f;
	gl_FragColor = vec4(color, 1.);
}
