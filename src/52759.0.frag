/*
 * Original shader from: https://www.shadertoy.com/view/3ssXR8
 */

#extension GL_OES_standard_derivatives : enable

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
 
 #define PI 3.14159265359
 #define PI2 6.28318530718
 #define PHI 1.618033988749895
 
 #define saturate(x) clamp(x, 0., 1.)
 
 
 
 // exported https//tinyurl.com/y82cdk8k
 vec2  raygl_sdf_map_1( in vec3 p) ;
 
 
 // exported https//tinyurl.com/y82cdk8k
 const int  raygl_sdf_ray_steps_1 =  128 ;
 
 
 // exported https//tinyurl.com/y82cdk8k
 const float  raygl_sdf_max_dist_1 =  48. ;
 
 
 // exported sdf
 const float  raygl_sdf_min_dist_6 =  1. ;
 
 
 // exported sdf
 const int  raygl_sdf_shadow_steps_6 =  16 ;
 
 
 // exported color
 const bool  raygl_color_lut_clamp_7 =  true ;
 
 
 // exported color
 const bool  raygl_color_lut_flip_7 =  false ;
 
 
 // body color
 vec3 raygl_rgb2hsv_7(vec3 c){
     vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
     vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
     vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
     float d = q.x - min(q.w, q.y);
     float e = 1.0e-10;
     return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
 }
 vec3 raygl_hsv2rgb_7(vec3 c)
 {
     vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
     vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
     return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
 }

 
 // body sdf
 vec2 raygl_sdf_map_6(in vec3 p) {
     return vec2(length(p)-3., 0.);
 }
 vec2 raygl_cast_6( in vec3 ro, in vec3 rd )
 {
     float t = raygl_sdf_min_dist_6;
     float m = -1.0;
     for( int i=0; i < raygl_sdf_ray_steps_1; i++ )
     {
 	    float precis = 0.0005*t;
 	    vec2 res = raygl_sdf_map_1( ro+rd*t );
         if( res.x < precis || t > raygl_sdf_max_dist_1 ) break;
         t += res.x;
 	    m = res.y;
     }
     if( t > raygl_sdf_max_dist_1 ) m=-1.0;
     return vec2( t, m );
 }
 vec3 raygl_norms_6( in vec3 pos )
 {
     vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
     return normalize( e.xyy*raygl_sdf_map_1( pos + e.xyy ).x + 
 					  e.yyx*raygl_sdf_map_1( pos + e.yyx ).x + 
 					  e.yxy*raygl_sdf_map_1( pos + e.yxy ).x + 
 					  e.xxx*raygl_sdf_map_1( pos + e.xxx ).x );
 }
 vec3 raygl_normals_6( in vec3 pos )
 {
     vec3 eps = vec3( 0.0005, 0.0, 0.0 );
 	vec3 nor = vec3(
 	    raygl_sdf_map_1(pos+eps.xyy).x - raygl_sdf_map_1(pos-eps.xyy).x,
 	    raygl_sdf_map_1(pos+eps.yxy).x - raygl_sdf_map_1(pos-eps.yxy).x,
 	    raygl_sdf_map_1(pos+eps.yyx).x - raygl_sdf_map_1(pos-eps.yyx).x );
 	return normalize(nor);
 }
 float raygl_shadow_6( in vec3 point, in vec3 rd, in float mint, in float tmax )
 {
     vec3 ro = point;
 	float res = 1.0;
     float t = mint;
     for( int i=0; i < raygl_sdf_shadow_steps_6; i++ )
     {
 		float h = raygl_sdf_map_1( ro + rd*t ).x;
         res = min( res, 8.0*h/t );
         t += clamp( h, 0.02, 0.10 );
         if( h<0.001 || t>tmax ) break;
     }
     return clamp( res, 0.0, 1.0 );
 }
 float raygl_occlusion_6( vec3 pos, vec3 nor )
 {
     float oc = 0.0;
     float sca = 1.0;
     for( int i=0; i<5; i++ )
     {
         float hr = 0.01 + 0.12*float(i)/4.0;
         vec3 aopos =  nor * hr + pos;
         float dd = raygl_sdf_map_1( aopos ).x;
         oc += -(dd-hr)*sca;
         sca *= 0.95;
     }
     return clamp( 1.0 - 3.0*oc, 0.0, 1.0 );    
 }
 
 // body noise/worley2D
   // worley noise from glslify
 vec3 raygl_permute_5(vec3 x) {
     return mod((34.0 * x + 1.0) * x, 289.0);
   }

 vec3 raygl_dist_5(vec3 x, vec3 y,  bool manhattandistance) {

     return manhattandistance ?  abs(x) + abs(y)  : (x * x + y * y);
 
 }
   vec2 raygl_noise_5(vec2 P, float jitter, bool manhattandistance) {
   float K= 0.142857142857; // 1/7
   float Ko= 0.428571428571 ;// 3/7
   	vec2 Pi = mod(floor(P), 289.0);
    	vec2 Pf = fract(P);
   	vec3 oi = vec3(-1.0, 0.0, 1.0);
   	vec3 of = vec3(-0.5, 0.5, 1.5);
   	vec3 px = raygl_permute_5(Pi.x + oi);
   	vec3 p = raygl_permute_5(px.x + Pi.y + oi); // p11, p12, p13
   	vec3 ox = fract(p*K) - Ko;
   	vec3 oy = mod(floor(p*K),7.0)*K - Ko;
   	vec3 dx = Pf.x + 0.5 + jitter*ox;
   	vec3 dy = Pf.y - of + jitter*oy;
   	vec3 d1 = raygl_dist_5(dx,dy, manhattandistance); // d11, d12 and d13, squared
   	p = raygl_permute_5(px.y + Pi.y + oi); // p21, p22, p23
   	ox = fract(p*K) - Ko;
   	oy = mod(floor(p*K),7.0)*K - Ko;
   	dx = Pf.x - 0.5 + jitter*ox;
   	dy = Pf.y - of + jitter*oy;
   	vec3 d2 = raygl_dist_5(dx,dy, manhattandistance); // d21, d22 and d23, squared
   	p = raygl_permute_5(px.z + Pi.y + oi); // p31, p32, p33
   	ox = fract(p*K) - Ko;
   	oy = mod(floor(p*K),7.0)*K - Ko;
   	dx = Pf.x - 1.5 + jitter*ox;
   	dy = Pf.y - of + jitter*oy;
   	vec3 d3 = raygl_dist_5(dx,dy, manhattandistance); // d31, d32 and d33, squared
   	// Sort out the two smallest distances (F1, F2)
   	vec3 d1a = min(d1, d2);
   	d2 = max(d1, d2); // Swap to keep candidates for F2
   	d2 = min(d2, d3); // neither F1 nor F2 are now in d3
   	d1 = min(d1a, d2); // F1 is now in d1
   	d2 = max(d1a, d2); // Swap to keep candidates for F2
   	d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller
   	d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x
   	d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz
   	d1.y = min(d1.y, d1.z); // nor in  d1.z
   	d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.
   	return sqrt(d1.xy);
   }
 
 // body phong
 struct raygl_Surface_4 {
     vec3 normal;
     vec3 diffuse;
     vec3 specular;
     float shiny;
 };
 vec3 raygl_direct_4( in raygl_Surface_4 s, in vec3 color, in vec3 dir ) 
 {
     vec3 halfDir = normalize( dir );
     float dotNL = saturate( dot( s.normal, dir ) );
 	float dotNH = saturate( dot( s.normal, halfDir ) );
 	float dotLH = saturate( dot( dir, halfDir ) );
     float fresnel = exp2( ( -5.55473 * dotLH - 6.98316 ) * dotLH );
 	vec3 F = ( 1.0 - s.specular ) * fresnel + s.specular;
 	
     vec3 L = (1. / PI) * s.diffuse * dotNL;
 	return color * (L + F * ( 0.25 * (1. / PI) * ( s.shiny * 0.5 + 1.0 ) * pow( dotNH, s.shiny ) ));
 }
 
 // body debug
 vec4 raygl_bars_3(vec4 m, vec2 uv) {
     vec4 color = vec4(0.);
     float inc = 1. / 4.;
     for(float j=0.;j<4.;j++) {
         float v = m.x;
         m.xyzw = m.yzwx;
         color.xyzw = color.yzwx;
         if(uv.x < j * inc || uv.x >= (j + 1.) * inc) { 
             continue;
         }
         if(uv.y > v){ 
             color.w = 0.2;
             continue;
         }
         color.w = 1.0;
     }
     if(color.a == 0.2) color.rgb = vec3(0.2);
     else if(color.a == 1.0) color.rgb = vec3(1.);
     color.a = 1.0;
     return color;
 }
 
 // body camera
 mat3 raygl_lookAt_2( in vec3 ro, in vec3 ta, float cr )
 {
 	vec3 cw = normalize(ta - ro);
 	vec3 cp = vec3(sin(cr), cos(cr),0.0);
 	vec3 cu = normalize( cross(cw,cp) );
 	vec3 cv = normalize( cross(cu,cw) );
     return mat3( cu, cv, cw );
 }
 
 // body https//tinyurl.com/y82cdk8k
 // El Jardí de Catalunya
 // by wizgrav, just normals
 vec3 raygl_CMOD_1 = vec3(0.0);
 vec2 raygl_BMOD_1 = vec2(0.5);
 vec4 raygl_rand_1(vec2 n) {
   return fract( vec4(1.0, 255.0, 65025.0, 16581375.0) * fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453));
 }
 float raygl_smin_1( float a, float b, float k )
 {
     float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
     return mix( b, a, h ) - k*h*(1.0-h);
 }
 vec2 raygl_sdf_map_1(in vec3 p) {
   p.xyz = p.xzy;
   vec3 c = raygl_CMOD_1;
   vec3 q = mod(p,c)-0.5 * c;
   vec3 z = q;
   vec3 dz=vec3(0.0);
   vec3 fl = floor((p-q) / raygl_CMOD_1) * raygl_CMOD_1;
   vec4 r4 = raygl_rand_1( fl.xy );
   float power = 8.0 + 2. * floor(4. * r4.x);
   float r, theta, phi;
   float dr = 1.0;
   float t0 = 1.0;
   for(int i = 0; i < 4; ++i) {
     r = length(z);
     if(r > 2.0) continue;
     theta = atan(z.y / z.x) ;
     phi = asin(z.z / r)  + iTime * 0.3  + 0.9 * mix(raygl_BMOD_1.x,1. - raygl_BMOD_1.y, 0.66 + r4.x * 0.33);
     
     dr = pow(r, power - 1.) * dr * power + 1. ;
     r = pow(r, power);
     theta = theta * power;
     phi = phi * power;
     z = r * vec3(cos(theta)*cos(phi), sin(theta)*cos(phi), sin(phi)) + q;
     power +=  2. * floor(4. * r4.y) + r4.x * 0.5;
     t0 = min(t0, r);
     r4.xyzw = r4.yzwx;
    }
   float rz = 0.5 * log(r) * r / dr;
   rz = raygl_smin_1(q.z , rz, 0.24);
   return vec2(rz, mix( 0.1, t0, abs(q.z) * 0.96 ));
 }
 float raygl_shape_1(in vec2 fragCoord, out vec3 pt, out vec3 nor) {
   raygl_CMOD_1 = vec3(2.9 ,2.9,0. );
   vec3 ro = vec3(4. + iTime * 0.33, 1.7 , 2.9);
   mat3 cam = raygl_lookAt_2(ro, ro + vec3(4.,-6. ,0.), 0.);
   vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
   vec3 rd = cam * normalize( vec3(p.xy,1.0) );
   vec2 res = raygl_cast_6(ro, rd);
   pt = ro + res.x * rd;
   nor = raygl_normals_6(pt);
   return res.y;
 }
 void raygl_main_1(inout vec4 fragColor, vec2 fragCoord) {
   vec3 pt;
   vec3 nor;
   raygl_shape_1(fragCoord, pt, nor);  
   fragColor.rgb = nor;
 }
 
 // body 
 // El Jardí de Catalunya
 // by wizgrav
 
   
 float raygl_fbm_(vec2 uv) {
     float amp = 1., freq = 6., asum = 0., res = 0.;
     for(int i=0; i < 3; i++) {
         res += raygl_noise_5(uv * freq , 1., false).x * amp;
         asum += amp;
         freq *= 2.;
         amp *= 0.5;
     }
     return res / asum;
 }
 void mainImage(out vec4 fragColor, vec2 fragCoord) {
   vec4 bms = vec4(1.);
   raygl_BMOD_1 = bms.xy;
   
    
   vec3 pt;
   vec3 nor;
   float m = raygl_shape_1(fragCoord, pt, nor);
   raygl_Surface_4 s;
   float z = 0.;
   float mz = raygl_sdf_map_1(vec3( pt.x, 1.0, pt.z)).x;
   float q = raygl_fbm_(pt.xz * 0.1);
   z =  raygl_fbm_(pt.xz * 0.2 + vec2(0.01, 0.02) * iTime + vec2(0.2 * bms.y,0.2 * bms.z)  + q);
   vec3 p = vec3(pt.x, 0.03 * z, pt.z );
   vec3 nor2 = normalize(cross(dFdx(p),dFdy(p)));
   float f = smoothstep(0., 0.1, pt.y);
   nor = mix(nor2, nor, f);
   s.diffuse = vec3(raygl_hsv2rgb_7(vec3(pow(m, 2.) ,   1. - m,  0.66 -  z * (1. - f)  )));
   s.specular = vec3(0.9);
   s.shiny = 32. * m;
   s.normal = nor;
   vec3 nv = normalize(vec3(2., 6., 2.));
   float att = max(0.33, length(pow(bms,vec4(1.33))));
   vec3 l = raygl_direct_4(s, vec3(att), nv);
   float ao = raygl_occlusion_6(pt, nor);
   vec3 col = mix(vec3(0.000, 0.067, 0.067), vec3(0.200, 0.196, 0.200) , s.normal.y) * ao * att + l * raygl_shadow_6( pt, nv, 0.1, 4.0 ); 
   col = pow(col, vec3(1./2.2));
   fragColor = vec4(col,1.0);

 }

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
