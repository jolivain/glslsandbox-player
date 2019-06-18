/*
 * Original shader from: https://www.shadertoy.com/view/tlfGWS
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
// Code by Flopine
// Thanks to wsmind, leon, XT95, lsdlive, lamogui, Coyhot, Alkama and YX for teaching me
// Thanks LJ for giving me the love of shadercoding :3

// Thanks to the Cookie Collective, which build a cozy and safe environment for me 
// and other to sprout :)  https://twitter.com/CookieDemoparty

//#define time iTime
const float ITER = 64.;
const float PI = 3.141592;

float rand (vec2 x)
{return fract(sin(dot(x, vec2(12.45,49.4564)))*1254.48);}

mat2 rot (float a)
{return mat2(cos(a),sin(a),-sin(a),cos(a));}

float cyl (vec3 p, float r, float h)
{return max(length(p.xy)-r, abs(p.z)-h);}

float glass (vec3 p)
{
    float body = cyl(p.xzy, 0.8+sin(p.y*3.)*0.05, 1.6);
    float final_body = abs(body) - 0.06;
    final_body = max(final_body,p.y-1.4);
    p.xy *= rot(-PI/8.);
    p.xy += vec2(1.,0.2);
    p.x -= sin((p.y-1.1)*PI/1.5)*0.7;
    float handle = max(cyl(p.xzy, 0.15, 1.), -body);
    return min(handle,final_body);
}

float beer (vec3 p)
{
    return max(p.y-1.2,  cyl(p.xzy, 0.72+sin(p.y*3.)*0.05, 1.6));
}

int mat_id;
float SDF (vec3 p)
{
    p.xz *= rot(time);
    float g= glass(p);
    float b = beer(p);
    float d = min(g,b);
    if (d == g) mat_id = 1;
    if (d == b) mat_id = 2;
    return d;
}

float beer_bottle (vec2 uv)
{
    uv -=0.5;
    float a = mix (-PI/5., -PI/3., clamp(floor(sin(time*PI)+1.),0.,1.));
    uv *= rot(a);
    float r = mix(0.15, 0.09 - uv.y*0.1, smoothstep(0.02,0.15, uv.y));
    return abs(uv.y) < 0.4 ? step(abs(uv.x), r) : 0.;
}

float checker (vec2 uv)
{
    uv.y += time*0.4;
    uv *= rot(PI/4.);

    vec2 uu = mod (fract(uv),2.);
    float c = beer_bottle(uu);
    uv = mod(floor(uv),2.);
    return mod(uv.x + uv.y,2.) == 0. ? 1.-c : 0.+c;
}

vec3 get_normals (vec3 p)
{
    vec2 eps = vec2(0.01,0.);
    return normalize(vec3(SDF(p+eps.xyy)-SDF(p-eps.xyy),
                          SDF(p+eps.yxy)-SDF(p-eps.yxy),
                          SDF(p+eps.yyx)-SDF(p-eps.yyx)
                         )
                    );
}

vec3 get_cam (vec3 ro, vec3 tar, vec2 uv)
{
    vec3 f = normalize(tar-ro);
    vec3 l = normalize(cross(vec3(0.,1.,0.),f));
    vec3 u = normalize(cross(f,l));
    return normalize(f + l*uv.x + u*uv.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);
    uv -= 0.5;
    uv /= vec2(iResolution.y / iResolution.x, 1);

    float dither = rand(uv);

    vec3 ro = vec3(0.001,2.5, -5.5); vec3 p = ro;
    vec3 tar = vec3(0.);
    vec3 rd =  get_cam(ro, tar, uv);

    // transparency trick from Shane shader: 
    // https://www.shadertoy.com/view/Xd3SDs 
    vec3 col = vec3(0.);
    vec3 lp = vec3(3, 1, 2);
    float shad = 0., t=0., layers = 0., d, aD;
    // light parameters
    float lDist, specular, lighting;
    // thickness of the geometry
    float thD = .00125;

    for (float i=0.; i<ITER; i++)
    {
        if(layers > 30. || t > 15.) break;
        p = ro+t*rd;
        d = SDF(p);

        aD = (thD-abs(d))/thD;
        if (aD>0.)
        {
            uv *= 0.98; // fake refraction trick thanks to alkama!
            if (mat_id == 2) col += vec3(0.8,0.3,0.)*0.2;
            vec3 sn = get_normals(p)*sign(d);
            vec3 ld = (lp - p);
            lDist = length(ld);
            ld /= lDist;
            specular = pow(max(dot(reflect(-ld, sn), -rd), 0.), 15.);
            lighting = max(dot(ld, sn), 0.);
            col += (lighting * 0.3 + vec3(0.1,0.2,0.5)*specular)*aD / (1.+lDist*0.25 + lDist*lDist*0.05)*0.5;
            if(mat_id == 2) col = mix(col, vec3(0.8,0.3,0.), 1.-exp(-0.05*aD*aD));
            layers ++;
        }
        d *= 0.8 + dither*0.02;
        t += max(abs(d), thD*0.25);
    }

    col += vec3(checker(uv*7.));

    t = min(t, 15.);
    col = mix(col, vec3(0.1), 1.-exp(-0.008*t*t));

    // vignetting (from iq)
    vec2 q = fragCoord.xy / iResolution.xy;
    col *= .5 + 0.5 * pow(16. * q.x * q.y * (1. - q.x) * (1. - q.y), 0.8);

    fragColor = vec4(pow(col,vec3(0.4545)), 1.);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
