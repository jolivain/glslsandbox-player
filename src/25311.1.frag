precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

#define RENDER_MODE

#define PI 3.14159265359
#define DEG2RAD (PI/180.0)

#ifdef RENDER_MODE
vec3 rotateX(vec3 p, float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return vec3(p.x, c*p.y+s*p.z, -s*p.y+c*p.z);
}

vec3 rotateY(vec3 p, float angle)
{
    float c = cos(angle);
   float s = sin(angle);
    return vec3(c*p.x-s*p.z, p.y, s*p.x+c*p.z);
}

vec3 rotateZ(vec3 p, float angle)
{
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c*p.x+s*p.y, -s*p.x+c*p.y, p.z);
}


float kaleidoscopic_IFS(vec3 z)
{
    const int FRACT_ITER      = 20;
    float FRACT_SCALE   = 1.8;
    float FRACT_OFFSET  = 1.0;
	
    float c = 2.0;
    z.y = mod(z.y, c)-c/2.0;
    z = rotateZ(z, PI/2.0);
    float r;
    int n1 = 0;
    for (int n = 0; n < FRACT_ITER; n++) {
        float rotate = PI*0.5;
        z = rotateX(z, rotate);
        z = rotateY(z, rotate);
        z = rotateZ(z, rotate);

        z.xy = abs(z.xy);
       // if (z.x+z.y<0.0) z.xy = -z.yx; // fold 1
        //if (z.x+z.z<0.0) z.xz = -z.zx; // fold 2
        //if (z.y+z.z<0.0) z.zy = -z.yz; // fold 3
        z = z*FRACT_SCALE - FRACT_OFFSET*(FRACT_SCALE-1.0);
    }
    return (length(z) ) * pow(FRACT_SCALE, -float(FRACT_ITER));
}


float tglad_formula(vec3 z0)
{
	z0 = mod(z0, 2.);
	
    float mr=0.25, mxr=1.0;
    vec4 scale=vec4(-3.12,-3.12,-3.12,3.12), p0=vec4(0.0,1.59,-1.0,0.0);
    vec4 z = vec4(z0,1.0);
    for (int n = 0; n < 3; n++) {
        z.xyz=clamp(z.xyz, -0.94, 0.94)*2.0-z.xyz;
        z*=scale/clamp(dot(z.xyz,z.xyz),mr,mxr)*1.;
        z+=p0;
    }
    float dS=(length(max(abs(z.xyz)-vec3(1.2,49.0,1.4),0.0))-0.06)/z.w;
    return dS;
}

// distance function from Hartverdrahtet
// ( http://www.pouet.net/prod.php?which=59086 )
float hartverdrahtet(vec3 f)
{
	vec3 cs=vec3(.808,.808,1.167);
	float fs=1.;
	vec3 fc=vec3(0);
	float fu=10.;
	float fd=.763;
	
	// scene selection
	int i = int(mod(time/2.0, 9.0));
	if(i==0) cs.y=.58;
	if(i==1) cs.xy=vec2(.5);
	if(i==2) cs.xy=vec2(.5);
	if(i==3) fu=1.01,cs.x=.9;
	if(i==4) fu=1.01,cs.x=.9;
	if(i==6) cs=vec3(.5,.5,1.04);
	if(i==5) fu=.9;
	if(i==7) fd=.7,fs=1.34,cs.xy=vec2(.5);
	if(i==8) fc.z=-.38;
	
	//cs += sin(time)*0.2;
		
	float v=1.;
	for(int i=0; i<12; i++){
		f=2.*clamp(f,-cs,cs)-f;
		float c=max(fs/dot(f,f),1.);
		f*=c;
		v*=c;
		f+=fc;
	}
	float z=length(f.xy)-fu;
	return fd*max(z,abs(length(f.xy)*f.z)/sqrt(dot(f,f)))/abs(v);
}

float pseudo_kleinian(vec3 p)
{
	const vec3 CSize = vec3(0.92436,0.90756,0.92436);
	const float Size = 1.0;
	const vec3 C = vec3(0.0,0.0,0.0);
	float DEfactor=1.;
	const vec3 Offset = vec3(0.0,0.0,0.0);
   	vec3 ap=p+1.;
	for(int i=0;i<10 ;i++){
		ap=p;
		p=2.*clamp(p, -CSize, CSize)-p;
		float r2 = dot(p,p);
		float k = max(Size/r2,1.);
		p *= k;
		DEfactor *= k;
		p += C;
	}
	float r = abs(0.5*abs(p.z-Offset.z)/DEfactor);
	return r;
}

float pseudo_knightyan(vec3 p)
{	
	const vec3 CSize = vec3(0.63248, 0.78632, 0.775);
	float DEfactor=1.;
	for(int i=0;i<6;i++){
		p = 2.*clamp(p, -CSize, CSize)-p;
		float k = max(0.70968/dot(p,p),1.);
		p *= k;
		DEfactor *= k*1.1;
	}
	float rxy=length(p.xy);
	return max(rxy-0.92784, abs(rxy*p.z) / length(p))/DEfactor;
}


float map(vec3 p)
{
	//return kaleidoscopic_IFS(p);
	return tglad_formula(p);
	//return hartverdrahtet(p);
	//return pseudo_kleinian(p);
	//return pseudo_knightyan(p);
}

vec3 guess_normal(vec3 p)
{
	const float d = 0.001;
	return normalize( vec3(
		map(p+vec3(  d,0.0,0.0)) - map(p+vec3( -d,0.0,0.0)),
		map(p+vec3(0.0,  d,0.0)) - map(p+vec3(0.0, -d,0.0)),
		map(p+vec3(0.0,0.0,  d)) - map(p+vec3(0.0,0.0, -d)) ) );
}


vec2 pattern(vec2 p)
{
	p = fract(p);
	float r = 0.123;
	float v = 0.0, g = 0.0;
	r = fract(r * 9184.928);
	float cp, d;
	
	d = p.x;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.y;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.x - 1.0;
	g += pow(clamp(3.0 - abs(d), 0.0, 1.0), 1000.0);
	d = p.y - 1.0;
	g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 10000.0);
	
	const int iter = 12;
	for(int i = 0; i < iter; i ++)
	{
		cp = 0.5 + (r - 0.5) * 0.9;
		d = p.x - cp;
		g += pow(clamp(1.0 - abs(d), 0.0, 1.0), 200.0);
		if(d > 0.0) {
			r = fract(r * 4829.013);
			p.x = (p.x - cp) / (1.0 - cp);
			v += 1.0;
		}
		else {
			r = fract(r * 129.528);
			p.x = p.x / cp;
		}
		p = p.yx;
	}
	v /= float(iter);
	return vec2(g, v);
}

vec2 sphere_mapping(vec3 p)
{
	return vec2(
		asin(p.x)/PI + 0.5,
		asin(p.y)/PI + 0.5);
}


mat3 axis_rotation_matrix33(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c          );
}

#endif

void main( void ) {
#ifdef RENDER_MODE
	vec3 pos = vec3(vec2((gl_FragCoord.xy*2.0 - resolution.xy) / resolution.y), 0.0);
	
	vec3 camPos = vec3(5.0*cos(time*0.1), 0.5*sin(time*0.2), 5.0*sin(time*0.1));
	vec3 camDir = normalize(pos - camPos);
	vec3 camUp = normalize( vec3(0.0, 1.0+cos(time*0.1)*0.75, sin(time*0.1)*0.75) );
	camUp  = axis_rotation_matrix33(cross(camDir, camUp), 90.0*DEG2RAD)*camDir;
	vec3 camSide = cross(camDir, camUp);
	
	float fovy = 60.0;
	
	vec3 rayDir = normalize(camSide*-pos.x + camUp*-pos.y + camDir*1.0/tan(fovy*0.5*DEG2RAD));
	vec3 rayPos = camPos;
	float m = 0.0;
	float d = 0.0, total_d = 0.0;
	const int MAX_MARCH = 100;
	const float MAX_DISTANCE = 100.0;
	for(int i=0; i<MAX_MARCH; ++i) {
		d = map(rayPos);
		total_d += d;
		rayPos += rayDir * d;
		m += 1.0;
		if(d<0.001) { break; }
		if(total_d>MAX_DISTANCE) { break; }
	}
	
	vec3 normal = guess_normal(rayPos);
	
	float r = mod(time*2.0, 20.0);
	float glow = max((mod(length(rayPos)-time*1.5, 10.0)-9.0)*2.5, 0.0);
	vec3 gp = abs(mod(rayPos, vec3(0.4)));
	vec2 p =(sphere_mapping(normalize(rayPos)*mod(length(rayPos), 1.0))*2.0);
	if(p.x<1.4) {
		glow = 0.0;
	}
	else {
		glow += 0.0;
	}
	glow += max(1.0-abs(dot(-camDir, normal)) - 0.4, 0.0) * 0.5;
	
	float c = (total_d)*0.01;
	vec4 result = vec4( vec3(c, c, c) + vec3(0.02, 0.02, 0.025)*m*0.4, 1.0 );
	result.xyz += vec3(0.5, 0.5, 0.75)*glow;
	//result *= mod(gl_FragCoord.y, 4.0)<2.0 ? 0.6 : 1.0;
	//result.xyz = normal*0.5+0.5;
	gl_FragColor = result;

	
	
#else
	gl_FragColor = vec4(0.2);
#endif
	
}
