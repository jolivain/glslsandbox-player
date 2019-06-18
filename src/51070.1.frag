/*
 * Original shader from: https://www.shadertoy.com/view/XtyfRc
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
/*
* License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
* Created by bal-khan
*/

#define E 0.0001

void rotate(inout vec2 p, float a)
{
	p = vec2(cos(a)*p.x+sin(a)*p.y, -sin(a)*p.x+cos(a)*p.y);
}

vec3 h = vec3(0.);

float mylength(vec3 p) {return max(abs(p.z), max(abs(p.x), abs(p.y)));}

vec2 modA(vec2 p, float c)
{
    float an = 6.28/c;
    float a = atan(p.x, p.y)+an*.5;
    a = mod(a, an)-an*.5;
    return vec2(cos(a), sin(a))*length(p);
}

float map(vec3 p)
{
	float m = 1e5;
    p.x -= 1.5*cos(iTime*.25);
    p.y += 1.5*sin(iTime*.5);
	rotate(p.xz, .25*sin(iTime));   
    vec3 op = p;
    
    float a = p.z*1.+ iTime*.0;
    
    p.xy += vec2(cos(a), sin(a))*.125;
    m = max(length(p.xy)-.7, -(length(p.xy)-.5));
    
    m = abs(m)+.001;
    
    h += vec3(.7, .42, .3)/max(.25, m*m*.0001 + 1.81);
    
    p = op;
    p.xy += .5*vec2(cos(a), sin(a))*.6;
    p.xy = modA(p.xy, 5.);p.x-=.75;
    p.z -= 2.-iTime;
    float id = floor(p.z);
    p.z = fract(p.z)-.5;
    float e = mix(length(p), mylength(p), ceil(mod(id, 2.)) )-.125;
    e = abs(e)-.001;

    e = abs(e)+0.001;
    m = min(m, e*.25);
    h += vec3(.51, .5, .3)/max(.25, e*e*100. + .181);

    p = op;
//    p.xy += vec2(cos(a), sin(a))*.6;
    rotate(p.xy, a*.1-iTime*.5);

    
    p.xy = fract(p.xy*.25)-.5;
    rotate(p.xy, p.z*1.5+iTime*10.*.25+sin(p.z+iTime)*3.14);
    p.xy = abs(p.xy)-.1051;
    rotate(p.xy, -p.z*1.5+iTime*-5.*.25+sin(-p.z+iTime*.5)*3.14);
    p.xy = abs(p.xy)-.051;
    
    
    float s = length(p.xy)-.0151+(.0071+1.0*.027*cos(p.z*1.*.5-(2.+iTime)));
    
    m = min(s, m);
    
    h += vec3(.1, .418, .93)/max(.25, s*s*10. + .81);
    return m;
}

void mainImage( out vec4 o, in vec2 f )
{
    h -= h ;
    vec2 R = iResolution.xy,u = (f-R*.5)/R.y;

    vec3 col = vec3(.0);
    vec3 ro = vec3(.0,.0,-1.);
    vec3 rd = vec3(u.xy, 1.);
    
    vec2 md = vec2(0.);
    vec3 p;
    for (int i = 0; i < 250; i++)
    {
        p = ro + rd*md.y;
    	md.x = map(p);
        md.y += md.x;
        if (md.y > 10. || md.x <= E)
            break;
        
    }
	col = h*.01;
    col /= max(1., md.y*.5);
    
    col+= md.y * vec3(.01, .13, .01)*0.051;
    col*= 1.-(length(u)*.75);
    o = vec4(col,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
