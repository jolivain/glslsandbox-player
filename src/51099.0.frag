
precision highp float;

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
    p = abs(p) - b;
    return length(max(p, 0.0)) + min(max(p.x, p.y), 0.0);
}

mat2 rotate(float r) {
    float c = cos(r);
    float s = sin(r);
    return mat2(c, s, -s, c);
}

float map(vec3 p) {
    p.xy *= rotate(p.z * 0.08);
    p.xy = abs(p.xy);
    p.xy -= 2.0;
    return sdBox(p.xy, vec2(0.3));

}

vec3 hsv2rgb(float h, float s, float v) {
	h = mod(h, 360.0);
	if (s == 0.0) {
		return vec3(0.0, 0.0, 0.0);
	}
	float c = v * s;
	float i = h / 60.0;	
	float x = c * (1.0 - abs(mod(i, 2.0) - 1.0)); 
	return vec3(v - c) + (i < 1.0 ? vec3(c, x, 0.0) : 
			     		    i < 2.0 ? vec3(x, c, 0.0) : 
			     		    i < 3.0 ? vec3(0.0, c, x) : 
			     		    i < 4.0 ? vec3(0.0, x, c) : 
			     		    i < 5.0 ? vec3(x, 0.0, c) : 
			     		                   vec3(c, 0.0, x));
}

vec3 materialColor = vec3(0.85, 0.7, 0.5) * 2.0;

vec3 raymarch(vec3 ro, vec3 rd) {
    vec3 color = vec3(1.0) + 1.0 * hsv2rgb(mod(time * 20.0, 360.0), 1.0, 1.0);
    vec3 p = ro;
    float minD = 10000.0;
    for (int i = 0; i < 64; i++) {
        float d = map(p);
        p += d * rd;
        minD = min(d, minD);
        if (d < 0.01) {
            return color;
        }
    }
    return color * vec3(1.0 - smoothstep(0.0, 0.5 + 0.8 * exp(3.0 * sin(time * 1.0)) / exp(3.0), minD));
}

void main(void) {
    vec2 st = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);

    vec3 ro = vec3(5.0, 5.0, 5.0 - time * 20.0);
    vec3 ta = vec3(0.0, 0.0, 0.0 - time * 20.0);
    vec3 z = normalize(ta - ro);
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 x = normalize(cross(z, up));
    vec3 y = normalize(cross(x, z));
    vec3 rd = normalize(x * st.x + y * st.y + z);

    vec3 c = raymarch(ro, rd);


    gl_FragColor = vec4(c, 1.0);   
}
