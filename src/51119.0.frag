/*
 * Original shader from: https://www.shadertoy.com/view/4tGfz3
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
const vec4 iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
mat3 rotx(float a) { mat3 rot; rot[0] = vec3(1.0, 0.0, 0.0); rot[1] = vec3(0.0, cos(a), -sin(a)); rot[2] = vec3(0.0, sin(a), cos(a)); return rot; }
mat3 roty(float a) { mat3 rot; rot[0] = vec3(cos(a), 0.0, sin(a)); rot[1] = vec3(0.0, 1.0, 0.0); rot[2] = vec3(-sin(a), 0.0, cos(a)); return rot; }
mat3 rotz(float a) { mat3 rot; rot[0] = vec3(cos(a), -sin(a), 0.0); rot[1] = vec3(sin(a), cos(a), 0.0); rot[2] = vec3(0.0, 0.0, 1.0); return rot; }

vec3 lightDir = normalize(vec3(1.5, 1.2, -1.0));
const float groundH = .05;

//https://www.shadertoy.com/view/4djSRW
float hash(vec2 p)
{
	#define HASHSCALE1 .1031
	vec3 p3  = fract(vec3(p.xyx) * HASHSCALE1);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}


// https://www.shadertoy.com/view/lsf3WH
float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
	
	vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}


// https://www.shadertoy.com/view/Ml2XDw
float smax(float a, float b, float k)
{
    return log(exp(k*a)+exp(k*b))/k;
}

// https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}


float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0))
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}


float opBentBox(in vec3 p, in vec3 v , float bend)
{
    float c = cos(bend*p.y);
    float s = sin(bend*p.y);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return sdBox(q, v);
}

float sdRoundBox( vec3 p, vec3 b, float r )
{
  vec3 d = abs(p) - b;
  return length(max(d,0.0)) - r
         + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf 
}

vec3 traceSphere(in vec3 ro, in vec3 rd, float r, out float t1, out float t2)
{
    t1=t2=-1.0;
    vec3 X = ro + rd * (dot(normalize(-ro), rd)) * length(ro);
    float disc = r*r-pow(length(X), 2.0);
    if (disc < 0.0) return vec3(1000000.0);
    disc=sqrt(disc);
    vec3 p=X-disc*rd;
    t1=length(p-ro);t2=t1+disc*2.;
    return p;
}

const int NOTHING = 0;
const int EYES = 1;

struct HitInfo
{
    int id;
    vec3 pos;
    float d;
};



HitInfo map(in vec3 rp)
{
	HitInfo hi;
    rp.x = abs(rp.x);
    hi.id = NOTHING;
    
    // head
    float head = sdRoundBox(rp*1.7, vec3(.04, .05, .2)*1., 0.1);
    head += length(rp + vec3(0.0, 0.0, 0.1)) - 0.15;
    head = smin(head, length(rp * vec3(1.1, 1.3, 1.0)+ vec3(0.0, -0.1, -.07)) -0.08, 0.05);
    
    // nostrils
    float nostril = length(rp * vec3(6.0, 10.0, 1.0) + vec3(-0.27, -.5, 0.25)) - 0.1;
    head = max(head, -nostril );
    
    // ears
    float ear = length(rp * vec3(1.0, 1.0, 5.0) + vec3(-0.05, -.14, -0.5)) - 0.02;
    head = smin(head, ear, 0.02);
    // eyes
    vec3 eyePos = vec3(-0.02, -0.11, -0.02);
    float eye = length(rp + eyePos) - 0.03;
    
    if(eye < 0.0) 
    {
    	hi.id = EYES;
        hi.pos = rp-eyePos;
        hi.d = eye;
        return hi;
    }

    head = min(head, eye);
    
    
    // mouth
    float mouth = sdBox(rotx(-0.2) * rp + vec3(0.0, 0.02, 0.215), vec3(0.15, 0.001 * max( -((rp.z))*25., 0.), 0.15));
    head = max(head, -mouth);
    
	// torso    
    float torso = length(rp * vec3(1.0, 1., 1.) + vec3(0.0, 0.12, -0.04)) - 0.13;
    torso = smin(torso, head, max(0.0, rp.z*1.));
    
    // legs
    float leg = sdRoundBox(rp + vec3(-.075, 0.2, -0.1), vec3(0.04, 0.3, 0.04)*.25, 0.04);
    float feet = sdBox(rp + vec3(-.075, 0.35, -0.07), vec3(0.07, 0.01, 0.06)*.25)-.025;
    leg = smin(leg, feet, 0.14);
    torso = smin(torso,leg, 0.04);
    
    // arms
   	float arm = opBentBox(rotz(0.8)*(rp + vec3(-0.15, 0.09, -0.08)), vec3(0.01, 0.3, 0.07*max(1.0, -rp.y*0.))*.25, 5.) - .02;
    const float fingerWidth = .03;
    const float fingerBend = 40.;
    const float fingerX = -0.185;
    const float roundness = .004;
    const float spacing = 0.025;
    const float smoothen = .02;
    const float fingerY = .184;
    
    float finger1 = opBentBox(rp + vec3(fingerX, fingerY, -0.08-spacing), vec3(fingerWidth, .02, .01)*.2, fingerBend)-roundness;
    arm = smin(finger1, arm, smoothen);

    float finger2 = opBentBox(rp + vec3(fingerX, fingerY, -0.08), vec3(fingerWidth, .02, .01)*.2, fingerBend)-roundness;
    arm = smin(finger2, arm, smoothen);

    float finger3 = opBentBox(rp + vec3(fingerX, fingerY, -0.08+spacing), vec3(fingerWidth, .02, .01)*.2, fingerBend)-roundness;
    arm = smin(finger3, arm, smoothen);
    
    head = smin(arm, torso, 0.05);
    
    
    float body = min(head, torso);
    hi.d = body;
    return hi;
}


vec3 grad(in vec3 rp)
{
    vec2 off = vec2(0.002, 0.0);
    vec3 g = vec3(map(rp + off.xyy).d - map(rp - off.xyy).d,
                  map(rp + off.yxy).d - map(rp - off.yxy).d,
                  map(rp + off.yyx).d - map(rp - off.yyx).d);
    return normalize(g);
}


float ao(in vec3 n, in vec3 rp)
{
    float dist = 0.1;
    rp += n*dist;
    float occ = 0.;
    const int steps = 4;
    
    for (int i = 0; i < steps; ++i)
    {
        float d = map(rp).d;
        float o= clamp(d/(dist*float(i + 1)), 0.0, 1.0);
        
        occ += o;
        rp += n * dist;
    }
    
    occ /= float(steps);
    return occ;
          
}


float fbm(in vec3 rp)
{
    rp += vec3(5.0, 0.0, 0.0);
    vec2 p = rp.xz*.2;
    float f = noise(p) * 0.5;
    f += noise(p * 2.) * 0.5 * 0.5;
    f += noise(p * 4.) * 0.5 * 0.5 * 0.5;
    return f;
}


float sampleGround(in vec3 rp)
{
    rp *= 3.;
    float texCol = 0.;
	float f = fbm(rp);
    texCol=1.-f;
    return texCol;
}

vec3 g_hitp = vec3(0.0);

vec3 groundNormal(in vec3 rp)
{
    float h0 = sampleGround(rp);
    vec2 off = vec2(0.1, 0.0);
    float h1 = h0 - sampleGround(rp + off.xyy);
    float h2 = h0 - sampleGround(rp + off.yyx);
    float h =.5;
    vec3 f=(vec3(off.x, h1*h, 0.0));
    vec3 u=(vec3(0.0, h2*h, off.x));
    vec3 n = normalize(cross(u, f));
    n += (1.0 - 2.0 * texture(iChannel3, rp.xz*2.).rgb)*.15;
    n = normalize(n);
    return n*vec3(-1.0, 1.0, -1.0);
}


bool trace(in vec3 rp, in vec3 rd, inout vec4 color)
{
 
    bool hit = false;
    vec3 ro = rp;
    float dist = 0.0;
    HitInfo hi;
    
    // trace to character bounding sphere
    float t1, t2 = 0.0;
    traceSphere(ro, rd, .38, t1, t2);
    
    // character
    if(t1 > 0.0)
    {
        rp = ro + t1 * rd;
        for (int i = 0; i < 140; ++i)
        {
            hi = map(rp);
            dist = hi.d;
            if(dist < 0.0)
            {
                hit = true;
                break;
            }
            rp += rd * max(dist*.2, 0.001);

            if(length(ro - rp) > t2) break;

        }
        rp += rd * dist*.5;
        hi = map(rp);
    }
	
    // character color
    vec3 albedo = vec3(180., 190., 200.)/255.;
    if(hi.id == EYES)
    {
        float off = .155;
        albedo = vec3(1.-smoothstep(off, off+.001, dot(hi.pos, normalize(vec3(0.0, 1., -1.0)))));
    }
           
    
    if(hit)
    {
        
        color = vec4(.0);
        vec3 g = grad(rp);
        g_hitp = rp;
        
        //diff
        float d = dot(g, lightDir);
        float wrap = 0.8;
        d = d+wrap/(1.0+wrap);
        d = clamp(d, 0.1, 1.0);
        color.rgb += d*albedo*.5;
        
        //ao
        color.rgb += ao(g, rp)*vec3(239., 219., 159.)/255.*.15;
        
        // rim/fresn
        vec3 source = normalize(vec3(1.0, 2.0, 5.0));
        float rim = max(0.0, (dot(reflect(source, g), rd)));
        rim = pow(rim, 4.0)*.5;
        color.rgb += rim*vec3(.2, 0.2, 0.3);
        
        // some grounding for character + shadow
        color.rgb *= mix(vec3(1.0), vec3(0.2, 0.7, 0.9), 1.-smoothstep(-.7, 0.3, g.y));
        color.rgb *= 0.4 + 0.6 * smoothstep(-0.5, 0., rp.y);
    }
    
    float travel = length(ro - rp);
    vec3 hitp = ro;
    vec3 n = vec3(0.0, 1.0, 0.0);
    float t = (-dot(n, ro)+groundH)/dot(rd, n);
    
    // ground
    if(t > 0.)
    {
        hitp = ro + rd*t;

		float vdist = 0.0;
        
        // rougher tracing
        for (int i = 0; i < 40; ++i)
        {
            float texCol = sampleGround(hitp);
            vdist = hitp.y - (groundH - texCol);
            if(vdist < 0.)
            {
                break;
            }

            hitp += rd*.05*log(2.+dot(ro-hitp, ro-hitp));
        }
        
        // hone into the surface
        for (int i = 0; i < 40; ++i)
        {
            hitp += rd * vdist;
            float texCol = sampleGround(hitp);
            vdist = hitp.y - (groundH - texCol);
        }
		
        if(!hit || (travel > length(ro - hitp)))
        {
            // dif
            vec3 n = groundNormal(hitp);
            float d = dot(n, normalize(vec3(0.0, 1., 0)));
            d = clamp(d, 0.1, .99);
            vec3 groundCol = vec3(0.7, 1., 1.) *pow(d, 4.)*.5;
            
            // rim            
            float _rimd = 1.-(n.y * -rd.y);
            float rimd = pow(_rimd, 8.0) * 4.;
            rimd = clamp(rimd, 0.0, 1.0);
            
            groundCol += vec3(0.4, 0.6, 0.8) * rimd;
            groundCol += texture(iChannel1, hitp.xz*.02).rrr * texture(iChannel3, hitp.xz).rrr;
            
            float specd = dot(reflect(normalize(vec3(0., -1., 0.)), n), -rd); 
            specd = pow((clamp(specd, .0, 1.0)), 4.0) * .3;
            groundCol += vec3(0.8, 0.9, 1.0)*specd;
            
            color.rgb = groundCol;

            g_hitp = hitp;
		    
            color.rgb *= 0.5 + 0.5 * smoothstep(0.0, .5, length(hitp.xz));
        }
    }
    
    return hit;
}

    
mat3 lookat(vec3 from, vec3 to)
{
    vec3 f = normalize(to - from);
    vec3 _tmpr = normalize(cross(f, vec3(0.0, 1.0, 0.0)));
    vec3 u = normalize(cross(_tmpr, f));
    vec3 r = normalize(cross(u, f));
    return mat3(r, u, f);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv -= vec2(0.5);
    uv.y /= iResolution.x / iResolution.y;

    vec2 im = 2.0 * ((iMouse.xy / iResolution.xy) - vec2(0.5));
    im.y *= .75;
    vec3 rd = normalize(vec3(uv, .4));
    vec3 rp = vec3(0.0, 1., -1.);
    vec3 _rp = rp;
    rp = roty(im.x) * rp;
    rp.y = (rotx(im.y) *_rp).y;
    
    if(iMouse.z <= 0.0)
    {
        float T = iTime * .2;
        rp.x = sin(T+.4);
        rp.y = sin(T) * 0.25 + .3;
        rp.z = -0.6;
    }
    
    rd = lookat(rp, vec3(0.0)) * rd;
    vec4 bgCol = vec4(.0, .1+rd.y*.2, 0.2, 0.15)*.15;
    bool hit = trace(rp, rd, fragColor);
    
    float light = smoothstep(5.0, 1.0, length(g_hitp));
    fragColor.rgb = mix(fragColor.rgb, vec3(0.0, 0.0, 0.02), .99-light);
    if(!hit)
    {
	    fragColor.rgb = mix(fragColor.rgb, bgCol.rgb, smoothstep(-0.15, 0., rd.y));
        
        vec2 starCoord = vec2( atan(rd.x, rd.z), rd.y);
        vec3 stars = texture(iChannel0,starCoord).rrr*smoothstep(-1., .1, rd.y);
        stars = smoothstep(0.5, 1.0, stars-.3);
        stars *= texture(iChannel0, starCoord+vec2(iTime*.02)).rrr;
        fragColor.rgb += stars;
        
    }
    
    fragColor.rgb = pow(fragColor.rgb, vec3(1.0 / 2.2));
    
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
