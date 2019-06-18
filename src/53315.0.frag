/*
 * Original shader from: https://www.shadertoy.com/view/wssXWl
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
////////////////////////////////////////////////////////////////////////////////
//"The gamma ray feast" - Shader Showdown practice session 011

// WHAT THE FUCK IS THE SHADER SHOWDOWN?
// The "Shader Showdown" is a demoscene live-coding shader battle competition.
// 2 coders battle for 25 minutes making a shader from memory on stage. 
// The audience votes for the winner by making noise or by voting on their phone.
// Winner goes through to the next round until the final where champion is crowned.
// Live coding shader software used is BONZOMATIC made by Gargaj from Conspiracy:
// https://github.com/Gargaj/Bonzomatic

// Every tuesdays around 21:00 UK time I practise live on TWITCH. This is the result of session 011.

// COME SEE LIVE CODING EVERY TUESDAYS HERE: https://www.twitch.tv/evvvvil_

// evvvvil / DESiRE demogroup

// "Science in my day was fucking weldin' fucking ships together, and sending them to the fucking sea" - Limmy (The armadillo sketch)

vec2 sc,y,e=vec2(.000035,-.000035);float t,tt=0.,b,bb=0.,g1=0.,g2=0.;vec3 np,bp;//Some fucking globals, about as exciting as a vegetarian sausage
float bo(vec3 p,vec3 r){vec3 q=abs(p)-r;return max(max(q.x,q.y),q.z);}//box function stolen from UNC because Russian is math.
float cy(vec3 p,float r){p.y=0.;return length(p)-r;}//Did you know you could make an infinite cylinder by taking a sphere and making an axis 0? 
float cz(vec3 p,float r){p.z=0.;return length(p)-r;}//Did you know you could ... I just fucking told you, didn't I? Pay attention this isn't your ex's nitting class
mat2 r2(float r){return mat2(cos(r),sin(r),-sin(r),cos(r));}//Simple rotate function, it is useful as fuck and short. Bit like the key to your ex girlfriend's dad's tool shed
vec2 fb(vec3 p,vec3 m, float s)//Fucking bits function which makes the fucking bit/piece it is a base shape which we clone and repeate to create the whole geometry in mp function
{
  p.xz*=r2(s);//constantly giving it a little shake, like a juicing diet but without the pretention or the juices
  p.xy*=r2(s+bb*1.4);//Every so often we flip the fuck outta everything, it's like those brexit promises that got flipped into nothingness
  vec2 h,t=vec2(bo(abs(p)-vec3(0,0,1),vec3(2.2,0.3,0.7)),m.x);//set the tone make a bunch of fucking boxes with abs symetry cloning
  t.x=min(0.6*cy(abs(abs(p)-vec3(0.5,0,0))-vec3(0.5,0,1),0.1),t.x);//Erecting major fucking poles, because it's not a good shader if it doesn't have sexual innuendo
  if(m.x<6.) g2+=0.1/(0.1+pow(abs(t.x),2.));//glow trick by Balkhan, we pass the distance field of shape to g2 glow variable which we gonnu add to light at end
  h=vec2(bo(abs(p)-vec3(0,0,1),vec3(2.0,0.5,0.5)),m.y);//More fucking boxes, double outline grapphitti style mother fucker, "yeah I come from the streets". Not really, i was born in a hospital
  t=(t.x<h.x)?t:h;//Blending two shapes while retinaing material ID, like a melting headbutt with colours punched in the face
  h=vec2(bo(p,vec3(1.8,0.2,2.8)),m.z);//yet more fucking boxes, this time white one for structure and comfort, take off your shoes broski, we share slipers here. Gross, yes, but at least we're family
  t=(t.x<h.x)?t:h;//Blending two shapes while retinaing material ID, like a melting headbutt with colours punched in the face
  t.x*=0.7;//bit more definition so we avoid artifact, i like my shaders looking good, well at least handsome, because cute is for puppies.
  return t;
}
float noise(vec3 p){//Noise function stolen from Virgil who stole it from Shane who I assume understands this shit, unlike me who is too busy throwing toilet paper at my math teacher's house
  vec3 ip=floor(p),s=vec3(7,157,113);
  p-=ip; vec4 h=vec4(0,s.yz,s.y+s.z)+dot(ip,s);
  p=p*p*(3.-2.*p);
  h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
  h.xy=mix(h.xz,h.yw,p.y);
  return mix(h.x,h.y,p.z);
}
vec2 mp( vec3 p ) //This is the main MAP function where all geometry is made/defined. It's centre stage broski, bit like someone drunk at a funeral
{//Technique is to make a new position np and tweak it, clone it, rotate it and then pass np to fb to create complex geometry from simple piece
  b=sin(p.z-tt*10.)*0.1;//animation variable based on sin of z axis
  np=p;//new position is set to original position
  for(int i=0;i<5;i++){//In the loop we push, rotate np into more complex "position"
    np=abs(np)-vec3(2.5,1.7,0);//symetry clone the fucker out
    np.xy*=r2(cos(p.y*0.05)*0.5);//rotate the bitch along xy axis
    np.xz*=r2(20.);//and again mega rotate the whole shit along xz so it looks symetrical
  }
  vec2 h,t=fb(np,vec3(5,3,6),b);//push np to fucking bit function to make complex geometry base don single piece, like flipping a coin in the air and getting a gram of coke back!
  bp=np;bp.yz*=r2(.785);bp=abs(bp*0.5)-vec3(3.2);//we make one more new position, called "bp" for the outter bits
  np.xz*=r2(b);//This line is to keep track of the final result of np as it's being rotated in fb function and we msut track it as w euse np for the gloss map further down
  np.xy*=r2(b+bb*1.4);//Same just keeping track of final np otherwise the  gloss map slides, like your ex when she is drunk and walking in high hells but without the ensuing hospital drama
  h=fb(bp,vec3(7,8,9),0.1);//this line makes outter bits using same fb function but with different position "bp" this time, making it totally different, nifty shit broski
  h.x*=2.0;//Outterb bits bp position is at different scale so we must adjust the distance field to avoid warpnig artefact
  t=(t.x<h.x)?t:h;//Blending the inner red/black/white bits with outter blue/black/white bits, bit like diplomacy really but with fun coloured stickers rather than corrupt politicians
  h=vec2(cz(p,0.5-b),8);//Make a fucking wobbly tube that glows, bit like a fat wobbly glow stick. Well fuck, i guess the metaphore is ironic, it's not the fucking nineties anymore.
  h.x=min(length(p)-6.+b,h.x);//Also make a glow sphere inside the inner bits, it is about feeding after all
  g1+=0.1/(0.1+pow(abs(h.x),2.));//glow trick by Balkhan, we pass the distance field of shape to g1 glow variable which we gonnu add to light at end
  t=(t.x<h.x)?t:h;//This again a colourful handshake between two shapes blending the glowy bits and rest
  return t;
}
vec2 tr( vec3 ro, vec3 rd )
{
  vec2 h,t=vec2(0.1);//Near plane because we all started as annoying little shits yeah, and nah, your kids aren't cute
  for(int i=0;i<128;i++){//Main loop de loop 
    h=mp(ro+rd*t.x);//Marching forward like any good fascist army: without any care for culture theft
    if(h.x<.0001||t.x>50.) break;//Don't let the bastards break you down!
    t.x+=h.x;t.y=h.y;//Remember the postion and the material id? Yeah let me hold your beer whil you hold my paint brush. Artist? Yes,...but albcoholic first
  }
  if(t.x>50.) t.x=0.;//If we've gone too far then stop, you know like Alexander The Great did when he realised he left his Iphone charger in Greece. (10 points whoever gets the reference)
  return t;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = vec2(gl_FragCoord.x / iResolution.x, gl_FragCoord.y / iResolution.y);
    uv -= 0.5;
    uv /= vec2(iResolution.y / iResolution.x, 1);//boilerplate code to get uvs in BONZOMATIC live coding software i use.
    tt=mod(iTime,100.);//MAin time variable, it's modulo'ed to avoid ugly artifact. Holding time in my hand: playing god is nearly as good as this crystal meth bag
  	bb=0.5+clamp(sin(tt),-0.5,0.5);//This is just animation variables used in mp or fb
    vec3 ro=vec3(cos(tt*0.5)*15.,sin(tt*0.5)*15.,-20),//Ro=ray origin=camera position because everything is relative to a view point, even your ex girlfriend's dubious taste in men
    cw=normalize(vec3(0)-ro),cu=normalize(cross(cw,vec3(0,1,0))),cv=normalize(cross(cu,cw)),
    rd=mat3(cu,cv,cw)*normalize(vec3(uv,.5)),//rd=ray direction (where the camera is pointing), co=final color, fo=fog color
    co,fo,ld=normalize(vec3(0,0.5,-0.5));//ld=light direction, light is in front a bit above to cheat light effect being lit from ray, whatever it works broh innit.
    co=fo=vec3(.04)*(1.-(length(uv)-.2));//By default the color fog color and it's pretty black with reverse vignette because I'm not scared of the dark anymore since getting revenge on my math teacher
    sc=tr(ro,rd);t=sc.x;//This is where we shoot the fucking rays to get the fucking scene. Like a soldier but with a pixel gun and less intentions to invade and pillage.
	
    if(t>0.){//If t>0 then we must have hit some geometry so let's fucking shade it. 
        //We hit some geometry so let's get the current position (po) and build some normals (no). You do the Maths while I make a jug of PIM's and drink it without you
        vec3 po=ro+rd*t,no=normalize(e.xyy*mp(po+e.xyy).x+e.yyx*mp(po+e.yyx).x+e.yxy*mp(po+e.yxy).x+e.xxx*mp(po+e.xxx).x),
        //LIGHTING MICRO ENGINE BROSKI 
        al=vec3(1,0.05,0);//Albedo is base colour.
        float dif=max(0.,dot(no,ld)),//dif=diffuse because i ain't got time to cook torrance
        aor=t/50.,ao=exp2(-2.*pow(max(0.,1.-mp(po+no*aor).x/aor),2.)),//aor =amibent occlusion range, ao = ambient occlusion
        fr=pow(1.+dot(no,rd),4.),//Fr=fresnel which adds reflections on edges to composite geometry better, yeah could be reflected, but who gives a shit? Anyways just like your ex, it doesn't do much.
        spo=exp(1.+3.*noise(np/vec3(.1,.2,.4)));//TRICK making a gloss map from a 3d noise function is a thing of fucking beauty
        //Change colour depending on material id, it's like art school but without the whinging PC babies
        if(sc.y<5.) al=vec3(0);//albedo becomes white
        if(sc.y>5.) al=vec3(1);//albedo is black 
        if(sc.y>6.) {al=vec3(0.1,0.5,0.9);spo=exp(1.+3.*noise(bp/vec3(.1,.2,.4))); no*=(1.+.6*ceil(cos(bp*4.)));no=normalize(no);}//Yeah we re make the gloos map for outter bits as they need gloss map based on bp not np
        if(sc.y>7.) {al=vec3(0);}//Yeah i know not exactly elegant but neither am I wearing a little black dress.
        if(sc.y>8.) {al=vec3(1);}//Anyway it's easy way of redefining materials to include the gloss map based on bp rather than np as these materials are all for outter bits
        
        vec3 sss=vec3(0.5)*smoothstep(0.,1.,mp(po+ld*0.4).x/0.4),//sss=subsurface scatterring made by tekf from the wax shader, big up tekf! https://www.shadertoy.com/view/lslXRj
        sp=vec3(0.5)*pow(max(dot(reflect(-ld,no),-rd),0.),spo);//Sp=specualr, sotlen from Shane and it's better than being punched in the stomach by our ex's new and tougher boyfriend
        co=mix(sp+al*(.8*ao+0.2)*(dif+sss),fo,fr);//Building the final lighting result, compressing the fuck outta everything above into an RGB shit sandwich
        co=mix(co,fo,1.-exp(-.0001*t*t*t));//Fog soften things, but it won't save your ex's failed pet rescue center, money will.
    }
    co+=g1*0.3;//Adding the white gamma ray glow at the end
  	co+=vec3(1,0.05,0)*g2*(0.004*bb);//and the red cylinder glow too, that simple broski look above for more glow explanation, line 31 and 65
    fragColor = vec4(pow(co,vec3(0.45)),1);//Cheap tone mapping, even cheaper than the presents your ex used to get you for christmas
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
