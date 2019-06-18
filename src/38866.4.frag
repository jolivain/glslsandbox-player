#ifdef GL_ES
precision highp float;
#endif

uniform vec2 resolution;
uniform float time;

//Scene Start
float hash(vec2 p)  
{
    p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
    return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
	
	vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

float mapH(in vec3 pos) 
{
    	float h = 0.0;
    	vec2 q = pos.xz * 0.1;
    	float s = 0.03;
    	for (int i = 0; i < 3; i++)
	{
        	q += vec2(i)+time*0.3;
        	h += s * noise(q);
    	}
    	return pos.y + h * 58.0;
}

//Floor
vec2 obj0(in vec3 pos) 
{
    	return vec2(min(mapH(pos), 1.),0.);   
}


//Floor Color (checkerboard)
vec3 obj0_c(in vec3 p){
 if (fract(p.x*.15)>.5)
   if (fract(p.z*.15)>.5)
     return vec3(0.2,0.2,0.7);
   else
     return vec3(0.3,0.3,0.7);
 else
   if (fract(p.z*.15)>.5)
     return vec3(0.3,0.3,0.7);
   else
     	return vec3(0.2,0.2,0.7);
}

//Scene End

void main(void){
  vec2 vPos=-1.0+2.0*gl_FragCoord.xy/resolution.xy;

  //Camera animation
  vec3 vuv=vec3(0,2,sin(time*0.1));//Change camere up vector here
  vec3 prp=vec3(-sin(time*0.6)*16.0+time,7,cos(time*0.4)*16.0+time); //Change camera path position here
  vec3 vrp=vec3(40.+time,-45,20.+time); //Change camere view here


  //Camera setup
  vec3 vpn=normalize(vrp-prp);
  vec3 u=normalize(cross(vuv,vpn));
  vec3 v=cross(vpn,u);
  vec3 vcv=(prp+vpn);
  vec3 scrCoord=vcv+vPos.x*u*resolution.x/resolution.y+vPos.y*v;
  vec3 scp=normalize(scrCoord-prp);

  //Raymarching
  const vec3 e=vec3(0.1,0,0);
  const float maxd=80.0; //Max depth

  vec2 s=vec2(0.1,0.0);
  vec3 c,p,n;

  float f=1.0;
  for(int i=0;i<86;i++){
    if (abs(s.x)<.01||f>maxd) break;
    f+=s.x;
    p=prp+scp*f;
    s=obj0(p);
  }
  
  if (f<maxd){
    if (s.y==0.0)
      c=obj0_c(p);
    n=normalize(
      vec3(s.x-obj0(p-e.xyy).x,
           s.x-obj0(p-e.yxy).x,
           s.x-obj0(p-e.yyx).x));
    float b=dot(n,normalize(prp-p));
    gl_FragColor=vec4(b*c*(2.0-f*.02),1.0);
  }
  else gl_FragColor=vec4(0,0.2,0.7,1); //background color
}

