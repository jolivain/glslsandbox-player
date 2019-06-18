/*
 * Original shader from: https://www.shadertoy.com/view/wtB3RD
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

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// Emulate some GLSL ES 3.x functions
mat4 inverse(mat4 m)
{
    return mat4(
        m[0][0], m[1][0], m[2][0], 0.0,
        m[0][1], m[1][1], m[2][1], 0.0,
        m[0][2], m[1][2], m[2][2], 0.0,
        -dot(m[0].xyz,m[3].xyz),
        -dot(m[1].xyz,m[3].xyz),
        -dot(m[2].xyz,m[3].xyz),
        1.0 );
}


// --------[ Original ShaderToy begins here ]---------- //

/*
https://shadertoy.com/view/wt23z1
the original is a shader by hamneggs and looks identical,
but i only modified the tunnel and tunnelshadow function so it is faster
*/

// Fork of "Traced Columns" by Hamneggs. https://shadertoy.com/view/wt23z1
// 2019-05-23 18:02:02

/**
 * This just traces through a field of cubes that make a box, plus two
 * extra cubes plus lightsources.
 */



#define ENABLE_SHADOWS /* Compute intensive */
#define ENABLE_NORMAL_MAPPING
#define ENABLE_SPECULAR

#define MAT_REFLECTANCE 3.0
#define BRIGHTNESS 10.0
#define ID_NONE 0.0
#define ID_TUNNEL 1.0
#define ID_LIGHT1 2.0
#define ID_LIGHT2 4.0
#define LIGHT1_COLOR vec3(.8,.05,.667)
#define LIGHT2_COLOR vec3(.05,.05,2.0)

/*
	Creates and orientates ray origin and direction vectors based on a
	camera position and direction, with direction and position encoded as
	the camera's basis coordinates.
*/
void camera(in vec2 uv, in vec3 cp, in vec3 cd, in float f, out vec3 ro, out vec3 rd)
{
	ro = cp;
	rd = normalize((cp + cd*f + cross(cd, vec3(0,1,0))*uv.x + vec3(0,1,0)*uv.y)-ro);
}

/**
 * Minimum of two 2D vectors.
 */
vec2 min2( in vec2 a, in vec2 b )
{
    if (a.x < b.x) return a;
    else return b;
}

/**
 * Minimum of two 3D vectors.
 */
vec3 min4( in vec3 a, in vec3 b )
{
    if (a.x < b.x) return a;
    else return b;
}

/**
 * Minimum of two 4D vectors.
 */
vec4 min4( in vec4 a, in vec4 b )
{
    if (a.x < b.x) return a;
    else return b;
}

/**
 * Takes the minimum of two intersections.
 */
void minInt(in float distA,  in vec3 normA,  in vec2 uvA,
            in float distB,  in vec3 normB,  in vec2 uvB,
            out float distM, out vec3 normM, out vec2 uvM)
{
    if ( distA < distB ) { distM = distA; normM = normA; uvM = uvA; }
    else                 { distM = distB; normM = normB; uvM = uvB; }
}

/**
 * That random function off of SF.
 */
float rand( in vec2 co )
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


/**
 * 3D version.
 */
float rand3( in vec3 co )
{
    return fract(sin(dot(co ,vec3(12.9898,78.233,-53.1234))) * 43758.5453);
}

/**
 * Sorta the usual FBM, but without using a noise texture and adding
 * high frequency noise at the end.
 */
float fbm( in vec2 x )
{
    float r = texture(iChannel0, x     ).x*.5;
    r += texture(iChannel0, x*2.0 ).x*.25;
    r += texture(iChannel0, x*4.0 ).x*.125;
    r += texture(iChannel0, x*8.0 ).x*.0625;
    r += rand(x)*.0325;
    return r;
}
    

/**
 * Reference function for light positions.
 */
vec3 lightpos1() { return vec3(sin(iTime*.5)*3., cos(iTime), 2.+sin(iTime)); }
vec3 lightpos2() { return vec3(sin(iTime)*3.0, -cos(iTime*.5)*.5, 0); }

/**
 * A kinda sorta smoothsquare function.
 */
float smoothSquare(in float x) { return smoothstep(.3, .7, pow(sin(x),2.)); }

/**
 * IQ Really nailed this one.
 */
mat4 translate( float x, float y, float z )
{
    return mat4( 1.0, 0.0, 0.0, 0.0,
				 0.0, 1.0, 0.0, 0.0,
				 0.0, 0.0, 1.0, 0.0,
				 x,   y,   z,   1.0 );
}

/**
 * IQ's sphere intersection.
 */
vec2 iSphere( in vec3 ro, in vec3 rd, in vec3 ce, float ra )
{
    vec3 oc = ro - ce;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - ra*ra;
    float h = b*b - c;
    if( h < 0.0 ) return vec2(99999.0); // no intersection
    h = sqrt( h );
    return vec2( -b-h, -b+h );
}

/**
 * IQ's Box intersection.
 */
float iBox( in vec3 row, in vec3 rdw, in mat4 txx, in mat4 txi, in vec3 rad, out vec3 oN, out vec2 oU ) 
{				 
    // convert from world to box space
    vec3 rd = (txx*vec4(rdw,0.0)).xyz;
    vec3 ro = (txx*vec4(row,1.0)).xyz;


    // ray-box intersection in box space
    vec3 m = 1.0/rd;
    vec3 s = vec3((rd.x<0.0)?1.0:-1.0,
                  (rd.y<0.0)?1.0:-1.0,
                  (rd.z<0.0)?1.0:-1.0);
    vec3 t1 = m*(-ro + s*rad);
    vec3 t2 = m*(-ro - s*rad);

    float tN = max( max( t1.x, t1.y ), t1.z );
    float tF = min( min( t2.x, t2.y ), t2.z );
	
    if( tN>tF || tF<0.0) return 99999.0;

    // compute normal (in world space), face and UV
    if( t1.x>t1.y && t1.x>t1.z ) { oN=txi[0].xyz*s.x; oU=ro.yz+rd.yz*t1.x; }
    else if( t1.y>t1.z   )       { oN=txi[1].xyz*s.y; oU=ro.zx+rd.zx*t1.y; }
    else                         { oN=txi[2].xyz*s.z; oU=ro.xy+rd.xy*t1.z; }

    return tN; // maybe min(tN,tF)?
}


/**
 * A simplified version.
 */
#ifdef ENABLE_SHADOWS
float iBoxSimple( in vec3 row, in vec3 rdw, in mat4 txx, in vec3 rad ) 
{				 
    vec3 rd = (txx*vec4(rdw,0.0)).xyz;
    vec3 ro = (txx*vec4(row,1.0)).xyz;

    vec3 m = 1.0/rd;
    vec3 s = vec3((rd.x<0.0)?1.0:-1.0,
                  (rd.y<0.0)?1.0:-1.0,
                  (rd.z<0.0)?1.0:-1.0);
    vec3 t1 = m*(-ro + s*rad);
    vec3 t2 = m*(-ro - s*rad);

    float tN = max( max( t1.x, t1.y ), t1.z );
    float tF = min( min( t2.x, t2.y ), t2.z );
	
    if( tN>tF || tF<0.0) return 99999.0;

    return tN;
}
#endif // ENABLE_SHADOWS

/**
 * Takes a ray, walks it forward, and see if it intersects
 * any columns near it.
 */
void tunnel( in vec3 ro, in vec3 rd, out float d, out vec3 n, out vec2 uv )
{
    uv = vec2(0);
    
    d = 0.0;
    float d2 = 9999.0;
    vec3 fp = floor(ro);
    vec3 lp = ro-fp;
    vec3 ird = 1.0/abs(rd);
    vec3 srd = sign(rd);
    
    vec3 lens = abs(step(0.0,rd)-lp)*ird;
    
    for (int i = 0; i < 20; i++) {
        
        //towers pointing in negative x,y,z direction (the ceiling and two walls)
        vec3 a = vec3( 0.5*smoothSquare(.25*iTime + 3.14*rand(fp.yz+1.0))+3.5,
                       0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xz+1.0))+2.5,
                       0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xy+1.0))+3.5);
        
        //towers pointing in positive x,y,z direction (the floor and two walls)
        vec3 b = vec3(-0.5*smoothSquare(.25*iTime + 3.14*rand(fp.yz+1.0))-3.5,
                      -0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xz+1.0))-2.5,
                      -0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xy+1.0))-3.5);
        
        vec3 c = (a-b)*0.5;
        vec3 e = b+c;
        
        vec3 p = (ro+rd*d)-e;
        
        vec3 f = (c-srd*p)*ird*step(abs(p),vec3(c));
        
        vec3 mask2;
        if (f.x < min(f.y,f.z)) {
        	mask2 = vec3(1,0,0);
        } else if (f.y < f.z) {
            mask2 = vec3(0,1,0);
        } else {
            mask2 = vec3(0,0,1);
        }
        
        float d2 = dot(mask2,f);
        float d3 = d;
        vec3 mask;
        if (lens.x < min(lens.y,lens.z)) {
        	mask = vec3(1,0,0);
        } else if (lens.y < lens.z) {
            mask = vec3(0,1,0);
        } else {
            mask = vec3(0,0,1);
        }
        
        d = dot(mask,lens);
        
        if (d2+d3 < d) {
            d = d2+d3;
            if (d2 > 0.0) n = mask2*srd;
            break;
        }
        
        n = mask*srd;
        
        fp += n;
        
        lens += mask*ird;
    }
    
    n = -n;
    vec3 p = ro+rd*d;
    
    uv = vec2(dot(n.yzx,p),dot(n.zxy,p));
    
    // Now it's time to get the two feature cubes in the middle.
    
    vec3 n_f1, n_f2; // Surface normals.
    vec2 uv_f1, uv_f2; // Texcoords.
    
    // Translation matrices.
    mat4 t_f1 = translate(-.6,-.6,-.6); mat4 t_f1i = inverse(t_f1);
    mat4 t_f2 = translate( .6, .6, .6); mat4 t_f2i = inverse(t_f2);
    
    // Check for intersection.
    float dist_f1 = iBox(ro, rd, t_f1, t_f1i, vec3(.5), n_f1, uv_f1);
    float dist_f2 = iBox(ro, rd, t_f2, t_f2i, vec3(.5), n_f2, uv_f2);
    
    // Factor them into the equation.
    minInt( d, n, uv, dist_f1, n_f1, uv_f1, d, n, uv );
    minInt( d, n, uv, dist_f2, n_f2, uv_f2, d, n, uv );
    
    // Perturb the surface normal.
    #ifdef ENABLE_NORMAL_MAPPING
    p = ro+d*rd;
    vec2 texCoord = uv+rand3(floor(p)); 
    vec3 diff = vec3(fbm(texCoord), fbm(texCoord+12348.3), 0);
    diff = 2.0*diff - 1.0;
    diff *= .125;
    vec3 an = abs(n);
    if( an.x > .5 ) 	 n = normalize(n+diff.zxy*sign(n.x));
    else if( an.y > .5 ) n = normalize(n+diff.xzy*sign(n.y));
    else				 n = normalize(n+diff.xyz*sign(n.z));
    #endif // ENABLE_NORMAL_MAPPING
}

/**
 * Traces a ray through the field. This trace function includes
 * two spheres for the light soruces.
 */
void trace( in vec3 ro, in vec3 rd, out float id, out float dist, out vec3 n, out vec2 uv)
{
    tunnel(ro, rd, dist, n, uv);
    float si1 = iSphere(ro, rd, lightpos1(), .05).x;
    float si2 = iSphere(ro, rd, lightpos2(), .05).x;
   	
    vec2 minElement = vec2(9999999.0, ID_NONE);
    minElement = min2(minElement, vec2(dist, ID_TUNNEL));
    minElement = min2(minElement, vec2(si1,  ID_LIGHT1));
    minElement = min2(minElement, vec2(si2,  ID_LIGHT2));
   	dist = minElement.x;
    id = minElement.y;
            
}

/**
 * Marches a ray forward through a simplified geometry field, since
 * we don't need the UV or normal vector of where the shadow ray
 * collides.
 */
#ifdef ENABLE_SHADOWS
void tunnelShadow( in vec3 ro, in vec3 rd, out float d )
{
    
    d = 0.0;
    float d2 = 9999.0;
    vec3 fp = floor(ro);
    vec3 lp = ro-fp;
    vec3 ird = 1.0/abs(rd);
    vec3 srd = sign(rd);
    
    vec3 lens = abs(step(0.0,rd)-lp)*ird;
    
    for (int i = 0; i < 20; i++) {
        
        //towers pointing in negative x,y,z direction (the ceiling and two walls)
        vec3 a = vec3( 0.5*smoothSquare(.25*iTime + 3.14*rand(fp.yz+1.0))+3.5,
                       0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xz+1.0))+2.5,
                       0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xy+1.0))+3.5);
        
        //towers pointing in positive x,y,z direction (the floor and two walls)
        vec3 b = vec3(-0.5*smoothSquare(.25*iTime + 3.14*rand(fp.yz+1.0))-3.5,
                      -0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xz+1.0))-2.5,
                      -0.5*smoothSquare(.25*iTime + 3.14*rand(fp.xy+1.0))-3.5);
        
        vec3 c = (a-b)*0.5;
        vec3 e = b+c;
        
        vec3 p = (ro+rd*d)-e;
        
        vec3 f = (c-srd*p)*ird*step(abs(p),vec3(c));
        
        vec3 mask2;
        if (f.x < min(f.y,f.z)) {
        	mask2 = vec3(1,0,0);
        } else if (f.y < f.z) {
            mask2 = vec3(0,1,0);
        } else {
            mask2 = vec3(0,0,1);
        }
        
        float d2 = dot(mask2,f);
        float d3 = d;
        vec3 mask;
        if (lens.x < min(lens.y,lens.z)) {
        	mask = vec3(1,0,0);
        } else if (lens.y < lens.z) {
            mask = vec3(0,1,0);
        } else {
            mask = vec3(0,0,1);
        }
        
        d = dot(mask,lens);
        
        if (d2+d3 < d) {
            d = d2+d3;
            break;
        }
        
        fp += mask*srd;
        
        lens += mask*ird;
    }
    
    mat4 t_f1 = translate(-.6,-.6,-.6);
    mat4 t_f2 = translate( .6, .6, .6);
    
    float dist_f1 = iBoxSimple(ro, rd, t_f1, vec3(.5));
    float dist_f2 = iBoxSimple(ro, rd, t_f2, vec3(.5));
    
    d = min(d, dist_f1);
    d = min(d, dist_f2);
}
#endif // ENABLE_SHADOWS

/**
 * Traces a shadow ray through the distance field.
 */
#ifdef ENABLE_SHADOWS
void traceShadow( in vec3 ro, in vec3 rd, out float dist)
{
    tunnelShadow(ro, rd, dist);
}
#endif // ENABLE_SHADOWS

/*
	Oren-Nayar reflectance modeling. I use this everywhere. Just looks good.
*/
float orenNayar( in vec3 n, in vec3 v, in vec3 ldir )
{
    float r2 = pow(MAT_REFLECTANCE, 2.0);
    float a = 1.0 - 0.5*(r2/(r2+0.57));
    float b = 0.45*(r2/(r2+0.09));

    float nl = dot(n, ldir);
    float nv = dot(n, v);

    float ga = dot(v-n*nv,n-n*nl);

	return max(0.0,nl) * (a + b*max(0.0,ga) * sqrt((1.0-nv*nv)*(1.0-nl*nl)) / max(nl, nv));
}

/**
 * Models a point light.
 */
vec3 pointLight( in vec3 p, in vec3 n, in vec3 lp, in vec3 rd, in vec3 texel, in vec3 lc )
{
    
    vec3 ld = lp-p; 								// Direction of light.
    float dist = length(ld); 						// Distance to the light.
    ld = normalize(ld); 							// Normalize for correct trig.
    float base = orenNayar(n, rd, ld)*BRIGHTNESS; 	// Base lighting coefficient.
    float falloff = clamp(1.0/(dist*dist),0.0,1.0); // Quadratic coefficient.
    
    // Specular.
    #ifdef ENABLE_SPECULAR
    vec3 reflection = normalize(reflect(rd,n));
    float specular = clamp(pow(clamp(dot(ld, reflection),0.0,1.0),25.0),0.0,1.0);
    #else
    float specular = 0.0;
    #endif // ENABLE_SPECULAR
    
    // Optionally do shadows.
    #ifdef ENABLE_SHADOWS
    float shadowDist;
    traceShadow(p+ld*.01, ld, shadowDist);
    float shadow = smoothstep(dist*.99, dist*1.01,shadowDist);
    #else
    float shadow = 1.0;
    #endif // ENABLE_SHADOWS
    
    return lc*specular*shadow + base*falloff*shadow*lc*texel + lc*.0125;
}

/**
 * Lights the entire scene by tracing both point lights.
 */
vec3 lightScene( in vec3 p, in vec3 n, in vec3 rd, in vec3 texel )
{
    
    return clamp( pointLight(p, n, lightpos1(), rd, texel, LIGHT1_COLOR) +
              	  pointLight(p, n, lightpos2(), rd, texel, LIGHT2_COLOR),
              	  vec3(0),vec3(1) );
}

/**
 * Takes it a step further by coloring based on object ID.
 */
vec3 shade( in vec3 p, in vec3 n, in vec3 rd, in float dist, in float id )
{
    if(id == ID_NONE) return vec3(0);
    else if(id == ID_TUNNEL) return vec3( lightScene(p+rd*dist, n, rd, vec3(1)) );
    else if(id == ID_LIGHT1) return LIGHT1_COLOR*BRIGHTNESS*2.0;
    else if(id == ID_LIGHT2) return LIGHT2_COLOR*BRIGHTNESS*2.0;
    else return vec3(0);
}

/**
 * Some quick tonemapping and vignetting.
 */
vec4 postProcess( in vec3 c, in vec2 uv )
{
    float vig = 1.0-dot(uv,uv)*.6;
    c = pow(clamp(c, 0., 1.), vec3(.4545));
    return vec4(c*vig,1);
}

/**
 * Entrypoint.
 */
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy - 0.5;
	uv.x *= iResolution.x/iResolution.y; //fix aspect ratio
    
    // Set up the camera.
    
    // Position.
    vec3 cp =  vec3(3.0*cos(iTime*.5), sin(iTime*.25), 3.0*sin(iTime*.25));
    
    // Direction.
    vec3 cd = normalize(vec3(-cos(iTime*.5), .5*cos(iTime*.25), -sin(iTime*.25)));
    
    // Places to store results.
    vec3 p, d;
    
    // Create the view ray.
    camera(uv, cp, cd, .667, p, d);
    
    // Do the traces.
    float id; float dist; vec3 n; vec2 texCoord;
    trace(p, d, id, dist, n, texCoord);
    
    // Shade the point.
    vec3 c = shade(p, n, d, dist, id);
    
    
    
    // Based on the results of that trace, we shade accordingly.
    fragColor = postProcess(c, uv);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
