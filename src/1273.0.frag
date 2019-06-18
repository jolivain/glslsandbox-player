// this is a remake of Puls, a famous 256b intro by Rrrola
// see here for a video: http://www.youtube.com/watch?v=R35UuntQQF8
//
// rendering is done with raymarching with distance fields:
// http://goo.gl/6dZE3
//
// translucency is done with depth testing (smaller depth -> lighter pixel)
//
// the standalone version has music (Hybrid song by Axwell:
// http://goo.gl/jPEib) and a "beat-sync" ;). you can get it here: 
// http://github.com/pakt/gfx. you will need a browser with webkit
// audio api (about:flags, enable experimental apis in chrome).
//
// here's a capture of version with music: http://youtu.be/Kc4ZZrITBic
//
//e#1238.0 - raer: fixed the raymarching eps 0.1->0.005 to get rid of artifacts
//e#1238.0 - raer: added soft shadows ala http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// pk
// twitter.com/pa_kt
uniform float bin0;
uniform float bin1;
uniform float bin2;

//#define FISH_EYE
//#define FAKE_AO

#define PI (4.0*atan(1.0))
#define CELL_SIZE 3.5

#define FLOOR 0.0
#define BOX 1.0
#define TORUS 2.0
#define FIELD 3.0
#define GREEN_OCTA 4.0
#define ORANGE_OCTA 5.0
#define BARS 6.0
#define BOLTS 7.0
#define SPHERE 8.0

float fog(vec3 eye, vec3 p){
 float f = 1.0/exp(length(p)*0.05);
 return f;
}

vec2 op_union(vec2 a, vec2 b){
 if(a.x < b.x)
  return a;
 return b;
}

vec2 op_subtract(vec2 a, vec2 b){
 if(-a.x > b.x){ 
  return vec2(-a.x, a.y);
 }
 return b;
}

vec2 op_intersect(vec2 a, vec2 b){
 if(a.x > b.x)
  return a;
 return vec2(b.x, a.y);
}

float rbox_d(vec3 p, vec3 b, float r )
{
  return length(max(abs(p)-b,0.0))-r;
}

float torus_d(vec3 p, vec2 t){  
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float sphere_d(vec3 p, float r){
	return length(p)-r;
}

float octa_d(vec3 p, float r){
	//p = p/2.0;
	float d = abs(p.x)+abs(p.y)+abs(p.z);
	d = d/2.0;
	return d-r;
}


float bars_d(vec3 p, float r){
	float d = (abs(abs(p.x)-abs(p.z)) + abs(abs(p.y)-abs(p.x)) + abs(abs(p.z)-abs(p.y)));
	d = d/4.0;
	return d-r;
}

vec3 rep( vec3 p, float m )
{
	vec3 c = vec3(m,m,m);
    	vec3 q = mod(p+c/2.0, c)-c/2.0;
   	return q;
}

float tempo(){
	float t = 1.0;//sin(time*2.0);
	t = (t+1.0)/2.0;
	return t;
}	

vec2 get_octas(vec3 p, float octa_size, float cell_size, float id){
	vec3 q = rep(p, cell_size);
	vec2 o = vec2(octa_d(q, octa_size), id);	
	return o;
}

vec2 get_all_octas_dist(vec3 p, float cell_size, in float green_size, in float orange_size){
	vec2 green = get_octas(p, green_size, cell_size, GREEN_OCTA);
	vec3 r = p - cell_size/2.0;	
	vec2 orange = get_octas(r, orange_size, cell_size, ORANGE_OCTA);
	return op_union(green, orange);
}

// "beat-sync" with music
void get_sizes(float t, out float green_size, out float orange_size){
	float fix0 = max(bin0-0.55, 0.0)*2.0;
	float fix1 = max(bin1-0.4, 0.0)*2.0;
	green_size = mix(0.4, 0.7, t)+fix0;
	orange_size = mix(0.8, 0.3, t)+fix1;
}

//octas is the distance to sum of orange/green octas (without bars/bolts)
vec2 march_step_(vec3 p, out vec2 octas){ 

	float t = tempo();
	float cell_size = CELL_SIZE;	
 	
	vec3 q = rep(p, cell_size);	
	
	float green_size = 0.0;
	float orange_size = 0.0;
	get_sizes(t, green_size, orange_size);
	vec2 green_octas =  get_octas(p, green_size, cell_size, GREEN_OCTA);
	vec3 offset = vec3(0,0,0)+cell_size/2.0;
	vec3 r = p - offset;	
	vec2 orange_octas = get_octas(r, orange_size, cell_size, ORANGE_OCTA);
	octas = op_union(green_octas, orange_octas);
	
	vec2 bars = vec2(bars_d(q, 0.14), BARS);
	
	float bolt_size = 0.5;
	float bolt_offset = 0.1;
	float small_size = mix(green_size, length(offset)-orange_size-green_size, t);
	float big_size = small_size+bolt_size;
	vec2 bolts = vec2(bars_d(q, 0.28), BOLTS);
	vec2 small_octa = vec2(octa_d(q, small_size), BOLTS);
	vec2 big_octa = vec2(octa_d(q, big_size), BOLTS);
	bolts = op_intersect(bolts, big_octa);
	bolts = op_subtract(small_octa, bolts);
	
	vec2 o = vec2(0,0);
	
	o = op_union(bars, octas);
	o = op_union(o, bolts);	
	
	return o;
}

vec2 march_step(vec3 p){
	vec2 trash = vec2(0,0);
	vec2 o = march_step_(p, trash);
	return o;
}

vec3 normal(float dist, vec3 p){
	vec2 e = vec2(0.01, 0.0);
	float dx = dist-march_step(p-e.xyy).x;
	float dy = dist-march_step(p-e.yxy).x;
	float dz = dist-march_step(p-e.yyx).x;
      	vec3 n = vec3(dx, dy, dz);
	n = normalize(n);

	return n;
}

vec3 camera(
  in vec3 eye,
  in vec3 lookat,
  in vec3 up,
  in float fov)
{
	vec2 pos = -1.0 + 2.0*( gl_FragCoord.xy / resolution.xy );
	float aspect = resolution.x / resolution.y;
	vec3 ray = normalize(lookat - eye);
	// view plane spanning vectors
	vec3 u = normalize(cross(up, ray));
	vec3 v = cross(ray, u);
	fov = radians(fov/2.0);
	float vp_distance = 1.0/tan(fov);	
	vec3 vp_center = eye+vp_distance*ray;

 	vec3 vp_point = vp_center + pos.x*u*aspect + pos.y*v;
  	vec3 vp_ray = normalize(vp_point - eye);
	
	return vp_ray;
}

vec3 camera_fish(
  in vec3 eye,
  in vec3 lookat,
  in vec3 up,
  in float fov)
{
	vec2 pos = -1.0 + 2.0*( gl_FragCoord.xy / resolution.xy );
	float aspect = resolution.x / resolution.y;
	
	vec3 ray = normalize(lookat - eye);	
	vec3 u = normalize(cross(up, ray));
	vec3 v = normalize(cross(ray, u));
	
	fov = radians(fov/2.0);	
	float w = sin(fov);
	float x = pos.x * w * aspect;
	float y = pos.y * w;
	float z = sqrt(1.0 - x*x - y*y);
	
	//vec3 vp_ray = vec3(pos.x, pos.y, z);
	vec3 vp_ray = (x*u+y*v+ray*z);
	vp_ray = normalize(vp_ray);
	
	return vp_ray;
}

//AO technique by Alex Evans (statix)
//http://www.iquilezles.org/www/material/nvscene2008/rwwtt.pdf
float ao(vec3 p, vec3 n){
	float delta = 0.2;
	float o = 1.0;
	float d = 0.0;
	float e = 1.0;
	float s = 0.0;
	for(int i=1;i<6;i++){
		s = float(i)*delta;
		p = p+n*s;
		d = march_step(p).x;
		d = d - s;
		e *= 2.0;
		o += d/e;
	}
	//o = (0.9*o);
	
	return o;
}

vec2 ray_march(vec3 eye, vec3 ray, float eps, float min_depth, float max_depth, out vec3 p, out float f){
	vec2 o = vec2(eps+1.0, -1);
	f = min_depth;

	for(int i=0;i<64;i++){
	 	if(abs(o.x)<eps){
	  		break;
	 	}
		if(f > max_depth){
			o.y = -1.0;
			break;
		}
	 	f += o.x;
	 	p = eye + f*ray;
	 	o = march_step(p);	 	
	}
	return o;
}

float softshadow( vec3 pos, vec3 light, float k )
{
    //ray origin is shading point
    //ray direction is shading point to light position
    vec3 rd = light-pos;
    float max_dist = length(rd);
    rd = normalize(rd);
    float res = 1.0;
    float h = 0.0;
    float t = 0.001;
    for(int i=0;i<32;i++)
    {
        h = march_step(pos + rd*t).x;
        if( h<0.001 )
            return 0.0;
        res = min( res, k*h/t );
        t += h;
	if (t >= 1.0) {
	    break;
	}
    }
    return res;
}

vec3 gen_eye(float t){
	vec3 o = vec3(0,0,0);
	o.x = cos(t/2.0)*2.0;
	o.y = t;
	o.z = sin(t/2.0)*2.0;
	return o;
}

void main( void ) {
	
	vec3 up = vec3(0.0, 1.0, sin(time)*2.0);
	vec3 lookat = gen_eye(time+1.2); //vec3(0.0, 0.0, 0.0);
	vec3 eye = gen_eye(time); //vec3(CELL_SIZE/2.0, 0.0, 2.0);
	//vec3 eye = vec3(sin(time)+6.0, 10.0+cos(time)*2.0, sin(time)*2.0);
	vec3 light = eye+vec3(sin(time)*4.0, cos(time)*4.0, 0.0);
	
	
	#ifndef FISH_EYE
	float fov = 90.0;
	vec3 vp_ray = camera(eye, lookat, up, fov);	
	#else
	float fov = 80.0;
	vec3 vp_ray = camera_fish(eye, lookat, up, fov);	
	#endif
	

	
	vec3 color = vec3(0.0, 0.0, 0.0);
	
	float min_depth = 0.0;
	float max_depth = 20.0;	
	int max_steps = 64;
	float eps = 0.005;
	float f = min_depth;
	
	vec3 p = vec3(0,0,0);
	
	vec2 o = ray_march(eye, vp_ray, eps, min_depth, max_depth, p, f);	
	
	if(o.y!=-1.0){      
		if (o.y == BOX){
			color = vec3(0.1, 0.5, 0.2);
	  	}
		else if(o.y == BARS){
			color = vec3(0.9,0.9,0.9);
			
		}	
		else if(o.y == BOLTS){
			color = vec3(0.1,0.3,0.5);

		}		
		else if(o.y == GREEN_OCTA){
			color = vec3(0.0, 1.0, 0.0);
		}
		else if(o.y == ORANGE_OCTA){
			color = vec3(1.0, 0.6, 0.0);
		}
		
	  	else{
           		color = vec3(0.3, 0.1, 0.2);
          	}	  
		
	   	vec3 n = normal(o.x, p);
           	float b=dot(n, normalize(light-p));
		float light_value = softshadow(p, light, 16.0);
	   	color =vec3((b*color+pow(b,5.0))*light_value);//simple phong
		color = color*(1.0-(f/max_depth));
		
		//float a_o = ao(p, n);
		//color = color*a_o;
		
		if(o.y == ORANGE_OCTA || o.y == GREEN_OCTA){
			light = p+5.0*(vp_ray);
			eye = p-0.01*n; //step inside the object			
			vec3 ray = normalize(light - eye);
			if(dot(n,ray)>0.0)
				ray = -ray;
			vec3 q = p;
			f = 0.0;
			for(int i=0;i<64;i++){
				march_step_(p, o);
				if(o.x>=-0.01)
					break;
				o.x = -1.0*o.x;
				f = f+o.x;				
				p = eye+f*ray;
			}
			if(f>0.01){
				f = 1.0+1.0/(f);
				color *= f;
			}	
		}
	 }
		
	color = color * max(1.0-f*.04,0.1);
	//color = color * fog(eye, p);

	gl_FragColor = vec4( color, 1.0 );

}

