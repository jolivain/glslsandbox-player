// stolen from https://www.shadertoy.com/view/MsVXWW
// mini version....  for something  ;-)
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
#define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)
float nudge = 0.0;    // size of perpendicular vector
float normalizer = 0.0;    // pythagorean theorem on that perpendicular to maintain scale
float SpiralNoiseC(vec3 p){
    float n = 0.0;    // noise amount
    float iter = 1.0;
    for (int i = 0; i < 6; i++){         // add sin and cos scaled inverse with the frequency
        n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;    // abs for a ridged look
        // rotate by adding perpendicular and scaling down
        p.xy += vec2(p.y, -p.x) * nudge;
        p.xy *= normalizer;        // rotate on other axis
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;        // increase the frequency
        iter *= 1.733733;
    }
    return n;
}

float SpiralNoise3D(vec3 p){
    float n = 0.0;
    float iter = 1.0;
    for (int i = 0; i < 5; i++){
        n += (sin(p.y*iter) + cos(p.x*iter)) / iter;
        p.xz += vec2(p.z, -p.x) * nudge;
        p.xz *= normalizer;
        iter *= 1.33733;
    }
    return n;
}

float NebulaNoise(vec3 p){
   float final = p.y + 4.5;
    final -= SpiralNoiseC(p.xyz); // mid-range noise
    final += SpiralNoiseC(p.zxy*0.5123 + 100.0)*4.0; // large scale features
    final -= SpiralNoise3D(p); // more large scale features, but 3d
    return final;
}

float map(vec3 p){
    R(p.xz, time*0.4);
    float r = length(p);
    float star = r + 0.5;
    float noise = 1.0 + pow(abs(NebulaNoise(p/0.5)*0.5), 1.5);
    return mix(star, noise, smoothstep(0.45, 1.5, r) - smoothstep(2.0, 3.0, r));
}

bool RaySphereIntersect(vec3 org, vec3 dir, out float near, out float far){
    float b = dot(dir, org);
    float c = dot(org, org) - 8.;
    float delta = b*b - c;
    if(delta < 0.0) return false;
    float deltasqrt = sqrt(delta);
    near = -b - deltasqrt;
    far = -b + deltasqrt;
    return far > 0.0;
}

const vec3 starColor = vec3(1.0, 0.5, 0.25);
void main(void) {
    nudge = 0.739513+cos(time*0.0095);
    normalizer = 1.0 / sqrt(1.0 + nudge*nudge);
    vec3 rd = normalize(vec3((gl_FragCoord.xy-0.5*resolution.xy)/resolution.y, 1.0));
    vec3 ro = vec3(0.0, 0.0, -4.0);   
    const float rot = 0.01;
    int steps = 0;    const int max_steps = 64;
    const float max_advance = 1.0;
    float t = 0.0;    vec4 sum = vec4(0.0);
    float min_dist=0.0, max_dist=0.0;
    if(RaySphereIntersect(ro, rd, min_dist, max_dist)){
        float dither = 0.5 - 1.5;//*texture2D(iChannel0, gl_FragCoord.xy/256.0).r;
        t = min_dist + max_advance*dither;
        for(int i = 0; i < max_steps; i++){
            if(sum.a > 0.95 || t > max_dist) break;           
            vec3 pos = ro + t*rd;
            float dist = map(pos);
            float advance = clamp(0.05*dist, 0.01, max_advance);   
            float density = max(1.2 - dist, 0.0);
            vec3 emit = starColor*(110.0*advance*density/dot(pos, pos));
            float block = 1.0 - pow(0.05, density*advance/0.05);
            sum += (1.0 - sum.a)*vec4(emit, block);
            t += advance;
            steps = i;
        }
    }
    sum.rgb = pow(sum.rgb, vec3(4.2));
    sum.rgb = sum.rgb/(1.0 + sum.rgb);
    gl_FragColor = vec4(sum.xyz,1.0);
}
