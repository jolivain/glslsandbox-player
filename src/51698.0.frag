/*
 * Original shader from: https://www.shadertoy.com/view/tdXGWM
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Created by S. Guillitte 2015


//Play with the detail level, change it!
#define DETAIL 5

//also play with this one
#define INNER_DEPTH 64

float zoom=1.;


vec2 cmul( vec2 a, vec2 b )  { return vec2( a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x ); }
vec2 csqr( vec2 a )  { return vec2( a.x*a.x - a.y*a.y, 2.*a.x*a.y  ); }


mat2 rot(float a) {
	return mat2(cos(a),sin(a),-sin(a),cos(a));	
}

vec2 iSphere( in vec3 ro, in vec3 rd, in vec4 sph )//from iq
{
	vec3 oc = ro - sph.xyz;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - sph.w*sph.w;
	float h = b*b - c;
	if( h<0.0 ) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b-h, -b+h );
}

vec3 map(in vec3 p) {
	
	float res = 0.;
	
    vec3 c = p;
	for (int i = 0; i < DETAIL; ++i) {
        p =.7*abs(p)/dot(p,p) -.7;
        p.yz= csqr(p.yz);
        p=p.zxy;
        res += exp(-19. * abs(dot(p,c)))+.02;
        
	}
	return res/1.65*normalize(p);
}



vec3 raymarch( in vec3 ro, vec3 rd, vec2 tminmax )
{
    float t = tminmax.x;
    float dt = .02;
    //float dt = .2 - .195*cos(iTime*.05);//animated
    vec3 col= vec3(0.);
    vec3 c = vec3( 0.);
    for( int i=0; i<INNER_DEPTH; i++ )
	{
        t+=dt*exp(-2.*length(c));
        if(t>tminmax.y)break;
        //vec3 pos = ro+t*rd;
        vec3 pos = refract( ro, (ro+t*rd)/.7,-.012);
        c = map(pos);//map(ro+t*rd);               
        
        float gr= .009;//.01*(2.0-float(i)/64.0);
        
        col = .995*col+ .09*c+vec3(gr,1.2*gr,1.2*gr);//vec3(c*c, c, c*c*c);//green	
        //col = .99*col+ .08*vec3(c*c*c, c*c, c);//blue
    }    
    return col;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	float time = iTime;
    vec2 q = fragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0 * q;
    p.x *= iResolution.x/iResolution.y;
    vec2 m = vec2(0.);
	if( iMouse.z>0.0 )m = iMouse.xy/iResolution.xy*3.14;
    m-=.5;

    // camera

    vec3 ro = zoom*vec3(4.);
    ro.yz*=rot(m.y);
    ro.xz*=rot(m.x+ 0.1*time);
    vec3 ta = vec3( 0.0 , 0.0, 0.0 );
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    vec3 rd = normalize( p.x*uu + p.y*vv + 4.0*ww );

    
    vec2 tmm = iSphere( ro, rd, vec4(0.,0.,0.,2.) );

	// raymarch
    vec3 col = raymarch(ro,rd,tmm);
    if (tmm.x<0.)col = texture(iChannel0, rd).rgb;
    else {
        vec3 nor=(ro+tmm.x*rd)/2.;
        nor = reflect(rd, nor);        
        float fre = pow(.5+ clamp(dot(nor,rd),0.0,1.0), 3. )*1.3;
        col += texture(iChannel0, nor).rgb * fre;
    
    }
	
	// shade
    
    col =  .5 *(log(1.+col));
    col = clamp(col,0.,1.);
    fragColor = vec4( col, 1.0 );

}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
