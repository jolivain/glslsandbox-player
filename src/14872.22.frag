// Shader by Nicolas Robert [NRX]
// Latest version: http://glsl.heroku.com/e#14872
// Forked from: https://www.shadertoy.com/view/lsXXz8

#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

#define DELTA			0.01
#define RAY_LENGTH_MAX		50.0
#define RAY_STEP_MAX		50
#define LIGHT			vec3 (0.5, 0.75, 1.0)
#define BACK_COLOR		vec3 (0.25, 0.5, 1.0)
#define AMBIENT			0.2
#define SPECULAR_POWER		4.0
#define SPECULAR_INTENSITY	0.5
#define REFLECT_COUNT		2
#define FADE_POWER		2.0
#define GAMMA			(1.0 / 2.2)
#define M_PI			3.1415926535897932384626433832795

#define SHADOW

mat3 mRotate (in vec3 angle) {
	float c = cos (angle.x);
	float s = sin (angle.x);
	mat3 rx = mat3 (1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);

	c = cos (angle.y);
	s = sin (angle.y);
	mat3 ry = mat3 (c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);

	c = cos (angle.z);
	s = sin (angle.z);
	mat3 rz = mat3 (c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);

	return rz * ry * rx;
}

vec3 vRotateY (in vec3 p, in float angle) {
	float c = cos (angle);
	float s = sin (angle);
	return vec3 (c * p.x - s * p.z, p.y, c * p.z + s * p.x);
}

float sphere (in vec3 p, in float r) {
	return length (p) - r;
}

float box (in vec3 p, in vec3 b, in float r) {
	vec3 d = abs (p) - b + r;
	return min (max (d.x, max (d.y, d.z)), 0.0) + length (max (d, 0.0)) - r;
}

float plane (in vec3 p, in vec3 n, in float d) {
	return dot (p, normalize (n)) + d;
}

float torusZ (in vec3 p, in float r1, in float r2) {
	vec2 q = vec2 (length (p.xy) - r1, p.z);
	return length (q) - r2;
}

float cylinderX (in vec3 p, in float r) {
 	return length (p.yz) - r;
}

float cylinderY (in vec3 p, in float r) {
 	return length (p.xz) - r;
}

vec3 twistY (in vec3 p, in float k, in float angle) {
	return vRotateY (p, angle + k * p.y);
}

float fixDistance (in float d, in float correction, in float k) {
	correction = max (correction, 0.0);
	k = clamp (k, 0.0, 1.0);
	return min (d, max ((d - DELTA) * k + DELTA, d - correction));
}

float getDistance (in vec3 p, out vec4 q) {

	// Ground
	vec3 q_ = p;
	q_.z += 0.8 * (sin (time + p.x * 0.5) + sin (p.y * 0.5));
	float dist = fixDistance (plane (q_, vec3 (-0.2, 0.0, 1.0), 5.0), 0.6, 0.8); // need to fix the distance because of the sine deformation
	q = vec4 (q_, 0.0);

	// Twisted box
	q_ = p;
	q_.x -= 5.0;
	q_ = twistY (q_, cos (time), time);
	float dist_ = box (q_, vec3 (1.0, 1.0, 1.0), 0.1); // no need to fix the distance here, despite of the twist
	if (dist_ < dist) {
		q = vec4 (q_, 1.0);
		dist = dist_;
	}

	// Simple box
	q_ = p;
	q_.y -= 3.0;
	q_ = mRotate (vec3 (0.7, 0.0, -0.2)) * q_;
	dist_ = box (q_, vec3 (1.0, 0.5, 1.0), 0.3);
	if (dist_ < dist) {
		q = vec4 (q_, 2.0);
		dist = dist_;
	}

	// Sphere
	q_ = p + vec3 (3.0, -1.0, sin (time * 2.0) - 1.0);
	dist_ = sphere (q_, 1.0);
	if (dist_ < dist) {
		q = vec4 (q_, 3.0);
		dist = dist_;
	}

	// Twisted torus
	q_ = p;
	q_.y += 4.0;
	q_ = twistY (q_, 2.0, 0.0);
	dist_ = fixDistance (torusZ (q_, 1.0, 0.3), 0.8, 0.5); // need to fix the distance because of the twist
	if (dist_ < dist) {
		q = vec4 (q_, 4.0);
		dist = dist_;
	}

	// Cylinders
	q_ = p;
	q_.z += 2.0;
	q_.y = mod (q_.y, 5.0) - 0.5 * 5.0;
	dist_ = cylinderX (q_, 0.2);
	if (dist_ < dist) {
		q = vec4 (q_, 5.0);
		dist = dist_;
	}
	q_ = p;
	q_.z += 2.0;
	q_.x = mod (q_.x, 5.0) - 0.5 * 5.0;
	dist_ = cylinderY (q_, 0.2);
	if (dist_ < dist) {
		q = vec4 (q_, 6.0);
		dist = dist_;
	}

	// Smallest distance
	return dist;
}

vec3 getObjectColor (in vec4 q, out float reflection) {
	float tint = 0.6 + 0.4 * sin (q.x * 10.0) * sin (q.y * 10.0) * sin (q.z * 10.0);
	if (q.w < 0.5) {
		reflection = 0.0;
		return (0.6 + 0.4 * tint) * vec3 (0.2, 1.0, 1.0);
	}
	if (q.w < 1.5) {
		reflection = 0.2;
		return tint * vec3 (1.0, 0.0, 0.0);
	}
	if (q.w < 2.5) {
		reflection = 0.0;
		return tint * vec3 (0.0, 0.0, 1.0);
	}
	if (q.w < 3.5) {
		reflection = 0.5;
		return tint * vec3 (1.0, 1.0, 0.0);
	}
	if (q.w < 4.5) {
		reflection = 0.0;
		return tint * vec3 (1.0, 0.2, 0.5);
	}
	reflection = 0.0;
	return tint * vec3 (0.5, 0.5, 0.6);
}

vec3 getNormal (in vec3 p) {
	vec4 q;
	vec2 h = vec2 (DELTA, 0.0);
	return normalize (vec3 (
		getDistance (p + h.xyy, q) - getDistance (p - h.xyy, q),
		getDistance (p + h.yxy, q) - getDistance (p - h.yxy, q),
		getDistance (p + h.yyx, q) - getDistance (p - h.yyx, q)
	));
}

void main () {

	// Define the ray corresponding to this fragment
	vec2 frag = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
	vec3 direction = normalize (vec3 (frag, 2.0));

	// Set the camera
	float angle = M_PI * sin (0.1 * time);
	vec3 origin = vec3 (10.0 * cos (angle), 10.0 * sin (angle), 2.5);
	direction = mRotate (vec3 (M_PI / 2.0 + 0.45, 0.0, angle - M_PI / 2.0)) * direction;

	// Compute the fragment color
	vec3 lightDirection = normalize (LIGHT);
	float moveAway = DELTA * 10.0;

	vec3 color = vec3 (0.0, 0.0, 0.0);
	float absorb = 1.0;
	float fade = 0.0;
	for (int reflectionIndex = 0; reflectionIndex < REFLECT_COUNT; ++reflectionIndex) {

		// Ray marching
		vec4 objectInfo;
		float rayLength = 0.0;
		for (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {
			float dist = getDistance (origin, objectInfo);
			rayLength += dist;
			if (dist < DELTA || rayLength > RAY_LENGTH_MAX) {
				break;
			}
			origin += dist * direction;
		}

		// Combine colors
		if (reflectionIndex == 0) {
			fade = pow (max (0.0, 1.0 - rayLength / RAY_LENGTH_MAX), FADE_POWER);
		} else {
			color *= 1.0 - absorb;
		}
		if (rayLength > RAY_LENGTH_MAX) {
			color += BACK_COLOR * absorb;
			break;
		}

		// Get the object color
		float reflection;
		vec3 objectColor = getObjectColor (objectInfo, reflection);

		// Lighting
		vec3 normal = getNormal (origin);
		direction = reflect (direction, normal);

		#ifdef SHADOW
		vec3 p = origin + moveAway * lightDirection;
		rayLength = 0.0;
		for (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {
			float dist = getDistance (p, objectInfo);
			rayLength += dist;
			if (dist < DELTA || rayLength > RAY_LENGTH_MAX) {
				break;
			}
			p += dist * lightDirection;
		}		
		if (rayLength < RAY_LENGTH_MAX) {
			objectColor *= AMBIENT;
		}
		else
		#endif
		{
			float diffuse = max (0.0, dot (normal, lightDirection));
			float specular = pow (max (0.0, dot (direction, lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;
			objectColor = (AMBIENT + diffuse) * objectColor + specular;
		}
		color += objectColor * absorb;

		// Next ray...
		if (reflection < DELTA) {
			break;
		}
		absorb *= reflection;
		origin += moveAway * direction;
	}

	// Fading
	color = mix (BACK_COLOR, color, fade);

	// Gamma correction
	color = pow (color, vec3 (GAMMA));

	// Set the fragment color
	gl_FragColor = vec4 (color, 1.0);
}
