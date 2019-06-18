/*
 * Original shader from: https://www.shadertoy.com/view/Wtl3DH
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
vec4 iSphere(vec3 sp, float sr,vec3 ro, vec3 rd) //intersection entre une sphere et un rayon
{
vec3 p = sp-ro;
float d = dot(-rd,p);
float i = d*d- dot(p,p)+sr*sr;
d = i>0.?-sqrt(i)-d:-1000.;
    if(d<0.)
        i=-abs(i);
return vec4(normalize(rd*d-p),i>0.?d:1e6); //renvoie le vecteur normal au point d'intersection et la distance
}									//1e6 est un nombre tres grand

float iPlane(vec3 ro, vec3 rd, vec3 po, vec3 pn){//intersection entre un plan et un rayon
    float d =dot(rd,pn);
    if(abs(d)<1e-4)
        return -1.;
  	return dot(po-ro,pn)/d;//renvoie juste la distance
}

float iRec(vec3 ro, vec3 rd, vec3 po, vec3 pn,vec2 dim, vec3 vert){//intersection entre un rectangle et un rayon
    vec3 horiz = cross(pn,vert);
	float d =iPlane( ro,  rd,  po,  pn); //on calcule l'intersection avec le plan contenant le rectangle
    if(d>0.){
    	vec3 p = ro+d*rd-po;
    	if(abs(dot(p,horiz))>dim.x || abs(dot(p,vert))>dim.y) //on verifie si on est effectivement a l'interieur du rectangle
    		return 1e6;
     }else
     	return 1e6;
    return d;
}

vec2 rli(vec3 o1, vec3 d1, vec3 o2, vec3 d2){ //intersection entre deux rayons(demi-droites)
	vec3 n = normalize(cross(d1,d2));
    float md = dot(o1-o2,n);
    o1 = o1-md*n;					//o1 projeté dans le plan passant par o2
    vec3 dt = normalize(cross(d1,n)); //"transposée" de d1 dans le plan induit par d1,d2 
    float d = (dot(dt,o1))/dot(dt,d2);
    return vec2(abs(md)*d,abs(md)<d && dot(cross(d2,n),o1)>0.?d:1e6); //renvoie la distance minimale entre les deux rayons ainsi que la distance parcourue par le deuxieme rayon avant ce point
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = 2.*fragCoord-iResolution.xy;
    
    float vFov = 1.5;			//pas réellement le Fov, mais des les variables "vFov" et "Fov" permettent d'influer sur l'angle
   	float Fov = 1.5;			//de la caméra virtuelle et de la caméra principale respectivement
    
    vec3 ro = vec3(0,0,0);							//origine des rayons = position de la "camera"
    vec3 rd = normalize(vec3(uv,iResolution.y*Fov));//direction du rayon


	
    vec3 ld = normalize(vec3(1,1,-1));//direction de la lumiere
    vec3 c = vec3(1);  //couleur temporaire (avcant gestion de la lumuiere
    
    
    vec3 spp = vec3(-3,1.1,8);//position de la sphere
    float spr = .8;//rayon de la sphere
    
    vec4 isph = iSphere(spp,spr,ro,rd);//sphere
    vec3 n = isph.rgb;
    float d = isph.a;//distance a l'objet le plus proche le long du rayon en cours
 
    
    float ipl = iPlane(ro,rd,vec3(0,-.5,0),normalize(vec3(0,1,0))); //sol
    if(ipl<d && ipl>0.){
        n = normalize(vec3(0,1,0));
    	d=ipl;
    }
    
    
    vec3 so = vec3(1.3,.6+.2*cos(iTime*.9),4.);	//position du centre de l'"ecran"
    so.xz+=.8*vec2(cos(iTime*.4),sin(iTime*.4));//animation
    vec3 sn = normalize(so-vec3(.35,.44,6.6));	//orientation de l'"ecran"
    vec3 ro2 = so+sn*vFov;						//position de la "camera" viruelle
    vec3 vert = normalize(vec3(0,1,0));			//orientation de la verticale de l'écran 
    vert =normalize(vert-dot(sn,vert)*sn);		//correction de la verticale pour qu'elle soit orthogonale a la direction de l'ecran
    vec2 format=vec2(1.6,.9);					//dimention de l'ecran
    
    float ir = iRec(ro,rd,so,sn,format,vert); 	//"ecran"
    if(ir<d && ir>0.){
        n = sn;
    	d=ir;
        vec3 ro = d*rd;
        vec3 rd2 = normalize(ro-ro2);
        vec4 isph = iSphere(spp,spr,ro,rd2); //encore la sphere
    	vec3 n = isph.rgb;
    	float d = isph.a;
 
    
    	float ipl = iPlane(ro,rd2,vec3(0,-.5,0),normalize(vec3(0,1,0)));//encore le sol
    	if(ipl<d && ipl>0.){
        	n = normalize(vec3(0,1,0));
    		d=ipl;
    	}
        float l =(iSphere(spp,spr,ro+d*rd2,ld).a>=1e6?max(0.,dot(ld,n)):0.);//lumiere directe
    	c = mix(vec3(.4+l),vec3(.5,.7,1.),float(d>1e5));//affichage de la scene sur l'"ecran" secondaire
    }
    

    
    vec4 io =iSphere(so+sn*vFov,.03,ro,rd); //camera (bille noire)
    if(io.a<d){
        n = io.rgb;
    	d=io.a;
        c = vec3(.1);
    }
   
    
    vec3 p =ro+(d-1e-5)*rd;
    float sh = min(iSphere(spp,spr,p,ld).a,min( iRec(p,ld,so,sn,format,vert),iSphere(so+sn*vFov,.03,p,ld).a));
    float l =(sh>=1e6?max(0.,dot(ld,n)):0.);//limiere directe
    
    vec3 col =  mix(c*vec3(.4+l),vec3(.5,.7,1.),float(d>1e5));//application de l'eclairage 

    
   	float epsilon = 2./(iResolution.y*Fov);//antialiasing

    vec2 itsc=(rli(ro2,normalize(ro2-spp-vec3(3,1,0)),ro,rd)); // le rayon qui n'intersecte pas la scène
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(1,0,0),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }

    itsc=(rli(ro2,normalize(ro2-spp+.3),ro,rd));//le rayon qui intersecte la sphère
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(0,1,0),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }

    vec3 horiz = cross(sn,vert);	//et les quatre coins
    itsc=(rli(ro2,normalize(ro2-so+format.x*horiz+format.y*vert),ro,rd));
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(.4,.45,1),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }
    itsc=(rli(ro2,normalize(ro2-so-format.x*horiz+format.y*vert),ro,rd));
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(.4,.45,1),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }
    itsc=(rli(ro2,normalize(ro2-so+format.x*horiz-format.y*vert),ro,rd));
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(.4,.45,1),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }
    itsc=(rli(ro2,normalize(ro2-so-format.x*horiz-format.y*vert),ro,rd));
    if(itsc.y<d && itsc.y>0.){
        col=mix(col,vec3(.4,.45,1),smoothstep(.05+epsilon*itsc.y*itsc.y,.05,itsc.x));
        d=mix(d,itsc.y,step(itsc.x,.06));
    }
    
    
    col = pow(col*.6,vec3(1./2.24));//correction gamma
    
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
