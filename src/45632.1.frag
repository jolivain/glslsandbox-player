/*
 * Original shader from: https://www.shadertoy.com/view/llBSWh
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
const float PI=3.14159265358979323846;

float speed=0.;
float value=0.;
float ground_x=0.;//1.0+0.05*cos(PI*speed*0.25);
float ground_y=0.;//1.0+0.05*sin(PI*speed*0.25);
float ground_z=0.;

vec2 rotate(vec2 k,float t)
	{
	return vec2(cos(t)*k.x-sin(t)*k.y,sin(t)*k.x+cos(t)*k.y);
	}

float scene1(vec3 p)
	{
	float dot_p=0.125;
	float dot_w=dot_p*0.625;
	float dot=length(mod(p.xyz,dot_p)-dot_p*0.5)-dot_w;
	float ball_p=1.0;
	float ball_w=ball_p*(0.6625-0.075*(1.0-value));
	float ball=length(mod(p.xyz,ball_p)-ball_p*0.5)-ball_w;
	float hole_w=ball_p*(0.625+0.0125*value);
	float hole=length(mod(p.xyz,ball_p)-ball_p*0.5)-hole_w;
	float hole2_p=0.125;
	float hole2_w=hole2_p*0.375;
	float hole2=length(mod(p.xyz,hole2_p)-hole2_p*0.5)-hole2_w;
	return max(max(dot,-mix(hole,hole2,0.5)),ball);
	}

void mainImage(out vec4 fragColor,in vec2 fragCoord)
	{
	speed=iTime*0.5;
	value=0.4+0.25*cos(PI*speed*0.125);
	ground_x=0.0;//1.0+0.05*cos(PI*speed*0.25);
	ground_y=0.0;//1.0+0.05*sin(PI*speed*0.25);
	ground_z=speed*(0.125+0.375);

	vec2 position=(fragCoord.xy/iResolution.xy);
	vec2 p=-1.0+2.0*position;
	vec3 vp=normalize(vec3(p*vec2(1.77,1.0),0.75)); // screen ratio (x,y) fov (z)
	//vp.yz=rotate(vp.yz,PI*0.125*sin(speed*0.5));	// rotation x
	//vp.zx=rotate(vp.zx,PI*0.125*sin(speed*0.5));	// rotation y
	vp.xy=rotate(vp.xy,speed*0.25);					// rotation z
	vec3 ray=vec3(ground_x,ground_y,ground_z);
	float t=0.0;
	const int ray_n=96;
	for(int i=0;i<ray_n;i++)
		{
		float k=scene1(ray+vp*t);
        if(abs(k)<0.002) break;
		t+=k*0.7;
		}
	vec3 hit=ray+vp*t;
	vec2 h=vec2(-0.1,0.1); // light
	vec3 n=normalize(vec3(scene1(hit+h.xyy),scene1(hit+h.yxx),scene1(hit+h.yyx)));
	float c=(n.x+n.y+n.z)*0.08+t*0.16;
	float color=-0.25*cos(PI*position.x*2.0)+0.25*sin(PI*position.y);
	fragColor=vec4(vec3((c*t+t)*0.5*value+color,c*1.5-t*0.025,c*1.25-t*0.0125*value-color)*c,1.0);
	}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
