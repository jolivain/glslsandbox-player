/*
 * Original shader from: https://www.shadertoy.com/view/wdBGW3
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
float iTime = 0.0;
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
/*
	This shader was created live on stream!
	You can watch the VOD here: https://www.twitch.tv/videos/380157661

	I use the Bonzomatic tool by Gargaj/Conspiracy:
	https://github.com/Gargaj/Bonzomatic

	Wednesdays around 9pm UK time I stream at https://twitch.tv/lunasorcery
	Come and watch a show!

	~yx
*/

vec2 rotate(vec2 a, float b)
{
    float c=cos(b);
    float s=sin(b);
    return vec2(
        a.x*c-a.y*s,
        a.x*s+a.y*c
    );
}

float sdBox(vec3 p, vec3 r)
{
    p=abs(p)-r;
    return max(max(p.x,p.y),p.z);
}

float sdBox(vec3 p, vec3 a, vec3 b)
{
    return sdBox(p-(a+b)/2.,abs(b-a)/2.);
}

float sdPlane(vec3 p, vec4 n)
{
    n.xyz = normalize(n.xyz);
    return dot(vec4(p,1),n);
}

float sdCappedCylinder(vec3 p, vec4 r)
{

    return max(
        length(p.xy-r.xy)-r.z,
        abs(p.z)-r.w
    );
}

float noise(vec3 p)
{
    return fract(sin(dot(p,vec3(13.43672,4.534782,21.43672)))*234.432);
}

float sdSphere(vec3 p, float r)
{
    return length(p)-r;
}

float sdChamferBox(vec3 p, vec3 r, float R)
{
    p=abs(p);
    p=max(p,r-R);
    return (dot(p-r,vec3(1))+R+R)/sqrt(3.);
}

int mat=0;
vec3 cell=vec3(0.);

float sdDoor(vec3 p)
{
    float rail = sdBox(p, vec3(-.3,5.2,-10), vec3(.3,5.4,10));

    float yoffs = 5.5;
    p.y-=yoffs;
    p.xy = rotate(p.xy, sin(iTime*4.+cell.z*10.)*.1);
    p.y+=yoffs;

    vec3 np = p;

    float door = sdBox(p,vec3(2,4,.15));
    p.xz = abs(p.xz);
    p.z-=.2;
    door=max(door, -sdChamferBox(p, vec3(1.4,3.4,.1), .2));
    p.z+=.2;
    if(noise(cell)>.5)
        door = min(door, sdBox(p, vec3(-.1,3.5,0.03), vec3(.3,-3.5,.15)));
    if(noise(cell+1.)>.5)
        door = min(door, sdBox(p, vec3(-2,-.8,0.03), vec3(2,-.2,.15)));

    float frame = sdBox(p, vec3(2,-4.2,-.3), vec3(2.4,4.1,.3));
    frame = min(frame, sdBox(p, vec3(-.1, 4, -.3), vec3(2.4, 5., .3)));
    frame = min(frame, sdBox(p, vec3(-.1, -4.4, -.3), vec3(2.4, -4, .3)));
    frame = min(frame, sdBox(p, vec3(-.1, -4.55, -.2), vec3(.5, -4, .2)));
    frame = min(frame, sdBox(p, vec3(1, -4.55, -.2), vec3(1.6, -4, .2)));

    float frameMask = sdPlane(p, vec4(1,1,0,-4.7));
    frameMask = max(frameMask, sdPlane(p, vec4(.2,1,0,-4.9)));
    frameMask = max(frameMask, sdPlane(p, vec4(-.2,1,0,-4.4)));
    frameMask = min(frameMask, sdPlane(p, vec4(2,1,0,-2.7)));

    frame = max(frame, frameMask);
    frame = min(frame, sdCappedCylinder(p, vec4(0,4.5,.3,.36)));
    frame = min(frame, sdBox(p, vec3(.3, 5, -.3), vec3(.5,5.6,.3)));
    frame = min(frame, sdBox(p, vec3(-.5, 5.4, -.3), vec3(.5,5.6,.3)));

    frame = min(frame, sdSphere(np-vec3(1.5,-.5,.5), .25));

    float light = sdCappedCylinder(p, vec4(0,4.5,.22,.42));

    float dist = min(min(door,rail), min(frame, light));
    if (door == dist) {
        mat=1;
    } else if (light == dist) {
        mat=2;
    } else {
        mat=3;
    }

    return dist;
}

float scene(vec3 p)
{
    const float pi = acos(-1.);
    const vec3 cellsize = vec3(20, 18, 8);
    p.xy += p.z*p.z*.002;
    p.y -= iTime;
    p.z -= sign(sin(p.x/cellsize.x*pi)*sin(p.y/cellsize.y*pi))*iTime*25.; // thanks, theartofcode
    cell = floor(p/cellsize);
    p = mod(p, cellsize)-cellsize*.5;
    return sdDoor(p);
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
    vec2 uv = fragCoord/iResolution.xy - .5;
    uv.x *= iResolution.x / iResolution.y;

    vec3 cam = vec3(0,2,15);
    vec3 dir = normalize(vec3(uv,-1));

    cam.yz = rotate(cam.yz, -.1);
    dir.yz = rotate(dir.yz, -.1);

    vec3 bg = vec3(.1,.15,.2);

    float t = 0.;
    float k = 0.;
    for(int i=0;i<100;++i) {
        k=scene(cam+dir*t);
        t+=k;
        if(k<.001)
        {
            vec3 h = cam+dir*t;
            vec2 o=vec2(.02,0);
            vec3 n= normalize(vec3(
                scene(h+o.xyy)-scene(h-o.xyy),
                scene(h+o.yxy)-scene(h-o.yxy),
                scene(h+o.yyx)-scene(h-o.yyx)
            ));

            float light = dot(n,normalize(vec3(1,2,3)))*2.;

            if (mat == 1)
            {
                vec3 color = vec3(
                    noise(cell.xyz),
                    noise(cell.yzx),
                    noise(cell.zxy)
                )*.8+.2;
                out_color.rgb = vec3(light)*color;
            }
            else if (mat == 2)
            {
                out_color.rgb = light*vec3(1,.1,.1)*.7;
            }
            else
            {
                out_color.rgb = light*vec3(.5);
            }

            out_color.rgb = mix(bg, out_color.rgb, pow(.985, t-15.));

            return;
        }
    }
    out_color.rgb = bg;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
