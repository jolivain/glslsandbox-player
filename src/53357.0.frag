/*
 * Original shader from: https://www.shadertoy.com/view/3sSGzK
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
//Minus256
//2019-03-17

const float maxitr = 500.0;//max marching
const int occitr = 10;//occlusion
const float sdwitr = 50.0;//shadow
//random
float random(vec2 f)
{
    return fract(sin(dot(f.xy,vec2(2.38843992,4.40872883))));
}
//ground mapping using random
float m(vec2 xy)
{
    if(mod(xy.x,2.0) < 0.3 || mod(xy.y,4.0) < 0.6)//road
        return 2.4;
    else
        return 0.95*(random(floor(xy*2.54))*0.5+random(floor(xy*9.1))*0.3)+2.0;//city
        //return 0.95*(random(floor(xy*2.54))*0.5+random(floor(xy*5.7))*0.5+random(floor(xy*9.1))*0.3)+2.0;//city
}
//safe march optimization
void premarch(inout vec3 pos,in vec3 ray,inout float leng,float safe)
{
    float safemarch = (pos.y-safe)/abs(ray.y);
    leng += safemarch;
    pos += ray*safemarch;
}
//reusable marcher
//another method can be implemented
void march(inout int chk,inout float chkud,inout vec3 pos,inout float eps,in vec3 ray,inout float leng)
{
    for (int x=0; x<1000;x++)
    {
    ++chkud;
    pos += ray*eps;
    if(pos.y-m(pos.xz)<eps)
		chk = 1;
    if(chkud>maxitr)
        chk = 2;
    leng += eps;
    eps *= 1.0+chkud/150000.0; //varies marching step length
    if (chk != 0)
        break;
    }
}
//exp occlusion function
float occlusion(vec3 dir,vec3 pos,in float eps)
{
    float occ = .0;
    eps *= 3.0;
    pos += dir*eps;
    for(int i=0;i<occitr;i++)
    {
    	if(pos.y-m(pos.xz)<eps)
        {
        	occ -= eps;
            break;
        }
    	else
        	occ += eps;
    	pos += dir*eps;
    }
    //return smoothstep(.0,1.0,1.0-min(max(pow(occ+1.5,1.5)-1.0,0.0),1.0));
    return occ;
}
float shadow(vec3 dir,vec3 pos,in float eps,float lightleng)
{
    float shadow = .0;
    eps *= 0.3;
    for(float i=.0;i<sdwitr;i++)
    {
    	pos += dir*eps;
        eps *= 1.0+i/400.0;
    	if(pos.y-m(pos.xz)<eps)
    	{
        	pos -= dir*eps;
        	shadow = m(pos.xz);
            break;
        }
    }
    return shadow/lightleng;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xx;//not used xy because otherwise it will distort itself
    //setting up camera
    vec3 cen = vec3(.0,3.0,.0);
    vec3 vp = vec3(-7.0*sin(iTime*0.1),4.0,-7.0); //camera's position
    vec3 vdir = normalize(cen-vp);  //camera's direction
    vec3 side = cross(vdir,vec3(.0,1.0,.0)); //side of camera(right)
    vec3 upsd = cross(side,vdir);  //camera's upside
    //view pixel of each ray
    vec3 ray = normalize(vdir*(1.0+sin(iTime)*0.3)+side*uv.x+upsd*uv.y-side/2.0-upsd/2.0);
    //ground march
    float eps = 0.005;
    float leng =.0;
    vec3 pos = vp;
    int chk = 0;
    float chkud = 0.0;
    float safe = 3.235;
    premarch(pos,ray,leng,safe);
    march(chk,chkud,pos,eps,ray,leng);
    //get normal
    vec2 dirs = vec2(eps,.0);
    vec3 normal = normalize(vec3(m(pos.xz-dirs.xy)-m(pos.xz+dirs.xy),2.0*dirs.x,m(pos.xz-dirs.yx)-m(pos.xz+dirs.yx)));
    if(chk == 2)//temporal!!
        normal = vec3(.0,1.0,.0);
    //and direction
    vec3 lightpos = vec3(2.0*sin(iTime),5.0,4.0);//lightpos
    vec3 lightdir = normalize(pos-lightpos);
    float lightleng = length(pos-lightpos);
    //reflection
    vec3 shiny = reflect(vdir,normal);
    float dif = dot(lightdir,normal);
    //occlusion setup
    float ambocc = occlusion(normal,pos,eps);
    float spcocc = occlusion(shiny,pos,eps);
    float dffocc = occlusion(lightdir,pos,eps);//light is neg signed because direction is pos to light ins of lit to pos
    //shadow
    float shadow = shadow(-lightdir,pos,eps,lightleng);
    //fragColor = vec4(vec3(pos.y/10.0+leng/50.0+normal*0.5+spec),1.0);
    //fragColor = vec4(vec3(1.0-ambocc-spcocc-dffocc-shadow),1.0);
    //fragColor = vec4(vec3(shadow),1.0);
    //fragColor = vec4(vec3(1.0-spcocc),1.0);
    fragColor = vec4(vec3(1.0-(shadow*2.0-ambocc*1.0-dffocc*0.3+spcocc*0.4)),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
