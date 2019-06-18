#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//#define TOP_VIEW
//#define MOUSE_CONTROL

#define RAYMARCH_STEPS 64
#define RAYMARCH_LIGHT_STEPS 64
#define EPSILON 0.01
#define PI 3.1415

vec3 CAMERA_POS = vec3(0.);
#ifdef TOP_VIEW
#define CAMERA_ROT 0.5
#else
#define CAMERA_ROT 0.35
#endif

vec3 CAMERA_TARGET = vec3(0., 0.2, 0.);

vec3 LIGHT_POS = vec3(0.);
float LIGHT_LENGTH = 9.;
vec3 SKY_COLOR=vec3(0.00, 0.0, 0.00);
vec3 LIGHT_COLOR=vec3(0.9, 0.8, 0.5);

#ifdef TOP_VIEW
float LIGHT_BALL_RADIUS=0.1;
#else
float LIGHT_BALL_RADIUS=0.1;
#endif
float LIGHT_BRIGHTNESS=10.;

struct Surface {
	vec3 color;
	float shadow;
	float ao;
};

struct Hit {
	vec3 p;
	vec3 normal;
	Surface s;
	bool touched;
	float raymarch_steps;
};

struct Ray {
	vec3 origin;
	vec3 direction;
};


struct Camera{
	vec3 position;
	vec3 lookAt;
	vec3 rayDir;
	vec3 forward, up, left;
};



float rand(vec2 n){
    return fract(sin(n.x + n.y * 1e3) * 1e5);
}

float rand(vec3 n){
    return fract(sin(n.x + n.y * 1e3 + n.z * 1e4) * 1e5);
}

vec2 rotate(vec2 p, float angle){
	return vec2(p.x*cos(angle)-p.y*sin(angle), p.y*cos(angle)+p.x*sin(angle));
}


float sdBox(vec3 p, vec3 box_pos, vec3 b){
	vec3 d = abs(p - box_pos) - b;
  	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float sdSphere(vec3 p, vec3 sphere_pos, float r){
	return distance(p, sphere_pos)-r;
}

float opUnion(float d1, float d2){
	return min(d1, d2);
}



float sdSphere(vec3 p, float r){
	return length(p)-r;
}
float sdDisc(vec2 p, float r){
	return length(p)-r;
}

float opU(float a, float b){
	return min(a, b);
}

float opI(float a, float b){
	return max(a, b);
}

float opS(float a, float b){
	return max(a, -b);
}
float sdBox(vec3 p, vec3 b){
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float sdRectangle(vec2 p, vec2 b){
	vec2 d = abs(p) - b;
	return min(max(d.x, d.y),0.0) + length(max(d,0.0));
}

bool computing_light=false;
float de(vec3 p){
	float d = -sdBox(p-vec3(0., 10., 0.), vec3(5., 10., 5.));
	vec3 alt_p=p;
	alt_p.xz=mod(alt_p.xz, vec2(1.5, 1.5))-vec2(.75, .75);
	d=min(d, sdSphere(alt_p-vec3(0., .2, 0.), .2));

	return d;
}


void raymarch(Ray light_ray, out Hit result){
	result.p=light_ray.origin;

	float d;
	for(int n=0; n<RAYMARCH_STEPS; n++){
		d=min(de(result.p), sdSphere(result.p-LIGHT_POS, LIGHT_BALL_RADIUS));
		result.p+=.6*d*light_ray.direction;
		if(d<=EPSILON){
			result.touched=true;
			result.raymarch_steps=float(n);
			return;
		}
		if(distance(result.p, LIGHT_POS)>LIGHT_LENGTH*2.){
			break;
		}
	}
	result.touched=false;
	result.raymarch_steps=float(RAYMARCH_STEPS);
}

void raymarch_alt(Ray light_ray, out Hit result){
	result.p = light_ray.origin;
	float d;
	float last_d = 0.;
	float best_d = 100.;
	float current_k = 1.6;
	for(int n = 0; n < RAYMARCH_STEPS ; n++){
		d = min(de(result.p), sdSphere(result.p-LIGHT_POS, LIGHT_BALL_RADIUS));
		if(last_d*current_k>last_d+d){ // Circles don't overlap
			result.p-=light_ray.direction*last_d*.6;
			current_k = 1.;
		} else {
			last_d = d;
			result.p+=light_ray.direction*d*current_k;
			if(d < EPSILON){
				result.touched=true;
				result.raymarch_steps=float(n);
			}
		}
	}
}
float raymarch_light(Ray light_ray, float mint, float maxt, float k ){
    float res = 1.0;
	float t=mint;
	for(int n=0; n<RAYMARCH_LIGHT_STEPS; n++){
		float h = de(light_ray.origin + light_ray.direction*t);
		if( h<EPSILON*.1){
			return 0.0;
		}
		res = min( res, k*h/t );
		t += h;
		if(t > maxt){
			break;
		}
	}
	return res;
}

void compute_camera(vec2 uv, out Camera result){
	result.lookAt = CAMERA_TARGET;
	result.position = CAMERA_POS;
	result.up = vec3(0., 1., 0.);
	result.forward = normalize(result.lookAt-result.position);
	result.left = cross(result.forward, result.up);
	result.up = cross(result.left, result.forward);
}

void compute_ray(vec2 uv, Camera cam, out Ray result){
	#ifdef TOP_VIEW
	vec3 screenOrigin = (cam.position+cam.forward*.08);
	#else
	vec3 screenOrigin = (cam.position+cam.forward);
	#endif

	vec3 screenHit = screenOrigin + uv.x*cam.left + uv.y*cam.up;

	cam.rayDir = normalize(screenHit-cam.position);
	result.origin=CAMERA_POS;
	result.direction=cam.rayDir;

}

void compute_normal(inout Hit result){
	vec2 off=vec2(0., EPSILON*.5);
  	vec3 n;
  	n.x = de(result.p+off.yxx);
  	n.y = de(result.p+off.xyx);
  	n.z = de(result.p+off.xxy);
	n = n-de(result.p);
  	result.normal=normalize(n);
}
float compute_ambiant_occlusion( in Hit result)
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  result.normal * hr + result.p;
        float dd = de( aopos );
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 2.*occ, 0.0, 1.0 );
}
void compute_surface(Ray light_ray, inout Hit result){
	if(!result.touched){
		result.s.color=SKY_COLOR;
		result.s.shadow=0.;
		return;
	}
	if(distance(result.p, LIGHT_POS)<LIGHT_BALL_RADIUS+EPSILON){
		result.s.color=LIGHT_COLOR*2.;
		result.s.shadow=1.;
		return;
	}

	result.s.ao=compute_ambiant_occlusion(result);

	if(result.p.y<EPSILON){
		result.s.color = .1*mix(vec3(0.5, 0.5, 0.5), vec3(1., 1., 1.), step(0.0, (cos(result.p.x*3.*3.1415)*cos(result.p.z*3.*3.1415))));
	} else {
		result.s.color=.1*mix(vec3(1.), result.normal, .5);
	}

		result.s.color=mix(result.s.color, vec3(.9, .7, .3)*(.5+.5*cos(result.p.x*50.)*cos(result.p.y*50.)*cos(result.p.z*50.)), .2*(1.-result.s.ao));

	Ray ray_to_light = Ray(result.p, normalize(LIGHT_POS-result.p));

	if(dot(ray_to_light.direction, result.normal)<0.){
		result.s.shadow=1.;
	} else {
		ray_to_light.origin+=ray_to_light.direction*EPSILON;
		computing_light=true;
		result.s.shadow=raymarch_light(ray_to_light, 0., distance(result.p, LIGHT_POS), LIGHT_LENGTH);
		computing_light=false;
	}
	result.s.shadow*=smoothstep(0.0, .15, dot(ray_to_light.direction, result.normal));
	result.s.shadow=mix(result.s.shadow, 1., .15);
	result.s.shadow*=clamp(1.-smoothstep(0., LIGHT_LENGTH, distance(result.p, LIGHT_POS)), 0., 1.);
	result.s.shadow*=result.s.ao;
	result.s.shadow*=LIGHT_BRIGHTNESS;
	result.s.color*=LIGHT_COLOR*result.s.shadow;

}

vec3 compute_mouse_hit(){
	vec2 mouse_on_uv = mouse;
	mouse_on_uv-=vec2(.5);
	mouse_on_uv.x*=resolution.x/resolution.y;


	Camera cam;
	Ray view_ray;
	Hit ray_hit;
	compute_camera(mouse_on_uv, cam);
	compute_ray(mouse_on_uv, cam, view_ray);
	computing_light=true;
	raymarch_alt(view_ray, ray_hit);
	computing_light=false;
	return ray_hit.p;
}
void main( void ) {
	#ifdef TOP_VIEW
	CAMERA_POS = vec3(0., 10., 0.)+1.*vec3(cos(PI*CAMERA_ROT), 0., sin(PI*CAMERA_ROT));
	#else
	CAMERA_POS = vec3(0., 2., 0.)+4.5*vec3(cos(PI*CAMERA_ROT), 0., sin(PI*CAMERA_ROT));
	#endif
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	uv-=vec2(.5);
	uv.x*=resolution.x/resolution.y;
	#ifdef MOUSE_CONTROL
	LIGHT_POS=compute_mouse_hit()+vec3(0., 1., 0.);
        #else
        LIGHT_POS=vec3(cos(time*.1)*4., 1.0, sin(time*.2)*4.);
	#endif
	Camera cam;
	Ray view_ray;

	compute_camera(uv, cam);
	compute_ray(uv, cam, view_ray);
	Hit ray_hit;

	raymarch_alt(view_ray, ray_hit);

	compute_normal(ray_hit);
	compute_surface(view_ray, ray_hit);

	vec3 color = ray_hit.s.color;
	color=clamp(color, vec3(0.), vec3(1.));
	color=pow( color, vec3(1.0/2.2) );
	gl_FragColor = vec4( color , 1.0 );

}
