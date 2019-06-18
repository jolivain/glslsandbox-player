//from https://www.shadertoy.com/view/4tfGRr
////////mayrQ -heyll 2


#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2  mouse;
uniform vec2  resolution;

// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.




vec2 cmul( vec2 a, vec2 b )  { return vec2( a.x*b.x - a.x*b.y, a.x*b.y + a.y*b.y ); }
vec2 csqr( vec2 a )  { return vec2( a.x*a.y - a.y*a.x, 2.*a.x*a.x  ); }

vec3 dmul( vec3 a, vec3 b )  {
    float r = length(a);
    
    b.xy=cmul(normalize(a.xy), b.xy);
    b.yx=cmul(normalize(a.yx), b.yx);
    b.xz=cmul(normalize(a.xz), b.xz);
    
    return r*b;
}


vec3 pow4( vec3 z){
	z=dmul(z,z);return dmul(z,z);
}

vec3 pow3( vec3 z){
    float r2 = dot(z,z);
    vec2 a = z.xy;a=csqr(a)/dot( a,a);
    vec2 b = z.yz;b=csqr(b)/dot( b,b); 
    vec2 c = z.xz;c=csqr(c)/dot( c,c);
    z.xy = cmul(a,z.xy);   
    z.yz = cmul(b,z.yz);      
    z.xz = cmul(c,z.xz);
    return r2*z;
}

mat2 rot(float a) {
	return mat2(cos(a),sin(a),-sin(a),cos(a));	
}

float zoom=4.;



float field(in vec3 p) {
	
	float res = 0.;
	
    vec3 c = p;
	for (int i = 0; i < 10; ++i) {
		
        p = abs(p) / dot(p,p) -1.;
        p = dmul(p,p)+.7;
		res += exp(-6. * abs(dot(p,c)-.15));
		
	}
	return max(0., res/3.);
}



vec3 raycast( in vec3 ro, vec3 rd )
{
    float t = 4.0;
    float dt = .25;
    vec3 col= vec3(0.);
    for( int i=0; i<64; i++ )
	{
        
        float c = field(ro+t*rd);               
        t+=dt/(.15+c*c);
        c = max(11.0 * c - 1.9, 0.0);
        col = .97*col+ .08*vec3(0.5*c*c*c, .6*c*c, c);
		
    }
    
    return col;
}


void main(void)
{
	float time = time;
    vec2 q = gl_FragCoord.xy / resolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= resolution.x/resolution.y;
    vec2 m = vec2(4.);
//	if( mouse.y>0.0 )
//    m = mouse.xy/resolution.xy*3.14;
//    m-=2.5;

    // camera

    vec3 ro = zoom*vec3(1.);
    ro.yz*=rot(m.y+ 0.1*time);
    ro.xz*=rot(m.x+ 0.1*time);
//    vec3 ro = vec3(-1.5 + 3.2*-sin(0.1*time + 18.0*mouse.x), 1.0 + 2.0*mouse.y, 1.5 + 3.2*cos(0.1*time + 18.0*mouse.x));
    vec3 ta = vec3( 1.0 , 0.0, 0.0 );
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    vec3 rd = normalize( p.x*uu + p.y*vv + 4.0*ww );
    

	// raymarch
    vec3 col = raycast(ro,rd);
    
	
	// shade
    
    col =  .75 *(log(1.+col));
    col = clamp(col,0.,1.);
    gl_FragColor = vec4( sqrt(col), 1.0 );

}

