/*
 * Original shader from: https://www.shadertoy.com/view/3ssGWn
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

// shadertoy globals
float iTime = 0.0;
vec3  iResolution = vec3(0.0);
vec4  iMouse = vec4(0.0);

// Emulate a black texture
#define texture(s, uv) vec4(0.0)

// --------[ Original ShaderToy begins here ]---------- //
//Адаптер
float u_time = 0.;


const float PI = radians(180.);
const float Infinity = 1e6;

//Камера
struct Camera {
	//Задаваемые параметры
	float fov;
	float aspect;
	vec3  origin;
	vec3  target;
	vec3  up;
	//Расчетные параметры
	float factor;
	vec3  forward;
	vec3  right;
	vec3  position;
	vec3  coord;
};

//Дополнительные параметры, возвращаемые картой расстояний
struct Object {
	float   distance;	//Последнее приближение луча к элементу сцены (стремится к 0 в случае нахождения точки пересечения)
	int 	id;			//id элемента сцены
};
//Луч
struct Ray {
	//Задаваемые параметры
	vec3  origin;		//Начало луча
	vec3  direction;	//Направление луча
	float near;			//Минимальное расстояние до элемента
	float far;			//Предельное расстояние до элемента
	float epsilon;		//Точность
	int	  steps;		//Максимальное число итераций
	//Возвращаемые параметры
	float distance; 	//Расстояние до точки элемента сцены от ray.origin в направлении ray.direction
	vec3  position; 	//Текущая точка элемента сцены ray.origin + ray.direction * ray.distance
	bool  hit;			//Успех нахождения точки пересечения
	vec3  normal;
	Object object;		//Дополнительные параметры, возвращаемые картой расстояний
};
//Формирование луча камеры
Ray lookAt (in vec2 uv, inout Camera cam) {
	//Расчетные характеристики камеры
	cam.factor 		= 1.0/tan(radians(cam.fov/2.));
	cam.forward 	= normalize(cam.target-cam.origin); 
	cam.right 		= normalize(cross(cam.up, cam.forward));
	cam.up 			= cross(cam.forward, cam.right);
	cam.position 	= cam.origin + cam.factor * cam.forward;
	cam.coord 		= cam.position + uv.x * cam.right * cam.aspect + uv.y * cam.up;
	//Формирование луча
	Ray ray;
	{
		ray.origin 		= cam.origin;
		ray.direction 	= normalize(cam.coord - cam.origin);
	}
	return ray;
}

struct Sphere {
	vec3  center;
	float radius;
};

struct Plane {
	vec3 center;
	vec3 normal;
};

struct Light {
    vec3 position;
	vec3 color;
};
Light light_0 = Light ( vec3(1.5, 1.5, 0), vec3(0.9, 0.9, 0.6) );
Light light_1 = Light ( vec3(1.5, 1.5, 0), vec3(0.6, 0.9, 0.9) );               

struct Material {
    vec3  colorAmbient;     
    vec3  colorDiffuse;    
    vec3  colorSpecular;  
    float shininess;   	
	
    float reflectivity;  	//1 - полное отражение
    float refractivity;		//1 - полное преломление
    float indexRefractive;
};
Material material_0 = Material ( 
	vec3(0), vec3(0.3, 0.6, 0.9), vec3(0.0), 32.0,
	0.0, 0.0, 0.0
);										              
Material material_1 = Material (
	vec3(0), vec3(0.9, 0.3, 0.6), vec3(1.0), 32.0,
	0.2, 0.0, 0.0
);            
Material material_2 = Material (
	vec3(0), vec3(0.6, 0.9, 0.3), vec3(0.0), 32.0,	
	0.8, 0.0, 0.0
);
//Шары            
Material material_3 = Material (
	vec3(0), vec3(.95, .9, .85), vec3 (1.0), 32.0,	
	0.5, 0.5, 0.95
);              
//-------------Вспомогательные функции-----------------------------
//Масштаб вектора
void scale (inout vec3 v, vec3 s) {
	v = v * s;
}
//Перемещение вектора
void translate (inout vec3 v, vec3 delta) {
	v = v - delta;
}
//Вращение вектора
void rotate(inout vec3 v, vec3 rad) {
	vec3 c = cos(rad), s = sin(rad);
	if (rad.x!=0.) v = vec3(v.x, 				   c.x * v.y + s.x * v.z, -s.x * v.y + c.x * v.z);
	if (rad.y!=0.) v = vec3(c.y * v.x - s.y * v.z, v.y, 				   s.y * v.x + c.y * v.z);
	if (rad.z!=0.) v = vec3(c.z * v.x + s.z * v.y, -s.z * v.x + c.z * v.y, v.z					);
}
//---------------------------------------
//Пересечение луча со сферой
float intersectSphere (in Ray ray, in Sphere sphere) {
    float a = dot (ray.direction, ray.direction);
    // exit early, if denominator would almost be zero 
    if (a <= 0.) return ray.far;
    // set up coefficients a, b and c
    float b = dot (2. * ray.direction, ray.origin - sphere.center);
    vec3 op = ray.origin - sphere.center;
    float c = dot (op, op) - sphere.radius * sphere.radius;
    float d = sqrt (b * b - 4. * a * c);
    float twoA = 1. / 2.*a;
    // compute possible values for t
    float t1 = (-b + d) * twoA;
    float t2 = (-b - d) * twoA;
    // this case should not be possible 
    if (t1 <= .0 && t2 <= .0) return ray.far;
	float dist = ray.far;
    if (t1 > .0 && t2 > .0) {
        if (t1 < t2) {
			dist = t1;
		} else {
			dist = t2;
		}
    }
    return dist;
}
//Пересечение луча с плоскостью
float intersectPlane (in Ray ray, in Plane plane) {
	// are ray and plane parallel?
	float d = dot (ray.direction,plane.normal);
    if ( d >= 0.) return ray.far;
	float dist = dot(plane.center - ray.origin, plane.normal) / d;
	return dist;
}
//Пересечение луча с элементами сцены
void rayMarch (inout Ray ray) {
	ray.origin += ray.near * ray.direction;
	ray.distance = ray.far;
	ray.hit = false;
	ray.position = ray.origin + ray.distance * ray.direction;
	ray.normal = vec3(0);
	ray.object.id = 0;
	
	float d;
	
	Sphere sphere;
	Plane plane;
	
	//Шары
	sphere = Sphere(vec3 (-2.,-1.4*0.5,-0.5), 0.6);
	sphere.center.y += -1.4*0.5*cos(0. + u_time);
    d = intersectSphere (ray, sphere);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= normalize (ray.position - sphere.center);
		ray.object.id 	= 1;
	}
    
	sphere = Sphere(vec3 ( 1.,-1.5*0.5, 0.5), 0.5);
	sphere.center.y += -1.5*0.5*cos(1. + u_time);
	d = intersectSphere (ray, sphere);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= normalize (ray.position - sphere.center);
		ray.object.id 	= 2;
	}

	sphere = Sphere(vec3 ( 0.,-1.6*0.5, 1.5), 0.4);
	sphere.center.y += -1.6*0.5*cos(2. + u_time);
    d = intersectSphere (ray, sphere);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= normalize (ray.position - sphere.center);
		ray.object.id 	= 3;
	}
	
	//Пол
	plane = Plane(vec3 (.0, -2., .0),  vec3 ( 0, 1, 0));
    d = intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 4;
	}
	//Потолок
	plane = Plane(vec3 (.0, 2.0, 0.),  vec3 ( 0,-1, 0));
    d = intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 5;
	}
	//Ближняя стена
	plane = Plane(vec3 (.0, .0, 4.),   vec3 ( 0, 0,-1));
    d = intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 6;
	}
	//Дальняя стена
	plane = Plane(vec3 (.0, .0, -4.),  vec3 ( 0, 0, 1));
    d = intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit			= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 7;
	}
	//Правая стена
	plane = Plane(vec3 (-6.0, .0, 0.), vec3 ( 1, 0, 0));
    d= intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 8;
	}
	//Левая стена
	plane = Plane(vec3 (6.0, .0, 0.),  vec3 (-1, 0, 0));
    d = intersectPlane (ray, plane);
	if (ray.distance > d) {
		ray.distance 	= d;
		ray.hit 		= true;
		ray.position 	= ray.origin + ray.distance * ray.direction;
		ray.normal 		= plane.normal;
		ray.object.id 	= 9;
	}


}
//Освещение от двух источников света
vec3 lighting (in Ray ray, in Light lights[2], in Material material) {
	vec3 color = vec3(0);
	
	for (int i=0; i<2; i++) {
		vec3 lightDirection = normalize (lights[i].position - ray.position);
    	float lightDistance = length (lights[i].position - ray.position);
		vec3 rayDirection_ref = reflect (ray.direction, ray.normal);
		//Тень
		Ray ray1 = ray;
		{
			ray1.origin 	= ray.position;
			ray1.direction 	= lightDirection;
			ray1.near		= 0.01; //Отступ
			ray1.far 		= lightDistance;
		}
		rayMarch (ray1);
		float shadow = ray1.distance<lightDistance ? 0.5 : 1.0;
		
		float attenuation = 1.4 / (lightDistance * lightDistance);
		float diffuse = max (dot (ray.normal, lightDirection), .0);
		float specular = pow (max (dot (rayDirection_ref, lightDirection), .0), material.shininess);
		if (shadow >= 0.5)  specular = 0.;

		vec3 col = vec3(0);
		col += material.colorAmbient;
		col += material.colorDiffuse * diffuse * shadow * attenuation;
		col *= lights[i].color;
		col += material.colorSpecular * specular;
		
		color += col;
	}
	return color;
}
/*
//Получение цвета текстуры
vec3 getColorTexture(sampler2D texture, vec3 p, vec3 normal) {
	mat3 m = mat3(
		texture(texture, p.yz).rgb,
		texture(texture, p.zx).rgb,
		texture(texture, p.xy).rgb
	);
	return m * abs(normal);
}
*/
//Получение материала
Material getMaterial(vec3 p, vec3 normal, int id) {
	Material material;
	if (id==1) {
		//Прозрачные шарики
		material = material_3;
		material.colorDiffuse = vec3 (0);
	} else if (id==2) {
		//Прозрачные шарики
		material = material_3;
		material.colorDiffuse = vec3 (0.5);
	} else if (id==3) {
		//Прозрачные шарики
		material = material_3;
		material.colorDiffuse = vec3 (0.5, 0.1, 0.1);
	} else if (id==4) {
		//Пол (Красная отражающая)
		material = material_1;
    	float pattern = clamp (pow (abs(2. * cos(p.x + u_time) * sin (p.z + u_time) * .5 + .5), .3), 0., 1.);
		material.colorDiffuse = mix (vec3 (.9, .3, .3), vec3 (.9), 1. - pattern);
	} else if (id==5) {
		//Потолок (Желтая отражающая)
		material = material_1;
    	float pattern = clamp (pow (abs(2. * cos(p.x + u_time) * sin (p.z + u_time) * .5 + .5), .3), 0., 1.);
		material.colorDiffuse = mix (vec3 (.9, .9, .3), vec3 (.5), 1. - pattern);
	} else if (id==6 || id==7) {
		//Ближняя и дальняя стены (Зеленая отражающая)
		material = material_2;
    	float pattern = clamp (mod (length(p*sin(.1*u_time)), .5), 0., 1.);
		material.colorDiffuse = mix (vec3 (.6, .9, .3), vec3 (.5), 1. - pattern);
//    	float pattern = clamp (pow (length (4.*sin(mod((p.y*p.x), .3))), .125), 0., 1.);
//		material.colorDiffuse = mix (vec3 (.6, .9, .3), vec3 (.5), 1. - pattern);
	} else if (id==8) {
		//Правая стена (синяя не отражающая)
		material = material_0;
		float pattern = clamp (pow (abs(15. * cos(p.x+u_time) * sin (p.z+u_time)), .3), 0., 1.);
		material.colorDiffuse = mix (vec3 (.3, .6, .9), vec3 (.8), 1. - pattern);
	} else if (id==9) {
		//Левая стена (Кирпичная не отражающая)
		material = material_0;
        p *= 0.5;
        mat3 m = mat3(
            texture(iChannel0, p.yz).rgb,
            texture(iChannel0, p.zx).rgb,
            texture(iChannel0, p.xy).rgb
        );
		material.colorDiffuse = m * abs(normal);;
	}
	return material;
}
//Отражения
vec3 rayReflect(inout Ray ray_hit, in Light lights[2], Material material, int steps) {
	vec3 color = vec3(0);
	Ray ray = ray_hit;
	float factorReflect = 1.0;
	for (int i=1; i<10; i++) {
		if (i>steps) break;
		//Фактор суммарного отражения
		factorReflect *= material.reflectivity;
		
		if (factorReflect < 0.01) break;
		Ray ray1 = ray;
		{
			ray1.origin 	= ray.position;
			ray1.direction 	= reflect (ray.direction, ray.normal);
			ray1.near 		= 0.01; //Отступ
		}
		rayMarch (ray1);
		
		if (ray1.hit==false) break;
		//Освещение точки
		material = getMaterial(ray1.position, ray1.normal, ray1.object.id);
		color += factorReflect * lighting (ray1, lights, material);
		//Возвращаем последний удачный луч
		ray_hit = ray;  
		//Слeдующий луч
		ray = ray1;
	}
	return color;
}
//Преломления
vec3 rayRefract(inout Ray ray_hit, in Light lights[2], in Material material, in int steps) {
	vec3 color = vec3(0);
	Ray ray = ray_hit;
	float factorRefract = 1.0;
	for (int i=1; i<10; i++) {
		if (i>steps) break;
		//Фактор суммарного преломления
		factorRefract *= material.refractivity;
		if (factorRefract < 0.01) break;
		//Пересечение преломленного луча
		Ray ray1 = ray;
		{
			ray1.origin 	= ray.position;
			ray1.direction 	= refract (ray.direction, ray.normal, material.indexRefractive);
			ray1.near 		= 0.01; //Отступ
		}
		rayMarch (ray1);
		
		if (ray1.hit==false) break;
		//Освещение точки
		material = getMaterial(ray1.position, ray1.normal, ray1.object.id);
		color += factorRefract * lighting (ray1, lights, material);
		//Возвращаем последний удачный луч
		ray_hit = ray; 
		//Слeдующий луч
		ray = ray1; 
	}
	return color;
}

void mainImage( out vec4 GL_FragColor, in vec2 GL_FragCoord ) {
    //Адаптер
    u_time = iTime;
    vec2 u_canvas = iResolution.xy;
    vec2 u_mouse  = iMouse.xy;
    
    float aspect = u_canvas.x / u_canvas.y;
    vec2 uv = GL_FragCoord.xy / u_canvas.xy;
    uv = uv * 2. - 1.;

    vec2 mouse = u_mouse.xy / u_canvas.xy;
    mouse = mouse * 2. - 1.;
    mouse = (u_mouse.xy==vec2(0)) ? vec2(0) : (mouse.xy);

        //Источники света
        Light lights[2];
    lights[0] = light_0;
    lights[1] = light_1;
    rotate (lights[0].position, vec3(0,1,0)*u_time/5.);
    rotate (lights[1].position, vec3(0,1,0)*-u_time/5.);
    //Камера
    Camera cam;
    {
        cam.fov     = 45.;
        cam.aspect  = aspect;
        cam.origin 	= vec3 (.0, .0, -3.);

        float rotX = 0.5*PI*sin (0.5 * PI * mouse.y);
        float rotY = PI*sin (0.5 * PI * mouse.x);
        rotate(cam.origin, vec3(rotX, rotY, 0));

        cam.target  = vec3(0,0,0);
        cam.up 		= vec3(0,1,0);
    }
    //Луч из камеры
    Ray ray = lookAt(uv, cam);
    {
        ray.near 	= 0.0;
        ray.far  	= 15.0;
        ray.epsilon = 0.0001;
        ray.steps 	= 1;
    }	
    rayMarch (ray);

    vec3 color = vec3(0);

    if (ray.hit) {
        //Пересечение с элементом сцены
        //Обычное освещение
        Material material = getMaterial(ray.position, ray.normal, ray.object.id);
        color = lighting (ray, lights, material);
        //Освещение отражения и прeломления
        #if 1
        Ray ray_hit;
        //Отражения
        ray_hit = ray;
        color += rayReflect(ray_hit, lights, material, 4);
        //Преломления
        ray_hit = ray;
        color += rayRefract(ray_hit, lights, material, 4);
        //Отражения от последнего преломления
        material = getMaterial(ray_hit.position, ray_hit.normal, ray_hit.object.id);
        color += rayReflect(ray_hit, lights, material, 4);
        #endif
    }

    //Гаммакоррекция
    color = pow(color, vec3(1.0/2.2));

    GL_FragColor = vec4 (color, 1.);

}
// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
    iTime = time;
    iResolution = vec3(resolution, 0.0);
    iMouse = vec4(mouse * resolution, 0.0, 0.0);

    mainImage(gl_FragColor, gl_FragCoord.xy);
}
