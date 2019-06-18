// Created by Stephane Cuillerdier - @Aiekick/2018
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// Tuned via NoodlesPlate / SdfEditor (my softs to come)

// original https://www.shadertoy.com/view/ltcyWj
// Woman Jade Statue

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

//https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
float sdSphere(vec3 p, float s)
{
	return length(p) - s;
}

vec2 sdCapsule(vec3 p, vec3 a, vec3 b)
{
	vec3 pa = p - a, ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return vec2(length(pa - ba * h),h);
}

vec2 sdCapsuleEllipse(vec3 p, vec3 a, vec3 b, vec3 r)
{
	vec3 pa = p - a, ba = b - a;
	float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
	return vec2(length((pa - ba * h)/r),h);
}

float sdEllipsoid(in vec3 p, vec3 a, in vec3 r)
{
	return (length((p - a) / r) - 1.0) * min(min(r.x, r.y), r.z);
}

// modified for my needs
float sdEllipsoid(in vec3 p, mat4 m, in vec3 r)
{
	return (length(((p - m[3].xyz)*mat3(m))/r) - 1.0) * min(min(r.x, r.y), r.z);
}

float sdSphere(in vec3 p, mat4 m, float r)
{
	return length(((p - m[3].xyz)*mat3(m))) - r;
}

// https://iquilezles.org/www/articles/smin/smin.htm
// polynomial smooth min (k = 0.1);
float sminPoly( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float smin( float a, float b, float k )
{
	return sminPoly(a,b,k);
}

// frim Iq : Quadratic Bezier - 3D / https://www.shadertoy.com/view/ldj3Wh
vec2 sdBezier(vec3 A, vec3 B, vec3 C, vec3 pos)
{    
    vec3 a = B - A;
    vec3 b = A - 2.0*B + C;
    vec3 c = a * 2.0;
    vec3 d = A - pos;

    float kk = 1.0 / dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      

    vec2 res;

    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
    float h = q*q + 4.0*p3;

    if(h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h, -h) - q) / 2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = uv.x + uv.y - kx;
        t = clamp( t, 0.0, 1.0 );

        // 1 root
        vec3 qos = d + (c + b*t)*t;
        res = vec2( length(qos),t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
        t = clamp( t, 0.0, 1.0 );

        // 3 roots
        vec3 qos = d + (c + b*t.x)*t.x;
        float dis = dot(qos,qos);
        
        res = vec2(dis,t.x);

        qos = d + (c + b*t.y)*t.y;
        dis = dot(qos,qos);
        if( dis<res.x ) res = vec2(dis,t.y );

        qos = d + (c + b*t.z)*t.z;
        dis = dot(qos,qos);
        if( dis<res.x ) res = vec2(dis,t.z );

        res.x = sqrt( res.x );
    }
    
    return res;
}


// vec3 from SdfEditor
const vec3 uLoc1 = vec3(0,0.00203843,0.00360684);
const vec3 uLoc3 = vec3(0,0.306208,0.11644);
const vec3 uLoc4 = vec3(0,0.324002,-0.00769925);
const vec3 uLoc7 = vec3(0.0183471,0.287671,-0.546344);
const vec3 uLoc12 = vec3(0.000250067,0.241125,0.0758075);
const vec3 uLoc13 = vec3(0.0110198,0.241354,0.0817071);
const vec3 uLoc14 = vec3(0.0227902,0.251562,0.0491019);
const vec3 uLoc15 = vec3(0.00461896,0.248268,0.0754393);
const vec3 uLoc16 = vec3(0.0152348,0.246408,0.070115);
const vec3 uLoc17 = vec3(0.0306791,0.245639,0.0403069);
const vec3 uLoc18 = vec3(0.000147426,0.235244,0.0736692);
const vec3 uLoc19 = vec3(0.0276588,0.241318,0.0750517);
const vec3 uLoc20 = vec3(0.0443396,0.234284,0.0277071);
const vec3 uLoc21 = vec3(0,0.251592,0.0764101);
const vec3 uLoc22 = vec3(0.0726629,0.259075,0.0646102);
const vec3 uLoc23 = vec3(-0.0617832,0.229258,-0.104316);
const vec3 uLoc24 = vec3(0,0.318978,0.0737746);
const vec3 uLoc25 = vec3(0,0.293775,0.0796922);
const vec3 uLoc26 = vec3(-0.000892206,0.277262,0.0893624);
const vec3 uLoc27 = vec3(0.00638537,0.276021,0.0804291);
const vec3 uLoc31 = vec3(0.20228,0.348349,0.120626);
const vec3 uLoc32 = vec3(0,-1.16415e-10,-0.0378109);
const vec3 uLoc33 = vec3(0.140931,0.126447,-0.0456791);
const vec3 uLoc34 = vec3(0.0231488,0.109465,0.023192);
const vec3 uLoc36 = vec3(0,-0.0104738,-0.183424);
const vec3 uLoc37 = vec3(0,-0.0100463,0.0703228);
const vec3 uLoc38 = vec3(0,0.0259907,-0.039358);
const vec3 uLoc39 = vec3(0,0.0988484,-0.0512504);
const vec3 uLoc42 = vec3(0,0.125604,-0.0484375);
const vec3 uLoc43 = vec3(1.16415e-10,0.387246,0.00678631);
const vec3 uLoc44 = vec3(0.106815,0.452016,0.00219224);
const vec3 uLoc45 = vec3(0.0370535,0.174836,0.00913381);
const vec3 uLoc46 = vec3(0.00114844,0.402296,0.00267714);
const vec3 uLoc47 = vec3(0.122269,0.437704,0);
const vec3 uLoc48 = vec3(0.0385304,0.146079,0.00786149);
const vec3 uLoc49 = vec3(0,0.415296,-0.0035327);
const vec3 uLoc50 = vec3(0.146797,0.436727,0);
const vec3 uLoc51 = vec3(0.0258521,0.138664,0.00117993);
const vec3 uLoc52 = vec3(0,0.392706,0.0209802);
const vec3 uLoc53 = vec3(0.137235,0.427677,0.0180633);
const vec3 uLoc54 = vec3(0.0263039,0.136626,0.0155087);
const vec3 uLoc55 = vec3(0,0.213307,0.0548081);
const vec3 uLoc56 = vec3(0.140222,0.171291,0.0624294);
const vec3 uLoc57 = vec3(0.0429538,0.0682408,0.0372264);

// matrixs from SdfEditor
const mat4 uLoc0 = mat4(0.774993,0,0,0,0,-1.1667,-1.14583,0,0,0.658059,-0.670043,0,-2.91038e-11,0.267095,0.0594358,1);
const mat4 uLoc5 = mat4(1.61052,0,0,0,0,0.804379,0.594113,0,0,-0.46788,0.633471,0,0.00135185,0.2467,0.0239092,1);
const mat4 uLoc6 = mat4(0.811406,0,0,0,0,0.921883,0.387467,0,0,-0.286288,0.681152,0,-0.00513797,0.243955,-0.00344948,1);
const mat4 uLoc8 = mat4(0.604029,0,0,0,0,1.28311,0,0,0,0,1.59333,0,0.0426618,0.303089,0.0798052,1);
const mat4 uLoc9 = mat4(0.730816,0,0,0,0,1,0,0,0,0,0.999989,0,0.0469761,0.186637,0,1);
const mat4 uLoc10 = mat4(1.58959,0,0,0,0,1.0653,0,0,0,0,1,0,0.0243361,0.271856,0.0172644,1);
const mat4 uLoc11 = mat4(1,0,0,0,0,0.999964,0,0,0,0,0.999964,0,0.0957007,0.243697,-0.0194892,1);
const mat4 uLoc28 = mat4(1.49882,0.0279406,0.0525695,0,0.000536533,0.34667,-0.199552,0,-0.0594995,0.747796,1.29895,0,0.00690892,0.269552,0.0868132,1);
const mat4 uLoc29 = mat4(0.985338,0,-0.170407,0,0,0.999996,0,0,0.170405,0,0.98533,0,0.0259051,0.305124,0.0514075,1);
const mat4 uLoc30 = mat4(1,0,0,0,0,0.825584,0,0,0,0,0.882683,0,0.00494779,0.270636,0.0179259,1);
const mat4 uLoc35 = mat4(0.458626,0,0,0,0,0.694593,0,0,0,0,0.724171,0,0,0.0715221,-0.0525544,1);
const mat4 uLoc40 = mat4(1.63833,0,0,0,0,2.3324,0.361054,0,0,-0.152977,0.988227,0,-1.16415e-10,0.244062,-0.0111016,1);
const mat4 uLoc41 = mat4(0.888535,0,0.458809,0,0,1,0,0,-0.103254,0,0.199963,0,0.0610963,0.304203,0.0864888,1);

float getLibs(vec3 p)
{
	vec2 i = sdBezier(uLoc12, uLoc13, uLoc14, p);
	float di = i.x - 0.008;
	vec2 ic = sdBezier(uLoc18, uLoc19, uLoc20, p);
	di = smin(di, ic.x - 0.005, -0.001);
	vec2 s = sdBezier(uLoc15, uLoc16, uLoc17, p);
	float ds = s.x - 0.008;
	vec2 sc = sdBezier(uLoc21, uLoc22, uLoc23, p);
	ds = smin(ds, sc.x - 0.005, -0.001);
	return min(di, ds);
}

float getNoze(vec3 p)
{
	vec2 bez = sdBezier(uLoc24, uLoc25, uLoc26, p);
	float d = bez.x  - mix(0.001, 0.01, bez.y);
	d = smin(d, sdSphere(p-uLoc27, 0.008), 0.008);
	d = smin(d, -sdSphere(p, uLoc28, 0.005), -0.003);
	return d;
}

float getEyes(vec3 p)
{
	float d = length(p) - 0.02;
	p.y = abs(p.y);
	d = smin(d, -(length(p - vec3(0,-0.013,0.015)) - 0.02), -0.001);
	d = min(d, length(p) - 0.018);
	return smin(d, -(length(vec2(length(p.xy) - 0.005, p.z-0.017))-0.001), -0.001);
}

mat3 getRotXMat(float a){return mat3(1.,0.,0.,0.,cos(a),-sin(a),0.,sin(a),cos(a));}

// allons pour le mode bourrin, j'en peux plus la :)
float getHairsOrHat(vec3 p)
{
	vec3 q = p;
	vec3 q2 = p;
	p *= vec3(1.,1.,0.2);
	vec2 bez = sdBezier(uLoc43, uLoc44, uLoc45, p);
	float d = bez.x - mix(0.01,0.0001,bez.y);
	bez = sdBezier(uLoc46, uLoc47, uLoc48, p);
	d = smin(d, bez.x - mix(0.01,0.0001,bez.y), 0.004);
	bez = sdBezier(uLoc49, uLoc50, uLoc51, p);
	d = smin(d, bez.x - mix(0.01,0.0001,bez.y), 0.004);
	q *= getRotXMat(0.4);
	q *= vec3(1.,1.,0.2);
	bez = sdBezier(uLoc52, uLoc53, uLoc54, q);
	d = smin(d, bez.x - mix(0.01,0.0001,bez.y), 0.003);
	q2 *= getRotXMat(1.3);
	q2 *= vec3(1.,1.,0.2);
	bez = sdBezier(uLoc55, uLoc56, uLoc57, q2);
	return smin(d, bez.x - mix(0.01,0.0001,bez.y), 0.02);
}

float getBuste(vec3 p)
{
	float d = sdEllipsoid(p, uLoc38, vec3(0.2,0.13,0.1));
	d = smin(d, sdEllipsoid(p, uLoc39, vec3(0.12,0.1,0.2)), -0.001);
	return smin(d, sdCapsule(p, uLoc42, uLoc42+vec3(0,0.2,0.05)).x - 0.045, 0.025);
}

float map(vec3 p)
{
	float d = 1e5;

	p.x *= 0.9;
	p.x = abs(p.x);
	
	d = smin(d, sdSphere(p, uLoc0, 0.025), 0.01);
	d = smin(d, sdSphere(p-uLoc4, 0.1), 0.01);
	d = smin(d, sdEllipsoid(p, uLoc5, vec3(0.05,0.025,0.05)), 0.01);
	d = smin(d, -sdSphere(p, uLoc8, 0.025), -0.01);
	d = smin(d, dot(p, vec3(1,0,0) * mat3(uLoc9)) - uLoc9[3].x, -0.04);
	d = smin(d, sdEllipsoid(p, uLoc6, vec3(0.05,0.025,0.05)), 0.01);
	d = smin(d, sdSphere(p, uLoc10, 0.05), 0.01);
	d = smin(d, -sdSphere(p, uLoc41, 0.02), -0.01);
	d = smin(d, getLibs(p - uLoc1.xyz), 0.01);
	d = smin(d, -(length(p.yz - uLoc3.yz) - 0.03), -0.04);
	d = smin(d, getNoze(p), 0.01);
	d = smin(d, getEyes((p-uLoc29[3].xyz) * mat3(uLoc29)), 0.003);
	d = smin(d, sdSphere(p, uLoc30, 0.05), 0.01);
	d = smin(d, -sdSphere(p-uLoc31, 0.05), -0.1);
	d = smin(d, sdSphere(p, uLoc40, 0.05), 0.05);
	d = smin(d, getBuste(p), 0.025);
	
	return smin(d, getHairsOrHat(p), 0.005);
}

vec3 nor( vec3 p, float prec )
{
    vec2 e = vec2( prec, 0. );
    vec3 n = vec3(
        map(p+e.xyy) - map(p-e.xyy),
        map(p+e.yxy) - map(p-e.yxy),
        map(p+e.yyx) - map(p-e.yyx) );
    return normalize(n);
}

vec3 shade(vec3 ro, vec3 rd, float d, vec3 lp, float li)
{
	vec3 p = ro + rd * d;
	vec3 n = nor(p,0.001); 							// precise normale at surf point
	float sb = clamp(map(p - n * 0.2)/0.004,0.,1.);	
	vec3 bb = mix(vec3(0.0, 0.4, 0.1), vec3(0.1,0.7,0.1), vec3(1.-sb));
	vec3 ld = normalize(lp-p); 										// light dir
    
	vec3 refl = reflect(rd,n);										// reflected ray dir at surf point 
	float amb = 0.5; 												// ambiance factor
	float diff = clamp( dot( n, ld ), 0.0, 1.0 ); 					// diffuse
	float fre = pow( clamp( 1. + dot(n,rd),0.0,1.0), 4. ); 			// fresnel
	float spe = pow(clamp( dot( refl, ld ), 0.0, 1.0 ),16.);		// specular
	float sss = 1. - map(p - n * 4.); 							// one step sub density of df
	vec3 col = clamp((diff + fre + bb * sb * 0.608 + sss * 0.352) * amb * li + spe * 0.6, 0., 1.);
	
	return mix(col, vec3(1), vec3((bb*diff + 0.1 *spe)));
}

void main()
{
	gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0);
	
	vec2 si = resolution;
	vec2 uvc = (2.*gl_FragCoord.xy-si)/min(si.x, si.y);
	vec2 uv = gl_FragCoord.xy/si;
	
    	float maxd = 2.;
    
    	float t = time * 0.3;
    
	vec3 ro = vec3(cos(t),0.4,sin(t)); ro.xz *= 0.6;
	vec3 z = normalize(vec3(0,0.25,0) - ro);
	vec3 x = normalize(cross(vec3(0,1,0), z));
	vec3 y = normalize(cross(z, x));
    	uvc *= 0.5; // fov
	vec3 rd = normalize(z + uvc.x * x + uvc.y * y);
	
    	float s = 1., d = 0.;;
	for (int i = 0; i < 150; i++) 
	{
		if (d*d/s>1000. || d > maxd) break;
		s = map(ro + rd * d);
		d += s * 0.5;
	}

    	if (d < maxd)
    	{
        	gl_FragColor.rgb = shade(ro, rd, d, ro, 0.6);
	}

	gl_FragColor.rgb *= vec3(0.5 + 0.5*pow( 16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.55 ));
	gl_FragColor = vec4(sqrt(gl_FragColor.rgb*gl_FragColor.rgb*1.5),1.0);
	
}
