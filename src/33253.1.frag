#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

float tri(in float x) {
	return abs(fract(x)-.5);
}

float square(in float x) {
	return fract(x) > 0.5 ? 1.0 : 0.0;
}

vec3 tri3(in vec3 p) {
	return vec3( tri(p.z+tri(p.y*1.)), tri(p.z+tri(p.x*1.)), tri(p.y+tri(p.x*1.)));
}

vec3 sin3(vec3 p) {
	return abs(vec3(sin(p.z + sin(p.y)), sin(p.z + sin(p.x)), sin(p.y + sin(p.x)) ));
}

float sineNoise3d(in vec3 p, in float spd) {
	float z = 1.4;
	float rz = 0.;
	vec3 bp = p;
	for (float i=0.; i<=3.; i++ ) {
        	vec3 dg = sin3(bp*2.);
        	p += (dg+time*spd);

        	bp *= 1.8;
		z *= 1.5;
		p *= 1.2;
        	
        	rz += (tri(p.z+tri(p.x+tri(p.y))))/z;
        	bp += 0.14;
	}
	return rz;
}

float triNoise3d(in vec3 p, in float spd) {
	float z = 1.4;
	float rz = 0.;
	vec3 bp = p;
	for (float i=0.; i<=3.; i++ ) {
        	vec3 dg = tri3(bp*2.);
        	p += (dg+time*spd);

        	bp *= 1.8;
		z *= 1.5;
		p *= 1.2;
        	
        	rz+= (tri(p.z+tri(p.x+tri(p.y))))/z;
        	bp += 0.14;
	}
	return rz;
}

float hash2(vec2 p) {
	return fract(sin(dot(p, vec2(15.64, 35.82))) * 43758.26);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5*(b - a)/k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

float map(vec3 p) {
	//p.x += abs(fract(p.y + time) - 0.5);
	vec3 q = p;
	p.xz *= 1.5;
	float b = hash2(floor(p.xz / 2.0)) * 3.141592 * 2.0;
	p.xz = mod(p.xz, 2.0) / 2.0 - 0.5;
	p.x += sin(p.y * 3.14 * 2.0 + time + b) * 0.05;
	p.z += cos(p.y * 3.14 * 2.0 + time + b) * 0.05;
	float tn =  triNoise3d(q * 0.2, 0.1) * 0.1;
	float d = max(length(abs(p.xz)) - sin(-p.y*3.14 / 2.0 + 1.5) * 0.1, abs(p.y) - 1.0);
	d = smin(d, q.y + 0.2 + tn, 0.4);
	return d;
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(-1.0, 1.0) * 0.01;
    return normalize(
        e.xyy * map(p + e.xyy) +
        e.yxy * map(p + e.yxy) +
        e.yyx * map(p + e.yyx) +
        e.xxx * map(p + e.xxx)
    );
}

float shadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float t = mint;
    float res = 1.0;
    for(int i = 0; i < 30; i++) {
        if(t > maxt) continue;
        float h = map(ro + rd * t);
        t += h;
        res = min(res, k * h / t);
    }
    return res;
}

float calculateAO(vec3 p, vec3 n){
	const float AO_SAMPLES = 5.0;
	float r = 0.0, w = 1.0, d;
	
	for (float i=1.0; i<AO_SAMPLES+1.1; i++){
		d = i/AO_SAMPLES;
		r += w*(d - map(p + n*d));
		w *= 0.5;
	}
	
	return 1.0-clamp(r,0.0,1.0);
}
void main() { 
	vec2 p = gl_FragCoord.xy / resolution;
	p = 2.0 * p - 1.0;
	p.x *= resolution.x / resolution.y;
	
	float tt = time * 0.2;
	vec3 ro = vec3(0.0, 2.0 + 3.0 * (sin(tt) * 0.5 + 0.5), 7.0 + tt);
	vec3 target = ro - vec3(0.0, 2.0 + sin(tt), 4.0);
	vec3 cw = normalize(target - ro);
	vec3 cup = vec3(0.0, 1.0, 0.0);
	vec3 cu = normalize(cross(cw, cup));
	vec3 cv = normalize(cross(cu, cw));
	vec3 rd = normalize(p.x * cu + p.y * cv + 2.5 * cw);
	
	float t = 0.0;
	float e = 0.01;
	float h = e * 2.0;
	for(int i = 0; i < 120; i++) {
		if(h < e || t > 20.0) continue;
		h = map(ro + rd * t);
		t += h;
	}
	
	float col = 0.0;
	vec3 pos = vec3(0.0);
	if(t < 20.0) {
		pos = ro + rd * t;
		vec3 lig = normalize(vec3(1.0));
		vec3 nor = calcNormal(pos);
		float dif = clamp(dot(nor, lig), 0.0, 1.0);
		float bak = 1.0 - dot(-rd, nor);
		float depth = pow(1.0 - t / 20.0, 2.0);	  
		float spe = pow(clamp(dot(rd, reflect(lig, nor)), 0.0, 1.0), 12.0);
		//float sh = shadow(pos, lig, 0.01, 20.0, 6.0);
		float ao = calculateAO(pos, nor); 
		col = ((dif + spe * 20.0) * ao + bak * 1.5);
		col *= depth;
	}
	vec3 color = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.2), pow(0.5 + 0.5 * sin(pos.y * 39.0), 3.0)) * col;
	gl_FragColor = vec4(color, 1.0);
}
