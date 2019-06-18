/*
 * Original shader from: https://www.shadertoy.com/view/WsXGDs
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
// This is the result of session 004. 

// COME SEE LIVE CODING EVERY TUESDAYS HERE: https://www.twitch.tv/evvvvil_

// evvvvil / DESiRE demogroup

vec2 sc,e=vec2(.00035,-.00035);float t=0.,tt=0.;vec3 np=vec3(0.);

//Cheap box function bullshit, not my doings, another instance of stealing from IQ
float mx(vec3 p){return max(max(p.x,p.y),p.z);}
float bo(vec3 p,vec3 r){return mx(abs(p)-r);}

//Simple 2d rotate function, nothing to see here, move along, find the double-ended dildo
mat2 r2(float r) {return mat2(cos(r),sin(r),-sin(r),cos(r));}

//Fucking bits function which makes the the fucking bit/piece:
//Essentially the piece is a bunch of thin rectangles inside a bunch of cubes the total of which is much smaller than my dick
vec2 fb( vec3 p )
{
    vec2 h,t=vec2(bo(abs(p)-vec3(0,3,0),vec3(1,.8,1)),5);
    h=vec2(bo(abs(p)-vec3(0,2,0),vec3(1.2,.8,1.2)),3);
    h.x=min(bo(abs(abs(p)-vec3(.6,0,.6))-vec3(.3,0,.3),vec3(.1,20,.1)),h.x);
    t=(t.x<h.x)?t:h;
    return t;
}
//IQ/Shane's compact 3d noise function. If i can memorise your mum's dress size then i can memorise this
float noise(vec3 p){
    vec3 ip=floor(p);p-=ip;
    vec3 s=vec3(7,157,113);
    vec4 h=vec4(0,s.yz,s.y+s.z)+dot(ip,s);
    p=p*p*(3.-2.*p);
    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
    h.xy=mix(h.xz,h.yw,p.y);
    return mix(h.x,h.y,p.z);
}
//Sky because on the 7th day god told your mum to get off her fat ass and let there be light!
vec3 sky(vec3 rd,vec3 ld){ return vec3(1,.5,0)*pow(clamp(dot(rd,ld),0.,1.),128.)+vec3(.5,.6,.7)-rd.y*.2;}
//Map function / scene / Where the geometry is made. This fucker is like Richard Pryor after too much freebase.(on fire)
vec2 mp( vec3 p )
{
    //The technique is taking a piece of geometry modelled in fb function above and 
    //repeat, bend, twist the fuck outta it until we reach a concensus where every body is stoned and drinking tea.
    np=p;np.z=mod(np.z+tt*6.6,40.)-20.;
    //above line creates np=new position. Then we clone it over z axis with modulo.
    for(int i=0;i<9;i++){
        //enter the pseudo fractal bullshit (it's not that fancy trust me; wipe the ketchup off the chair and take a seat)
        //first we use symetry to create more geometry
        np=abs(np)-2.;
		//Then we rotate the fucker a bit
        np.xy*=r2(.785*float(i)*.5);
        //Shift the bitch again somehow it goes awol but wait for it...
        np-=-3.;
        //...We bring the fucker back with a twisterooney
        np.yz*=r2(.785*float(i));
        //Then again shift it into place with dumb as fuck pos offset
        np-=.785;
    }
    //Wait, what? more twisteroo but over time, because I wanna impress those middle aged ladies across the street...
    np.xy*=r2(.785*(3.+2.*clamp(sin(tt*.5),-.5,.5)));
    //Puffing up my chest now, they not looking... so check this fucking geom now that it's 8 times bigger with another symetry
    np=abs(np)-vec3(1,-1,3);
    //It's exhausting being handsome, but I always wanna be the cover of Men's Health Magazine...
    vec2 h,t=fb(np);
    //THIS TRICK! Take the whole black and yellow gemoetry, scales it, cos it, and presto we got some lovely white geometry
    //hugging it and it's all very snug without any fucking overlapping, it's a thing of fucking beauty I tell you.
    h=vec2(1.8*bo(cos(np*.4+.5),vec3(.2,.1,1)),6);
    //the +.5 above is nice trick to open up the geom and make sure it has hole in the middle to avoid colliding  with the camera
    //"Open up the geometry", "make a hole", I believe this time no need for extra lewd jokes, gotta be subtle sometimes, mother fucker.
    t=(t.x<h.x)?t:h;
    return t;
}

//Main raymarching loop with material ID flex, because your wife's yoga class is fucking lame, bro.
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
    uv -= 0.5; uv /= vec2(iResolution.y / iResolution.x, 1);//Boilerplate code building uvs by default in BONZOMATIC
    //Modulo time because everything's gotta fucking die one day, including your lazy cat (not really just stops it all getting fucking noisy)  
    tt=mod(iTime,100.);
    //Camera simple bullshit thing ro=ray origin, rd=ray direction, co=color, fo=fog colour, ld=light direction
   vec3 ro=vec3(0,0,-10),
    cw=normalize(vec3(sin(tt)*10.,cos(tt*.66)*3.,10.)-ro),
    cu=normalize(cross(cw,vec3(0,1,0))),
    cv=normalize(cross(cu,cw)),
    rd=mat3(cu,cv,cw)*normalize(vec3(uv,.4)),co,fo,ld=normalize(vec3(0.3,.5,-.3));
    //Setting up default background colour and fog colour 
    co=fo=sky(rd,ld);
    //Grabbing the fucking scene by shooting fuckin' rays, because we all want a laser gun for christmas.
    sc=tr(ro,rd);
    //Stick scene geometry result in this shorter one char variable. This time it's nice to finish fast.
    t=sc.x;  
  if(t>0.){
    //We hit some geometry so let's get the current position (po) and build some normals (no). Fun over, time for some fucking maths.
    vec3 po=ro+rd*t,no=normalize(e.xyy*mp(po+e.xyy).x+e.yxy*mp(po+e.yxy).x+e.yyx*mp(po+e.yyx).x+e.xxx*mp(po+e.xxx).x),
    
    //LIGHTING MICRO ENGINE BROSKI 
        
    //Default albedo is still yellow because you're still bitter and envious (al=albedo)
    al=vec3(1,.5,0);
	//THIS TRICK! Adds some detail to geometry by tweaking the normals. Adds sexyness, check the legs on this one.
	no*=(1.+.6*ceil(sin(np*2.)));no=normalize(no);
    //Different material id? Better get fucking painting then... Someone hold Vincent's absinth glass please (al=albedo)
    if(sc.y<5.) al=vec3(0);
    if(sc.y>5.) al=vec3(1);
    //dif = diffuse because I dont have time to cook torrance
    float dif=max(0.,dot(no,ld)),
    //ao = ambient occlusion, aor = ambient occlusion range
    aor=t/50.,ao=exp2(-2.*pow(max(0.,1.-mp(po+no*aor).x/aor),2.)),
    //spo=specular power, THIS TRICK is some fucking sweet gloss map generated from recursive noise function. Fuck yeah broski!
    spo=exp2(1.+3.*noise(np/vec3(.4,.8,.8)+noise((np+1.)/vec3(.1,.2,.2)))),
    //Fresnel blends the geometry in the background with some sort of gradient edge reflection colouring mother fucker
    fresnel=pow(1.+dot(no,rd),4.);
    //Fake sub surface fucking scattering, sort of reverse ambient occlusion trick from tekf, big up tekf! https://www.shadertoy.com/view/lslXRj
    vec3 sss=vec3(.5)*smoothstep(0.,1.,mp(po+ld*0.4).x/0.4),
    //spec=specular with the spo gloss map above, yeah broski, it's a thing of fucking beauty.
    spec=vec3(1)*pow(max(dot(reflect(-ld,no),-rd),0.),spo);
    //Ultimate final lighting result
    co=mix(spec+al*(0.8*ao+0.2)*(dif+sss),sky(rd,ld),fresnel);
    //Add some fucking fog to blend it even more, get soft and comfy, ride the sofa.
    co=mix(co,fo,1.-exp(-.00002*t*t*t));
  }
  //Add some sort of tone mapping... but just like vegatarian sausages: it's not the real deal.
  fragColor = vec4(pow(co,vec3(0.45)),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
