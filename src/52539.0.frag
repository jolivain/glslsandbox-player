/*
 * Original shader from: https://www.shadertoy.com/view/XldyDl
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define C gl_FragColor
#define U gl_FragCoord.xy
#define R resolution.xy
#define t time
#define f(i) 2.*cos(i.y+acos(cos(2.*i.x))/(3.))*sin(i.x)-2.5*sin(t)

void main(void){vec2 k=U/R-.5;vec2 j=U/R.y*20.-vec2(t);vec4 d=vec4(1.,.5,.5,1.);if(abs(f(j))<1.){d+=1.;}d/=sqrt(.65-.9*length(.55*k));C=d;}
