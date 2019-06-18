#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;


vec3 trans(vec3 p)
{
	//return mod(p, 2.0)-1.0;
	vec3 moddata = vec3(mod(p.x, 4.0)-2.0,mod(p.y, 4.0)-2.0,mod(p.z, 4.0)-2.0)*1.0;
	return moddata;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float lengthN(vec3 v, float n)
{
	vec3 tmp = pow(abs(v), vec3(n));
	return pow(tmp.x+tmp.y+tmp.z, 1.0/n);
}

float distanceFunction(vec3 pos)
{
	return sdBox(trans(pos),vec3(0.3));
}
 
void main() {
	vec2 pos = (gl_FragCoord.xy*2.0 -resolution) / resolution.y;
	
	vec3 camPos = vec3(0.1, 10.0, 4.0);
	vec3 camDir = vec3(0.4, sin(time)*0.01, -1.0);
	camPos -= vec3(time*-15.0,0.5,time * 0.0);
	vec3 camUp = vec3(((mod(time/10.,15.0))), 1.0, 1.0);
	vec3 camSide = cross(camDir, camUp);
	float focus = 1.0;
	
	vec3 rayDir = normalize(camSide*pos.x + camUp*pos.y + camDir*focus);	    
    vec3 ray = camPos;
    int march = 0;
    float d = 0.0;

    float total_d = 0.0;
    const int MAX_MARCH = 24;
    const float MAX_DIST = 100.0;
    for(int mi=0; mi<MAX_MARCH; ++mi) {
        d = distanceFunction(ray);
        march=mi;
        total_d += d;
        ray += rayDir * d;
        if(d<0.001) {break; }
        if(total_d>MAX_DIST) {
            total_d = MAX_DIST;
            march = MAX_MARCH-1;
            break;
        }
    }
	
    float fog = min(1.0, (1.0 / float(MAX_MARCH)) * float(march))*0.6;
    vec3  fog2 = 0.013 * vec3(1, 1, 1.5) * total_d;
    gl_FragColor = vec4(vec3(clamp(sin(time/2.),0.,0.5), clamp(cos(time/4.),0.,0.5), 0.2)*fog + fog2, 1.0);
	
}
