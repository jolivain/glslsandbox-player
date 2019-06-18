/*
 * Original shader from: https://www.shadertoy.com/view/3sjGDV
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);

// --------[ Original ShaderToy begins here ]---------- //

//Corona effect based on https://www.shadertoy.com/view/4dXGR4

float 	inner_radius=.22;
float 	outer_radius=.245;
float 	fov=.69; // not working in this version
float	zoom=1.8;

const float vol_steps=8.;
float 	vol_rot=1.5;
float 	vol_fade=.0;

float 	surf_scale=1.75;
const int surf_iterations=8;
vec3	surf_param_1=vec3(.6,.45,.6);
float	surf_param_2=1.19;
float	surf_param_3=0.48;
float 	surf_exp=2.3;
float	surf_base_value=.5;
float	surf_intensity=1.1;
float	surf_brightness=1.5;
float	surf_contrast=1.8;
float 	surf_rotation_speed=.15;
float 	surf_turbulence_speed=.03;

float 	cor_size=.3;
float 	cor_offset=.015;
const int cor_iterations=3;
float 	cor_iteration_fade=.0;
float 	cor_param_1=.24;
float 	cor_param_2=.3;
float 	cor_exp_1=1.07;
float 	cor_exp_2=0.95;
float 	cor_brightness=3.2;
float 	cor_speed=.125;
float 	cor_speed_vary=.4;

float	glow_intensity=7.;
float 	glow_size=.1;


vec3	color_1=vec3(.1,.2,.35);
vec3	color_2=vec3(.3,.2,.15);
float	color_saturation=0.6;
float	color_contrast=1.3;
float	color_brightness=0.45;


mat3 lookat(vec3 fw,vec3 up){
	fw=normalize(fw);vec3 rt=normalize(cross(fw,normalize(up)));return mat3(rt,cross(rt,fw),fw);
}

float sphere(vec3 p, vec3 rd, float r){
	float b = dot( -p, rd ), i = b*b - dot(p,p) + r*r;
	return i < 0. ?  -1. : b - sqrt(i);
}


mat2 rot(float a) {
    float si = sin(a);
    float co = cos(a);
    return mat2(co,si,-si,co);
}

float snoise(vec3 uv, float res) //by trisomie21
{
    const vec3 s = vec3(1e0, 1e2, 1e4);	
	uv *= res;	
	vec3 uv0 = floor(mod(uv, res))*s;
	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;	
	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);	
	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);	
	vec4 r = fract(sin(v*1e-3)*1e5);
	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);	
	r = fract(sin((v + uv1.z - uv0.z)*1e-3)*1e5);
	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);	
	return mix(r0, r1, f.z)*2.-1.;
}

float kset(vec3 p) { //by me :P
    p*=surf_scale*(1.+outer_radius);
    float m=1000.;
	for (int i=0; i<surf_iterations; i++) {
        float d=dot(p,p);
		p=abs(p)/d*surf_param_2-vec3(surf_param_1);
		m=min(m,abs(d-surf_param_3))*(1.+surf_param_3);
    }
    float c=pow(max(0.,1.-m)/1.,surf_exp);
	c=pow(c,surf_exp)*surf_exp*surf_intensity;
	return c; 
}


//stolen and mutated code
float cor(vec2 p) { 
	float ti=iTime*cor_speed*cor_param_1+200.;
    float d=length(p);
	float fad = (exp(-3.5*d)-outer_radius)/(outer_radius+cor_size);
    
    
    float v1 = fad;
	float v2 = fad;
	float angle = atan( p.x, p.y )/6.2832;
	float dist = length(p)*cor_param_1/fov;
	vec3 crd = vec3( angle, dist, ti * .1 );
    float ti2=ti+fad*cor_speed_vary*cor_param_1;
    float t1=abs(snoise(crd+vec3(0.,-ti2*1.,ti2*.1),15.));
	float t2=abs(snoise(crd+vec3(0.,-ti2*.5,ti2*.2),45.));	
    float it=float(cor_iterations);
    float s=1.;
	for( int i=1; i<=cor_iterations; i++ ){
		ti*=1.5;
        float pw = pow(1.5,float(i));
		v1+=snoise(crd+vec3(0.,-ti,ti*.02),(pw*50.*(t1+1.)))/it*s*.13;
		v2+=snoise(crd+vec3(0.,-ti,ti*.02),(pw*50.*(t2+1.)))/it*s*.13;
    }
	
	float co=pow(v1*fad,cor_exp_2)*cor_brightness;
	co+=pow(v2*fad,cor_exp_2)*cor_brightness;
	co*=1.-t1*cor_param_2*(1.-fad*.3);
    return co;
}


//messy code below
vec3 render(vec2 uv) {
    vec3 ro=vec3(0.,0.,1.);
    ro.xz*=rot(iTime*surf_rotation_speed);
    vec3 rd=normalize(vec3(uv,fov));
    rd.xy*=.8;
    rd=lookat(-ro,vec3(0.,1.,0.))*rd;
    float tot_dist=outer_radius-inner_radius;
	float st=tot_dist/vol_steps;
    float br=1./vol_steps;
    float tr=iTime*surf_rotation_speed;
	float tt=iTime*surf_turbulence_speed;
    float dist=0.;
    float c=0.;
    float dout=step(0.,sphere(ro, rd, outer_radius));
    float d;
    for (float i=0.; i<vol_steps; i++) {
        d=sphere(ro, rd, inner_radius+i*st);
        dist+=st;
        vec3 p = ro+rd*d;
        float a=vol_rot*i+tt;
        p.yz*=rot(a);
        p.xy*=rot(a);
        c+=kset(p)*br*step(0.,d)*max(0.,1.-smoothstep(0.,tot_dist,dist)*vol_fade);
    }
	c+=surf_base_value;    
    vec3 col=1.*mix(color_1, color_2, vec3(c))*c;
    inner_radius*=fov;
    outer_radius*=fov;
    glow_size*=fov;
    cor_size*=fov;
    float cor=cor(uv);
    float r1=inner_radius;
    float r2=outer_radius;
    float l=smoothstep(r1-cor_offset,r2, length(uv));
    float rt=outer_radius+glow_size;
    float sw=1.-smoothstep(0.,rt,length(uv));
    col=min(vec3(5.),pow(col,vec3(surf_contrast))*surf_brightness*surf_contrast);
    col+=cor*color_1*l+sw*color_2*glow_intensity;
    col=mix(vec3(length(col)), col, color_saturation)*color_brightness;
    return pow(col,vec3(color_contrast));
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy-.5;
	uv.x*=iResolution.x/iResolution.y;
    uv.x+=cos(iTime*.178924387342)*.1;
    zoom*=1.+sin(iTime*.2)*.2;
	vec3 col = render(uv/zoom);
    col=pow(col,vec3(1.5))*vec3(1.1,1.,1.);
    fragColor = vec4(col,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
