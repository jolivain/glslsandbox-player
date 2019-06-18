/*
 * Original shader from: https://www.shadertoy.com/view/ld3XWr
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

// Emulate a black texture
#define textureLod(s, uv, lod) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
const float PI= 3.1415926535897;
const float H_PI = PI * 0.5;
const float Q_PI = PI * 0.25;
const float E_PI = PI * 0.125;
const float TWO_PI= PI*2.0;

// rotations
mat3 rotate(vec3 axis, float angle)
{
    axis = normalize(axis); float s = sin(angle), c = cos(angle), oc = 1.0 - c;
    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c          
               );
}
vec3 rotateX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
vec3 rotateY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, c*p.z - s*p.x); }
vec3 rotateZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }

// signed distance primitives (from IQ)
float sdPlane( vec3 p, vec4 n ) { return dot(p,n.xyz) + n.w; }
float sdSphere(vec3 p,float r) { return (length(p) - r); }
float sdTorus(vec3 p,float r,float r2) { return(length( vec2(length(p.xz)-r,p.y) )-r2); }
float sdBox( vec3 p, vec3 b ) { vec3 d = abs(p) - b; return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0)); }
float sdHexPrism( vec3 p, vec2 h ) { vec3 q = abs(p); return max(q.z-h.y,max((q.x*0.866025+q.y*0.5),q.y)-h.x); }
float sdCylinder( vec3 p, vec3 c ) { return length(p.xz-c.xy)-c.z; }
float sdCappedCylinder( vec3 p, vec2 h ) { vec2 d = abs(vec2(length(p.xz),p.y)) - h; return min(max(d.x,d.y),0.0) + length(max(d,0.0)); }
float sdVerticalCapsule( vec3 p, float h, float r ) { p.y -= clamp( p.y, 0.0, h ); return length( p ) - r; }
float sdCapsule( vec3 p, vec3 a, vec3 b, float r ) { vec3 pa = p - a, ba = b - a; float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 ); return length( pa - ba*h ) - r; }
float sdTriPrism( vec3 p, vec2 h ) { vec3 q = abs(p); return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5); }
float sdEllipsoid( in vec3 p, in vec3 r ) { float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.0)/k1;}

float opSmoothUnion( float d1, float d2, float k ) { float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 ); return mix( d2, d1, h ) - k*h*(1.0-h); }
float opSmoothSubtraction( float d1, float d2, float k ) { float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );    return mix( d2, -d1, h ) + k*h*(1.0-h); }
float opSmoothIntersection( float d1, float d2, float k ) { float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );    return mix( d2, d1, h ) + k*h*(1.0-h); }

float hash(vec3 p) { return fract(dot(p,vec3(102.04978598, 51.98729547, 33.09874))*4.13439); }
float hash( vec2 p ) { return fract(sin(1.0+dot(p,vec2(127.1,311.7)))*43758.545); }

float noise( in vec3 x )
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = f*f*(3.0-2.0*f);
#ifndef HIGH_QUALITY_NOISE
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
	vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0. ).yx;
#else
	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z);
	vec2 rg1 = textureLod( iChannel0, (uv+ vec2(0.5,0.5))/256.0, 0. ).yx;
	vec2 rg2 = textureLod( iChannel0, (uv+ vec2(1.5,0.5))/256.0, 0. ).yx;
	vec2 rg3 = textureLod( iChannel0, (uv+ vec2(0.5,1.5))/256.0, 0. ).yx;
	vec2 rg4 = textureLod( iChannel0, (uv+ vec2(1.5,1.5))/256.0, 0. ).yx;
	vec2 rg = mix( mix(rg1,rg2,f.x), mix(rg3,rg4,f.x), f.y );
#endif	
	return mix( rg.x, rg.y, f.z );
}

vec2 cossin(float a) { return vec2(cos(a),sin(a)); }
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) { return a + b*cos( 6.28318*(c*t+d) ); }

	
// checkers, in smooth xor form
float checkers( in vec3 p )
{
    vec2 s = sign(fract(p.xz*.5)-.5);
    return .5 - .5*s.x*s.y;
}

//----------------------------------------------------------------------------------------------



vec2 map(in vec3 p) 
{    
    float d2Plane=sdPlane(p,vec4(0.0,1.0,0.0,0.0));

    vec2  grid_id = floor((p.xz+1.0)/2.0);    
    float fSeed = hash(grid_id);
    float fSeed2 = hash(grid_id+248.0);
    
    p.xz = mod( p.xz+1.0, 2.0 ) - 1.0;        
    
    float a =fSeed*TWO_PI+iTime*(1.0+fSeed2*3.0)*sign(fSeed-0.5);
    vec2 sc = cossin(a);
   	
    // deformation 
    p.xz +=cossin(p.y*sign(fSeed)+iTime*(5.0+fSeed2)+fSeed*TWO_PI).yx*0.2;
    
    // jump anim
    p.y-=0.7+sin(iTime*(1.0+fSeed2*5.0)+fSeed)*0.5;
    
    // Body
    float h = 1.0+fSeed2;
    float r = sin(p.y*PI+fSeed*TWO_PI+iTime*10.0)*(0.05+fSeed2*0.05-0.025)+0.25;    
    float d2Body =  sdVerticalCapsule(p, h, r);
    
    // Arms
    float r2 = r*2.5;
    float armH = h*0.6+fSeed2*0.3;
    float armL = h*0.4+fSeed*0.2 + abs(sin(iTime*(1.0+fSeed*1.0)+fSeed2));
    d2Body=opSmoothUnion(d2Body, sdCapsule(p, vec3(sc.x*r,armH,sc.y*r), vec3(sc.x*r2,armL,sc.y*r2) ,0.1), 0.2);
    d2Body=opSmoothUnion(d2Body, sdCapsule(p, vec3(-sc.x*r,armH,-sc.y*r), vec3(-sc.x*r2,armL,-sc.y*r2) ,0.1), 0.2);
    
    // Mouth
    float mouthR = max(0.0,sin(iTime*(0.7+fSeed2)+fSeed)*sin(iTime*(2.0+fSeed)+fSeed2)*0.15+0.1);
    float d2Mouth = sdSphere(p+vec3(-sc.y*r,-h*(0.7+fSeed2*0.2),sc.x*r),mouthR);
    
    // Eyes
    vec2 eye1 = cossin(a+Q_PI);
    vec2 eye2 = cossin(a+Q_PI+H_PI);
    float eyeS = 0.12;     
    float d2Eyeball = min(sdSphere(p+vec3(eye1.x*r,-h,eye1.y*r),eyeS),sdSphere(p+vec3(eye2.x*r,-h,eye2.y*r),eyeS) );
    float pupilS = 0.07;
    float r3=r+eyeS;
    float d2Pupil = min(sdSphere(p+vec3(eye1.x*r3,-h,eye1.y*r3),pupilS),sdSphere(p+vec3(eye2.x*r3,-h,eye2.y*r3),pupilS) );
    float d2Eye = max(d2Eyeball, -d2Pupil);
    
    if (d2Plane<d2Body)
   		return vec2(-1.0, d2Plane);
    else if (d2Eye<d2Body)       
        if (d2Pupil  < d2Eyeball )
            return vec2(-4.0, d2Pupil);
		else            
        	return vec2(-3.0, d2Eyeball);
    else
    {
     	if(d2Body > -d2Mouth)   
        	return vec2(fSeed,d2Body);
        else
            return vec2(-2.0,-d2Mouth);
    }
}

vec3 normal( in vec3 pos,in float epsilon )
{
	vec3 eps = vec3( 0.003, 0.0, 0.0 );
	vec3 nor = vec3(
	    map(pos+eps.xyy).y - map(pos-eps.xyy).y,
	    map(pos+eps.yxy).y - map(pos-eps.yxy).y,
	    map(pos+eps.yyx).y - map(pos-eps.yyx).y );
	return normalize(nor);
}



float AO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float hr = 0.01 + 0.10*float(i)/4.0;
        vec3 aopos =  nor * hr + pos;
        float dd = map( aopos ).y;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );    
}

float softShadows( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ )
    {
		float h = map( ro + rd*t ).y;
        res = min( res, 7.0*h/t );
        t += clamp( h, 0.01, 0.2 );
        if( res<0.01 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

vec3 intersect( in vec3 ro, in vec3 rd, in float px, const float maxdist )
{
    vec3 res = vec3(-1.0);
    float t = 0.0;
    for( int i=0; i<256; i++ )
    {
	    vec2 IDdist = map(ro + t*rd);
        res = vec3( t, IDdist.x, float(i)/256.0 );
        if( IDdist.y<(px*t) || t>maxdist ) break;
        t += min( IDdist.y, 0.5 )*0.4;
    }
	return res;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy / iResolution.xx) -vec2( 0.5,0.5*iResolution.y/iResolution.x);
    
    float time = iTime*0.3;
  
    float cam_h = sin(time*0.5+1.0)*5.0+10.0;
    float cam_r = sin(time*1.7+2.0)*sin(time)*5.0+cam_h;
    
    vec3 ro = vec3(sin(time)*cam_r,cam_h,-cos(time)*cam_r); 
     
    vec3 rd = normalize(vec3(uv, 1.0)); // fov
    rd=rotateX(rd,PI/5.0);
    
    vec3 r = intersect(ro, rd, 0.3/iResolution.y, 100.0);                	
    
    // light
    vec3 p = ro+(rd*r.x);
    vec3 nor = normal(p,0.0001);
    vec3 light = normalize(vec3(-0.5,2.0,-1.0));
    float diffuse = dot(nor,light);
    float occlusion = AO(p,nor);
    vec3 ref = reflect( rd, nor );
    float specular = (r.y >=0.0 || r.y==-4.0) ? pow(clamp( dot( ref, light ), 0.0, 1.0 ),20.0) : 0.0;
    float shadow = softShadows(p,light,0.01,10.0);   
    
    vec3 color = r.y<0.0 ? 
        (r.y<-3.0 ? vec3(0.1) :
        (r.y<-2.0 ? vec3(1.0) :
        (r.y<-1.0 ? vec3(0.1) :
        checkers(p)*vec3(0.2)+0.2 ))) : 
        palette(r.y*100.,vec3(0.5),vec3(0.5),vec3(0.5),vec3(0.0,0.33,0.67));
    
    fragColor=vec4( vec3(1.0)*diffuse*specular + vec3(diffuse*0.5*shadow+0.5)*color,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
