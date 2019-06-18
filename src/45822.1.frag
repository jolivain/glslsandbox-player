/*
 * Original shader from: https://www.shadertoy.com/view/MddyWX
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
// Code by Flopine
// Thanks to wsmind and leon for teaching me :)


#define PI 3.141592
#define TAU 2.*PI

mat2 rot (float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c,s,-s,c);
}


vec2 moda (vec2 p, float per)
{
    float a = atan(p.y,p.x);
    float l = length(p);
    a = mod(a-per/2.,per)-per/2.;
    return vec2 (cos(a),sin(a))*l;
}

// iq's palette http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos(TAU*(c*t+d));
}


float sphe (vec3 p, float r)
{
    return length(p)-r;
}

float box (vec3 p, vec3 c)
{
    return length(max(abs(p)-c,0.));
}

float prim (vec3 p)
{
    float b = box(p, vec3(1.));
    float s = sphe(p,1.3);
    return max(-s, b);
}

float row (vec3 p, float per)
{
	p.y = mod(p.y-per/2., per)-per/2.;
    return prim(p);
}

float squid (vec3 p)
{
    p.xz *= rot(PI/2.);
    p.yz = moda(p.yz, TAU/5.);
    p.z += sin(p.y+iTime*2.);
    return row(p,1.5);
}

float SDF(vec3 p)
{
    p.xz *= rot (iTime*.8);
    p.yz *= rot(iTime*0.2);
    p.xz = moda(p.xz, TAU/12.);
    return squid(p);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = 2.*(fragCoord/iResolution.xy)-1.;
	uv.x *= iResolution.x/iResolution.y;
    
    vec3 p = vec3 (0.01,3.,-8.);
    vec3 dir = normalize(vec3(uv*2.,1.));
    
    float shad = 1.;
    
    for (int i=0;i<60;i++)
    {
        float d = SDF(p);
        if (d<0.001)
        {
            shad = float(i)/60.;
            break;
        }
        p += d*dir*0.5;
    }
    
    vec3 pal = palette(p.z,
        				vec3(0.5),
                      vec3(0.5),
                      vec3(.2),
                      vec3(0.,0.3,0.5)
                      );
    // Time varying pixel color
    vec3 col = vec3(1.-shad)*pal;

    // Output to screen
    fragColor = vec4(pow(col, vec3(0.45)),1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
