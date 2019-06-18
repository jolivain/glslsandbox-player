/*
 * Original shader from: https://www.shadertoy.com/view/MsSyRz
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
#define PI 3.14159
#define PI2 PI*2.0
#define sm(a,b) smoothstep( a - 10./iResolution.y, a, b)

float EvaluateCustomMove(float time, float a, float b){
  float t = time;
  t = mod(t,1.0);
  t=pow(-4.0*t*(t-1.0),1.0);
  return a*(1.0-t) + b*t;
}

float PatternCircles(vec2 p, float m){
  p.x-=m/2.0*step(0.0,sin(PI*p.y/m));
  p = mod(p,m)-m/2.0;
  return 1.0-sm(0.0,(p.x*p.x+p.y*p.y)-1.0);
}

vec4 rgba(float r, float g, float b, float a){
  return vec4(r/255.0,g/255.0,b/255.0,a/255.0);
}

vec2 vec2_n(float x, float y){
  return normalize(vec2(x,y));
}

float sRegion(vec2 p, vec2 dir){
  return step(0.0,dot(p,dir));
}

float sSquare(vec2 p){
  return sRegion(p+vec2(1.0,0.0),vec2_n(1.0,0.0))*
         sRegion(p+vec2(-1.0,0.0),vec2_n(-1.0,0.0))*
         sRegion(p+vec2(0.0,1.0),vec2_n(0.0,1.0))*
         sRegion(p+vec2(0.0,-1.0),vec2_n(0.0,-1.0));
}

float sCircle(vec2 p, float radius){
  return sm(0.0,radius*radius-(p.x*p.x+p.y*p.y));
}

float sSemiCircle(vec2 p, float radius){
  return sm(0.0,p.y) * sCircle(p,radius);
}

float fHead(vec2 p, float width){
  vec2 psquare = p;
  psquare.x/=width;
  return max(
            max(sCircle(p-vec2(-width,0.0),1.0),
                sCircle(p-vec2(width,0.0),1.0)
            ),
            sSquare(psquare))
            ;
}


float fBody(vec2 p){

  vec2 psquare = p;

  vec2 pinvcirc = p;
  pinvcirc -= vec2(-1.95,2.6);

  vec2 pcirc = p;

  float f = sCircle(pcirc,1.0);
  psquare.x *= 1.2;
  psquare -= vec2(-1.0,0.0);
  f = max(f,sSquare(psquare));
  psquare = p;
  psquare.y *= 1.0;
  psquare.x *= 1.5;
  psquare -= vec2(0.5,1.0);
  f = max(f,sSquare(psquare));

  f = min(f,(1.0-1.0*sCircle(pinvcirc,2.5)));
  return f;
}

float fLollipop(vec2 p, float width, float height, float radius){
  vec2 psquare = p;
  psquare.y-=(1.0+height)*radius;
  psquare.x/=width;
  psquare.y/=height;
  return max(sCircle(p,radius),sSquare(psquare));
}

float fLeg(vec2 p, float amp, float thickness){
  float f = p.y-amp*sin(p.x);
  f = (1.0-sm(0.0,p.x-PI))*sm(0.0,p.x)*(1.0-sm(thickness,f))*sm(-thickness,f);
  return f;
}

float fTail(vec2 p, float amp, float thickness,float limitx){
  return fLeg(p,amp,thickness)*(1.0-sm(0.0,p.x-limitx));
}

float fEye(vec2 p,float thickness,float limitx){
  return sm(-limitx,p.x)*(1.0-sm(limitx,p.x))*sm(-thickness,p.y-p.x*p.x)*(1.0-sm(thickness,p.y-p.x*p.x));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){

  float time = 3.0*iTime;
  vec4 backgroundCol = rgba(38.0,173.0,106.0,1.0);
  vec4 shadowCol = rgba(34.0,130.0,89.0,1.0);
  vec4 skinCol = rgba(255.0,207.0,64.0,1.0);
  vec4 noseCol = rgba(232.0,163.0,1.0,0.0);
  vec4 spotsCol = rgba(208.0,124.0,74.0,1.0);
  vec4 blackCol = vec4(0.0,0.0,0.0,1.0);
  
  vec4 col = backgroundCol;

  vec2 p = fragCoord.xy/iResolution.xy;
  p -= 0.5;
  p.x*=iResolution.x/iResolution.y;
  p.y-=-0.3;
  p*=19.0;
  p.x-=mod(time,22.0*2.0)-22.0;
  
  //Inspired by Javier Agüera, iapafoto and FabriceNeyret2, 
  //here a little familiar improve :)
  
  //Just for fun!
  //float k = 1.5 + 3.5*(0.5-0.5*cos(time));
  float k = 1.;
  float motherHeight = mix(k,6.0-k,step(0.0,p.x));
  p.x = mix(p.x,mod(p.x,6.)-2.5,step(-6.0,p.x)*(1.0-step(6.0,p.x))); 

  float f;

  vec2 pbody = p;
  pbody.y+=EvaluateCustomMove(time,0.0,-0.4*PI);
  f = fBody(pbody);
  col = mix(col,skinCol,f);
  f *= PatternCircles(3.0*pbody,3.0)+
  PatternCircles(7.0*(pbody+vec2(0.0,0.7)),7.0); 
  f*=step(1.0,pbody.y);
  col = mix(col,spotsCol,f);


  vec2 psquare = pbody;
  psquare.x-=0.74;
  psquare.y-=7.0-(5.0-motherHeight);
  psquare.x*=3.8;
  psquare.y/=motherHeight;
  f =sSquare(psquare);
  col = mix(col,skinCol,f);
  f *= PatternCircles(3.0*pbody,3.0)+
  PatternCircles(7.0*(pbody+vec2(0.0,0.7)),7.0);
  f*=1.0-step(11.0,pbody.y);
  col = mix(col,spotsCol,f);

    
  vec2 phead = p;
  phead -= vec2(2.75,12.4-1.85*(5.0-motherHeight));
  float t = EvaluateCustomMove(time,0.05*PI2,-0.05*PI2);
  phead = mat2(cos(t),-sin(t),sin(t),cos(t))*phead;
  phead*=1.3;
  phead -= vec2(-1.0,0.0);
  f = fHead(phead,1.0);
  col = mix(col,skinCol,f);

  vec2 pear = pbody;
  t = PI+EvaluateCustomMove(time,-0.2*PI,0.1*PI);
  pear -= vec2(0.4,12.0-1.85*(5.0-motherHeight));
  pear = mat2(cos(t),-sin(t),sin(t),cos(t))*pear;
  pear *= 2.0;
  pear += vec2(-1.0,0.0);
  
  pear.x*=0.8;
  f = sSemiCircle(pear,1.0);
  col = mix(col,skinCol,f);

  vec2 plollipop = phead;
  plollipop -= vec2(-1.9,2.0);
  plollipop = mat2(cos(PI),-sin(PI),sin(PI),cos(PI))*plollipop;
  f = fLollipop(3.4*plollipop,0.25,2.5,1.0);
  col = mix(col,skinCol,f);

  plollipop = phead;
  plollipop -= vec2(-1.1,2.4);
  plollipop = mat2(cos(PI),-sin(PI),sin(PI),cos(PI))*plollipop;
  f = fLollipop(3.5*plollipop,0.25,2.5,1.0);
  col = mix(col,skinCol,f);

  vec2 pnose = 3.5*phead;
  pnose-=vec2(3.3,1.5);
  f = sCircle(pnose,1.0);
  pnose = 3.5*phead;
  pnose-=vec2(3.3,-1.5);
  f += sCircle(pnose,1.0);
  col = mix(col,noseCol,f);  

  vec2 peye = 3.0*phead;
  peye -= vec2(-3.0,0.4);
  peye.x*=1.3;
  f = fEye(peye,0.2,1.1);
  col = mix(col,blackCol,f);  

  float angle,amp;

  vec2 pleg = pbody;
  pleg.y-=-0.9;
  pleg.x-=0.3;
  angle = EvaluateCustomMove(time,-PI/2.0,-0.6*PI/2.0);
  pleg = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*pleg;
  pleg*=1.7;
  amp = 0.6*sin(2.0*PI*time);
  f = fLeg(pleg,amp,0.12);
  col = mix(col,skinCol,f);

  pleg = pbody;
  pleg.y-=-0.9;
  pleg.x-=-1.0;
  angle = EvaluateCustomMove(time,-PI/2.0,-0.6*PI/2.0);
  pleg = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*pleg;
  pleg*=1.7;
  amp = 0.5*sin(2.0*PI*time);
  f = fLeg(pleg,amp,0.12);
  col = mix(col,skinCol,f);

  pleg = pbody;
  pleg.y-=-0.9;
  pleg.x-=-1.2;
  angle = EvaluateCustomMove(time,-PI/2.0,-1.5*PI/2.0);
  pleg = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*pleg;
  pleg*=1.7;
  amp = 0.8*(0.5-0.5*cos(2.0*PI*time));
  f = fLeg(pleg,amp,0.12);
  col = mix(col,skinCol,f);

  pleg = pbody;
  pleg.y-=-0.9;
  pleg.x-=-0.0;
  angle = EvaluateCustomMove(time,-PI/2.0,-1.5*PI/2.0);
  pleg = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*pleg;
  pleg*=1.7;
  amp = 0.8*(0.5-0.5*cos(2.0*PI*time));
  f = fLeg(pleg,amp,0.12);
  col = mix(col,skinCol,f);

  vec2 ptail = pbody;
  ptail-=vec2(-1.6,0.05);
  angle = PI + EvaluateCustomMove(time,-0.8*PI/2.0,0.8*PI/2.0);;
  ptail = mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*ptail;
  ptail*=3.0;
  ptail.x*=1.0;
  amp = 0.4*cos(2.0*PI*time);
  f = fLeg(ptail,amp,0.2);
  col = mix(col,skinCol,f);

  vec2 pshadow = 7.0*p;
  pshadow-=vec2(-3.0,-20.0);
  float len = EvaluateCustomMove(time,8.0,15.0);
  f=fHead(pshadow,len);
  col = mix(col,shadowCol,f);  
  
  fragColor = col;

}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
