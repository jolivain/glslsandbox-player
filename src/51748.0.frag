/*
 * Original shader from: https://www.shadertoy.com/view/3dsGzS
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
// This is the result of session 001.

// COME SEE LIVE CODING EVERY TUESDAYS HERE: https://www.twitch.tv/evvvvil_

// evvvvil / DESiRE demogroup
// (Apologies for the lack of comments, next sessions will be commented...)

vec2 sc=vec2(0.),e=vec2(.00035,-.00035);float t=0.,tt=0.; vec3 newPos;

float mx(vec3 p){return max(max(p.x,p.y),p.z);}
float bo(vec3 p,vec3 r){return mx(abs(p)-r);}

vec2 fb( vec3 p)
{
  vec2 h,t=vec2(.8*bo(p,vec3(1,.5,6)),5);
  t.x=min(t.x,.8*bo(p-vec3(1,0,0),vec3(.2,1,1.5)));
  t.x=min(t.x,.8*bo(p+vec3(1,0,0),vec3(.2,1,1.5)));
  h=vec2(.8*bo(abs(p)-vec3(.25,0,1.7),vec3(.15,1,1.4)),3);
  t=(t.x<h.x)?t:h;
  return t;
}

mat2 r2(float r){ return mat2(cos(r),sin(r),-sin(r),cos(r));}

vec2 mp( vec3 p)
{
  vec2 t;
  p.z=mod(p.z+tt*10.,50.)-25.;//clones it along z
  p.yx*=r2(sin(p.z*0.05+tt)*2.);//rotate it along z
  newPos=p;
  newPos.z=mod(p.z+tt*10.,25.)-12.5;
  float att=clamp(length(p)-1.5,3.,13.);
  for(int i=0;i<4;i++){
    newPos=abs(newPos)-vec3(0.5+att*0.3,0.5+att*0.1,2);
    newPos.yx*=r2(abs(cos(p.z*0.05*float(i))));
  }
  t=fb(newPos);
  t.x=max(t.x,bo(p,vec3(15,15,23)));
  return t;
}

vec2 tr( vec3 ro,vec3 rd )
{
  vec2 h,t=vec2(.1);
  for(int i=0;i<128;i++){
    h=mp(ro+rd*t.x);
    if(h.x<.0001||t.x>60.) break;
    t.x+=h.x;t.y=h.y;
  }
  if(t.x>60.) t.x=0.;
  return t;
}

float noise(vec3 p){
  	vec3 ip=floor(p);p-=ip; 
    vec3 s=vec3(7,157,113);
    vec4 h=vec4(0.,s.yz,s.y+s.z)+dot(ip,s);
    p=p*p*(3.-2.*p); 
    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
    h.xy=mix(h.xz,h.yw,p.y);
    return mix(h.x,h.y,p.z); 
}

vec3 sky(vec3 rd){return clamp(vec3(.4,.4,.5)-rd.y*.3,0.,1.);}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  tt=mod(iTime,100.);
  vec3 ro=vec3(0,0,-10),
  cw=normalize(vec3(sin(tt)*10.,0,cos(tt)*3.)-ro),
  cu=normalize(cross(cw,vec3(0,1,0))),
  cv=normalize(cross(cu,cw)),
  rd=normalize(mat3(cu,cv,cw)*vec3(uv,.5)),
  co,fo,ld=normalize(vec3(-.3,0,.3));co=fo=sky(rd);
  sc=tr(ro,rd);t=sc.x;

  if(t>0.){
    vec3 po=ro+rd*t,
    no=normalize(e.xyy*mp(po+e.xyy).x+
    e.yyx*mp(po+e.yyx).x+
    e.yxy*mp(po+e.yxy).x+
    e.xxx*mp(po+e.xxx).x),al=vec3(.5);
    if(sc.y<5.) al=vec3(1,.5,0);
    //LIGHTING MICRO ENGINE
    float dif=max(0.,dot(no,ld)),
    aor=t/50.,
    ao=exp2(-2.*pow(max(0.,1.-mp(po+no*aor).x/aor),2.)),
    spo= exp2(5.0+3.0*noise(newPos/vec3(.2,.4,.6))),
    fresnel=pow(1.+dot(no,rd),4.);
    vec3 sss=vec3(.5)*smoothstep(0.,1.,mp(po+ld*0.4).x/0.4),
    spec=vec3(2)*pow(max(0.,dot(no,normalize(ld-rd))),spo)*spo/32.;
    co=mix(spec+al*(0.8*ao+.2)*(dif+sss),sky(rd),fresnel);
    co=clamp(co,0.,1.);
    co=mix(co,fo,1.-exp(-.00002*t*t*t));
  }
  fragColor = vec4(pow(co,vec3(0.45)),1);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
