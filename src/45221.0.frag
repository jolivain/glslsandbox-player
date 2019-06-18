#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float scene(in vec3 p)	
{
	float r = 0.05; 
	float ox = float(int(p.x*10.0+10.0*r)); 
	float oy = float(int(p.y*10.0+10.0*r)); 
	
	p.x = mod(p.x+r, 2.0*r) - r; 
	p.y = mod(p.y+r, 2.0*r) - r; 
	p.z += sin(ox*ox*0.01+oy*oy*0.00+time)*0.3+cos(oy*ox*0.01+ox*oy*0.00+time)*0.3; 
	return length(p) - r; 
}
vec3 get_normal(in vec3 p)
{
	vec3 eps = vec3(0.001, 0, 0); 
	float nx = scene(p + eps.xyy) - scene(p - eps.xyy); 
	float ny = scene(p + eps.yxy) - scene(p - eps.yxy); 
	float nz = scene(p + eps.yyx) - scene(p - eps.yyx); 
	return normalize(vec3(nx,ny,nz)); 
}

float rm2(in vec3 ro, in vec3 rd)
{
	vec3 pos = ro; 
	float dist = 1.0; 
	float d; 
	for (int i = 0; i < 5; i++) {
		d = scene(pos); 
		pos += rd*d;
		dist -= d; 
	}
	return dist; 
}


vec3 rotatex(in vec3 p, float ang)
{
	return vec3(p.x,p.y*cos(ang)-p.z*sin(ang),p.y*sin(ang)+p.z*cos(ang)); 
}
void main( void ) {

	vec2 p = 2.0*( gl_FragCoord.xy / resolution.xy )-1.0;
	p.x *= resolution.x/resolution.y; 

	vec3 color = vec3(0.1); 
	
	vec3 ro = vec3(0,0,1.0);
	vec3 rd = normalize(vec3(p.x,p.y,-2.0)); 
	rd = rotatex(rd, 1.2); 
	vec3 pos = ro; 
	float dist = 0.0; 
	float d; 
	for (int i = 0; i < 64; i++) {
		d = scene(pos)*0.5; 
		pos += rd*d;
		dist += d; 
	}
	if (dist < 10.0 && abs(d) < 0.1) {
		vec3 l = normalize(vec3(1,1,1)); 
		vec3 n = get_normal(pos); 
		vec3 r = reflect(rd, n); 
		float fres = clamp(dot(n, -rd),0.0, 1.0);  
		float diff = clamp(dot(n, l), 0.0, 1.0); 
		float spec = pow(clamp(dot(r, l), 0.0, 1.0), 40.0);  
		float shade = rm2(pos+0.05*n, n); 
		color = mix(vec3(1,1,1)*0.8, vec3(1,1,1)*0.0, fres); 
		color += 0.1*vec3(1,1,1)*diff*pos.y; 
		color += vec3(1,1,1)*spec; 
		color += 0.1*shade; 
		color /= dist; 
	}
	
	
	gl_FragColor = vec4(color, 1.0); 
}
