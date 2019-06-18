// Insane recursion with multiple effects by Optimus
// Guest code by AkumaX (rand function)

// Version Zoomer

#ifdef GL_ES
precision mediump float;
#endif
 
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

const float recursion_level = 8.0;

float rand(vec2 vector)
{
    return fract( 43758.5453 * sin( dot(vector, vec2(12.9898, 78.233) ) ) );
}

float get_bump_height(vec2 position)
{
	return sin((sin(position.x * 32.0) + sin(position.y * 24.0) + sin(position.x * 4.0 + sin(position.y * 8.0 + time))) * 4.0) * 0.5 + 0.5;
}

float get_light(vec2 position)
{
	vec2 tex = mod(position * 4.0, 1.0) - vec2(0.5);
	return 0.0005 / pow(length(tex), 4.0);
}

void main(void)
{
	float scale = cos(time / 85.0021) * 8.0 + 8.005;
	if (scale < 0.025) scale = 0.025;

	vec2 position = vec2((gl_FragCoord.x / resolution.x) - 0.5, (gl_FragCoord.y / resolution.y) - 0.5) * scale + time * 1.0;

//	vec2 rotated_position;
//	rotated_position.x = ((position.x - 0.5) * cos(sin(0.25 * time) * 2.5) - (position.y - 0.5) * sin(sin(0.25 * time) * 2.5)) * scale;
//	rotated_position.y = ((position.y - 0.5) * cos(sin(0.25 * time) * 2.5) + (position.x - 0.5) * sin(sin(0.25 * time) * 2.5)) * scale;
//	position = rotated_position;

	vec2 coord = mod(position,1.0);	// coordinate of single effect window (0.0 - 1.0)
	vec2 effect = floor(mod(position,4.0)); // effect number (0-3,0-3)
	float effect_number = effect.y * 4.0 + effect.x;
	vec2 effect_group = floor(position) * 7.0; // effect group float id
 
	float gradient = 0.0;
	vec3 color = vec3(0.0);
 
	float angle = 0.0;
	float radius = 0.0;
	const float pi = 3.141592;
	float fade = 0.0;
 
	float u,v;
	float z;
 
	vec2 centered_coord = coord - vec2(0.5);

	float dist_from_center = length(centered_coord);
	float angle_from_center = atan(centered_coord.y, centered_coord.x);

	float iii = 0.0;
	for (float ii=0.0; ii<=recursion_level; ii++)
	{
		if (effect_number==15.0)
		{
			position *= 4.0;

			coord = mod(position,1.0);
			effect = floor(mod(position,4.0));
			effect_number = effect.y * 4.0 + effect.x;
			effect_group = floor(position) * 7.0;

			centered_coord = coord - vec2(0.5);
			dist_from_center = length(centered_coord);
			angle_from_center = atan(centered_coord.y, centered_coord.x);

			color = vec3(0.5);	
		} 
		else if (effect_number==0.0)
		{
			// gradient = mod(sin(coord.x*400.0) * sin(coord.y * 400.0) * 16.0 * time, 1.0);
			gradient = (rand( vec2(sin(coord*400.0))*time));
			color = vec3(gradient);
			break;
		}
		else if (effect_number==1.0)
		{
			color.r = sin(coord.x * 32.0) + sin(coord.y * 24.0) + sin(coord.x * 4.0 + sin(coord.y * 8.0 + time));
			color.g = sin(coord.x * 16.0) + sin(coord.y * 12.0) + sin(coord.x * 8.0 + sin(coord.y * 16.0 + 2.0 * time));
			color.b = sin(coord.x * 8.0) + sin(coord.y * 48.0) + sin(coord.x * 2.0 + sin(coord.y * 4.0 + 3.0 * time));
			break;
		}
		else if (effect_number==2.0)
		{
			radius = dist_from_center + sin(time * 8.0) * 0.1 + 0.1;
			angle = angle_from_center + time;
	 
			gradient = 0.5 / radius + sin(angle * 5.0) * 0.3;
			color = vec3(gradient, gradient / 2.0, gradient / 3.0);
			break;
		}
		else if (effect_number==3.0)
		{
			radius = dist_from_center;
			angle = angle_from_center + time;
	 
			gradient = sin(mod(angle + sin(-radius + time) * 2.0,2.0*pi) * 4.0) + 1.0;
			color = vec3(gradient/3.0, gradient / 2.0, gradient);
			break;
		}
		else if (effect_number==4.0)
		{
			float dist_from_center_y = length(centered_coord.y);
			u = 8.0/dist_from_center_y + 16.0*time;
			v = (16.0/dist_from_center_y)* centered_coord.x + sin(time) * 8.0;
	 
			fade = dist_from_center_y * 2.0;
			gradient = ((1.0 - pow(sin(u) + 1.0, 0.1)) + (1.0 - pow(sin(v) + 1.0, 0.1))) * fade;
			color = vec3(gradient / 2.0, gradient, gradient / 2.0);
			break;
		}
		else if (effect_number==5.0)
		{
			u = 8.0 / dist_from_center + 16.0 * time;
			v = angle_from_center * 16.0;
	 
			fade = dist_from_center * 2.0;
			gradient = ((1.0 - pow(sin(u) + 1.0, 0.1)) + (1.0 - pow(sin(v) + 1.0, 0.1))) * fade;
			color = vec3(gradient * 4.0, gradient, gradient / 2.0);
			break;
		}
		else if (effect_number==6.0)
		{
			for (float i=0.0; i<=32.0; i++)
			{
				vec2 blob_coord = vec2(sin(2.0*i + 2.0*time) * 0.4, cos(3.0*i + 3.0 * time) * 0.4);
				gradient += ((0.0001 + sin(i*i + 4.0*time) * 0.000095)) / pow(length(centered_coord - blob_coord), 2.75);
			}
			color = vec3(gradient, gradient * 2.0, gradient / 2.0);
		}
		else if (effect_number==7.0)
		{
			gradient = 1.0;
			for (float i=0.0; i<=16.0; i++)
			{
				vec2 blob_coord = vec2(sin(32.0*i + 0.5*time) * 0.5, cos(256.0*i + 1.0 * time) * 0.5);
				gradient = min(gradient, length(centered_coord - blob_coord));
			}
			gradient = pow(sin(gradient), 2.0) * 16.0;
			color = vec3(gradient / 1.5, gradient / 2.0, gradient * 1.5);
			break;
		}
		else if (effect_number==8.0)
		{
			float disp = 0.005;
			float p00 = get_bump_height(centered_coord);
			float p10 = get_bump_height(centered_coord + vec2(disp, 0.0));
			float p01 = get_bump_height(centered_coord + vec2(0.0, disp));
	 
			float dx = p10 - p00;
			float dy = p01 - p00;
	 
			vec2 light_coord = vec2(sin(time) * 0.3, sin(2.0*time) * 0.3);
			vec2 disp_coord = centered_coord - vec2(dx, dy);
			gradient = 0.1 / length(disp_coord - light_coord);
			color = vec3(gradient, gradient, gradient * 1.25);
			break;
		}
		else if (effect_number==9.0)
		{
			vec2 rotated_coord;
			float zoom = sin(time) + 1.25;
			rotated_coord.x = zoom * (centered_coord.x * cos(time) - centered_coord.y * sin(time));
			rotated_coord.y = zoom * (centered_coord.y * cos(time) + centered_coord.x * sin(time));
	
			vec2 pix = floor(rotated_coord * 8.0);
	
			gradient = mod(mod(pix.x,2.0) + mod(pix.y,2.0),2.0);
			color = vec3(gradient);
	
			float raster1 = 0.01 / length(centered_coord.y - sin(1.5 * time) * 0.5);
			float raster2 = 0.01 / length(centered_coord.y - sin(1.5 * time + 0.3) * 0.5);
			float raster3 = 0.01 / length(centered_coord.y - sin(1.5 * time + 0.6) * 0.5);
			vec3 rcolor;
			if (raster1 > 0.25 || raster2 > 0.25 || raster3 > 0.25)
			{
				rcolor = vec3(raster1, 0.0, 0.0);
				rcolor += vec3(0.0, raster2, 0.0);
				rcolor += vec3(0.0, 0.0, raster3);
				color = rcolor;
			}
			break;
		}
		else if (effect_number==10.0)
		{
			for (float i=1.0; i<=128.0; i++)
			{
				vec2 star_pos = vec2(sin(i) * 64.0, sin(i*i*i) * 64.0);
				float z = mod(i*i - 128.0*time, 256.0);
				float fade = (256.0 - z) / 256.0;
				vec2 blob_coord = star_pos / z;
				gradient += ((fade / 384.0) / pow(length(centered_coord - blob_coord), 1.5)) * (fade * fade);
			}
	
			color = vec3(gradient * 2.0, gradient, gradient / 2.0);
			break;
		}
		else if (effect_number==11.0)
		{
			float z = sqrt(0.25 - centered_coord.x * centered_coord.x - centered_coord.y * centered_coord.y);
			vec2 tex = (centered_coord * 32.0) / z;
	 
			fade = pow(z,2.0);
			vec2 discolamp = vec2(pow(sin(tex.x + sin(0.5 * time) * 64.0) + 1.0, 2.0), pow(sin(tex.y + sin(0.4 * time) * 128.0) + 1.0, 2.0));
			gradient = (4.0 - discolamp.x - discolamp.y) * fade;
			color = vec3(gradient * 4.0, gradient, gradient / 2.0);
			break;
		}
		else if (effect_number==12.0)
		{
			const float steps = 64.0;
			float sum = 0.0;
			for (float i=0.0; i<=steps; i++)
			{
				vec2 light_coord = centered_coord + vec2(sin(time), sin(time * 1.24));
				vec2 displacement = vec2(mix(centered_coord, 0.25 * light_coord, (steps - i) / steps));
				sum = mix(get_light(centered_coord + displacement), sum, 0.9);
			}
			gradient = sum;
	if (gradient <= 0.1) gradient = length(centered_coord) * 0.25;
			color = vec3(gradient * 4.0, gradient, gradient / 2.0);
			break;
		}
		else if (effect_number==13.0)
		{
			float xpos = -0.5 + sin(centered_coord.y * 16.0 + time) * 0.06;
			float ypos = 0.0 + sin(centered_coord.x * 24.0 + 1.5 * time) * 0.04;
			const float z_fractal = 0.4;
	
			const float iter = 64.0;
			const float iter2 = iter / 4.0;
		
			float z0_r = 0.0;
			float z0_i = 0.0;
			float z1_r = 0.0;
			float z1_i = 0.0;
			float p_r = (centered_coord.x + xpos * z_fractal) / z_fractal;
			float p_i = (centered_coord.y + ypos * z_fractal) / z_fractal;
			float d = 0.0;
		
			float nn;
			for (float n=0.0; n<=iter; n++)
			{
				z1_r = z0_r * z0_r - z0_i * z0_i + p_r;
				z1_i = 2.0 * z0_r * z0_i + p_i;
				d = sqrt(z1_i * z1_i + z1_r * z1_r);
				z0_r = z1_r;
				z0_i = z1_i;
				if (d > iter2) break;
				nn = n;
			}
		
			gradient = (nn / iter) * 4.0;
		
			color = vec3(gradient * 2.0, gradient, gradient * 16.0);
			break;
		}
		else if (effect_number==14.0)
		{
			float zom = 3.5;
			float x0 = centered_coord.x * zom;
			float y0 = centered_coord.y * zom;
	
			float x1, y1, mj2;
			const float iter = 32.0;
	
			float posx = sin(time * 2.0) * 0.75;
			float posy = sin(time * 1.5) * 0.75;
	
			float nn;
			for (float n=0.0; n<=iter; n++)
			{
				x1 = x0*x0 - y0*y0 + posx;
				y1 = 2.0*x0*y0 + posy;
				mj2 = x1*x1 + y1*y1;
				x0 = x1; y0 = y1;
				nn = n;
				if (mj2 > iter) break;
			}
	
			gradient = (nn / iter) * 2.0;
	
			color = vec3(1.0 - gradient, 1.0 - gradient * 2.0, gradient * 2.0);
		}
		iii = ii;
	}
 
	color.r *= (sin(effect_group.x * (iii+1.0)) * 0.5 + 0.5);
	color.g *= (sin(effect_group.x + effect_group.y * (iii*iii*iii)) * 0.5 + 0.5);
	color.b *= (sin(effect_group.x * effect_group.y* (iii*iii+1.5)) * 0.5 + 0.5);
 
	gl_FragColor = vec4(color, 1.0 );
}

