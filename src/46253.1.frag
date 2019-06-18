/*
 * Original shader from: https://www.shadertoy.com/view/Xtl3DB
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
//Playing with Refleks by eiffie
//If you uncomment REFLECT_OR_CONTINUE then the march will either reflect or continue to look for an intersect


//#define REFLECT_OR_CONTINUE

#define rez iResolution
#define tyme iTime

vec2 rep(vec2 p, vec2 a){return abs(mod(p+a,a*2.0)-a);}
float RSTube(in vec3 z, vec4 r){return length(vec2(length(max(abs(z.xy)-r.xy,0.0))-r.z,z.z))-r.w;}
float Torus(in vec3 z, vec2 r){return length(vec2(length(z.xy)-r.x,z.z))-r.y;}
const float SCALE = -1.77;
const vec4 scale=vec4(SCALE,SCALE,SCALE,abs(SCALE));
float dL=0.0;

float DE(in vec3 z0){
	float dF=-abs(z0.y)+1.82;
	float y=-z0.y,sW=dF*dF*0.02;
	z0.xz=rep(z0.xz,vec2(7.0,6.0));
	z0=abs(z0)-vec3(2.74,0.83,2.74);
	vec4 z = vec4(z0,1.0),p0=vec4(4.0,4.0,4.0,1.0);
	float d=length(z.xz+vec2(-0.82+sW*sin(y*10.0+tyme*17.0),-1.0+sW*cos(y*15.0+tyme*20.0))),d2=RSTube(z.xzy+vec3(-1.0,-1.0,0.0),vec4(0.51,0.32,0.74,0.04));
	dL=min(dL,d);
	vec2 nrm=vec2(0.6,0.38);
	for (int n = 0; n < 3; n++) {
		z.xz=clamp(z.xz, -1.0, 1.0) *2.0-z.xz;
		if(n==0){
			float h=length(z.xyz+vec3(-0.25,0.13,-0.25));
			dL=min(dL,(h-0.07));d=min(d,h-0.05);
			z.w+=clamp(1.0-h*2.0,0.0,1.0);
		}
		z.xz-=2.0*min(0.0,dot(z.xz,nrm))*nrm;
		z*=scale/clamp(dot(z.xyz,z.xyz),0.0,0.29);
		d=min(d,length(max(abs(z.xyz/z.w)-vec3(0.01,0.27,0.01),0.0)));
		z+=p0;
	}
	return min(d,min(d2,dF));
}
float DEL(in vec3 z0){
	z0.xz=rep(z0.xz,vec2(7.0,6.0));
	z0=abs(z0)-vec3(2.74,0.83,2.74);
	return length(z0+vec3(-0.82,0.0,-1.0));
}
vec4 strap=vec4(0.0);
float CE(in vec3 z0){
	float dF=-abs(z0.y)+1.82;
	z0.xz=rep(z0.xz,vec2(7.0,6.0));
	z0=abs(z0)-vec3(2.74,0.83,2.74);
	vec4 z = vec4(z0,1.0),p0=vec4(4.0,4.0,4.0,1.0);
	float d=100.0,d1=Torus(z.xzy+vec3(-1.0,-1.0,0.1),vec2(1.07,0.03)),d2=RSTube(z.xzy+vec3(-1.0,-1.0,0.0),vec4(0.51,0.32,0.74,0.04));
	vec2 nrm=vec2(0.6,0.38);
	for (int n = 0; n < 3; n++) {
		z.xz=clamp(z.xz, -1.0, 1.0) *2.0-z.xz;
		z.xz-=2.0*min(0.0,dot(z.xz,nrm))*nrm;
		z*=scale/clamp(dot(z.xyz,z.xyz),0.0,0.29);
		vec3 z2=z.xyz/z.w;
		d=min(d,max(length(z2.xz)-0.01,abs(z2.y)-0.27));
		z+=p0;
	}
	if(d<d1 && d<d2 && d<dF){z0*=200.0;d+=0.001*sin(z0.x+sin(z0.y+sin(z0.z)));strap+=vec4(sin(200.0*z.xyz/z.w)*0.4+0.5,0.2);}
	else if(d1<d2 && d1<dF){d=d1;strap+=vec4(0.0);}
	else if(d2<dF){d=d2;strap+=vec4(0.9,0.3,0.2,0.0);}
	else{d=dF;dF=1.5*pow(abs((fract(z0.x*3.0)-0.5)*(fract(z0.z*3.0)-0.5)),0.1);strap+=vec4(dF,dF,dF,0.1);}
	return d;
}
float ShadAO(in vec3 ro, in vec3 rd){
	float t=0.0,s=1.0,d;
	for(int i=0;i<10;i++){
		d=max(DE(ro+rd*t)*1.5,0.01);
		s=min(s,d/t+t);
		t+=d;
	}
	return s;
}
vec3 GetBackground(in vec3 rd){
	return vec3(0.7)+0.1*rd;
}
vec3 Bloom(in float t){
	return exp(-t*100.0)*vec3(2.0,0.4,0.2);
}
vec4 scene(in vec3 O, in vec3 D){
	vec3 ro=O,rd=D;
	float totalDist=0.0,firstDist=0.0,t=0.0,pxl=1.5/iResolution.y;
	vec4 col=vec4(0.0);
	dL=1000.0;
 #ifdef REFLECT_OR_CONTINUE
	for(int j=0;j<2;j++){
 #endif
		float d,dm=100.0,tm=0.0;
		for(int i=0;i<64;i++){
			d=DE(ro+rd*t);
			if(d<dm){dm=d;tm=t;}
			t+=d*clamp(t*0.25,0.8,1.0);
			if(t>20.0 || d<0.00001)break;
		}
		float px=pxl*(totalDist+tm);
		if(dm<px && dm<dL){
			vec3 so=ro+rd*tm;
			vec2 e=vec2(-1.0,1.0)*px;
			strap=vec4(0.0);
			float ld=dL;//I took the normal calc from nimitz
			vec3 N=normalize(e.yxx*CE(so+e.yxx)+e.xxy*CE(so+e.xxy)+e.xyx*CE(so+e.xyx)+e.yyy*CE(so+e.yyy));
			e=vec2(-1.0,1.0)*ld;//turn it around to get direction to the nearest light
			vec3 L=-normalize(e.yxx*DEL(so+e.yxx)+e.xxy*DEL(so+e.xxy)+e.xyx*DEL(so+e.xyx)+e.yyy*DEL(so+e.yyy));
			vec3 scol=strap.rgb*0.25;
  #ifdef REFLECT_OR_CONTINUE
			float refl=strap.a*0.25;
  #else
            float refl=0.0;
  #endif
			vec3 R=reflect(rd,N);
			float v=dot(-rd,N),l=dot(N,L);
			float shad=ShadAO(so+N*0.001,L);
			vec3 cc=vec3(0.4,0.5,0.7),lc=vec3(1.0,0.8,0.6);
			float cd=exp(-distance(O,so));l*=exp(-ld*0.75);
			float spcl=pow(max(0.0,dot(R,L)),10.0),spcc=pow(max(0.0,dot(R,-rd)),1.0+cd);
			scol=scol*max(max(cd*v*cc,shad*l*lc),0.0)+cd*spcc*cc+shad*spcl*lc;
			float fog=min(tm*0.1,1.0);//exp(-tm*0.1);
			scol=Bloom(ld)+mix(scol,vec3(0.7),fog);
			float alpha=(1.0-refl)*(1.0-col.a)*clamp(1.0-dm/px+fog,0.0,1.0);
			col+=vec4(clamp(scol,0.0,1.0),1.0)*alpha;
 #ifdef REFLECT_OR_CONTINUE
			if(col.a>0.95)break;
			if(d==dm){//bounce and stuff
				if(firstDist==0.0)firstDist=t;
				if(refl>0.01){
					ro+=rd*(t-px);
					totalDist+=t;
					t=0.0;
					rd=R;
				}else break;
			}
			dL=1000.0;
 #endif
		}
 #ifdef REFLECT_OR_CONTINUE
        else if(dL<px)break;
	}
 #endif
	col.rgb+=(Bloom(dL)+GetBackground(rd))*(1.0-clamp(col.w,0.0,1.0));
	return vec4(col.rgb,firstDist);
}
mat3 lookat(vec3 fw,vec3 up){
	fw=normalize(fw);vec3 rt=normalize(cross(fw,normalize(up)));return mat3(rt,cross(rt,fw),fw);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	float tim=tyme*0.25;
	vec3 ro=vec3(sin(tim)*(2.0+tim)-4.0,0.5,cos(tim)-4.0);
	vec3 rd=lookat(vec3(-4.0,-0.6,-4.0)-ro,vec3(0.0,1.0,0.0))*normalize(vec3((2.0*(fragCoord.xy)-rez.xy)/rez.y,1.0));

	vec4 color=scene(ro,rd);//eye,normalize(dir));
	fragColor = vec4(color.rgb,1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
