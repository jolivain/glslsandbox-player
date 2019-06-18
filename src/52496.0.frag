/*
 * Original shader from: https://www.shadertoy.com/view/3dS3Rd
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

// --------[ Original ShaderToy begins here ]---------- //
#define ZERO (min(iFrame,0))

// Volumes

float sdPlane( vec3 p )
{
	return p.y;
}

float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float gyroid ( vec3 p, float s )
{
    return sin(p.x*s)*cos(p.y*s) + sin(p.y*s)*cos(p.z*s) + sin(p.z*s)*cos(p.x*s);
}

// Ops

float opS( float d1, float d2 )
{
    return max(-d2,d1);
}

vec2 opU( vec2 d1, vec2 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}

vec3 opRep( vec3 p, vec3 c )
{
    return mod(p,c)-0.5*c;
}

vec3 opTwist( vec3 p )
{
    float  c = cos(10.0*p.y+10.0);
    float  s = sin(10.0*p.y+10.0);
    mat2   m = mat2(c,-s,s,c);
    return vec3(m*p.xz,p.y);
}

vec2 map( in vec3 pos )
{
    float d = sdBox( pos-vec3(0, 0, 0), vec3(1, 1, 1) );
    
    d = opS(d, sdBox(pos-vec3(0, 0, 0), vec3(0.5, 0.5, 2)));
    
    d = gyroid(pos, 1.0);
    
    return vec2(d, 1);
}

vec3 calcNormal( in vec3 pos )
{
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
    return normalize( e.xyy*map( pos + e.xyy ).x + 
					  e.yyx*map( pos + e.yyx ).x + 
					  e.yxy*map( pos + e.yxy ).x + 
					  e.xxx*map( pos + e.xxx ).x );
}

vec2 castRay( in vec3 ro, in vec3 rd )
{
    float tmin = 1.0;
    float tmax = 1000.0;
    
    float t = tmin;
    float m = -1.0;
    for( int i=0; i<256; i++ )
    {
	    float precis = 0.0004*t;
	    vec2 res = map( ro+rd*t );
        if( res.x<precis || t>tmax ) break;
        t += res.x;
	    m = res.y;
    }

    if( t>tmax ) m=-1.0;
    return vec2( t, m );
}

vec3 render( in vec3 ro, in vec3 rd )
{
    // Sky color
    vec3 col = vec3(0);
    //vec3 col = vec3(0.7, 0.9, 1.0) +rd.y*0.8;
    
    vec2 res = castRay(ro,rd);
    float t = res.x;
	float m = res.y;
    
    
    if( m>-0.5 )
    {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos );
        
        float a = abs(dot( rd, nor ));
        
		vec3 lig = normalize( vec3(-0.5, 0.5, -0.5) );
        
        vec3 hal = normalize( lig-rd );
        float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
        float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );
        float bac = clamp( dot( nor, normalize(vec3(-lig.x,0.0,-lig.z))), 0.0, 1.0 )*clamp( 1.0-pos.y,0.0,1.0);
        
		float spe = pow( clamp( dot( nor, hal ), 0.0, 1.0 ),16.0)*
                    dif *
                    (0.04 + 0.96*pow( clamp(1.0+dot(hal,rd),0.0,1.0), 5.0 ));
        
		vec3 lin = vec3(0.0);
        //lin += 1.0*dif*vec3(1.0,1.0,1.0);
        lin += 1.0*fre*vec3(1.00,1.00,1.00);
        //lin += 0.50*bac*vec3(0.25,0.25,0.25);
        
		//col += 9.00*spe*vec3(1.00,0.90,0.70);
        
        
        col = lin;
    }
    
    return col;
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Time
	float time = iTime;
    
    float spin = time * 0.5;
    float bob = time * 0.5;
    float pan = time * 0.5;

    // pixel coordinates
    vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
    
    // Camera
    float ox = cos(spin)*5.0;
    float oy = sin(bob)*2.0;
    float oz = sin(spin)*5.0;
    vec3 ro = vec3(ox, oy, oz);
    vec3 ta = vec3(0, 0, 0);
    
    ro = vec3(pan, pan, -pan) + vec3(1, 0, 1);
    ta = ro + vec3(1, 1, -1);
    
    // camera-to-world transformation
    mat3 ca = setCamera( ro, ta, 0.0 );
    // ray direction
    vec3 rd = ca * normalize( vec3(p.xy,1.0) );
    
    // Render from origin, along direction
    vec3 col = render(ro, rd);

    // Output to screen
    fragColor = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
