/*
 * Original shader from: https://www.shadertoy.com/view/wsfXz4
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
/*
	This shader was created live on stream!
	You can watch the VOD here: https://www.twitch.tv/videos/384007580

	I use the Bonzomatic tool by Gargaj/Conspiracy:
	https://github.com/Gargaj/Bonzomatic

	Wednesdays around 9pm UK time I stream at https://twitch.tv/lunasorcery
	Come and watch a show!

	~yx
*/

#define pi acos(-1.)
#define tau (pi*2.)

vec2 rotate(vec2 a, float b)
{
    float c = cos(b);
    float s = sin(b);
    return vec2(
        a.x * c - a.y * s,
        a.x * s + a.y * c
    );
}

float sdBox(vec3 p, vec3 r)
{
    p=abs(p)-r;
    return max(max(p.x,p.y),p.z);
}

float sdXor(float a, float b)
{
    return min(max(a,-b),max(-a,b));
}

float scene2(vec3 p)
{
    p=abs(p)-.3+sin(iTime)*.1;
    p=abs(p)-.1;
    p=abs(p);
    return max(p.x,p.y)-.05;

    return sdBox(p,vec3(.3));
}

const float REP = 9.;

float scene3(vec3 p)
{
    vec3 cell = floor((p-REP)/(REP*2.));
    p = mod(p-REP,REP*2.)-REP;
    p.xz = rotate(p.xz, iTime+cell.x+cell.y/2.+cell.z/4.);
    vec3 a=vec3(
        length(p.xz)-6.,
        p.y,
        atan(p.x,p.z)/tau
    );
    a.xy = rotate(a.xy, iTime);
    return max(sdXor(p.x,p.z),scene2(a));
}

float scene4(vec3 p)
{
    return min(
        scene3(p),
        scene3(p+vec3(REP))
    );
}

float scene(vec3 p)
{
    // experimental mirroring thing
    //p = abs(mod(p,REP*4.)-REP*2.);

    return min(
        scene4(p.xyz),
        min(
            scene4(p.yzx+vec3(0,0,REP)),
            scene4(p.zxy+vec3(REP,0,0))
        )
    );
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
    vec2 uv = fragCoord / iResolution.xy-.5;
    uv.x *= iResolution.x / iResolution.y;

    vec3 cam = vec3(0,0,-9);
    vec3 dir = normalize(vec3(uv, 1));

    cam.yz = rotate(cam.yz, .5);
    dir.yz = rotate(dir.yz, .5);
    cam.xz = rotate(cam.xz, pi/4.);
    dir.xz = rotate(dir.xz, pi/4.);

    float time = iTime*.25;
    cam.y += REP*.25;
    cam.z = -(time/pi)*REP*2.;
    cam.x = sin(time)*REP;
    dir.xy = rotate(dir.xy, sin(time*.3)*5.);
    dir.xz = rotate(dir.xz, cos(time*.1)*3.5);

    float t = 0.;
    float k = 0.;
    for (int i=0;i<100;++i) {
        k=scene(cam+dir*t);
        t+=k;
        if(abs(k)<.001)
        {
            break;
        }
    }

    vec3 h = cam+dir*t;
    vec2 o = vec2(.001, 0);
    vec3 n = normalize(vec3(
        scene(h+o.xyy)-scene(h-o.xyy),
        scene(h+o.yxy)-scene(h-o.yxy),
        scene(h+o.yyx)-scene(h-o.yyx)
    ));

    float fog = dot(-dir,n) * pow(.96, t);

    n.xz = rotate(n.xz, -cos(time*.1)*3.5);
    n.xy = rotate(n.xy, -sin(time*.3)*5.);
    float light = pow(n.x*.5+.5,4.);

    out_color.rgb = vec3(0);
    out_color.rgb += mix(vec3(0,0,0.02), vec3(.1,.2,1), fog);
    out_color.rgb += mix(vec3(0,0,0), vec3(.1,1.3,1.7), light*fog);
    out_color *= 1.3-dot(uv,uv);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
