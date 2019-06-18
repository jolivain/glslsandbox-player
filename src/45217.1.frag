/*
 * Original shader from: https://www.shadertoy.com/view/4sdyz4
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
// https://github.com/patuwwy/ShaderToy-Chrome-Plugin
// https://github.com/patuwwy/ShaderToy-Notifier

#define FAR 30.
#define t iTime

#define FOV 130.0
#define FOG .4

vec3 opRep( vec3 p, vec3 c ) {
    return mod(p,c)-0.5*c;
}

vec3 opU2( vec3 d1, vec3 d2 ) {
    if (d1.x < d2.x) return d1;
    return d2;
}

float vmax(vec3 v) {
	return max(max(v.x, v.y), v.z);
}

// Box: correct distance to corners
float fBox(vec3 p, vec3 b) {
	vec3 d = abs(p) - b;
	return length(max(d, vec3(0))) + vmax(min(d, vec3(0)));
}

// 	3D noise function (IQ)
float noise(vec3 p)
{
	vec3 ip=floor(p);
    p-=ip; 
    vec3 s=vec3(7,157,113);
    vec4 h=vec4(0,s.yz,s.y+s.z)+dot(ip,s);
    p=p*p*(3.-2.*p); 
    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);
    h.xy=mix(h.xz,h.yw,p.y);
    return mix(h.x,h.y,p.z); 
}

vec3 map(vec3 p) {
    
    p.y += noise(p * 6.1 + vec3(10, -iTime * .3, 0).xyy) * 0.175 - 1.;   	
    //p.y += noise(p * 2. + iTime * .2) * .1;
    p = opRep(p, vec3(1., 3., 1.));
    
    vec3 obj2 = vec3(
        fBox(p, vec3(1.3)), 
        0, 
        0
    );
    
    return obj2;
}


vec3 trace(vec3 ro, vec3 rd) {
    vec3 t = vec3(0., 0., 0.0);
    for (int i = 0; i < 78; i++) {
        vec3 d = map(ro + rd * t.x);
        if (abs(d.x) < 0.001 || t.x > FAR) break;
        t.x += d.x * .6;
        t.yz = d.yz;
    }
    return t;
}

float softShadow(vec3 ro, vec3 lp, float k) {
    const int maxIterationsShad = 28;
    vec3 rd = (lp - ro); // Unnormalized direction ray.

    float shade = 1.0;
    float dist = .01;
    float end = max(length(rd), 0.001);
    float stepDist = end / float(maxIterationsShad);

    rd /= end;
    for (int i = 0; i < maxIterationsShad; i++) {
        float h = map(ro + rd * dist).x;
        //shade = min(shade, k*h/dist);
        shade = min(shade, smoothstep(0.0, 1.0, k * h / dist)); 
        dist += min(h, stepDist * 2.); 
        if (h < 0.001 || dist > end) break;
    }
    return min(max(shade, 0.1), 1.0);
}

#define E .1
vec3 getNormal(vec3 pos) {
	float d=map(pos).x;
	return normalize(
        vec3(
            map(
                pos+vec3(E,0,0)).x-d,
                map(pos+vec3(0,E,0)).x-d,
                map(pos+vec3(0,0,E)).x-d 
        	)
    	);
}

float getAO(in vec3 hitp, in vec3 normal) {
    float 
        dist = 0.1;
    
    return clamp(map(hitp + normal * dist).x / dist, 0.0, .6);
}

vec3 doColor( in vec3 sp, in vec3 rd, in vec3 sn, in vec3 lp, vec2 mat) {
	vec3 sceneCol = vec3(0.0);
    
    vec3 ld = lp - sp; 
    float lDist = max(length(ld), 0.001);
    ld /= lDist; 

    float diff = max(dot(sn, ld), .1);
    float spec = pow(max(dot(reflect(-ld, sn), -rd), 0.0), 2.);

    vec3 objCol =  vec3(0.0);

    sceneCol += (objCol * (diff + 0.15) + vec3(.6, .6, .6) * spec * 2.);// * atten;

    return sceneCol;

}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec2 uv = fragCoord.xy / iResolution.xy - .5;
 
    uv *= tan(radians (FOV) / 2.0);          
    
    vec3 
        vuv = vec3(0., 1., 0.), // up
    	ro = vec3(-t, .0 - cos(2.+iTime * .05) * .4, sin(iTime * .1)),//-vec3(iMouse.x / 100. - 1.,iMouse.y / 100. - 1., 1.), // pos
    	vrp =  vec3(cos(iTime * .21), -5., 1.) + ro, // lookat    
		
    	vpn = normalize(vrp - ro),
    	u = normalize(cross(vuv, vpn)),
    	v = cross(vpn, u),
    	vcv = (ro + vpn),
    	scrCoord = (vcv + uv.x * u * iResolution.x/iResolution.y + uv.y * v),
    	rd = normalize(scrCoord - ro),
        
        light = vec3(0, 1.2, 0),  

        lp = light + ro,
        sceneColor = vec3(0.),
        tr = trace(ro, rd);
    
    float 
        fog = smoothstep(FAR * FOG, 0., tr.x * 3.), 
        sh,
        ao;        
    
    if (fog > .8) {
        ro += rd * tr.x;

        vec3 sn = getNormal(ro);	
        
        ao = getAO(ro + vec3(300., 0., t) * noise(ro) * 0.1, sn);

        sceneColor += doColor(ro, rd, sn, lp, tr.yz) * .3;
        
        sh = softShadow(ro, lp, 1.);

        rd = reflect(rd, sn);

        tr = trace(ro + rd * .01, rd);

        ro += rd * tr.x;

        sn = getNormal(ro);

        sceneColor += doColor(ro, rd, sn, lp, tr.yz) * .7;

        ao *= pow(getAO(ro, sn) * 9., .3);

        sceneColor *= sh * fog;
        sceneColor = mix(sceneColor, vec3(0., .9, 1.), pow((1.-ao) * fog, 2. - fog));
    }
    sceneColor = pow(sceneColor, vec3(.6));
    fragColor = vec4(clamp(sceneColor, 0.0, 1.0), 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
