// vector field
// 

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
varying vec2 surfacePosition;

float pi=atan(1.0)*4.0;

#define CELL_SIZE 16.0

float Ex(float x, float y)
{
   //return -y/(x*x+y*y);
	return sin(x+y-time/4.0);
   float xt=x-(mouse.x-0.5)*40.0;
   float yt=y-(mouse.y-0.5)*40.0;
   return -y/(x*x+y*y)+((yt))/((xt)*(xt)+(yt)*(yt));
}
float Ey(float x, float y)
{
   //return x/(x*x+y*y);
	return sin(y-x+time/4.0);
   float xt=x-(mouse.x-0.5)*40.0;
   float yt=y-(mouse.y-0.5)*40.0;
   return x/(x*x+y*y)+(-(xt))/((xt)*(xt)+(yt)*(yt));
   //return sin(y-x+t/4.0);
}

void main(void)
{
   float x = gl_FragCoord.x;
   float y = gl_FragCoord.y;
	//float x=surfacePosition.x;
	//float y=surfacePosition.y;
   float w = resolution.x*1.0;
   float h = resolution.y*1.0;

   float s = CELL_SIZE;
   float a = ceil(x/s);
   float b = ceil(y/s);
   float xd = s*(a-0.5);
   float yd = s*(b-0.5);

   float m=10.0;
   float X1 = -m;
   float X2 = m;
   float Y1 = -m;
   float Y2 = m;

   float X = (((X2-X1)/w)*x+X1);
   float Y = ((((Y2-Y1)/h)*y+Y1)*h/w);
   float Xd = (((X2-X1)/w)*xd+X1);
   float Yd = ((((Y2-Y1)/h)*yd+Y1)*h/w);
   
   float ex = Ex(Xd,Yd);
   float ey = Ey(Xd,Yd);
   float ex2 = Ex(X,Y);
   float ey2 = Ey(X,Y);
   float p = ey/ex;
   float f = (Y-Yd)-p*(X-Xd);
   float c = atan(ey2,ex2)/pi;
   if (abs(f)<=0.02) c=1.0;

#if 0
   gl_FragColor = c;
#else
   if (c>=0.0 && c<=0.5)
   {
      gl_FragColor = vec4(2.0*c,0.0,0.0,1.0);
   }
   if (c>0.5 && c<=1.0)
   {
      gl_FragColor = vec4(1.0,c*2.0-1.0,c*2.0-1.0,1.0);
   }
   if (c<0.0 && c>=-0.5)
   {
      gl_FragColor = vec4(0.0,0.0,abs(c)*2.0,1.0);
   }
   if (c<-0.5 && c>-1.0)
   {
      gl_FragColor = vec4(abs(c)*2.0-1.0,abs(c)*2.0-1.0,1.0,1.0);
   }
#endif   
}
