// BouncingSpheres   (c) 2012 Piers Haken
// 
// https://github.com/fxlex/ProcessingGLSL/blob/master/ProcessingGLSL/src/data/glslsandbox/bouncingspheres.glsl

// (c) 2012 Piers Haken

#ifdef GL_ES
precision highp float;
#endif

// uniforms
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// consts
const float PI = 3.1415926535897932384626433832795;
const vec3 UP = vec3 (0,0,1);
const vec3 Z3 = vec3(0,0,0);
const vec3 U3 = vec3(1,1,1);

const float INFINITY = 1.0/0.0;

// camera
const vec3 at = UP;///2.0;
const float fov = PI / 2.0;
float tanfov = tan(fov/1.8);

// structs
struct Camera
{
	vec3 Position;
	vec3 Side;
	vec3 Up;
	vec3 View;
	vec2 Scale;
};

struct Ray
{
	vec3 Position;
	vec3 Direction;
};

struct Sphere
{
	vec3 Center;
	float Radius;
};

struct Plane
{
	vec3 Point;
	vec3 Normal;
};

struct PointLight
{
	vec3 Position;
	vec3 DiffuseColor;
	float DiffusePower;
	vec3 SpecularColor;
	float SpecularPower;
};

struct Material
{
	vec3 DiffuseColor;
	vec3 SpecularColor;
	float Shininess;
};

struct Ball
{
	Sphere Sphere;
	Material Material;
	vec3 Velocity;
};


struct Bounce
{
	Ray Normal;
	Material Material;
};


const Material _matFloor = Material (vec3(1,.9,.7), vec3(1,1,1), 130.0);
const Plane _floor = Plane (vec3(0,0,0), vec3(0,0,1));

const int _cLights = 3;
PointLight _rgLights[_cLights];

const int _cBalls = 7;
Ball _rgBalls[_cBalls];


vec2 Circle (const float time)
{
	return vec2 (cos(time), sin(time));
}


float IntersectSphere (const Ray ray, const Sphere sphere, inout Ray normal)
{
	vec3 L = sphere.Center - ray.Position;
	float Tca = max (0.0, dot (L, ray.Direction));
	if (Tca < 0.0)
		return INFINITY;

	float d2 = dot (L, L) - Tca * Tca;
	float p2 = sphere.Radius * sphere.Radius - d2;
	if (p2 < 0.0)
		return INFINITY;

	float t = Tca - sqrt (p2);
	vec3 intersect = ray.Position + t * ray.Direction;
	normal = Ray (intersect, (intersect - sphere.Center) / sphere.Radius);
	return t;
}

float IntersectPlane (const Ray ray, const Plane plane, inout Ray normal)
{
	float t = dot (plane.Point - ray.Position, plane.Normal) / dot (ray.Direction, plane.Normal);
	normal = Ray (ray.Position + t * ray.Direction, plane.Normal);
	return t;
}

vec3 Phong (PointLight light, Material material, Ray normal, vec3 eye)
{
	vec3 viewDir = normalize (normal.Position - eye);
	vec3 lightVec = light.Position - normal.Position;
	float lightDistance2 = dot (lightVec, lightVec);
	vec3 lightDir = lightVec / sqrt (lightDistance2);
	float diffuse = dot(normal.Direction, lightDir);

	vec3 R = lightDir - 2.0 * diffuse * normal.Direction;
	float specular = pow(max(0.0, dot(R, viewDir)), material.Shininess);

	vec3 color =
		max (0.0, diffuse) * light.DiffuseColor * light.DiffusePower * material.DiffuseColor +
		max (0.0, specular) * light.SpecularColor * light.SpecularPower * material.SpecularColor;

	return color * 110.0 / lightDistance2;
}

bool Scene (const Ray ray, out Bounce bounce)
{
	float tMatch = INFINITY;
	Ray normalMatch;
	for (int i = 0; i < _cBalls; ++i)
	{
		Ray normal;
		float t = max(0.0, IntersectSphere (ray, _rgBalls[i].Sphere, normal));
		if (t > 0.0 && tMatch > t)
		{
			tMatch = t;
			bounce = Bounce (normal, _rgBalls[i].Material);
		}
	}

	Ray normalPlane;
	float t2 = IntersectPlane (ray, _floor, normalPlane);
	if (t2 > 0.0 && t2 < tMatch)
	{
		vec3 pt = normalPlane.Position;
		if (length(pt) < 10.0 && (fract(pt.x) < 0.9 == fract(pt.y) < 0.9))
		{
			tMatch = t2;
			bounce = Bounce (normalPlane, _matFloor);
		}
	}

	return tMatch < 1000.0 && tMatch > 0.0;
}

bool LightScene (inout Ray ray, inout vec3 color)
{
	Bounce bounce;
	if (!Scene (ray, bounce))
		return false;

	vec3 bouncePos = bounce.Normal.Position + bounce.Normal.Direction * .0001;

	Bounce bounceShadow;

	for (int iLight = 0; iLight < _cLights; ++iLight)
	{
		if (!Scene (Ray (bouncePos, normalize (_rgLights[iLight].Position - bouncePos)), bounceShadow))
			color += Phong (_rgLights[iLight], bounce.Material, bounce.Normal, ray.Position);
	}

	ray = Ray (bouncePos, reflect (ray.Direction, bounce.Normal.Direction));
	return true;	
}

const Sphere s = Sphere (Z3, .5);

void main( void )
{
	float time2 = time / 10.0 + 100.0;

	vec3 eye = vec3(Circle(time / 10.0) * (7.1 - 4.5 * mouse.y), 4.5 * mouse.y);
	vec3 look = normalize (at - eye);

	vec3 u = cross (look, UP);
	vec3 v = cross (u, look);

	vec3 dx = tanfov * u;
	vec3 dy = tanfov * v;

	vec2 position = (gl_FragCoord.xy - resolution/2.0) / min(resolution.x, resolution.y);
	Ray ray = Ray (eye, normalize (look + dx * position.x + dy * position.y));

	_rgBalls[0] = Ball(s, Material (vec3(1,0,0), U3, 100.0), vec3(1.17, 1.9, 3.03));
	_rgBalls[1] = Ball(s, Material (vec3(0,1,0), U3, 100.0), vec3(1.23, 1.8, 1.79));
	_rgBalls[2] = Ball(s, Material (vec3(0,0,1), U3, 100.0), vec3(1.35, 1.7, 2.73));

	_rgBalls[3] = Ball(s, Material (vec3(0,1,1), U3, 100.0), vec3(1.41, 1.6, 2.53));
	_rgBalls[4] = Ball(s, Material (vec3(1,0,1), U3, 100.0), vec3(1.50, 1.5, 2.23));
	_rgBalls[5] = Ball(s, Material (vec3(1,1,0), U3, 100.0), vec3(1.69, 1.4, 1.93));

	_rgBalls[6] = Ball(s, Material (vec3(0,0,0), U3, 100.0), vec3(1.39, 1.19, 1.93));
	//_rgBalls[7] = Ball(s, Material (vec3(1,1,1), U3, 100.0), vec3(1.73, 1.01, 1.93));

	for (int i = 0; i < _cBalls; ++i)
	{
		float q = fract(time2 * _rgBalls[i].Velocity.z / 3.0) - 0.5;

		_rgBalls[i].Sphere.Center = vec3 (
			abs(mod(time2 * _rgBalls[i].Velocity.xy, 8.0) - 4.0) - 2.0,
			_rgBalls[i].Sphere.Radius + 8.0 * (0.25-q*q));
	}


	_rgLights [0] = PointLight (4.0*vec3(1,0.,2), vec3(.5,1,.5), .3, vec3(.5,1,.5), 1.0);
	_rgLights [1] = PointLight (4.0*vec3(-1,-0.86,2), vec3(1,.5,.5), .3, vec3(1,.5,.5), 1.0);
	_rgLights [2] = PointLight (4.0*vec3(-1,0.86,2), vec3(.5,.5,1), .3, vec3(.5,.5,1), 1.0);


	vec3 color = vec3(0,0,0);

	LightScene (ray, color) &&
		LightScene (ray, color) &&
		LightScene (ray, color);

	gl_FragColor = vec4 (color, 1.0);
}
