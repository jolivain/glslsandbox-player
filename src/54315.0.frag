/*
 * Original shader from: https://www.shadertoy.com/view/MdVfWw
 */

#extension GL_OES_standard_derivatives : enable

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform vec4 date;

// shadertoy globals
#define iTime time
#define iResolution resolution

// -- Common -- //
#define PI 3.141592
#define FAR 50.0 
#define EPS 0.005

#define CA vec3(0.5, 0.5, 0.5)
#define CB vec3(0.5, 0.5, 0.5)
#define CC vec3(1.0, 1.0, 1.0)
#define CD vec3(0.0, 0.33, 0.67)

const vec3 ac = vec3(1.0, 0.6, 0.05);

mat2 rot(float x) {return mat2(cos(x), sin(x), -sin(x), cos(x));}
//IQ cosine palattes
//http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {return a + b * cos(6.28318 * (c * t + d));}

/* Distance functions IQ & Mercury */

float sdCaps(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h) - r;
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;    
}

float smin(float a, float b, float k) {
	float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

float planeIntersection(vec3 ro, vec3 rd, vec3 n, vec3 o) {
    return dot(o - ro, n) / dot(rd, n);
}

// see mercury sdf functions
// Repeat around the origin by a fixed angle.
// For easier use, num of repetitions is use to specify the angle.
float pModPolar(inout vec2 p, float repetitions) {
    float angle = 2.0 * PI / repetitions;
    float a = atan(p.y, p.x) + angle / 2.0;
    float r = length(p);
    float c = floor(a / angle);
    a = mod(a, angle) - angle / 2.0;
    p = vec2(cos(a), sin(a)) * r;
    // For an odd number of repetitions, fix cell index of the cell in -x direction
    // (cell index would be e.g. -5 and 5 in the two halves of the cell):
    if (abs(c) >= (repetitions / 2.0)) c = abs(c);
    return c;
}

/* Model - g prefix = glow */

float dfEars(vec3 p, float T) {
    p.z = abs(p.z);
    p.yz *= rot(1.1 + sin(T * 4.0) * 0.3);
    p.xy *= rot(-0.8);
    return smin(sdCaps(p, vec3(0.0, 0.6, 0.0), vec3(0.0, 0.9, 0.0), 0.4),
                sdCaps(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 0.9, 0.0), 0.1), 0.2);  
}

float gdfEars(vec3 p, float T) {
    p.z = abs(p.z);
    p.yz *= rot(1.1 + sin(T * 4.0) * 0.3);
    p.xy *= rot(-0.8);
    return sdCaps(p, vec3(0.0, 0.7, 0.0), vec3(0.0, 0.8, 0.0), 0.02);
}

float dfSnout(vec3 p) {
    p.xy *= rot(-0.2);
    return smin(sdCaps(p, vec3(-0.5, 0.0, 0.0), vec3(-0.9, 0.0, 0.0), 0.4),
                sdCaps(p, vec3(0.0, 0.0, 0.0), vec3(-1.4, 0.0, 0.0), 0.1), 0.2); 
}

float gdfSnout(vec3 p) {
    p.xy *= rot(-0.2);
    return sdCaps(p, vec3(-0.6, 0.0, 0.0), vec3(-0.8, 0.0, 0.0), 0.02);
}

float dfHead(vec3 p, float ofs, float T) {
    p.xy *= rot(0.4 + sin(T * 2.0) * 0.2);
    float neck = smin(sdCaps(p, vec3(0.0, 0.6, 0.0), vec3(0.0, 1.1, 0.0), 0.4),
                      sdCaps(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.7, 0.0), 0.1), 0.2); 
    float head = dfSnout(p - vec3(0.0, 1.7, 0.0));
    float ears = dfEars(p - vec3(0.0, 1.7, 0.0), T);
    float knot = sdSphere(p - vec3(0.0, 1.7, 0.0), 0.16);
    return min(min(head, knot), min(neck, ears));
}

float gdfHead(vec3 p, float ofs, float T) {
    p.xy *= rot(0.4 + sin(T * 2.0) * 0.2);
    float neck = sdCaps(p, vec3(0.0, 0.8, 0.0), vec3(0.0, 0.9, 0.0), 0.02);
    float head = gdfSnout(p - vec3(0.0, 1.7, 0.0));
    float ears = gdfEars(p - vec3(0.0, 1.7, 0.0), T);
    return min(head, min(neck, ears));
}

float dfLegs(vec3 p, float a) {
    p.z = abs(p.z);
    p.yz *= rot(-0.6);
    p.xy *= rot(a);
    return smin(sdCaps(p, vec3(0.0, -0.6, 0.0), vec3(0.0, -1.6, 0.0), 0.4),
                sdCaps(p, vec3(0.0, 0.0, 0.0), vec3(0.0, -2.1, 0.0), 0.1), 0.2);
}

float gdfLegs(vec3 p, float a) {
    p.z = abs(p.z);
    p.yz *= rot(-0.6);
    p.xy *= rot(a);
    return sdCaps(p, vec3(0.0, -1.0, 0.0), vec3(0.0, -1.2, 0.0), 0.02);
}

float dfTail(vec3 p, float a) {
    p.yz *= rot(a);
    p.xy *= rot(-0.5);
    return smin(sdCaps(p, vec3(0.0, 0.6, 0.0), vec3(0.0, 1.0, 0.0), 0.4),
                sdCaps(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.5, 0.0), 0.1), 0.2);  
}

float gdfTail(vec3 p, float a) {
    p.yz *= rot(a);
    p.xy *= rot(-0.5);
    return sdCaps(p, vec3(0.0, 0.7, 0.0), vec3(0.0, 0.9, 0.0), 0.02);
}

float dfDog(vec3 p, float ofs, float T) {
    
    p.xz *= rot(PI * -0.5);
    p.y -= 1.0 - sin((T + ofs) * 2.0); //jump
    
    float body = smin(sdCaps(p, vec3(-0.85, 0.0, 0.0), vec3(0.85, 0.0, 0.0), 0.4),
                     sdCaps(p, vec3(-1.4, 0.0, 0.0), vec3(1.4, 0.0, 0.0), 0.1), 0.2);
	body = min(body, sdSphere(p - vec3(-1.4, 0.0, 0.0), 0.16));
	body = min(body, sdSphere(p - vec3(1.4, 0.0, 0.0), 0.16));
               
    vec3 q = p;
    q.x = abs(q.x);
    float legs = dfLegs(q - vec3(1.4, 0.0, 0.0), 0.5 + sin((T + ofs) * 2.0) * 0.4);
    
    float waggle = sin(T * 8.0) * 0.4; //waggle tail
    float tail = dfTail(p - vec3(1.4, 0.0, 0.0), waggle); 
    float head = dfHead(p - vec3(-1.4, 0.0, 0.0), ofs, T);

    return min(body, min(tail, min(head, legs)));
}

float gdfDog(vec3 p, float ofs, float T) {
    
    p.xz *= rot(PI * -0.5);
    p.y -= 1.0 - sin((T + ofs) * 2.0); //jump
    
    float body = sdCaps(p, vec3(-0.5, 0.0, 0.0), vec3(0.5, 0.0, 0.0), 0.02);
               
    vec3 q = p;
    q.x = abs(q.x);
    float legs = gdfLegs(q - vec3(1.4, 0.0, 0.0), 0.5 + sin((T + ofs) * 2.0) * 0.4);
    
    float waggle = sin(T * 8.0) * 0.4; //waggle tail
    float tail = gdfTail(p - vec3(1.4, 0.0, 0.0), waggle); 
    float head = gdfHead(p - vec3(-1.4, 0.0, 0.0), ofs, T);

    return min(body, min(tail, min(head, legs)));
}

//https://www.shadertoy.com/view/lsdXDH
vec4 desaturate(vec3 c, float f) {
	vec3 lum = vec3(0.299, 0.587, 0.114);
	vec3 gray = vec3(dot(lum, c));
	return vec4(mix(c, gray, f), 1.0);
}

vec3 saturate(vec3 c) {
    return clamp(c, 0.0, 1.0);
}

// --------[ Original ShaderToy begins here ]---------- //
#define T iTime

//IQs noise
float noise(vec3 rp) {
    vec3 ip = floor(rp);
    rp -= ip; 
    vec3 s = vec3(7, 157, 113);
    vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
    rp = rp * rp * (3.0 - 2.0 * rp); 
    h = mix(fract(sin(h) * 43758.5), fract(sin(h + s.x) * 43758.5), rp.x);
    h.xy = mix(h.xz, h.yw, rp.y);
    return mix(h.x, h.y, rp.z); 
}

float fbm(vec3 x) {
    float r = 0.0;
    float w = 1.0;
    float s = 1.0;
    for (int i = 0; i < 5; i++) {
        w *= 0.5;
        s *= 2.0;
        r += w * noise(s * x);
    }
    return r;
}

// IQ anti-aliasing - see https://www.shadertoy.com/view/MtffWs
vec3 pri(vec3 x) {
    vec3 h = fract(x / 2.0) - 0.5;
    return x * 0.5 + h * (1.0 - 2.0 * abs(h));
}

float checkersTextureGradTri(vec3 p, vec3 ddx, vec3 ddy) {
    vec3 w = max(abs(ddx), abs(ddy)) + 0.01; // filter kernel
    vec3 i = (pri(p + w) - 2.0 * pri(p) + pri(p - w)) / (w * w); // analytical integral (box filter)
    return 0.5 - 0.5 * i.x *  i.y * i.z; // xor pattern
}

vec3 texCoords(vec3 p) {
	return 5.0 * p;
}

//Moody clouds from Patu
//https://www.shadertoy.com/view/4tVXRV
vec3 clouds(vec3 rd) {
    vec2 uv = rd.xz / (rd.y + 0.6);
    float nz = fbm(vec3(uv.yx * 1.4 + vec2(T * 0.013, 0.0), T * 0.013)) * 1.5;
    return clamp(pow(vec3(nz), vec3(4.0)) * rd.y, 0.0, 1.0);
}


vec2 map(vec3 p) {
	p.xz *= rot(T);    
    float ofs = pModPolar(p.xz, 5.0);
    return vec2(dfDog(p - vec3(8.0, 0.0, 0.0), ofs, T), ofs);;    
}

//inner glow
vec2 gmap(vec3 p) {
	p.xz *= rot(T);    
    float ofs = pModPolar(p.xz, 5.0);
    return vec2(gdfDog(p - vec3(8.0, 0.0, 0.0), ofs, T), ofs);;    
}

vec3 normal(vec3 p) {  
    vec2 e = vec2(-1., 1.) * EPS;   
	return normalize(e.yxx * map(p + e.yxx).x + e.xxy * map(p + e.xxy).x + 
					 e.xyx * map(p + e.xyx).x + e.yyy * map(p + e.yyy).x);   
}

float AO(vec3 p, vec3 n) {

    float r = 0.0;
    float w = 1.0;
    float d = 0.0;

    for (float i = 1.0; i < 5.0; i += 1.0){
        d = i / 5.0;
        r += w * (d - map(p + n * d).x);
        w *= 0.5;
    }

    return 1.0 - clamp(r, 0.0, 1.0);
}

//IQ https://www.shadertoy.com/view/lsKcDD
float shadow(vec3 ro, vec3 rd, float tmax) {
	
    float res = 1.0;
    float t = 0.0;
    float ph = 1e10; // big, such that y = 0 on the first iteration
    
    for(int i = 0; i < 32; i++) {
		float h = map(ro + rd * t).x;

        // use this if you are getting artifact on the first iteration, or unroll the
        // first iteration out of the loop
        //float y = (i==0) ? 0.0 : h*h/(2.0*ph); 

        float y = h*h/(2.0*ph);
        float d = sqrt(h*h-y*y);
        res = min( res, 10.0*d/max(0.0,t-y) );
        ph = h;
        
        t += h;
        
        if (res < EPS || t > tmax) break;
    }
    
    return clamp(res, 0.0, 1.0);
}

vec2 march(vec3 ro, vec3 rd) {
    float t = 0.0, id = 0.0;
    vec3 n = vec3(0.);
    for (int i = 0; i < 98; i++) {
        vec3 rp = ro + rd * t;
        vec2 ns = map(rp);
        if (ns.x < EPS || t > FAR) {
            id = ns.y;
            break;
        }
        t += ns.x * 0.6;
    }
    return vec2(t, id);
}

/*
//balloom interior
vec2 vMarch(vec3 ro, vec3 rd) {
    float t = 0.0, gc1 = 0., gc2 = 0.;
    for (int i = 0; i < 96; i++) {
        vec3 rp = ro + rd * t;
        float ns = map(rp).x;
        if (ns > 0.01 || t > FAR) break;
        
        vec2 gns = gmap(rp);
        gc1 += 0.1 / (1.0 + gns.x * gns.x * 10.);
        gc2 += 0.8 / (1.0 + gns.x * gns.x * 100.);
        
        t += 0.1;
    }
    return vec2(gc1, gc2);
}
*/

struct Scene {
    float t;
    float id;
    vec3 n;
    float did;
};

Scene drawScene(vec3 ro, vec3 rd) {

    float mint = FAR, id = 0., did = 0., rf = 0.;
    vec3 minn = vec3(0.);
    
    vec3 fn = vec3(0.0, 1.0, 0.0), fo = vec3(0.0, -2.0, 0.0);
    float ft = planeIntersection(ro, rd, fn, fo);
    if (ft > 0.0 && ft < FAR) {
        mint = ft;
        minn = fn;
        id = 1.0;
    }
    
    vec2 t = march(ro, rd);
        
    if (t.x > 0.0 && t.x < mint) {
        vec3 rp = ro + rd * t.x;
        mint = t.x;
        minn = normal(rp);
        id = 2.0;
        did = t.y;
    }
    
    return Scene(mint, id, minn, did);
}
        
vec3 colourScene(Scene scene, vec3 ro, vec3 rd) {
 
    vec3 pc = vec3(0.);
    vec3 lp = vec3(4.0, 5.0, -2.0);
    
    vec3 rp = ro + rd * scene.t;
    vec3 ld = normalize(lp - rp);
    float lt = length(lp - rp);
    float df = max(dot(ld, scene.n), 0.05);
    float atn = 1.0 / (1.0 + lt * lt * 0.01);
    float sh = 0.5 + 0.5 * shadow(rp, ld, 20.0);
    float sp = pow(max(dot(reflect(-ld, scene.n), -rd), 0.0), 64.0);
    float frs = pow(clamp(dot(scene.n, rd) + 1., 0., 1.), 2.);

    if (scene.id == 1.0) {
        
        // calc texture sampling footprint	
        vec3 uvw = texCoords(rp * 0.08);
		vec3 ddx_uvw = dFdx(uvw); 
    	vec3 ddy_uvw = dFdy(uvw);
        float fc = checkersTextureGradTri(uvw, ddx_uvw, ddy_uvw);
        fc = clamp(fc, 0.2, 0.8);
        pc = ac * (fc + noise(fc + rp * vec3(8.0 * fc, 1.0 *fc * 2.0, 0.5))) * df * atn * sh;

    } else if (scene.id == 2.0) {

        float ao = AO(rp, scene.n);
        df = max(dot(ld, scene.n), 0.8);

        //finally tried implemnting some of IQs suggestions and removed vMarch
        vec3 sc = palette((T + (scene.did + 2.0) * 2.0) * 0.1, CA, CB, CC, CD);
        pc = sc * ao;
        pc *= 1. - ao * 0.6;
        pc += sc * frs * 0.6;
        pc *= df;
        //pc *= df * 2.;
        pc += vec3(1.) * sp;
        
        //vec2 vc = vMarch(rp, rd);;
        //pc += sc * vc.x; //fake balloon volume
        //pc += sc * vc.y * max(sin(T * 0.4), 0.0); //glow
    }
    
    return pc;
}

void setupCamera(vec2 fragCoord, inout vec3 ro, inout vec3 rd) {

    vec2 uv = (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;

    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    ro = lookAt + vec3(0.0, 6.0 + sin(T * 0.5) * 5.0, -17.0 - sin(T * 0.3) * 3.);

    ro.xz *= rot(T * -0.2);
    
    float FOV = PI / 3.0;
    vec3 forward = normalize(lookAt - ro);
    vec3 right = normalize(vec3(forward.z, 0.0, -forward.x)); 
    vec3 up = cross(forward, right);

    rd = normalize(forward + FOV * uv.x * right + FOV * uv.y * up);
}

vec3 render(vec3 ro, vec3 rd) {
    
    vec3 pc = clouds(rd) * ac * 2.0;
    
    Scene scene = drawScene(ro, rd);
    if (scene.id > 0.0) {
        pc = colourScene(scene, ro, rd);
        //reflection
        vec3 rro = ro + rd * (scene.t - EPS);
        vec3 rrd = reflect(rd, scene.n);
        Scene rs = drawScene(rro, rrd);
        vec3 rc = colourScene(rs, rro, rrd);
        float rfatn = 1.0 / (1.0 + rs.t * rs.t * 0.1);
        pc += rc * rfatn * 0.5;
    }
    
    return pc; 
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {

    vec3 ro = vec3(0.), rd = vec3(0.);
    setupCamera(fragCoord, ro, rd);
    
    fragColor = vec4(render(ro, rd), 1.0);
}

void mainVR(out vec4 fragColor, in vec2 fragCoord, in vec3 fragRayOri, in vec3 fragRayDir) {    
    fragColor = vec4(render(fragRayOri * 4. + vec3(0.0,1.0,1.5), fragRayDir), 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
