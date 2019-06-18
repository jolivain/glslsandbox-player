/*
 * Original shader from: https://www.shadertoy.com/view/wsfXDS
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Code by Flopine
// Thanks to wsmind, leon, XT95, lsdlive, lamogui, Coyhot and Alkama for teaching me
// Thanks LJ for giving me the love of shadercoding :3

// Cookie Collective rulz

// IF THIS SHADER IS GLITCHY ON YOUR GPU, TRY DISABLING LINE 49 AND 70
// (and if you have an explanation on why it's glitchy on some GPU... please tell me :D)

//#define time iTime
#define PI 3.141592


void moda (inout vec2 uv, float rep)
{
    float per = 2.*PI/rep;
    float a = atan(uv.y,uv.x);
    float l = length(uv);
    a = mod(a-per/2., per)-per/2.;
    uv = vec2(cos(a), sin(a))*l;
}


mat2 rot(float a)
{return mat2(cos(a),sin(a),-sin(a),cos(a));}


vec2 rand (vec2 x)
{return fract(sin(vec2(dot(x, vec2(1.2,5.5)), dot(x, vec2(4.54,2.41))))*4.45);}


// voronoi function which is a mix between Book of Shaders : https://thebookofshaders.com/12/?lan=en
// and iq article : http://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
vec3 voro (vec2 uv)
{
    vec2 uv_id = floor (uv);
    vec2 uv_st = fract(uv);

    vec2 m_diff;
    vec2 m_point;
    vec2 m_neighbor;
    float m_dist = 10.;

    for (int j = -1; j<=1; j++)
    {
        for (int i = -1; i<=1; i++)
        {
            vec2 neighbor = vec2(float(i), float(j));
            vec2 point = rand(uv_id + neighbor);
            point = 0.5+0.5*sin(2.*PI*point+time);
            vec2 diff = neighbor + point - uv_st;

            float dist = length(diff);
            if (dist < m_dist)
            {
                m_dist = dist;
                m_point = point;
                m_diff = diff;
                m_neighbor = neighbor;
            }
        }
    }

    m_dist = 10.;
    for (int j = -2; j<=2; j++)
    {
        for (int i = -2; i<=2; i++)
        {
            vec2 neighbor = m_neighbor + vec2(float(i), float(j));
            vec2 point = rand(uv_id + neighbor);
            point = 0.5+0.5*sin(point*2.*PI+time);
            vec2 diff = neighbor + point - uv_st;
            float dist = dot(0.5*(m_diff+diff), normalize(diff-m_diff));
            m_point = point;
            m_dist = min(m_dist, dist);
        }
    }

    return vec3(m_point, m_dist);
}


vec3 blue_grid (vec2 uv, float detail)
{
    uv *= detail;
    vec3 v = voro(uv);
    return clamp(vec3(v.x*0.8, v.y,1.)*smoothstep(0.05,0.07, v.z),0.,1.);
}


vec3 green_grid (vec2 uv, float detail)
{
    uv *= detail;
    vec3 v = voro(uv);
    return clamp(vec3(v.x, 1. ,v.y)*smoothstep(0.05,0.07, v.z),0.,1.);
}


vec3 red_grid (vec2 uv, float detail)
{
    uv *= detail;
    vec3 v = voro(uv);
    return clamp(vec3(1.,v.x, v.y)*smoothstep(0.05,0.07, v.z),0.,1.);
}


vec3 magenta_grid (vec2 uv, float detail)
{
    uv *= detail;
    vec3 v = voro(uv);
    return clamp(vec3(1.,v.y*0.8, v.x*4.)*smoothstep(0.05,0.07, v.z),0.,1.);
}


float ground_mask1 (vec2 uv, float offset)
{
    uv.y += 0.2;
    uv.y += sin(uv.x*3.)*0.08;
    return step(uv.y,0.-offset);
}


float ground_mask2 (vec2 uv, float offset)
{
    uv.y += 0.37;
    uv.y -= sin(uv.x*3.)*0.08;
    return step(uv.y,0.-offset);
}


float seaweed_mask (vec2 uv, float offset)
{

    vec2 uu = uv;
    uv.x = abs(uv.x);
    uv.x -=.7;
    uv.y += 0.8;
    uv.x += sin(uv.y*8.+time)*0.05;
    float line = step(abs(uv.x), (0.1-uv.y*0.1)-offset);

    uv = uu;
    uv.x = abs(uv.x);
    uv.x -= 0.4;
    uv.y += 1.1;
    uv.x += sin(uv.y*4.-time)*0.05;
    float line2 = step(abs(uv.x), (0.1-uv.y*0.1)-offset);

    uv = uu;
    uv.y += 1.8;
    uv.x += sin(uv.y*4.-time)*0.05;
    float line3 = step(abs(uv.x), (0.2-uv.y*0.1)-offset);
    return line + line2 + line3;
}


float sun_mask (vec2 uv, float offset)
{
    uv -= vec2(0.4,0.2);
    uv *= rot(time*0.15);
    float s = step(length(uv),0.18 - offset);

    moda(uv,5.);
    float l = step(abs(uv.y), (0.02+uv.x*0.1)-offset);
    return s + l;
}


vec3 ground (vec2 uv)
{
    float m1 = clamp(ground_mask1(uv,0.01) - ground_mask2(uv, 0.) - seaweed_mask(uv,0.),0.,1.);
    float m2 = clamp(ground_mask2(uv,0.01)- seaweed_mask(uv,0.),0.,1.);
    return red_grid(uv,28.) * m2 + magenta_grid(uv,20.) * m1;
}


vec3 seaweed (vec2 uv)
{
    return green_grid(uv,35.) * seaweed_mask(uv,0.01);
}


vec3 sun (vec2 uv)
{
    float m1 = clamp(sun_mask(uv,0.01) -  (ground_mask1(uv,0.) + ground_mask2(uv,0.) + seaweed_mask(uv,0.)),0.,1.);
    return red_grid((uv-vec2(0.4,0.2))*rot(time*0.15),18.)*m1;
}


vec3 sky (vec2 uv)
{
    float m1 = clamp(1. - (ground_mask1(uv,0.) + ground_mask2(uv,0.) + seaweed_mask(uv,0.) + sun_mask(uv,0.)),0.,1.);
    return blue_grid(uv,13.)*m1;
}


vec3 framed (vec2 uv)
{
    return ground(uv) + seaweed(uv) + sky(uv) + sun(uv);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
  uv -= 0.5;
  uv /= vec2(iResolution.y / iResolution.x, 1);

  vec3 col = framed(uv);
    
  fragColor = vec4(col, 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
