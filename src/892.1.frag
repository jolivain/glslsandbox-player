#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;

//anony_gt

vec2 obj_0(in vec3 p)
{
  //obj repeating
  p.x=1.0;//sin(p.x)*cos(time);
  p.z=sin(p.z);
  p.y=sin(p.y);

/*
  	float sdSphere( vec3 p, float s )
		{
 	 	return length(p)-s;
		}
*/
  return vec2(length(p)- 1.01);
 }

//sphere with simple solid color
//vec3 obj1_c(in vec3 p)
//{
//	return sphere_color;
//}
vec3 obj_0c(in vec3 p){
 if (fract(p.x*.5)>.5)
   if (fract(p.z*.5)>.5)
     return vec3(0,0,0);
   else
     return vec3(1,1,1);
 else
   if (fract(p.z*.5)>.5)
     return vec3(1,1,1);
   else
     return vec3(0,0,0);
}


void main(void)
{
  vec2 vPos=-1.0+2.0*gl_FragCoord.xy/resolution.xy;

  //animate
  vec3 vuv=vec3(0,1,sin(time*0.1));//Change camere up vector here
  vec3 prp=vec3(sin(time*0.15)*2.0,sin(time*0.5)*2.0,cos(time*0.1)*8.0); //Change camera path position here
  vec3 vrp=vec3(0,0,1.); //Change camere view here


  //camera
  vec3 vpn=normalize(vrp-prp);
  vec3 u=normalize(cross(vuv,vpn));
  vec3 v=cross(vpn,u);
  vec3 vcv=(prp+vpn);
  vec3 scrCoord=vcv+vPos.x*u*resolution.x/resolution.y+vPos.y*v;
  vec3 scp=normalize(scrCoord-prp);

  //Raymarching
  //refine edge w .01
  const vec3 e=vec3(0.01,0,0);
  vec2 s=vec2(0.01,0.0);
  vec3 c,p,n;
  //clip
	float f=1.0;
	for(int i=0;i<256;i++)
	{
		if (abs(s.x)<.01||f>30.0) break;
		f+=s.x;
		p=prp+scp*f;
		s=obj_0(p);
	}
  //depth
	if (f<30.0)
	{
	

	c=obj_0c(p);
		
	const float n_er=0.01;
	float v1=obj_0(vec3(p.x+n_er,p.y-n_er,p.z-n_er)).x;
	float v2=obj_0(vec3(p.x-n_er,p.y-n_er,p.z+n_er)).x;
	float v3=obj_0(vec3(p.x-n_er,p.y+n_er,p.z-n_er)).x;
	float v4=obj_0(vec3(p.x+n_er,p.y+n_er,p.z+n_er)).x;
	n=normalize(vec3(v4+v1-v3-v2,v3+v4-v1-v2,v2+v4-v3-v1));
    
	float b=dot(n,normalize(prp-p));

    		//n=normalize(
		//vec3(s.x-obj1(p-e.xyy).x, s.x-obj1(p-e.yxy).x, s.x-obj1(p-e.yyx).x));
		//float b=dot(n,normalize(prp-p));
		gl_FragColor=vec4((b*c+pow(b,64.0))*(1.0-f*.05),1.);//simple phong LightPosition=CameraPosition
	}
	
  else gl_FragColor=vec4(0.,0.,0.,1.); //background color
}
