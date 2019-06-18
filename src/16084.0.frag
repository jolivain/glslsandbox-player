#ifdef GL_ES
precision highp float;
#endif

// Simple Mandelbulb - by @SyntopiaDK
// (The camera code and lightning was taken from an example by @mrdoob)

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
float PI=3.14159265;
#define Power 8.0
#define Bailout 4.0

void powN1(inout vec3 z, float r, inout float dr) {
	// extract polar coordinates
	float theta = acos(z.z/r);
	float phi = atan(z.y,z.x);
	float power = Power*cos(time*0.001+length(mouse));
	dr =  pow( r, power-1.0)*power*dr + 1.0 + pow((1.-cos(time*.3)*cos(time*.2)), -2.5);
	
	// scale and rotate the point
	float zr = pow( r,power);
	theta = theta*power;
	phi = phi*power;
	
	// convert back to cartesian coordinates
	z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
}


// Compute the distance from `pos` to the Mandelbox.
float DE(vec3 pos) {
	vec3 z=pos;
	float r;
	float dr=1.0;
	r=length(z);
	for(int i=0; (i < 5); i++) {
		powN1(z,r,dr);
		z+=pos;
		r=length(z);
		if (r>Bailout) break;
	}
	
	return 0.5*log(r)*r/dr;
}

vec3 DEColor(vec3 pos) {
	vec3 z=pos;
	float r;
	float dr=1.0;
	r=length(z);
	float minR = 1000.0;
	for(int i=0; (i < 2); i++) {
		powN1(z,r,dr);
		z+=pos;
		r=length(z);
		minR = min(r,minR);
		if (r>Bailout) break;
	}
	float i = minR*minR*minR*minR*0.70;
	return vec3(clamp(i,0.0,1.0));
}


void main(void){
  vec2 vPos=-1.0+2.0*gl_FragCoord.xy/resolution.xy;

  //Camera animation
  vec3 vuv=vec3(0,1,0);//Change camere up vector here
  vec3 vrp=vec3(0,0,0); //Change camere view here
  float mx=mouse.x*PI*4.0;
  float my=mouse.y*PI*2.01;
  vec3 prp=vec3(cos(my)*cos(mx),sin(my),cos(my)*sin(mx))*2.0; //Trackball style camera pos
  

  //Camera setup
  vec3 vpn=normalize(vrp-prp);
  vec3 u=normalize(cross(vuv,vpn));
  vec3 v=cross(vpn,u);
  vec3 vcv=(prp+vpn);
  vec3 scrCoord=vcv+vPos.x*u*resolution.x/resolution.y+vPos.y*v;
  vec3 scp=normalize(scrCoord-prp);

  //Raymarching
  const vec3 e=vec3(0.0001,0,0);
  const float maxd=5.0; //Max depth
  float s=0.0;
  vec3 c,p,n;

  float f=0.0010;
  for(int i=0;i<512;i++){
    f+=s;
    p=prp+scp*f;
    s=DE(p);
     if (abs(s)<.000525||f>maxd) break;
   
  }
  
  if (f<maxd){
    n=normalize(
      vec3(s-DE(p-e.xyy),
           s-DE(p-e.yxy),
           s-DE(p-e.yyx)));
    c = DEColor(p);
    c.yz = mix(c.yz, n.yz, 0.3);
    float b=dot(n,normalize(prp-p));  
    gl_FragColor = mix(vec4((b*c+pow(b,16.0))*(1.0-f*.01),1.0), vec4(c,1.0),0.58);
  }
  else gl_FragColor=vec4(.9,.9,.9,1); //background color
}
