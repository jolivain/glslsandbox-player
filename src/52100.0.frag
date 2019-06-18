/*
 * Original shader from: https://www.shadertoy.com/view/wsB3Rz
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
	You can watch the VOD here: https://www.twitch.tv/videos/366635236

	I use the Bonzomatic tool by Gargaj/Conspiracy:
	https://github.com/Gargaj/Bonzomatic

	Wednesdays around 9pm UK time I stream at https://twitch.tv/lunasorcery
	Come and watch a show!

	~yx
*/

#define pi (acos(-1.))
#define tau (pi*2.)

int mat;

vec2 rotate(vec2 a, float b)
{
    float c=cos(b);
    float s=sin(b);
    return vec2(
        a.x*c-a.y*s,
        a.x*s+a.y*c
    );
}

float field(vec3 p)
{
    float y = p.y+iTime + cos(p.x*2.)*.4 - cos(p.z*1.3)*.4;
    float r = sin(y*.5)*.4;
    p.y -= iTime*.5;
    vec3 cell = p;
    p = mod(p-.2,.4)-.2;
    return length(p)-r;
}

float field2(vec3 p)
{
    float y = p.y+iTime + cos(p.x*2.)*.4 - cos(p.z*1.3)*.4;
    float r = sin(y*.5)*1.1;
    p.y -= iTime*.5;
    vec3 cell = p;
    p = mod(p-.5,1.)-.5;
    return length(p)-r;
}

float outershape(vec3 p)
{
    return length(p)-3.;
}

float smin( float a, float b, float k )
{
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*k*(1.0/4.0);
}

float tick(float t)
{
    t= fract(t);
    t = smoothstep(0.,1.,t);
    t = smoothstep(0.,1.,t);
    return t;
}

float bettersign(float a)
{
    return step(0.,a)*2.-1.;
}

float cage(vec3 p)
{
    p.zx = rotate(p.zx, tick(iTime*.25)*sign(p.y)*pi*.5);

    p=abs(p);
    p.xy = vec2(max(p.x,p.y),min(p.x,p.y));
    p.yz = vec2(max(p.y,p.z),min(p.y,p.z)).yx;
    return max(
        max(
            length(p)-3.2,
            3.15-length(p)
        ),
        abs(mod(p.y+tick(iTime*.25),1.)-.5)-.02
    );
}

float scene(vec3 p)
{
    float ink = max(
        outershape(p),
        smin(
            field(p),
            field2(p),
            0.1
        )
    );

    float gold = cage(p);

    if (ink<gold){
        mat = 0;
        return ink;
    } else {
        mat = 1;
        return gold;
    }
}

vec3 trace(vec3 cam, vec3 dir)
{
    vec3 accum=vec3(1);
    int maxsteps = 100;
    for (int b=0;b<5;++b){
        float t= 0.;
        float k=0.;
        for(int i=0;i<100;++i){
            k = scene(cam+dir*t);
            t+=k;
            if(abs(k)<.001||i>=maxsteps)
                break;
        }
        vec3 h = cam+dir*t;
        vec2 o = vec2(.001,0);
        vec3 n = normalize(vec3(
            scene(h+o.xyy)-scene(h-o.xyy),
            scene(h+o.yxy)-scene(h-o.yxy),
            scene(h+o.yyx)-scene(h-o.yyx)
        ));

        if (k > 10.) {
            return accum*1.1;
        }
        else if (mat == 0) {
            float f = pow(1.-dot(-dir,n),5.);
            f = mix(.002,1.,f);
            accum *= f;
            cam = h + n * .01;
            dir = normalize(reflect(dir, n));

            // iter fog
            //return vec3(float(i)/100.) * accum;
        } else if (mat == 1) {
            accum *= vec3(.9,.5,.1).yyy;
            dir = normalize(reflect(dir, n));
            cam = h + dir * .01;
        }
        maxsteps/=2;
    }
    return vec3(0);
}

void mainImage(out vec4 out_color, vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy - .5;
    uv.x *= iResolution.x / iResolution.y;

    vec3 cam = vec3(0,0,-10);
    vec3 dir = normalize(vec3(uv,1.2));

    // alt camera
    //dir = normalize(vec3(uv,1));
    //dir.xz = rotate(dir.xz, -.15);
    //dir.yz = rotate(dir.yz, .05);

    cam.yz = rotate(cam.yz, pi/6.);
    dir.yz = rotate(dir.yz, pi/6.);

    cam.xz = rotate(cam.xz, pi/4.);
    dir.xz = rotate(dir.xz, pi/4.);

    out_color.rgb = trace(cam,dir);
    out_color.rgb = pow(out_color.rgb, vec3(.45));
    out_color *= 1.-dot(uv,uv)*.5;
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
