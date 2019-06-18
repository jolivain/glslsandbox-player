/*
 * Original shader from: https://www.shadertoy.com/view/XtGfRG
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
const float phi = (1.+sqrt(5.))*.5;

float noise(vec3 p)
{
    return fract(
        sin(
            dot(p, vec3(12.4536728,432.45673828,32.473682))
        )*43762.342);
}

vec2 rotate(vec2 a, float b)
{
    float c = cos(b);
    float s = sin(b);
    return vec2(
        a.x * c - a.y * s,
        a.x * s + a.y * c
    );
}

float sdIcosahedron(vec3 p, float r)
{
    const float q = (sqrt(5.)+3.)/2.;

    const vec3 n1 = normalize(vec3(q,1,0));
    const vec3 n2 = vec3(sqrt(3.)/3.);

    p = abs(p/r);
    float a = dot(p, n1.xyz);
    float b = dot(p, n1.zxy);
    float c = dot(p, n1.yzx);
    float d = dot(p, n2.xyz)-n1.x;
    return max(max(max(a,b),c)-n1.x,d)*r; // turn into (...)/r  for weird refractive effects when you subtract this shape
}

float sdDodecahedron(vec3 p, float r)
{
    const vec3 n = normalize(vec3(phi,1,0));

    p = abs(p/r);
    float a = dot(p,n.xyz);
    float b = dot(p,n.zxy);
    float c = dot(p,n.yzx);
    return (max(max(a,b),c)-n.x)*r;
}

float scene(vec3 p)
{
    p.xy = rotate(p.xy, p.z*.05);

    float n = noise(floor((p)/4.));
    float shape = fract((floor(p.x/4.)+floor(p.y/4.)*2.)/4.);
    float spinOffset1 = floor(p.z/4.);
    float spinOffset2 = floor(p.z/4.+2.);
    float spinOffset3 = floor(p.z/4.+4.);


    p = mod(p,4.)-2.;
    p.xy = rotate(p.xy, iTime+spinOffset1);
    p.yz = rotate(p.yz, iTime+spinOffset2);
    p.zx = rotate(p.zx, iTime+spinOffset3);

    if (shape < .25) {
        return min(
            sdDodecahedron(p,1.),
            sdIcosahedron(p.zyx,1.)
        );
    } else if (shape < .5) {
        return max(
            sdDodecahedron(p,1.),
            -sdIcosahedron(p.zyx,.9)
        );
    } else if (shape < .75) {
        return max(
            -sdDodecahedron(p,.95),
            sdIcosahedron(p.zyx,1.)
        );
    } else {
        return max(
            sdDodecahedron(p,.95),
            sdIcosahedron(p.zyx,1.)
        );
    }
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy - .5;
    uv.x *= iResolution.x / iResolution.y;

    uv *= 1.+length(uv)*.5;

    vec3 cam = vec3(0,0,0);
    vec3 dir = normalize(vec3(uv,1));

    //cam.yz = rotate(cam.yz, .3);
    //dir.yz = rotate(dir.yz, .3);

    cam.z = iTime * 4.;
    dir.xy = rotate(dir.xy, iTime*.1);
    //dir.yz = rotate(dir.yz, iTime*.3);
    //dir.zx = rotate(dir.zx, iTime*.3);

    float t = 0.;
    float k = 0.;
    int ii = 0;
    for(int i=0;i<100;++i)
    {
        k = scene(cam+dir*t)*.55;
        t += k;
        if (k < .001) break;
	ii++;
    }

    vec3 h = cam+dir*t;
    vec2 o = vec2(.001, 0);
    vec3 n = normalize(vec3(
        scene(h+o.xyy)-scene(h-o.xyy),
        scene(h+o.yxy)-scene(h-o.yxy),
        scene(h+o.yyx)-scene(h-o.yyx)
    ));

    float iterFog = pow(1.-(float(ii)/100.), 2.);
    float light = pow(max(0.,n.x*.5+.5),2.);
    float vignette = smoothstep(2.,0.,length(uv));
    vec3 a = mix(vec3(.01,.01,.1),vec3(0,1,1),iterFog);
    vec3 b = mix(vec3(0,0,0),vec3(1,sin(iTime*.4)*.5+.5,cos(iTime*.4)*.5+.5),light*iterFog*4.);
    out_color.rgb = a + b;
    out_color *= vignette;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
