/*
 * Original shader from: https://www.shadertoy.com/view/tdjXWm
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy emulation
#define iTime time
#define iResolution resolution
vec4  iMouse = vec4(0.0);

// --------[ Original ShaderToy begins here ]---------- //
//https://www.shadertoy.com/view/4ds3zn

#define AA 1

vec4 orb = vec4(0.);

float map( vec3 p, float s )
{
	float scale = 1.0;

	orb = vec4(1000.0); 
	
	for( int i=0; i<8;i++ )
	{
		p = -1.0 + 2.0*fract(0.5*p+0.5);

		float r2 = dot(p,p);
		
        orb = min( orb, vec4(abs(p),r2) );
		
		float k = s/r2;
		p     *= k;
		scale *= k;
	}
	
	return 0.25*abs(p.y)/scale;
}

vec2 fragCoordinate = vec2(0.);
vec3 panomeraRay(){
    
    vec2 pix=( fragCoordinate.xy*2.0 - iResolution.xy) / iResolution.x;
	
    vec3 camP=vec3(
        0.05 * sin(iTime*0.2 ),
        0.05 * sin(iTime*0.15 ),
        0.1*iTime
    );

	vec3 camC= camP + vec3(
        0.3 * sin(iTime*0.05),
        0.3 * sin(iTime*0.06),
        1.);

    vec3 camA=vec3(0.3*sin(iTime*0.03),0.8,0.);
	vec3 camS=cross(normalize(camC-camP),camA);
	vec3 camU=cross(camS,normalize(camC-camP));
    
    vec3 camF = normalize(camC-camP );

    // panoramic projection by aiming rays using angles
    vec3 ray=normalize(
        camS*sin(pix.x*3.5) + camF*cos(pix.x*3.5) +
        camU*pix.y*3.14
    );
         
    vec3 rayP=camP;
    return ray;
}

float trace( in vec3 ro, in vec3 rd, float s )
{
	float maxd = 30.0;
    float t = 0.01;
    for( int i=0; i<200; i++ )
    {
	    float precis = 0.001 * t;
        
	    float h = map( ro+rd*t, s );
        if( h<precis||t>maxd ) break;
        t += h;
    }

    if( t>maxd ) t=-1.0;
    return t;
}

vec3 calcNormal( in vec3 pos, in float t, in float s )
{
    float precis = 0.001 * t;

    vec2 e = vec2(1.0,-1.0)*precis;
    return normalize( e.xyy*map( pos + e.xyy, s ) + 
					  e.yyx*map( pos + e.yyx, s ) + 
					  e.yxy*map( pos + e.yxy, s ) + 
                      e.xxx*map( pos + e.xxx, s ) );
}

vec3 render( in vec3 ro, in vec3 rd, in float anim )
{

    // trace	
    vec3 col = vec3(0.0);
    float t = trace( ro, panomeraRay(), anim );
    if( t>0.0 )
    {
        vec4 tra = orb;
        vec3 pos = ro + t*rd;

        vec3 nor = calcNormal( pos, t, anim );

        // lighting
        vec3  light1 = vec3(  0.577, 0.577, -0.577 );
        vec3  light2 = vec3( -0.707, 0.000,  0.707 );
        float key = clamp( dot( light1, nor ), 0.0, 1.0 );
        float bac = clamp( 0.2 + 0.8*dot( light2, nor ), 0.0, 1.0 );
        float amb = (0.7+0.3*nor.y);
        float ao = pow( clamp(tra.w*2.0,0.0,1.0), 1.2 );

        vec3 brdf  = 1.0*vec3(0.40,0.40,0.40)*amb*ao;
        brdf += 1.0*vec3(1.00,1.00,1.00)*key*ao;
        brdf += 1.0*vec3(0.40,0.40,0.40)*bac*ao;

        // material		
        vec3 rgb = vec3(1.0);
        rgb = mix( rgb, vec3(1.0,0.80,0.2), clamp(6.0*tra.y,0.0,1.0) );
        rgb = mix( rgb, vec3(1.0,0.55,0.0), pow(clamp(1.0-2.0*tra.z,0.0,1.0),8.0) );

        // color
        col = rgb*brdf*exp(-0.2*t);
    }

    return sqrt(col);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fragCoordinate = fragCoord;
    float time = iTime*0.25 + 0.01*iMouse.x;
    float anim = 1.1 + 0.5*smoothstep( -0.3, 0.3, cos(0.1*iTime) );
    
    vec3 tot = vec3(0.0);
    #if AA>1
    for( int jj=0; jj<AA; jj++ )
    for( int ii=0; ii<AA; ii++ )
    #else
    int ii = 1, jj = 1;
    #endif
    {
        vec2 q = fragCoord.xy+vec2(float(ii),float(jj))/float(AA);
        vec2 p = (2.0*q-iResolution.xy)/iResolution.y;

        // camera
        vec3 ro = vec3( 1., 1., 2.8*cos(0.5+0.35*time) );
        vec3 ta = vec3( 1., 1., 1.9*cos(2.0+0.38*time) );
        float roll = 0.2*cos(0.1*time);
        vec3 cw = normalize(ta-ro);
        vec3 cp = vec3(sin(roll), cos(roll),0.0);
        vec3 cu = normalize(cross(cw,cp));
        vec3 cv = normalize(cross(cu,cw));
        vec3 rd = normalize( p.x*cu + p.y*cv + 2.0*cw );

        tot += render( ro, panomeraRay(), anim );
    }
    
    tot = tot/float(AA*AA);
    
	fragColor = vec4( tot, 1.0 );	

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iMouse = vec4(mouse * resolution, 0.0, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
