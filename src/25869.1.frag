// Copyright (c) 2013 Andrew Baldwin (baldand)
// License = Attribution-NonCommercial-ShareAlike (http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US)

// "Mirror Cube"
// A simple ray tracer and a simple scene - one cube
// Gigatron for glslsandbox ./.
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;




const vec3 up = vec3(0.,1.,0.);

float intersectfloor(vec3 ro, vec3 rd, float height, out float t0)
{	
	if (rd.y==0.0) {
		t0 = 100000.0;
		return 0.0;
	}
	
	t0 = -(ro.y - height)/rd.y;
	t0 = min(100000.0,t0);
	return t0;
}

float intersectbox(vec3 ro, vec3 rd, float size, out float t0, out float t1, out vec3 normal)
// Calculate intersections with origin-centred axis-aligned cube with sides length size
// Returns positive value if there are intersections
{
    vec3 ir = 1.0/rd;
    vec3 tb = ir * (vec3(-size*.5)-ro);
    vec3 tt = ir * (vec3(size*.5)-ro);
    vec3 tn = min(tt, tb);
    vec3 tx = max(tt, tb);
    vec2 t = max(tn.xx, tn.yz);
    t0 = max(t.x, t.y);
    t = min(tx.xx, tx.yz);
    t1 = min(t.x, t.y);
	float d = (t1-t0);
	vec3 i = ro + t0*rd;
	normal = step(size*.499,abs(i))*sign(i);
	if (t0<-0.1) d = t0;
	return d;
}

float intersect(vec3 boxPos, vec3 ro, vec3 rd, out vec3 intersection, out vec3 normal, out int material, out float t) 
{
	float tb0=0.0;
	float tb1=0.0;
	vec3 boxnormal;
	float dbox = intersectbox(ro-boxPos,rd,1.,tb0,tb1,boxnormal);
	float tf = 0.0;
	float dfloor = intersectfloor(ro,rd,0.,tf);
	t = tf;
	float d = dfloor;
	material = 4; // Sky
	if (d>=0.) {
		normal = vec3(0.,1.,0.);
		material = 2; // Floor
	}
	if (dbox>=0.) {
		t = tb0;
		d = dbox;
		normal = boxnormal;
		material = 1; // Box
		if (t<0.) d=-0.1;
	}
	intersection = ro+t*rd;
	return d;
}
				
void main()
{
	float rotspeed = time*1.+mouse.x/resolution.x;
	vec3 light = vec3(5.,4.+3.*sin(-rotspeed*.4),2.);
	float radius = sin(rotspeed*.1)*2.+4.;
	vec3 boxPos = vec3(0.3,1.5*abs(sin(rotspeed)),0.2);// bounce please
	vec3 eye = vec3(radius*sin(rotspeed),2.*sin(.1*rotspeed)+2.5+2.*mouse.y/resolution.y,radius*cos(rotspeed*1.));
	vec3 screen = vec3((radius-1.)*sin(rotspeed),1.5*sin(.1*rotspeed)+2.+2.*mouse.y/resolution.y,(radius-1.)*cos(rotspeed*1.));
        vec2 screenSize = vec2(resolution.x/resolution.y,1.0);
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 offset = screenSize * (uv - 0.5);
	vec3 right = cross(up,normalize(screen - eye));
	vec3 ro = screen + offset.y*up + offset.x*right;
	vec3 rd = normalize(ro - eye);
	vec3 i = vec3(0.);
	vec3 n = vec3(0.);
	int m,m2;
	float d,lightd,ra,global,direct,shade,t,tlight;
	vec3 lrd=vec3(0.),i2=vec3(0.),n2=vec3(0.);
	vec3 c=vec3(0.);
	vec3 ca=vec3(0.);
	float lra=1.;
	for (int reflections=0;reflections<10;reflections++) {
		// Find the direct ray hit
		d = intersect(boxPos,ro,rd,i,n,m,t);
		// Check for shadows to the light
		lrd = normalize(light-i);
		tlight = length(light-i);
		lightd = smoothstep(.5*length(i-i2),.0,intersect(boxPos,i,lrd,i2,n2,m2,t));
		if (t>tlight) lightd=1.0;
		// Colouring
		global = .3;
		direct = max( (10./length(lrd)) * dot( lrd, n) ,0.0);
		shade = global + direct*lightd;
		if (m==0) { ra=0.0; c = vec3(0.9,2.0,2.5); }
		if (m==1) { ra=0.2; c = shade*(.5+.5*(i-boxPos)); }
		if (m==2) {
			ra = 0.3;
			vec2 mxz = abs(fract(i.xz)*2.-1.);
			float fade = clamp(1.-length(i.xz)*.05,0.,1.);
			float fc =mix(.5,smoothstep(1.,.9,mxz.x+mxz.y),fade);
			c = vec3(fc*shade);
		}
		// Calculate any reflection on the next iteration
		ca += lra*c;
		lra *= ra;
		rd = reflect(rd,n);
		ro = i+0.01*rd;
	}
	gl_FragColor = vec4(ca/(1.+ca),1.);
}
