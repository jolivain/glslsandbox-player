/*
 * Original shader from: https://www.shadertoy.com/view/4lByzD
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy globals
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
vec4 to_bary(vec3 p[4], vec3 t) {
    // plucked straight out of SageMath
    // it's possible to crunch these equations further but ain't nobody got time for that

//ollj disagreed:
//ollj knows that using defines and differentiating them 
//is THE way to find patterns:

//#defines may not be faster
//, but the patterns that you find with them likely are faster
//or at least make it easier to make special or general cases.
    
#define bar0(b,a) ((p[a].z - t.z)*p[3].y - p[a].y*(p[3].z - t.z) - (p[a].z - p[3].z)*t.y)*p[b].x 
//looks like a LABEL_swap (a<->b) happened above. it is correct, do not sweat it!
#define bar1(a,b) ((p[a].z - t.z)*p[3].y - p[a].y*(p[3].z - t.z) - (p[a].z - p[3].z)*t.y)*p[b].x 
#define bar2(a,b) ((p[a].z - t.z)*p[b].y - p[a].y*(p[b].z - t.z) - (p[a].z - p[b].z)*t.y)*p[3].x 
#define bar3(a,b) ((p[a].z - p[3].z)*p[b].y - p[a].y*(p[b].z - p[3].z) - (p[a].z - p[b].z)*p[3].y)*t.x
float det = (
+((p[1].z-p[3].z)*p[2].y-p[1].y*(p[2].z-p[3].z)-(p[1].z-p[2].z)*p[3].y)*p[0].x 
-((p[0].z-p[3].z)*p[2].y-p[0].y*(p[2].z-p[3].z)-(p[0].z-p[2].z)*p[3].y)*p[1].x 
+((p[0].z-p[3].z)*p[1].y-p[0].y*(p[1].z-p[3].z)-(p[0].z-p[1].z)*p[3].y)*p[2].x 
-((p[0].z-p[2].z)*p[1].y-p[0].y*(p[1].z-p[2].z)-(p[0].z-p[1].z)*p[2].y)*p[3].x);
vec3 w=vec3((-bar0(1,2)+bar1(1,2)-bar2(1,2)+bar3(1,2))
           ,(+bar0(0,2)-bar1(0,2)+bar2(0,2)-bar3(0,2))
           ,(-bar0(0,1)+bar1(0,1)-bar2(0,1)+bar3(0,1)));
//return vec4(w,det-(w.x+w.y+w.z))/det;//  det/det!=1. is possible for some det!!!
return vec4(w/det,1)-vec4(0,0,0,(w.x+w.y+w.z))/det;//overly explicit
}//this kind of looks like a matrix-transpose would be useful,

vec3 from_bary(vec3 p[4], vec4 w)
{return p[0]*w.x+p[1]*w.y+p[2]*w.z+p[3]*w.w;}

// return the intersection of ray and tetrahedron as well as the barycentric
// coordinates of the hit points
bool iSimplex3(vec3 p[4], vec3 ro, vec3 rd, 
               out float near, out float far, 
               out vec4 bnear, out vec4 bfar) {
    // convert ray endpoints to barycentric basis
    // this can be optimized further by caching the determinant
    vec4 r0 = to_bary(p, ro);
    vec4 r1 = to_bary(p, ro + rd);

    // build barycentric ray direction from endpoints
    vec4 brd = r1 - r0;
    // compute ray scalars for each plane
    vec4 t = -r0/brd;
    
    near = -1.0 / 0.0;
    far = 1.0 / 0.0;    
    for (int i = 0; i < 4; ++i) {
        // equivalent to checking dot product of ray dir and plane normal
        if (brd[i] < 0.0) {
            far = min(far, t[i]);
        } else {
            near = max(near, t[i]);
        }
    }
    
    bnear = r0 + brd * near;
    bfar = r0 + brd * far;
    
    return (far > 0.0) && (far > near);
}

////////////////////////////////////////////////////////////////////////


void doCamera( out vec3 camPos, out vec3 camTar, in float time, in float mouseX )
{
    float an = iTime * 0.1;
    float d = 2.5;
	camPos = vec3(d*sin(an),1.0,d*cos(an));
    camTar = vec3(0.0,-0.3,0.0);
}


vec3 doBackground( void )
{
    return vec3( 0.0, 0.0, 0.0);
}

// from https://www.shadertoy.com/view/4djSRW
#define HASHSCALE3 vec3(.1031, .1030, .0973)
vec2 hash21(float p)
{
	vec3 p3 = fract(vec3(p) * HASHSCALE3);
	p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec3 feet_curve(float t) {
    float subt = mod(t, 3.0);
    float x = sin(radians(min(subt*180.0,180.0)));
    float a0 = radians((t - subt)/3.0 * 30.0);
    float a1 = a0 + radians(30.0);
    float a = mix(a0, a1, min(subt,1.0));
	return vec3(cos(a),sin(a),mix(-1.0,-0.8,x));
}

vec3 calc_intersection( in vec3 ro, in vec3 rd ) {
    ro = ro.zxy;
    rd = rd.zxy;
    vec3 p[4];
    float ti = iTime * 8.0;
    p[0] = feet_curve(ti);
    p[1] = feet_curve(ti + 12.0 + 1.0);
    p[2] = feet_curve(ti + 24.0 + 2.0);
    // do a little spring animation
    ti = iTime * 4.0;
    vec2 cuv = hash21(float(int(ti / 5.0))) * 2.0 - 1.0;
    ti = mod(ti, 5.0) * 2.0;
    float rk = (10.0 - ti) / (1.0 + (10.0 - ti));
    float spr = clamp(rk * ((8.0 - sin(ti * 8.0) / (ti * ti))/8.0), 0.0, 2.0);
    p[3] = vec3(mix(vec2(0.0), cuv, spr), mix(-0.7, 0.5, spr));
    
    vec3 l = normalize(vec3(1.0, -1.0, -1.0));
    
    float plane_t = -(ro.z + 1.0) / rd.z;
    
    float t0, t1;
    vec4 c0, c1;
    if (iSimplex3(p, ro, rd, t0, t1, c0, c1)) {
        vec4 c = (t0 > 0.0)?c0:c1;
        
        vec3 n;
        float lc = min(min(c.x, c.y), min(c.z, c.w));
        if (c.x == lc) {
            n = cross(p[2] - p[1], p[3] - p[1]);
        } else if (c.y == lc) {
            n = cross(p[0] - p[2], p[3] - p[2]);
        } else if (c.z == lc) {
            n = cross(p[1] - p[0], p[3] - p[0]);
        } else {
            n = cross(p[2] - p[0], p[1] - p[0]);
        }
        n = normalize(n);
        float lit = max(0.0, dot(l, -n)*0.5+0.5);
        
        return lit * (
              c.x * vec3(0.0, 1.0, 0.5)
        	+ c.y * vec3(1.0, 0.5, 0.0)
            + c.z * vec3(1.0, 0.0, 0.5)
            + c.w * vec3(0.5, 0.0, 1.0));
    } else if (plane_t > 0.0) {
	    vec3 plane_p = ro + rd * plane_t;
        float sh = iSimplex3(p, plane_p, -l, t0, t1, c0, c1)?0.2:0.5;
        return vec3(sh) * abs(rd.z);
    } else {        
        return vec3(0.0);
    }
}

mat3 calcLookAtMatrix( in vec3 ro, in vec3 ta, in float roll )
{
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(sin(roll),cos(roll),0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
    return mat3( uu, vv, ww );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 p = (-iResolution.xy + 2.0*fragCoord.xy)/iResolution.y;

    vec3 ro, ta;
    doCamera( ro, ta, iTime, 0.0 );

    // camera matrix
    mat3 camMat = calcLookAtMatrix( ro, ta, 0.0 );  // 0.0 is the camera roll
    
	// create view ray
	vec3 rd = normalize( camMat * vec3(p.xy,2.0) ); // 2.0 is the lens length

    //-----------------------------------------------------
	// render
    //-----------------------------------------------------

	vec3 col = doBackground();

	// raymarch
    col = calc_intersection( ro, rd );
	   
    fragColor = vec4( col, 1.0 );
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
