/*
 * Original shader from: https://www.shadertoy.com/view/MsffWr
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
//self: https://www.shadertoy.com/view/MsffWr
//cheerilee cutie mark flowers
//cartoon pony butt for reference: 
//https://vignette3.wikia.nocookie.net/mlp/images/3/3f/Cheerilee%27s_cutie_mark_S1E12.png/revision/latest?cb=20121118163857&format=original

//uncomment below line to show 2d distance fields, aso showing the polar modulo fold borders.
//#define showFract

#define tau 6.28318530718
//return cathesian of polar_modulo see: http://mercury.sexy/hg_sdf
float pModPolar(inout vec2 p,float t){float g=tau/t,a=atan(p.y,p.x)+g*.5,r=length(p),
 c=floor(a/g);a=mod(a,g)-g*.5;p=vec2(cos(a),sin(a))*r;if(abs(c)>=t*.5)c=abs(c);return c;}
//return polar coordinates of carthesian input
vec2 c2p(vec2 u){return vec2(length(u),atan(u.y,u.x));}
//return carthesian coordinates of polar input
vec2 p2c(vec2 u){return vec2(u.x*cos(u.y),u.x*sin(u.y));}
//#define r2(r) mat2(sin(r+vec4(1,0,0,-1)*asin(1.)))
//return distance of (p) to ray that starts at (0,0) and has direction (0,-1);
float ils(vec2 p){return mix(abs(p.y),length(p),step(0.,p.x));}
//rotate p (carthesian) by angle r (full rotation==tau): p=r(p,r);
#define r(p,r) (cos(r)*p+sin(r)*vec2(-p.y,p.x))
//r() with offset o;
//vec2 rOffset(vec2 p,float r,vec2 o){p-=o;return (cos(r)*p+sin(r)*vec2(-p.y,p.x))+o;}
//return vec3 range [0..1] of 3*8bit color picker values 3*[0..255]
vec3 bit82vec3(int r,int g,int b){return vec3(r,g,b)/255.;}
//return framed [u], adjusting aspect ratio, and centering to display.
vec2 frame(vec2 u){u/=iResolution.xy;u-=.5;
 u.x*=iResolution.x/iResolution.y;u*=2.;
 return u;}
//return brightness of eyes and mouth 
float eyes(vec2 w,float n){
 w=c2p(w);//we branch modify for one polar coordinate, therefore we must transform.
 if(n!=0.)w.y+=2.*n;//rotate whole faces, depenting by "slice"
 w.y+=.5*sin(iTime+n);//faces wiggle to sin() pebbles rotate to cos()
 w=p2c(w);
 w.x*=1.2;
 n=pModPolar(w,3.);//eyes and mouth are a 3fold , within 3fold flowers.
 w.x-=.14;
 w=c2p(w);
 w.y+=4.7;//(tricky transform cases to make "faces" look half decent, by rotating eyes)
 if(n==1.)w.y+=1.;if(n==0.)w.y-=1.;
 w=p2c(w);
 float blur=4./iResolution.y;
 //max(a,-b) of 2 distances (a,b) returns a distance that is ==(a NOT b)== crescent moon.
 #ifdef showFract
  return fract(max(length(w)-.08,-length(w-vec2(0,.04))+.1)*19.);}
 #else
 //return smoothstep(blur,-blur,max(length(w)-.1,0.));//debug Ooooooo-face
 return smoothstep(blur,-blur,max(length(w)-.08,-length(w-vec2(0,.04))+.1));}
 #endif
 
void mainImage(out vec4 O,in vec2 U){vec2 m=-frame(U);
 float blur=2./iResolution.y;
 m=r(m,3.);//rotate
 m.y+=.07;//offset
 float n=pModPolar(m,3.);//3 fold symmetry for 3 flowers
 m+=vec2(-.55-n*.055,.1+n*.1);//offset within 3fold; +n* -> 2 flowers are closer together
 #ifdef showFract
  float d=fract((length(m)-.25)*19.);//yellow flower circle distances.
 #else
  float d=smoothstep(blur,-blur,length(m)-.25);//yellow flower circle.
 #endif                                    
 m=r(m,.5*cos(iTime+n));//rotate whole flower
 float e=eyes(m,n);
 n=pModPolar(m,8.);//8fold symmetry for pebbles. 
 float p=ils(m-vec2(.31,0));//flower pebbles=distance to ray==infiniteLineSegment
 #ifdef showFract
  p=fract(p*19.);//pink flower pebbles distances
 #else
  p=smoothstep(blur,-blur,p-.11);//pink flower pebbles 
 #endif
 vec3 cBG=bit82vec3(195,111,160);//color background cheerilee cutiemark eye && mouth && body
 vec3 cYe=bit82vec3(247,244,177);//color yellow     cheerilee cutiemark circles
 vec3 cPi=bit82vec3(244,215,227);//color pink       cheerilee cutiemark pebbles
 vec3 r; 
 r=mix(cBG,cPi,p);//mix background with pink pebbles
 r=mix(r,cYe,d);//add yellow circles to mix
 #ifdef showFract
  r=mix(r,1.1*(1.-cBG),e);//add eyes and mouth to mix, tinted green
 #else
  r=mix(r,cBG,e);//add eyes and mouth to mix 
 #endif
 O=vec4(r,1);}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
