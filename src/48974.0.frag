/*
 * Original shader from: https://www.shadertoy.com/view/4lKyDD
 */

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

#define R iResolution.xy
#define PI 3.14159265359
#define T iTime

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

//http://geomalgorithms.com/a02-_lines.html
float distLine(vec2 point,vec2 start,vec2 end){
    
     vec2 v = end-start;
    vec2 w=point-start;

     float c1 = dot(w,v);
     if ( c1 <= 0.0 )
          return length(point-start);

     float c2 = dot(v,v);
     if ( c2 <= c1 )
          return length(point-end);

     float b = c1 / c2;
     vec2 Pb = start + b * v;
     return length(point-Pb);
}

float walls(vec2 p){
    return min(p.x,min(p.y,min(R.x-p.x,R.y-p.y)));
}
float content(vec2 p){
    return min(length(p-0.7*R)-30.0,min(distLine(p,vec2(0.2,0.9)*R,vec2(0.4,0.7)*R),min(length(p)-50.0,length(p-R)-100.0)));
}

float distToScene(vec2 p){
    return min(content(p),walls(p));
}
const float EPS_N=0.001;
vec2 get_normal(vec2 p){
    vec2 o=vec2(0.0001,0.0);
    float x=distToScene(vec2(p.x+EPS_N,p.y))-distToScene(vec2(p.x-EPS_N,p.y));
    float y=distToScene(vec2(p.x,p.y+EPS_N))-distToScene(vec2(p.x,p.y-EPS_N));
    return normalize(vec2(x,y));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv=fragCoord;
       
    float dist=distToScene(uv);
    
    fragColor=vec4(cos(abs(dist*0.02))*0.4+0.5);
    //fragColor=vec4(0.0);
    
    vec2 start=R/2.0;
    //replace image on medium
    //vec2 dir=normalize(iMouse.xy-start);
    vec2 dir=vec2(cos(T*0.1),sin(T*0.1));
    
    vec2 start0=start;
    float t=distToScene(start);
    float finalT=1000.0;
    float totalT=0.0;
    for(int i=0;i<60;i++){
        vec2 pStart=start;
        float pT=t;
        start+=t*dir;
        finalT=t;
        totalT+=t;
        t=distToScene(start);
        float circleDist=abs(length(uv-pStart))-pT;
        fragColor=mix(vec4(1.0),fragColor,smoothstep(circleDist,0.0,2.0));
        fragColor=mix(vec4(1.0),fragColor,smoothstep(-circleDist,-2.0,0.0));
        float dist=length(uv-pStart)-5.0;
        fragColor=mix(vec4(1.0,0.0,0.0,1.0),fragColor,smoothstep(dist,0.0,2.0));
        fragColor=mix(vec4(1.0,0.0,0.0,1.0),fragColor,smoothstep(-dist,-2.0,0.0));
        if (finalT>0.0 && finalT<=0.1) break;
    }
    
    float rayDist=distLine(uv,start0,start);
    fragColor=mix(vec4(1.0),fragColor,smoothstep(rayDist,0.0,2.0));
    
    vec2 normal=get_normal(start);
    float ang=atan(normal.y,normal.x)*0.5/PI+0.5;
    float normalDist=distLine(uv,start,start+normal*50.0);
    vec3 normalCol=hsv2rgb(vec3(clamp(ang,0.0,1.0),1.0,1.0));
    fragColor=mix(vec4(normalCol,1.0),fragColor,smoothstep(normalDist,0.0,2.0));
    
    
    //smooth outside boundaries
    fragColor=mix(vec4(0.0,0.0,1.0,1.0),fragColor,smoothstep(distToScene(uv),0.0,3.0));
    
    //smooth inside boundaries
    fragColor=mix(vec4(0.0,0.0,1.0,1.0),fragColor,smoothstep(-distToScene(uv),-3.0,0.0));
}


// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
    gl_FragColor.a = 1.0;
}
