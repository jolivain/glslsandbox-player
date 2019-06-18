/*
 * Original shader from: https://www.shadertoy.com/view/4dcyWS
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
const vec4  iMouse = vec4(0.);

// --------[ Original ShaderToy begins here ]---------- //

#define PI				3.1415926535
#define ABSORBANCE		1.0
//#define LIGHT_DIR		normalize(vec3(cos(-iTime*.3+PI*.5), 1.0, sin(-iTime*.3+PI*.5)))
#define LIGHT_DIR		normalize(vec3(1., 2., 0.))
//#define CAM_POS 		vec3(4.*cos(-iTime*.3), 4.0, 4.*sin(-iTime*.3))
#define CAM_POS 		vec3(1.5)


float yinDist(vec2 p)
{
    float R = 1.;    
    float r = .15;
    
    float d = length(p)-R;
    
    d = max(d, -(length(p-vec2(0.,R*.5))-R*.5));
    if(p.x>0.)
    {
    	d = max(d, length(p-vec2(0.,R)));
        
    	d = min(d, (length(p-vec2(0.,-R*.5))-R*.5));
    }
    
    d = min(d, length(p-vec2(0., R*.5))-r);
    d = max(d, -(length(p+vec2(0., R*.5))-r));
    
    
    return -d;
}

mat2 rot(float alpha)
{
    return mat2(cos(alpha), sin(alpha), -sin(alpha), cos(alpha));
}

// returns the distance to the plane, and the distance to the shape in the plane
vec2 intersectYin(vec3 ro, vec3 rd)
{
    vec2 res;
    res.x = (-0.-ro.y)/rd.y;
    //res.y = yinDist((ro+res.x*rd).xz*vec2(1., -1.));
    res.y = yinDist((ro+res.x*rd).xz*vec2(1., -1.)*rot(iTime));
    return res;
}

vec2 intersectYang(vec3 ro, vec3 rd)
{
    vec2 res;
    res.x = (-0.-ro.x)/rd.x;
    res.y = yinDist((ro+res.x*rd).yz*rot(iTime));
    return res;
}

vec3 render(in vec3 ro, in vec3 rd)
{
    vec3 col = vec3(0.5);
    
    vec2 ix = intersectYin(ro, rd);
    vec2 iy = intersectYang(ro, rd);
    
    float tx = ix.x;
    float ty = iy.x;
        
    vec3 px = ro+tx*rd;
    vec3 py = ro+ty*rd;
    
    float dx = ix.y;
    float dy = iy.y;
    
    
    vec4 colx = vec4(vec3(1.), clamp(dx/tx*iResolution.y, -1., 1.)*.5+.5);
    vec4 coly = vec4(vec3(.1), clamp(dy/ty*iResolution.y, -1., 1.)*.5+.5);
    
    if(tx<0.)
        colx.a=0.;
    if(ty<0.)
        coly.a=0.;
    
    //*
    //-------------------------------
    // SHADOWS
    vec2 ixs = intersectYang(px, LIGHT_DIR);
    vec2 iys = intersectYin(py, LIGHT_DIR);

    if(ixs.x>0.)
    {
        //float d = ixs.y/ix.x;
        float d = ixs.y/ix.x/ixs.x/5.;
        colx.rgb *= 1.-.7*(clamp(d*iResolution.y, -1., 1.)*.5+.5);
    }
    if(iys.x>0.)
    {
        float d = iys.y/iy.x/iys.x/10.;
        coly.rgb *= 1.-.7*(clamp(d*iResolution.y, -1., 1.)*.5+.5);
    }
    //*/
    
    /*
    //-------------------------------
    // REFLEXION
    vec2 ixr = intersectYang(px, reflect(ro, vec3(1., 0., 0.)));
    vec2 iyr = intersectYin (py, reflect(ro, vec3(0., 1., 0.)));

    if(ixr.x>0.)
    {
        //float d = ixs.y/ix.x;
        float d = ixr.y/ix.x;
        colx.rgb = mix(colx.rgb, coly.rgb, (clamp(d*iResolution.y, -1., 1.)*.5+.5));
    }
	//*/
    
    
    //-------------------------------
    // MIXING
    if(0.<tx && tx<ty || ty<0.)
    {
        col = mix(col, coly.rgb, coly.a);
        col = mix(col, colx.rgb, colx.a);
    }
    else if(0.<ty && ty<tx || tx<0.)
    {
        col = mix(col, colx.rgb, colx.a);
        col = mix(col, coly.rgb, coly.a);
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
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/ iResolution.y;
        
    // mouse camera control
    float phi = (iMouse.x-0.5)/iResolution.x * PI * 2.0;
    float psi = -((iMouse.y-0.5)/iResolution.y-0.5) * PI;
    
    if(iMouse.x<1.0 && iMouse.y < 1.0)
    {
        phi = iTime * PI * 2.0*0.1;
        psi = cos(iTime*PI*2.0*0.1)*PI*0.25;
    }
    
    // ray computation
    vec3 ro = 2.6*vec3(cos(phi)*cos(psi), sin(psi), sin(phi)*cos(psi));
    if(iMouse.z < 0.5)
        ro = CAM_POS;
    vec3 ta = vec3(0.);
    mat3 m = setCamera(ro, ta, 0.0);
    vec3 rd = m*normalize(vec3(p, 2.));
    
    // scene rendering
    vec3 col = render( ro, rd);
    
    // gamma correction
    col = sqrt(col);

    fragColor = vec4(col, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
