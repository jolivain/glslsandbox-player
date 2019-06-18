precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float hash(float n) { 
	return fract(sin(n)*43758.5453123); 
}

float noise3(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + p.z*113.0;
    float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                        mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                    mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                        mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
    return res;
}

float sdPlane( vec3 p ) {
  return -p.y;
}
float sdSphere( vec3 p, float r ) {
  return length(p)-r;
}

float sdCylinder( vec3 p, vec3 c ) {
  return length(p.xy-c.xy)-c.z;
}

vec2 rot(vec2 k, float t) {
    return vec2(cos(t)*k.x-sin(t)*k.y,sin(t)*k.x+cos(t)*k.y);
}

float DE(vec3 p) {
    //p.z+=time*2.0;
   // p.x+=sin(p.z*0.5)*2.0;
    //return sdCylinder(p, vec3(0.0,0.0,1.5));  
      //return sdSphere(p, 5.5); 
      return sdPlane(p*3.5);
}

vec4 DEc4(vec3 p) {
    float t=DE(p);
        p.z-=time*0.5;
        t+=noise3(p*3.5-(time*0.2))*0.8;

    vec4 res = vec4(  clamp( t, 0.0, 1.0 ) );
    	 res.xyz = mix( vec3(1.0,1.0,1.0), vec3(0.0,0.0,0.55), res.x );
	return res;
}

void main()
{
	
	vec3 rd=normalize( vec3( (-1.0+2.0*gl_FragCoord.xy/resolution.xy)*vec2(resolution.x/resolution.y,1.0), -1.0));
	vec3 lig=normalize(vec3(0.0, 1.0, 0.0));
	vec3 ro=vec3(0.0, -0.1, 0.0);
      
	ro.x = mouse.x * 4.0;
	ro.y += mouse.y;
	
	float d=0.0;
	//vec4 col=vec4(0.01,2.1,1.55,1.0);
	vec4 col=vec4(.0);
	vec3 pos = vec3(ro+rd*1.0);
	vec4 res; 
	for(int i=0; i<60; i++) {	
		res=DEc4(ro+rd*d);
    		res.xyz *= res.w;
    	    	col = col + res*(1.0 - col.w);  
       		d+=0.08;
	}

    	col = sqrt( col );
	col = mix(col,vec4(0.0,0.0,0.1,0.5),pos.y);
	
	gl_FragColor = vec4( col.xyz,1.0);
}

