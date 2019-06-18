/*
 * Original shader from: https://www.shadertoy.com/view/XtKBzc
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//From awesome iq's articles and shaders

float sdCappedCylinder( vec3 p, vec2 h )
{
  vec2 d = abs(vec2(length(p.yz),p.x)) - h;
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdSphere(vec3 p,float r )
{
    return length(p) - r;
}

float sdEllipsoid(vec3 p,vec3 r )
{
    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);
}

float sdEllipsoid(vec2 p,vec2 r )
{
    return (length( p/r ) - 1.0) * min(r.x,r.y);
}

float sdTorus( vec3 p, vec2 t )
{
    return length( vec2(length(p.xz)-t.x,p.y) )-t.y;
}

float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h ) - r;
}

vec2 udSegment( vec3 p, vec3 a, vec3 b )
{
	vec3 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return vec2( length( pa - ba*h ), h );
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float det( vec2 a, vec2 b ) { return a.x*b.y-b.x*a.y; }
vec3 getClosest( vec2 b0, vec2 b1, vec2 b2 ) 
{
    float a =     det(b0,b2);
    float b = 2.0*det(b1,b0);
    float d = 2.0*det(b2,b1);
    float f = b*d - a*a;
    vec2  d21 = b2-b1;
    vec2  d10 = b1-b0;
    vec2  d20 = b2-b0;
    vec2  gf = 2.0*(b*d21+d*d10+a*d20); gf = vec2(gf.y,-gf.x);
    vec2  pp = -f*gf/dot(gf,gf);
    vec2  d0p = b0-pp;
    float ap = det(d0p,d20);
    float bp = 2.0*det(d10,d0p);
    float t = clamp( (ap+bp)/(2.0*a+b+d), 0.0 ,1.0 );
    return vec3( mix(mix(b0,b1,t), mix(b1,b2,t),t), t );
}

vec4 sdBezier( vec3 a, vec3 b, vec3 c, vec3 p )
{
	vec3 w = normalize( cross( c-b, a-b ) );
	vec3 u = normalize( c-b );
	vec3 v =          ( cross( w, u ) );

	vec2 a2 = vec2( dot(a-b,u), dot(a-b,v) );
	vec2 b2 = vec2( 0.0 );
	vec2 c2 = vec2( dot(c-b,u), dot(c-b,v) );
	vec3 p3 = vec3( dot(p-b,u), dot(p-b,v), dot(p-b,w) );

	vec3 cp = getClosest( a2-p3.xy, b2-p3.xy, c2-p3.xy );

	return vec4( sqrt(dot(cp.xy,cp.xy)+p3.z*p3.z), cp.z, length(cp.xy), p3.z );
}

float smin( float a, float b, float k )
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

vec2 smin( vec2 a, vec2 b, float k )
{
	float h = clamp( 0.5 + 0.5*(b.x-a.x)/k, 0.0, 1.0 );
	return vec2( mix( b.x, a.x, h ) - k*h*(1.0-h), mix( b.y, a.y, h ) );
}
vec4 smin( vec4 a, vec4 b, float k )
{
	float h = clamp( 0.5 + 0.5*(b.x-a.x)/k, 0.0, 1.0 );
	return vec4( mix( b.x, a.x, h ) - k*h*(1.0-h), mix( b.yzw, a.yzw, h ) );
}

float smax( float a, float b, float k )
{
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( a, b, h ) + k*h*(1.0-h);
}

vec3 smax( vec3 a, vec3 b, float k )
{
	vec3 h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( a, b, h ) + k*h*(1.0-h);
}

vec2 opUnion(vec2 a, vec2 b){
    if(a.x<b.x){
    	return a;   
    }else{
     	return b;   
    }
}

// --------[ Image ]---------- //

vec2 scene(vec3 p){
    vec2 res = vec2(100.0,0.);
    float shape;
    vec3 q;
    
    
    float angle = 0.005*sin(20.*iTime+20.)+
        		  0.2*sin(1.*iTime+0.5)+
                  0.3*sin(0.5*iTime);
    			  0.5*sin(-0.25*iTime);
    
    
    
    q = p +vec3(0.,-1.,-2.);
    q.yx = mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*q.yx;
    
    shape = smin(10.,sdTorus(q.yzx+vec3(0.,0.,0.),vec2(2.,0.2)),0.);
    
    
    shape = smin(shape, sdCappedCylinder(q+vec3(0.,-0.12,0.),vec2(0.15,2.)),0.2);
    shape = smin(shape, sdCappedCylinder(q+vec3(0.,0.12,0.),vec2(0.15,2.)),0.2);
    
    shape = smin(shape, sdCappedCylinder(q.yzx+vec3(1.,0.,0.),vec2(0.15,1.)),0.2);
    shape = smin(shape, sdSphere(q*vec3(1.,1.,2.)+vec3(0.,0.5,0.),0.5),1.);
    
    shape += 0.005*sin(60.*q.x)*sin(60.*q.y)*sin(60.*q.z);
    //Adorno
    shape =min(shape, sdCappedCylinder(q.zxy+vec3(-0.27,0.,0.3),vec2(0.3,0.075))-0.03);
    
    if(shape<res.x) res = vec2(shape,3.);
    
    //Panel velocimetro
    q = p+vec3(0.,-1.,-1.);
   	shape = sdCappedCylinder(q.zyx+vec3(0.,0.5,0.),vec2(2.5,0.5+1.));
    shape = smax(shape,-sdCappedCylinder(q.zyx+vec3(0.,10.,0.),vec2(10.,1.+1.)),0.1);
    shape = smax(shape,-sdSphere(q+vec3(3.8,0.6,0.),2.),0.05);
    shape = smax(shape,-sdSphere(q+vec3(-3.8,0.6,0.),2.),0.05);
    
    shape = abs(shape)-0.1;
    shape = max(q.z-0.,shape);
    
    
    shape = max(shape,-sdBox(q+vec3(0.,-1.,1.3),vec3(0.3,0.5,0.1))+0.05);
    shape = max(shape,-sdCappedCylinder(q.zyx+vec3(1.3,-0.8,1.1),vec2(0.6,0.1))+0.05);
    shape = max(shape,-sdCappedCylinder(q.zyx+vec3(1.3,-0.8,-1.1),vec2(0.6,0.1))+0.05);
    
    shape = min(shape,sdCappedCylinder(q.zyx+vec3(1.5,-0.8,-1.1),vec2(0.075,0.1)));
    shape = min(shape,sdCappedCylinder(q.zyx+vec3(1.5,-0.8,1.1),vec2(0.075,0.1)));
	
    
    if(shape<res.x) res = vec2(shape,3.);
    

    float indexx = step(0.,q.x);
    q.x = sign(q.x)*(abs(q.x)-1.1);
    
    q.yz += vec2(-0.8,1.4);
    angle = -1.+0.1*sin(3.*iTime+2.*indexx);
    
    q.xy = mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*q.xy;
   	shape = sdBox(q+vec3(-0.3,0.,0.),vec3(0.3,(0.02-0.02*q.x)*vec2(1.,1.)));
    
    if(shape<res.x) res = vec2(shape,5);
        
    return res;
}

vec2 raycast(vec3 p, vec3 d){
 
    vec2 res = vec2(0.,-1.);
    
    float tmin = 0.1;
    float tmax = 30.;
    const int steps = 64;
    
    res.x = tmin;
    
    for(int i=0;i<steps;i++){
        
        vec2 f = scene(p+res.x*d);
        if(f.x<0.0001*res.x || res.x>tmax) break;
        res.x+=f.x;
        res.y=f.y;
    }
    
    if(res.x>tmax) res.y=-1.;
    return res;
    
}


vec3 calcNormal(vec3 p)
{
	
    float ep = 0.01;
    vec2 e = vec2(1.0,-1.0)*0.5773;
    return normalize(e.xyy*scene(p+e.xyy*ep).x + 
					 e.yyx*scene(p+e.yyx*ep).x + 
					 e.yxy*scene(p+e.yxy*ep).x + 
					 e.xxx*scene(p+e.xxx*ep).x );
    
}

float calcAO(vec3 pos,vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<4; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = scene( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.99;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}


vec3 color(vec3 p, vec3 d, vec2 res){
    
    vec3 lightdir1 = vec3(10.,1.,30.*(mod(0.5*iTime,1.)-0.5));
    lightdir1 = normalize(lightdir1);
    
    vec3 lightdir2 = vec3(-10.,1.,30.*(mod(0.5*iTime+0.5,1.)-0.5));
    lightdir2 = normalize(lightdir2);
             
	vec3 c = vec3(0.);
    
    p+=res.x*d;
    
    vec3 n = calcNormal(p);
    float shadow1 = raycast(p+0.001*lightdir1,lightdir1).y>1.?0.:1.;
   	float shadow2 = raycast(p+0.001*lightdir2,lightdir2).y>1.?0.:1.;
  
    if(res.y>0.){
        
        if(res.y<4.){
			  
            float r = clamp(dot(normalize(vec3(0.,3.,0.)-p),n),0.,1.);
           	c = 1.5*r*calcAO(p,n)*vec3(0.1,0.1,0.2)+
                0.3*r*vec3(0.1,0.1,0.5)*min(shadow1,shadow2);

            vec2 q = p.xy+vec2(0.,-1.8);
            q.x = abs(q.x)-1.1;
            float angle = atan(q.y,q.x);
            angle =smoothstep(0.6,1.,sin(20.*(angle+0.1)));
            angle *= (1.-step(0.,abs(length(q)-0.55)-0.05))*(1.-step(-0.25,p.z));
            c+= angle*vec3(0.8,0.8,1.)*step(0.,abs(atan(q.y,q.x)+3.14159/2.)-0.5);
            
            angle = atan(q.y,q.x);
            angle =smoothstep(0.8,1.,sin(40.*(angle+0.2)));
            angle *= (1.-step(0.,abs(length(q)-0.55)-0.025))*(1.-step(-0.25,p.z));
            c+= angle*vec3(0.8,0.8,1.)*step(0.,abs(atan(q.y,q.x)+3.14159/2.)-0.5);
            
            
            c+= 0.1*vec3(1.,0.5,1.)*(1.-smoothstep(0.,1.,length(q)))*(1.-step(-0.25,p.z));
            float mask = (1.-step(-0.25,p.z))*(1.-smoothstep(0.,0.2,abs(p.y-2.)-0.5))*(1.-smoothstep(0.,0.2,abs(p.x)-0.3));
           	
           	c+=0.2*mix(vec3(1.,0.2,0.),2.*vec3(1.,0.2,0.),mask)*mask;
            
            c+= (1.-0.1*fract(sin(12.*iTime)))*vec3(1.,0.2,0.)*(1.-smoothstep(0.,1.2,p.z))*step(-0.5,p.z)*(1.-smoothstep(0.,0.6,abs(p.x)))*(1.-smoothstep(0.,0.2,abs(p.y-1.)));
        
            c+=(0.1-0.05*sin(iTime))*vec3(1.,0.5,0.25)*smoothstep(0.,1.,dot(n,lightdir1))*shadow1;
            c+=(0.1-0.05*sin(iTime))*vec3(1.,0.5,0.25)*smoothstep(0.,1.,dot(n,lightdir1))*shadow2;
              
        }else if(res.y<6.){
         	 
            c = vec3(1.,0.3,0.3);
            
        }

    }

    return c;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{

    vec2 uv = fragCoord/iResolution.xy;
    vec2 p = uv;
    p-=0.5;
    p.x*=iResolution.x/iResolution.y;
    
    //-------Camera setup-----------//
    
    float angle = 3.1415/2.+1.*(iMouse.x/iResolution.x-0.5);
    vec3 po = vec3(cos(angle),4.+4.*(iMouse.y/iResolution.y-0.5),sin(angle));
    po.xz*=8.;
    vec3 ta = vec3(0.,1.5+0.,0.);
    
    vec3 dir = normalize(ta-po);
    vec3 up = vec3(0.,1.,0.);
    vec3 right = cross(dir,up);
    up = cross(right,dir);
    
    vec3 pos = po + p.x*right + p.y*up;
    
    float fov = 2.;
    dir = normalize(pos-(po-fov*dir));
    
    //-------------------------------//
    
    vec2 res = raycast(pos,dir);
    vec3 col = color(pos,dir,res);
    

    fragColor = vec4(col,1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
