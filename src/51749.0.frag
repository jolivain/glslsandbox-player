/*
 * Original shader from: https://www.shadertoy.com/view/WdlGRB
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
////////////////////////////////////////
// WHAT THE FUCK IS THE SHADER SHOWDOWN?

// The "Shader Showdown" is a demoscene live-coding shader battle competition.
// 2 coder battle for 25 minutes making a shader from memory on stage. 
// The audience votes for the winner by making noise or by voting on their phone.
// Winner goes through to the next round until the final where champion is crowned.
// Live coding shader software used is BONZOMATIC made by Gargaj from Conspiracy:
// https://github.com/Gargaj/Bonzomatic

// Every tuesdays around 20:00 UK time I practise live on TWITCH.
// This is the result of session 002.

// COME SEE LIVE CODING EVERY TUESDAYS HERE: https://www.twitch.tv/evvvvil_

// evvvvil / DESiRE demogroup

//WANNA STOP THE FUCKING MADNESS AND LOOK AT THE GEOMETRY BETTER??? COMMENT THIS LINE BROSKI:
#define MADNESS

vec2 sc=vec2(0.),e=vec2(.00035,-.00035);float t=0.,tt=0.,goFuckinMad=0.0;vec3 np;

//Cheap box function bullshit, distilling some of IQ's brain so I can play god
float mx(vec3 p){return max(max(p.x,p.y),p.z);}
float bo(vec3 p,vec3 r){return mx(abs(p)-r);}

//Fucking bits function which make the the fucking bit/piece
vec2 fb( vec3 p )
{
  vec2 h,t=vec2(bo(p,vec3(1)),521);
  h=vec2(bo(p,vec3(.5,.5,2.5)),3);
  for(int i=0;i<4;i++){
    h.x=min(h.x,bo(p-vec3(-.75*float(i)*0.5+0.5,0,0),vec3(.1,3.5-float(i)*0.5,.1)));
  }
  t.x=max(t.x,-bo(p,vec3(.7,.7,2.5)));
  t.x=min(t.x,bo(abs(p)-vec3(.85,.85,0),vec3(0.1,0.1,2.5)));
  //This mixes h(blue shape) and t(grey shape). Get your fucking chunks in order broh, dont be a fucking mango
  t=(t.x<h.x)?t:h;
  return t;
}

//Simple 2d rotate function, nothing to see here, move along, find the shiny piece of candy
mat2 r2(float r) {return mat2(cos(r),sin(r),-sin(r),cos(r));}

//Map function / scene / Where the geometry is made. This fucker is centre stage broski
vec2 mp( vec3 p )
{
  vec2 t;
  p.xy*=r2((tt+sin(tt))*goFuckinMad);
  p.z=mod(p.z+tt*10.,50.)-25.;
  //np=new position. We double modulo the shit, abs-symetry-clone the fucker and bend it while we at it
  np=p; np.z=mod(np.z,25.)-12.5;
  for(int i=0;i<4;i++){
    np=abs(np)-vec3(4.4-cos(tt*0.1)*sin(tt)*1.5,0.9+sin(tt)*1.2,2);
    np.xy*=r2(.785*float(i)*(-2.8+sin(p.z*0.2+tt)*0.2));
  }
  t=fb(np); return t;
}

//Main raymarching loop with material ID flex
vec2 tr( vec3 ro, vec3 rd )
{
  vec2 h,t=vec2(.1);
  for(int i=0;i<128;i++){
    h=mp(ro+rd*t.x);
    if(h.x<.0001||t.x>60.) break;
    t.x+=h.x;
    //This extra line passes the material id
    t.y=h.y;
  }
  if(t.x>60.) t.x=0.;
  return t;
}

//Sky function stroking my god complex and drawing the fucking sky 
vec3 sky(vec3 rd){ return vec3(0.9,.8,.6)-clamp(rd.y,0.,.3);}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  #ifdef MADNESS
    goFuckinMad=1.0;
  #endif
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5; uv /= vec2(iResolution.y / iResolution.x, 1);//Boilerplate code building uvs by default in BONZOMATIC
  //Modulo time because I am god and I fucking decide how long this world lives (not really just stops it all getting fucking noisy)  
  tt=mod(iTime,100.);

  //Camera simple bullshit thing ro=ray origin, rd=ray direction, co=color, fo=fog colour, ld=light direction
  vec3 ro=vec3(0),rd=normalize(vec3(uv,0.5+(sin(tt)*1.5)*goFuckinMad));      
      
  vec3 co,fo,ld=normalize(vec3(.3,.5,-.5));
  //Setting up default background colour and fog colour
  co=fo=sky(rd);
  //Grabbing the fucking scene by shooting fuckin' rays, because I am god and I'm the kind of god that shoots fucking rays from his eyes
  sc=tr(ro,rd);
  //Stick scene geometry result in this shorter one char variable. Fast and fucking bulbous, get me?
  t=sc.x;  
  if(t>0.){
    //We hit some geometry so let's get the current position (po) and build some normals (no). Get building broh, grab a fucking shovel
    vec3 po=ro+rd*t,no=normalize(e.xyy*mp(po+e.xyy).x+e.yxy*mp(po+e.yxy).x+e.yyx*mp(po+e.yyx).x+e.xxx*mp(po+e.xxx).x),
    
    //LIGHTING MICRO ENGINE BROSKI 
        
    //Default albedo is grey because your life is fucking dull (al=albedo)
    al=vec3(.5);
    //Yo different material id? No way broski, change the fucking colours then broh! (al=albedo)
    if(sc.y<50.) al=vec3(.05,.15,.35);
    //dif = diffuse because I dont have time to cook torrance
    float dif=max(0.,dot(no,ld)),
    //ao = ambient occlusion, aor = ambient occlusion range
    aor=t/50.,ao=exp2(-2.*pow(max(0.,1.-mp(po+no*aor).x/aor),2.)),
    //spo=specular power, yeah it's dumb as it's 1, but if I had had time to type in noise function this would be a gloss map. Get over it broski
    spo=1.,
    //Fresnel blends the geometry in the background with some sort of gradient edge detection colouring mother fucker
    fresnel=pow(1.+dot(no,rd),4.);
    //Fake sub surface fucking scattering, sort of reverse ambient occlusion trick from tekf, big up tekf! https://www.shadertoy.com/view/lslXRj
    vec3 sss=vec3(.5)*smoothstep(0.,1.,mp(po+ld*0.4).x/0.4),
    //spec=specular again if had had time to type noise function this would be better
    spec=vec3(5)*pow(max(0.,dot(no,normalize(ld-rd))),spo)*spo/32.;
    //Ultimate final lighting result
    co=mix(spec+al*(0.8*ao+0.2)*(dif+sss),sky(rd),fresnel);
    //Add some fucking fog to blend it even more. Don't get even broh, get soft
    co=mix(co,fo,1.-exp(-.00001*t*t*t));
  }
  //Add some sort of tone mapping for cheap byte sized fuckers (not really god in the end then, hey? just some cheap byte sized fucker)
  fragColor = vec4(pow(co,vec3(0.45)),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
