// "moon river" by @eddbiddulph

#ifdef GL_ES
precision mediump float;
#endif

uniform float   time;
uniform vec2    mouse;
uniform vec2    resolution;

vec3 cam_pos = vec3(0.);
mat3 cam_rot = mat3(0.);

vec3 transform(vec3 p)
{
   return cam_rot * (p - cam_pos);
}

vec2 project(vec3 p)
{
   return p.xy / p.z;
}

float gauss(float x, float a)
{
   return sqrt(a / 3.14159265) * exp(-a * x * x);
}

float blob(vec3 o, vec2 p)
{
   return gauss(distance(project(o), p), 50000.0 / abs(o.z - 6.01)) * 0.01;
}

void main()
{
   vec2 p = (gl_FragCoord.xy / resolution.xy - 0.5) * vec2(resolution.x / resolution.y, 1.0) * 1.0;
	
   cam_pos = vec3(cos(time * 0.1) * 5.0, -1.0,  -7.0 + 1.0 + sin(time * 0.07));

   vec3 cam_target = vec3(0.0, 1.0, 3.0);

   cam_rot[2] = normalize(cam_target - cam_pos);

   cam_rot[0] = cross(cam_rot[2], vec3(0.0, 1.0, 0.0));
   cam_rot[1] = cross(cam_rot[2], cam_rot[0]);

   gl_FragColor.rgb = vec3(0.0);

   for(int i = 0; i < 20; ++i)
   {
      for(int j = 0; j < 20; ++j)
      {
         float u = (float(i) / 20.0 - 0.5) * 10.0,
               v = (float(j) / 20.0 - 0.5) * 10.0;

         float h = 1.0 + cos(u - time) * sin(v + time * 0.8) * 0.2;

         vec3 g = transform(vec3(u + cos(v) * 0.5, h, v + sin(u) * 0.5));

         if(g.z > 0.0)
         {
            gl_FragColor.rgb += blob(g, p.xy) * 2.0 * (2.0) * 0.25;
         }
      }
   }

   gl_FragColor.rgb += blob(transform(vec3(10.0, 0.0, 50.0)), p.xy) * 400.0;
   gl_FragColor.rgb += blob(transform(vec3(0.0, 5.0, 50.0)), p.xy) * 0.2;

   gl_FragColor.a = 1.0;
}
