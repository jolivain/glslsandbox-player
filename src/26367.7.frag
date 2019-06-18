#ifdef GL_ES
precision mediump float;
#endif

// quadratic bezier curve rendering
// posted by Trisomie21

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

struct Bezier2 {
	vec2 p[3];
};

#define kCurvesPerCell 2
	
vec2 tangentAt(vec2 P0, vec2 P1, vec2 P2, float t) {
    return 2.0 * (1.0-t) * (P1 - P0) + 2.0 * t * (P2 - P1);
}

vec2 normalAt(vec2 P0, vec2 P1, vec2 P2, float t) {
    vec2 tangent = tangentAt(P0, P1, P2, t);
    return vec2(tangent.y, -tangent.x);
}

vec2 positionAt(vec2 P0, vec2 P1, vec2 P2, float t) {
    float mt = 1.0 - t;
    return mt*mt*P0 + 2.0*t*mt*P1 + t*t*P2;
}

float cuberoot( float x )
{
    if( x<0.0 ) return -pow(-x,1.0/3.0);
    return pow(x,1.0/3.0);
}

int solveCubic(in float a, in float b, in float c, out vec3 r)
{
	float p = b - a*a / 3.0;
	float q = a * (2.0*a*a - 9.0*b) / 27.0 + c;
	float p3 = p*p*p;
	float d = q*q + 4.0*p3 / 27.0;
	float offset = -a / 3.0;
	if(d >= 0.0) { // Single solution
		float z = sqrt(d);
		float u = (-q + z) / 2.0;
		float v = (-q - z) / 2.0;
		u = cuberoot(u);
		v = cuberoot(v);
		r[0] = offset + u + v;
		return 1;
	}
	float u = sqrt(-p / 3.0);
	float v = acos(-sqrt( -27.0 / p3) * q / 2.0) / 3.0;
	float m = cos(v), n = sin(v)*1.732050808;
	r[0] = offset + u * (m + m);
	r[1] = offset - u * (n + m);
	r[2] = offset + u * (n - m);
	return 3;
}

void findNearestPoint( in vec2 P0, in vec2 P1, in vec2 P2, in vec2 p, out float closestDistance, out vec2 closestPoint, out float dotNormal, out float closestT)
{
    float dis = 1e20;
    
    vec2 sb = (P1 - P0) * 2.0;
    vec2 sc = P0 - P1 * 2.0 + P2;
    vec2 sd = P1 - P0;
    float sA = 1.0 / dot(sc, sc);
    float sB = 3.0 * dot(sd, sc);
    float sC = 2.0 * dot(sd, sd);
    
    
    vec2 D = P0 - p;

    float a = sA;
    float b = sB;
    float c = sC + dot(D, sc);
    float d = dot(D, sd);

    vec3 res;
    int n = solveCubic(b*a, c*a, d*a, res);

    closestDistance = 100000.0;

    for (int i=0; i<3; i++) {
        if (i == n) break;
        float t = clamp(res[i], 0.0, 1.0);
        vec2 pos = positionAt(P0, P1, P2, t);
        vec2 closestVector = p - pos;
        float distance = length(closestVector);

        if (distance < closestDistance) {
		closestDistance = distance;
		closestPoint = pos;
		vec2 normal = normalAt(P0, P1, P2, t);
		dotNormal = dot(normalize(normal), normalize(closestVector));
		closestT = t;
        }
    }

}

// polynomial smooth min (k = 0.1);
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float signedDistanceToBeziers(in Bezier2 beziers[kCurvesPerCell], in int numBeziers, in vec2 position, out int closestCurve)
{
	float closestDistance = 10000.0;
	vec2 closestOnCurve = vec2(0.0);
	float closestDotNormal = 0.0;
	//int closestCurve;

	for (int i=0; i<kCurvesPerCell; i++) {
		if (i == numBeziers) break;
		float distance, dotNormal, t;
		vec2 oncurve;
		findNearestPoint(beziers[i].p[0], beziers[i].p[1], beziers[i].p[2], position, distance, oncurve, dotNormal, t);
		distance -= abs(dotNormal) * 1e-3 * distance;
		bool replace = distance < closestDistance;
		//if (distance == closestDistance) {
		if (oncurve == closestOnCurve) {
			replace = abs(dotNormal) > abs(closestDotNormal);
		}
		
		if (replace ) {
			closestDistance = distance;
			closestOnCurve = oncurve;
			closestDotNormal = dotNormal;
			closestCurve = i;
		}
	}
	
	return closestDotNormal < 0.0 ? -closestDistance : closestDistance;
}

void main( void ) {

	vec2 position = (gl_FragCoord.xy/resolution.y)*2.0 - 1.0;
	//position.y += .9;
	//position *= (0.5 + 10.0*mouse.y);
	//position.x = sqrt(abs(position.x));

	Bezier2 beziers[2];
	beziers[0].p[0] = vec2(-0.8, 0.1);
	beziers[0].p[1] = vec2(0.2, -0.2);
	beziers[0].p[2] = vec2(mouse.x*2.0, mouse.y) * 2.0 - 1.0;
	beziers[1].p[0] = beziers[0].p[2];
	beziers[1].p[1] = vec2(0.7, -0.2);
	beziers[1].p[2] = vec2(0.95, -0.3);
	
	int closestCurve;
	float closestDistance = signedDistanceToBeziers(beziers, 2, position, closestCurve);
		
	
	float k = fract(abs(closestDistance)*30.0);
	//closestDistance = abs(closestDistance);
	//gl_FragColor = vec4(float(closestCurve) * 0.5 + 0.5, closestDistance < 0.0 ? 0.5 : 1.0, k, 1.0);
	//float fac = dFdx(position.x);
	gl_FragColor = vec4(smoothstep(-1.0, 1.0, closestDistance*resolution.y));
	gl_FragColor.r = k;
	gl_FragColor = mix(gl_FragColor, vec4(float(closestCurve)), 0.2);

}
