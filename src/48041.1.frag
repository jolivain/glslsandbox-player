/*
 * Original shader from: https://www.shadertoy.com/view/XlcyWH
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
#define PI 3.1415
#define R(p, m) mod(p, m) - m / 2.
#define ID(p, m) floor(p / m) 

#define time mod(iTime, 76.)

mat3 Rotate(vec3 angles)
{
    vec3 c = cos(angles);
    vec3 s = sin(angles);
    
    mat3 rotX = mat3( 1, 0, 0, 0,c.x,s.x, 0,-s.x, c.x);
    mat3 rotY = mat3( c.y, 0,-s.y, 0,1,0, s.y, 0, c.y);
    mat3 rotZ = mat3( c.z, s.z, 0,-s.z,c.z,0, 0, 0, 1);

    return rotX*rotY*rotZ;
}



float hash(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise( vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), u.x), u.y);
}




/**********************
 * DISTANCE FUNCTIONS *
 **********************/


float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdSphere( vec3 p ) {
 	return length(p) - 1.;   
}

/******
 * OPS
 ******/

vec2 opU(vec2 a, vec2 b) {
 	return a.x < b.x ? a : b;   
}


float opRep1(inout float p, float m) {
 	float c = ID(p, m);
    p = R(p, m);
    return c;
}

vec2 opRep2(inout vec2 p, float m) {
    vec2 c = ID(p, m);
    p = R(p, m);
    return c;
}

/*****************
 * MAP Functions
 *****************/

float repid1 = 0.;
float spiralRot = .5;
float spiralNoise = 0.;
    
float spiral(vec3 p) {
    //saving original coordinate space 
    vec3 po = p; 
    
    repid1 = opRep1(p.x, 0.08); 
    repid1 = mod(repid1, 10.);
          
    //Spiral rotation effect
    p = Rotate(vec3(spiralRot * sin(po.x - p.x + time * PI / 4.), 0, 0)) * p;
    //spiral noise effect
    p.z += mix(0., noise(p.xy * 100.) * 0.3, clamp(time - spiralNoise, 0., 1.));
    return sdBox(p, vec3(.03, .45, .02)) - 0.002;
}

float repid2 = 0.;

float frame(vec3 p) {
 	vec3 p0 = p;
    
    repid2 = opRep1(p.x, .5);
    p *= Rotate(vec3(repid2, 0, 0));
    
    p.y -= .25;
    float d = .4 + 0.2 * sin(repid2);
    return max(sdBox(p, vec3(0.02, d, d)), -sdBox(p, vec3(0.2, d - 0.02, d - 0.02)));
}

void camera(inout vec3 p) {
    vec3 p1 = Rotate(vec3(0.7, 0, -PI / 8.)) * p;
    
    
    vec3 p2 = Rotate(vec3(0, PI / 2., 0.)) * p;
    vec3 p3 = Rotate(vec3(0, PI / 3., 0.)) * p;
    p2.y -= 0.30;// - 0.25;
 	p2.x += (time - 15.) * 1.;
    p3.x += time - 15.;
    
    spiralNoise = 40.;
    
    if (time < 8.) {
    	p = p2; 
    } else if (time < 20.) {
     	p = p1;   
    } else if (time < 28.) {
     	spiralRot =  2.;
        p = p2;
    } else if (time < 36.) {
        spiralRot = 2.;
     	p = p1;   
    } else if (time < 56.){
        spiralRot = 2.;
     	p = p2;   
    } else if (time < 64.) {
     	p = p3;   
    } else {
     	p = p2;   
    }
   
}

vec2 map(vec3 p) {

    float d;
    vec2 t = vec2(100);
	vec3 p0 = p;
    camera(p);
    
    
    t = vec2(spiral(p - vec3(0, .3, 0)), 1.);
        
   	//floor
    vec3 p1 = p;
    opRep2(p1.xz, 0.11);
    float off = noise((p.xz - p1.xz) * 10.) * 0.05;

    d = sdBox(p1 + vec3(0, .5 + off , 0), vec3(0.05)) - 0.005;
    t = opU(t, vec2(d, 2.));
       
    t.x = max(t.x, (p.x - 28.));
        
    //frames and stuff
    vec2 t2 = vec2(frame(p), 3);
        	
    //spiral2
        
    vec3 off2 = vec3(-64., 2. * sin(p.x), 2. * cos(p.x));
    vec2 s = vec2(sdBox(p + off2, 
                            vec3(10, .5, 0.1)), 4.);
    vec3 p2 = p;
    float b = sdBox(p2 + off2 - vec3(0, 0., 0.), vec3(12., 0.2, 0.2));
   	s.x = max(s.x, -b);
        
    t2 = opU(t2, s);
    	
		
    
    t2.x = max(t2.x, -p.x + 32.);
       	t = opU(t, t2);
    
   
    	//t = t2;
		
    
    
    //t = opU(t, vec2(p.y + .25, 2.));
    return t;
}

vec3 nor(vec3 p, float prec)
{
    vec2 e = vec2(prec, 0.);
    
    vec3 n;
    
    n.x = map(p+e.xyy).x - map(p-e.xyy).x; 
    n.y = map(p+e.yxy).x - map(p-e.yxy).x; 
    n.z = map(p+e.yyx).x - map(p-e.yyx).x;  
    
    return normalize(n); 
}

vec2 render(vec3 o, vec3 r) {
 	float t = 0.;
    vec2 t0;
    for (int i = 0; i < 128; i++) {
        vec3 p = o + r * t;
        t0 = map(p);
        
        if (t0.x < 0.001) break;
        
        t += t0.x * 0.55;
        
        if (t > 30.) {
            t0.x = 30.;
         	break;       
        }
    }
    
    return vec2(t, t0.y);
}

vec3 shade(vec2 t) {
    if (t.y == 0.) return vec3(0., 0., 0);
    //if (t.y == 2.) return vec3(1, 0, 0);
    
    vec3 col = vec3(0);
    if (t.y == 1.) {
    	vec3 c = repid1 == 0. ? vec3(1, 0.5, 0) : vec3(1);
    	col = c;// / (t.x * t.x * .6);
        
    }
    
    return col;
}

vec3 applyFog( in vec3  rgb,       // original color of the pixel
               in float distance ) // camera to point distance
{
    float fogAmount = 1.0 - exp( -distance*0.4 );
    vec3  fogColor  = vec3(0);
    return mix( rgb, fogColor, fogAmount );
}


vec3 scene1(vec3 o, vec3 r) {
    vec3 col;
    vec2 t = render(o, r);
    
    vec3 p = o + r * t.x;
    vec3 n = nor(p, 0.001);
    
       
    vec3 d = normalize(reflect(p - o, n));
    if (t.y == 2.) {
                
   		vec2 t1 = render(p + d * 0.02, d);
        col = 0.3 * vec3(0.2);

        col += applyFog(0.3 * shade(t1), t1.x);
        
    } else if (t.y == 3.) {
        float add = 1./8. - 1./8.;
	  
      //float x = clamp(floor(4. * time), 0., 8. * floor(time / 2.));
      float x = floor(time * 4. - add) * mod(floor(time - add), 2.);  
      col = mod(repid2 - x, 4.) == 0. ? vec3(1, .5, 0) : vec3(1, 1, 1);  
    } else if (t.y == 4.) {
     	//scene 2 spiral
        col = vec3(1);
    }else {
        col = shade(t);        
    }
    

   
    float ao = 1.;
    for (float i = 0.; i < 6.; i++) {
   		ao -= 0.3 * abs(length(n * i /16.) - map(p + n * i / 16.).x);
    }
    col *= ao;
   
    
	col = applyFog(col, t.x);
    return col;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;
    uv = uv * 2. - 1.;
    uv.x *= iResolution.x / iResolution.y;

    // Time varying pixel color
    vec3 o = vec3(0, 0, -1.8);
    vec3 r = normalize(vec3(uv, 2));
    
    vec3 col = mix(scene1(o, r), vec3(0), clamp((time - 75.), 0., 1.));

    // Output to screen
    fragColor = vec4(col ,1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

#undef time

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
