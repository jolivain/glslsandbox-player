precision highp float;

// mumumusuc
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;
uniform sampler2D backbuffer;

#define PI	3.14159
#define X	vec2(1.0,0.0)
#define Y	X.yx
#define W	0.002
#define R 	resolution.x/resolution.y
#define EDGE_Y	1.0
#define EDGE_X	R*EDGE_Y
#define REMAP_X vec2(-EDGE_X,EDGE_X)
#define REMAP_Y vec2(-EDGE_Y,EDGE_Y)
#define EPS	0.001
#define MAX_VEL	0.2
#define RADIUS	0.05
#define DT	0.1

mat2 mm2(float d){
	float r = d/180.0*PI;
	return mat2(cos(r),-sin(r),cos(r),sin(r));
}

float circle(vec2 pos, float radius, bool fill){
	return abs(max(length(pos)-radius,float(fill)-1.0));
} 

float qurd(vec2 pos, float w, float h, bool fill){
	vec2 d = abs(pos)-vec2(w,h);
	return max(max(d.x,d.y),1e4*(float(fill)-1.0));
}

float triangle(vec2 pos,bool fill){
	float d1 = dot(mm2(330.)*X,pos)-0.1;
	float d2 = dot(mm2(210.)*X,pos)-0.1;
	float d3 = dot(mm2( 90.)*X,pos)-0.1;
	return max(max(max(d1,d2),d3),1e4*(float(fill)-1.0));
}

float scene(vec2 pos,vec2 touch){
	float de = -qurd(pos,EDGE_X-0.001,EDGE_Y-0.001,false);
	float dc1 = triangle(pos+0.5*X,true);
	float dc2 = circle(pos-touch,0.2,true);
	float dc3 = qurd(pos-0.5*X,0.1,0.5,true);
	return min(min(min(de,dc1),dc2),dc3);
}

vec2 calcNormal(vec2 p,vec2 touch){
	return normalize(vec2(
		scene(vec2(p.x+EPS,p.y),touch) - scene(vec2(p.x-EPS,p.y),touch),
		scene(vec2(p.x,p.y+EPS),touch) - scene(vec2(p.x,p.y-EPS),touch)
	));
}

float remap(vec2 from, vec2 to,float x){
	return (to.y-to.x)/(from.y-from.x)*(x-from.x)+to.x;
}

vec2 remap(vec2 from, vec2 to,vec2 x){
	return (to.y-to.x)/(from.y-from.x)*(x-from.x)+to.x;
}

bool collide(vec2 pos,vec2 touch){
	return scene(pos,touch) < RADIUS;
}

void main( void ) {
	vec2 pos = (2.0*gl_FragCoord.xy - resolution) / resolution.y;
	vec2 touch = (2.0*mouse -1.0) * resolution / resolution.y;
	vec2 uv = gl_FragCoord.xy/resolution;
	vec4 pre_status = texture2D(backbuffer,X.yy);
	float dt = DT;
	vec2 pre_vel = remap(Y,REMAP_Y,pre_status.zw);
	if(length(pre_vel) < MAX_VEL/2.0){
		pre_vel = normalize(X+Y)*MAX_VEL;
	}
	vec2 pre_pos = vec2(remap(Y,REMAP_X,pre_status.x),remap(Y,REMAP_Y,pre_status.y));
	vec2 cur_vel = normalize(pre_vel)*clamp(length(pre_vel),0.0,MAX_VEL);
	if(collide(pre_pos,touch)){
		vec2 N = calcNormal(pre_pos,touch);
		if(dot(cur_vel,N)<0.0)
			cur_vel = reflect(cur_vel,N);
	}
	vec2 cur_pos = pre_pos + dt*cur_vel;
	
	vec3 color = vec3(0.0);
	if(length(uv)<W){
		float px = remap(REMAP_X,Y,cur_pos.x);
		float py = remap(REMAP_Y,Y,cur_pos.y);
		vec2  v  = remap(REMAP_Y,Y,cur_vel);
		gl_FragColor = vec4(px,py,v);
	}else{
		color += vec3(vec2(W/circle(pos-cur_pos,RADIUS,true)),0.0);
		color += W/scene(pos,touch);
		gl_FragColor = vec4(color, 1.0);
	}
}
