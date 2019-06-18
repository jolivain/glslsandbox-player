/*
 * Original shader from: https://www.shadertoy.com/view/WdBSR1
 */

#extension GL_OES_standard_derivatives : enable

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
#define PI 3.14159265359
#define matRotateX(rad) mat3(1,0,0,0,cos(rad),-sin(rad),0,sin(rad),cos(rad))
#define matRotateY(rad) mat3(cos(rad),0,-sin(rad),0,1,0,sin(rad),0,cos(rad))
#define matRotateZ(rad) mat3(cos(rad),-sin(rad),0,sin(rad),cos(rad),0,0,0,1)

float sdHexPrism( vec3 p, vec2 h )
{
    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float opSmoothUnion( float d1, float d2, float k ) {
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h); 
}

float sdLine( in vec2 p, in vec2 a, in vec2 b )
{
	vec2 pa = p-a, ba = b-a;
	float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
	return length( pa - ba*h );
}

vec3 line( in vec3 buf, in vec2 a, in vec2 b, in vec2 p, in vec2 w, in vec4 col )
{
   float f = sdLine( p, a, b );
   float g = fwidth(f)*w.y;
   return mix( buf, col.xyz, col.w*(1.0-smoothstep(w.x-g, w.x+g, f)) );
}

vec4 map(vec3 p){
    p *= matRotateZ(radians(iTime*5.0));
    p.y-= iTime*0.3;
    vec3 pref = p;
    
    float animateH = sin(iTime*3.0)*0.02;
    
    pref.x = mod(pref.x,0.4)-0.2;
    pref.y = mod(pref.y,0.7)-0.35;
    pref*= matRotateZ(radians(30.0));
    float d0 = sdHexPrism(pref+ vec3(0.0,0.0,-1.0),vec2(0.17,0.06+animateH));
    float d01 = sdHexPrism(pref+ vec3(0.0,0.0,-1.0),vec2(0.2,0.05+animateH));
    d0 = max(-d0,d01);
    pref = p;
    
    animateH =  sin(iTime*2.0)*0.02;
    pref += vec3(0.2,-0.35,-1.0);
    pref.x = mod(pref.x,0.4)-0.2;
    pref.y = mod(pref.y,0.7)-0.35;
    pref*= matRotateZ(radians(30.0));
    float d1 = sdHexPrism(pref,vec2(0.17,0.06+animateH));
    float d11 = sdHexPrism(pref,vec2(0.2,0.05+animateH));
    d1 = max(-d1,d11);
    pref = p;
    
    return vec4(vec3(0.0,0.7,0.0),opSmoothUnion(d0,d1,0.07));
}

vec3 normalMap(vec3 p){
	float d = 0.0001;
	return normalize(vec3(
		map(p + vec3(  d, 0.0, 0.0)).w - map(p + vec3( -d, 0.0, 0.0)).w,
		map(p + vec3(0.0,   d, 0.0)).w - map(p + vec3(0.0,  -d, 0.0)).w,
		map(p + vec3(0.0, 0.0,   d)).w - map(p + vec3(0.0, 0.0,  -d)).w
	));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
	vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
	mat3 camRotY = matRotateY(radians(sin(iTime)*3.0));
    
	vec3 ro=vec3(0.,0.0,0.0);
    vec3 rd=normalize(vec3(p,1.0));
	
    float t, dist;
	t = 0.0;
	vec3 distPos = vec3(0.0);
	vec4 distCl = vec4(0.0);
	for(int i = 0; i < 30; i++){
		distCl = map(distPos);
		dist = distCl.w;
		if(dist < 1e-4){break;}
        if(t>13.)break;
		t += dist;
		distPos = (ro+rd*t)*camRotY;
	}

	vec3 color;
	float shadow = 1.0;
	
	if(t < 13.){
		// lighting
		vec3 lightDir = vec3(1.0, 10.0, 1.0);
		vec3 light = normalize(lightDir);
		vec3 normal = normalMap(distPos);

        vec3 V = distPos;
        vec3 L = normalize(lightDir-V);
        
        vec3 E = normalize(-V);
        vec3 R = normalize(-reflect(L, normal));
        
		// difuse color
        float diffuseVal = 2.7;
        float diffuse = diffuseVal * max(dot(normal, L), 0.0);
        diffuse = clamp(diffuse, 0.0, 1.0);
        
		float specVal = 0.9;
		float shininess = 10.0;
		float spec = specVal * pow(max(dot(R, E), 0.0), 0.3*shininess);
        spec = clamp(spec, 0.0, 1.0);
				
        float AmbientVal = 1.5;
        vec3 AmbientColor = vec3(0.5);
        vec3 DiffuseColor = vec3(0.3,0.3,0.3);
        vec3 SpecularColor = vec3(0.9);
		vec3 ambient = AmbientVal * AmbientColor;        
        
		float lambert = max(.0, dot( normal, light));

		// result
		color = (distCl.xyz+(.1-length(p.xy)/3.))*vec3(1.0, 1.0, 1.0);
        color *= ambient +(DiffuseColor * diffuse)+ (SpecularColor*spec);
	}else{
        color =.84*max(mix(vec3(0.1,0.11,0.15)+(.1-length(p.xy)/3.),vec3(1),.1),0.);
	}

    vec3 white = vec3(1.0);
    vec3 logoCol = vec3(0.0);
    vec2 logoPos = vec2(0.4,0.0);
    
    p.x+=(mod(iTime,2.0)<0.3)?sin(floor(p.y*20.0)*iTime*30.)*0.03:0.0;
    
	logoCol = line( logoCol, vec2(0.0, 0.07), vec2(0.0, -0.07), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
	logoCol = line( logoCol, vec2(0.0, -0.1), vec2(0.12, -0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.0, 0.1), vec2(0.12, 0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    
    logoCol = line( logoCol, vec2(0.2, 0.07), vec2(0.2, -0.07), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
	logoCol = line( logoCol, vec2(0.2, -0.1), vec2(0.32, -0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.2, 0.1), vec2(0.32, 0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.24, 0.0), vec2(0.32, 0.0), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    
	logoCol = line( logoCol, vec2(0.4, 0.1), vec2(0.4, -0.07), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.4, -0.1), vec2(0.52, -0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.6, 0.1), vec2(0.6, -0.07), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    logoCol = line( logoCol, vec2(0.6, -0.1), vec2(0.72, -0.1), p+logoPos, vec2(0.02,2.0), vec4(white,2.0) );
    
	// rendering result
	float brightness = 1.0;
	vec3 dst = color*brightness;
	fragColor = vec4(dst+logoCol, 1.0);
}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
