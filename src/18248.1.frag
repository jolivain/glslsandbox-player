

#ifdef GL_ES
//precision highp float;
precision mediump float;
#endif 

uniform float time;
varying vec2 surfacePosition;
   
#define ptpi 1385.4557313670110891409199368797 //powten(pi)
#define pipi  36.462159607207911770990826022692 //pi pied, pi^pi
#define picu  31.006276680299820175476315067101 //pi cubed, pi^3
#define pepi  23.140692632779269005729086367949 //powe(pi);
#define chpi  11.59195327552152062775175205256  //cosh(pi)
#define shpi  11.548739357257748377977334315388 //sinh(pi)
#define pisq  9.8696044010893586188344909998762 //pi squared, pi^2
#define twpi  6.283185307179586476925286766559  //two pi, 2*pi 
#define pi    3.1415926535897932384626433832795 //pi
#define sqpi  1.7724538509055160272981674833411 //square root of pi 
#define hfpi  1.5707963267948966192313216916398 //half pi, 1/pi
#define cupi  1.4645918875615232630201425272638 //cube root of pi
#define prpi  1.4396194958475906883364908049738 //pi root of pi
#define lnpi  1.1447298858494001741434273513531 //logn(pi); 
#define trpi  1.0471975511965977461542144610932 //one third of pi, pi/3
#define thpi  0.99627207622074994426469058001254//tanh(pi)
#define lgpi  0.4971498726941338543512682882909 //log(pi)       
#define rcpi  0.31830988618379067153776752674503// reciprocal of pi  , 1/pi  
#define rcpipi  0.0274256931232981061195562708591 // reciprocal of pipi  , 1/pipi 

vec3 rotate(vec3 vect, vec3 axis, float angle)
{
    //axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    float azs = axis.z * s; 
    float axs = axis.x * s;
    float ays = axis.y * s;
    float ocxy = oc * axis.x * axis.y; 
    float oczx = oc * axis.z * axis.x;
    float ocyz = oc * axis.y * axis.z;   
	    
    
    mat4 rm = mat4(oc * axis.x * axis.x + c, ocxy - azs, oczx + ays, 0.0,
                   ocxy + azs, oc * axis.y * axis.y + c, ocyz - axs, 0.0,		   
                   oczx -ays, ocyz + axs, oc * axis.z * axis.z + c,  0.0,
                   0.0, 0.0, 0.0, 1.0);
	
	return (vec4(vect, 1.0)*rm).xyz;
}


void main( void )
{

	float t = (rcpi*(time/pisq))+pi;
	vec2 pos = surfacePosition*pi;
	vec3 qAxis = normalize(vec3(sin(t*(prpi)), cos(t*(cupi)), cos(t*(hfpi)) ));
	vec3 wAxis = normalize(vec3(cos(t*(-trpi)), sin(t*(rcpi)), sin(t*(lgpi)) ));
	vec3 camPos = normalize(vec3(0.0, 0.0, 1.0))/(twpi+sin(t)*pi);
	camPos = rotate(camPos, qAxis, sin(t*lnpi)*pi)/pi;
	vec3 camTarget = vec3(0.0);
	vec3 camDir = normalize(camTarget-camPos);
	vec3 camUp  =normalize(vec3(0.0,1.0,0.0));
	camUp = rotate(camUp, camDir, sin(t*prpi)*pi);
    	vec3 camSide = cross(camDir, camUp);
	vec3 sideNorm=normalize(cross(camUp, camDir));
	vec3 upNorm=cross(camDir, sideNorm);
	vec3 worldFacing=(camPos + camDir);
	
    	float focus =pi+sin(t)*sqpi;
    	vec3 rayDir = normalize((worldFacing+sideNorm*pos.x + upNorm*pos.y - camDir*((focus))));

	float f=0.0;
	vec3 tv=vec3(0.0);
	vec3 acCol = sin(worldFacing);
	float len =0.0;
	for(float i=0.2; i<pi; i+=0.08)
	{
        	tv = rotate(worldFacing + (rayDir*(i)),normalize(reflect(wAxis*camDir,normalize(vec3(pos/pi,sin(t*rcpi)*pi)))),i*sin(i+time/pi));
		//tv = worldFacing + (rayDir*i);
		vec3 tvl =( cos(length(tv*hfpi))*sin(t+tv*pi));
		if((abs(tvl.x)<0.02 || abs(tvl.y)<0.02 || abs(tvl.z)<0.02))
		{
			tv=tv+(tvl/pi);
			tvl =( cos(length(tv*hfpi))*sin(t+tv*pi));
			len +=1.2+i;
			acCol += ((camPos + (rayDir*i)))/len;
			if((abs(tvl.x)<0.012 || abs(tvl.y)<0.012 || abs(tvl.z)<0.012))
			{
				
				acCol += ((worldFacing + (rayDir*i)))/len;
				break;
			}
			//break;
			
		}
		acCol += ((worldFacing - (rayDir*i)))/pipi;
		
	}
	
	acCol = ((acCol)- acCol/len)/2.;
	
	acCol*=acCol;
	
	gl_FragColor = vec4(acCol,1.0);
}

