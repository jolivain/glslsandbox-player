/*
 * Original shader from: https://www.shadertoy.com/view/llGcDz
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
precision highp float;

struct Camera {
  vec3 position;
  vec3 target;
  float fov;
};

struct Ray {
  vec3 origin;
  vec3 direction;
};

struct Light {
  vec3 position;
};

vec3 calculateRayDirection(Camera c, vec2 uv) {
  vec3 forward = normalize(c.target - c.position);
  vec3 right = normalize(vec3(forward.z, 0.0, -forward.x));
  vec3 up = normalize(cross(forward, right));

  return normalize(forward + c.fov * uv.x * right + c.fov * uv.y * up);
}

////
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
    vec3(1, 0, 0), vec3(0, c, -s), vec3(0, s, c)
    );
}
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
    vec3(c, 0, s), vec3(0, 1, 0), vec3(-s, 0, c)
    );
}
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
    vec3(c, -s, 0), vec3(s, c, 0), vec3(0, 0, 1)
    );
}

float voxel(vec3 p, mat4 m) {
  vec3 tp = vec3(m * vec4(p, 1.0)).xyz;
  vec3 size = vec3(1.0);

  vec3 d = abs(tp) - size;
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float scene(vec3 op){
  vec3 p = op;

  p.x = -p.x;

  p = rotateY(p.y * 0.1 + iTime + sin(iTime)) * p;
  p = rotateY(p.y * 0.1 + iTime) * p;
  p = rotateZ(p.y * 0.03 + sin(iTime) * 0.3 * .05 + iTime) * p;
  p = rotateZ(p.y * 0.01 + sin(iTime)) * p;

  // H
  float h = voxel(p, mat4(0.0,-0.0,-0.2996,-0.0,-1.0,0.0,-0.0,0.0,0.0,1.0,0.0,-0.0,-0.0,0.0,-0.0,1.0));
  h = min(h, voxel(p, mat4(-1.0,-0.0,0.0,-0.0,-0.0,0.0,0.1597,0.0,0.0,1.0,0.0,-0.0,-2.5,0.0,-0.0,1.0)));
  h = min(h, voxel(p, mat4(-1.0,-0.0,0.0,-0.0,-0.0,0.0,0.1597,0.0,0.0,1.0,0.0,-0.0,2.5,-0.0,-0.0,1.0)));

  float plane = dot(op, normalize(vec3(0.0, 0.0, -1.0))) + 12.1;

  return min(h, plane);
}

#define FAR 200.
#define INFINITY 1e32
float t_min = 2.01;
float t_max = FAR;
const int MAX_ITERATIONS = 125;
// http://erleuchtet.org/~cupe/permanent/enhanced_sphere_tracing.pdf
// https://www.shadertoy.com/view/4tVXRV
float march(Ray r) {
    vec3 o = r.origin;
    vec3 d = r.direction;

    float omega = 1.3;
    float t = t_min;
    float candidate_error = INFINITY;
    float candidate_t = t_min;
    float previousRadius = 0.2;
    float stepLength = 0.;
    float pixelRadius = 0.0001;
    float functionSign = scene(o) < 0. ? -1. : 1.;
    float mp;
    
    for (int i = 0; i < MAX_ITERATIONS; ++i) {
        mp = scene(d * t + o);
        float signedRadius = functionSign * mp;
        float radius = abs(signedRadius);
        bool sorFail = omega > 1. &&
        (radius + previousRadius) < stepLength;
        if (sorFail) {
            stepLength -= omega * stepLength;
            omega = 1.;
        } else {
        stepLength = signedRadius * omega;
        }
        previousRadius = radius;
        float error = radius / t;
        if (!sorFail && error < candidate_error) {
            candidate_t = t;
            candidate_error = error;
        }
        if (!sorFail && error < pixelRadius || t > t_max) break;
        t += stepLength;
   	}
    if (
        (t > t_max || candidate_error > pixelRadius)
    	) return 0.0;
    
    return candidate_t;
}

// 4 taps
// http://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calculateNormal( in vec3 p ) // for function f(p)
{
    const float h = 0.1; // or some other value
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*scene( p + k.xyy*h ) + 
                      k.yyx*scene( p + k.yyx*h ) + 
                      k.yxy*scene( p + k.yxy*h ) + 
                      k.xxx*scene( p + k.xxx*h ) );
}

float hash( float n ){
	return fract(sin(n)*3538.5453);
}

float calcAO( in vec3 p, in vec3 n, float maxDist, float falloff ){
	float ao = 0.0;
	const int nbIte = 6;
	for( int i=0; i<nbIte; i++ )
	{
		float l = hash(float(i))*maxDist;
		vec3 rd = n*l;
		ao += (l - scene( p + rd )) / pow(1.+l, falloff);
	}
	return clamp( 1.-ao/float(nbIte), 0., 1.);
}

// https://www.shadertoy.com/view/4scSW4
float fresnel(float bias, float scale, float power, vec3 I, vec3 N) {
    return bias + scale * pow(1.0 + dot(I, N), power);
}

float calcShadow( in vec3 ro, in vec3 rd, float k )
{
    float res = 1.0;
    float t = 0.01;
    for( int i=0; i<125; i++ )
    {
        vec3 pos = ro + t*rd;
        float h = scene( pos );
        res = min( res, k*max(h,0.0)/t );
        if( res<0.0001 ) break;
        t += clamp(h,0.01,0.5);
    }

    return res;
}

float blinnPhongSpecular(
  vec3 lightDirection,
  vec3 viewDirection,
  vec3 surfaceNormal,
  float shininess) {

  //Calculate Blinn-Phong power
  vec3 H = normalize(viewDirection + lightDirection);
  return pow(max(0.0, dot(surfaceNormal, H)), shininess);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv = (2.0 * fragCoord.xy / iResolution.xy - 1.0) * vec2(aspect, 1.0);

  Camera c = Camera(
    // vec3(sin(iTime) * 10.0, cos(iTime) * 10.0, -30.0),
    vec3(0.0, 0.0, -30.0),
    vec3(0.0, 0.0, 0.0),
    0.4
  );

  Ray r = Ray(
    c.position,
    calculateRayDirection(c, uv)
  );

  Light l = Light(
    vec3(0.0, 20.0, 20.0)
  );

  float traveled = march(r);
  vec3 color = vec3(0.0);

  if (traveled <= 0.0) {
    // Hit nothing
    fragColor = vec4(color, 1.0);
    return;
  }

  vec3 positionHit = c.position + r.direction * traveled;
  vec3 normal = calculateNormal(positionHit);

  if (positionHit.z > 5.0) {
    fragColor = vec4(color, 1.0);
    return;
  }

  // Phong
  vec3 eyeDirection = normalize(c.position - positionHit);
  vec3 lightDirection = normalize(l.position - positionHit);
  float power = blinnPhongSpecular(lightDirection, eyeDirection, normal, 1.0);

  color += vec3(0.3) + power;

  // AO
  float ao = calcAO(positionHit, normal,10.,1.6);
  color *= ao;

  // Fresnel
  vec3 I = normalize(positionHit - c.position);
  float R = fresnel(.0, 2.4, 5.2, I, normal);
  color *= 1.0 - R;

  // Fog
  float dd = distance(c.position, positionHit);
  float start = 20.0;
  float end = 50.0;
  float fog = 1.0 - clamp((end - dd) / (end - start), 0.0, 1.0);
  color = mix(color, vec3(0.0), fog);
  
  fragColor = vec4(color, 1.0);
}

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
