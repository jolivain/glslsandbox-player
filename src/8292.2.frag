#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// Written by David Hoskins.
// Copying the Shadertoy error message.

// First posted on *** https://www.shadertoy.com/view/ldsGR7 ***

// 96 x 12 bitmap embedded into 16 bit hexadecimal numbers.

float corrupt = 16.0;
float rand( float n )
{
    return fract(sin(n)*23758.5453);
}


float GetBinary(vec2 coord)
{
	int x = int(coord.x);
	int y = int(coord.y);
	int col[6];
	if (x < 1 || x > 95) return 0.0;
	if (y < 1 || y > 12) return 0.0;
	y = 12-y;// Upside down! Oh well. :)
	if (y == 0)
	{
		col[0] = 0x60f8;
		col[1] = 0x0;
		col[2] = 0x60;
		col[3] = 0xf800;
		col[4] = 0xf;
		col[5] = 0x0;
	}
	else
	if (y == 1)
	{
		col[0] = 0x61fc;
		col[1] = 0x0;
		col[2] = 0x60;
		col[3] = 0xf800;
		col[4] = 0xf;
		col[5] = 0x0;
	}
	else
	if (y == 2)
	{
		col[0] = 0x638e;
		col[1] = 0x0;
		col[2] = 0x60;
		col[3] = 0x1800;
		col[4] = 0x00;
		col[5] = 0x00;
	}
	else
	if (y == 3)
	{
		col[0] = 0x6306;
		col[1] = 0xf87;
		col[2] = 0x3e6e;
		col[3] = 0x1836;
		col[4] = 0xdb60;
		col[5] = 0xd87c;
	}
	else
	if (y == 4)
	{
		col[0] = 0xf01e;
		col[1] = 0x9fcf;
		col[2] = 0x7f3f;
		col[3] = 0x1c3e;
		col[4] = 0xfbe0;
		col[5] = 0xf8fe;
	}
	else
	if (y == 5)
	{
		col[0] = 0x707c;
		col[1] = 0x98cc;
		col[2] = 0x6339;
		col[3] = 0xfc0e;
		col[4] = 0x38e7;
		col[5] = 0x39c6;
	}
	else
	if (y == 6)
	{
		col[0] = 0x30f0;
		col[1] = 0xdc0e;
		col[2] = 0x63b0;
		col[3] = 0xfc06;
		col[4] = 0x1867;
		col[5] = 0x1987;
	}
	else
	if (y == 7)
	{
		col[0] = 0x31c0;
		col[1] = 0xdfc6;
		col[2] = 0x7fb0;
		col[3] = 0xc07;
		col[4] = 0x1c70;
		col[5] = 0x1d83;
	}
	else
	if (y == 8)
	{
		col[0] = 0x3983;
		col[1] = 0xcce6;
		col[2] = 0x1b8;
		col[3] = 0xc03;
		col[4] = 0xc30;
		col[5] = 0xcc3;
	}
	else
	if (y == 9)
	{
		col[0] = 0x19c7;
		col[1] = 0xcc66;
		col[2] = 0x3399;
		col[3] = 0xe03;
		col[4] = 0xc30;
		col[5] = 0xce7;
	}
	else
	if (y == 10)
	{
		col[0] = 0x18fe;
		col[1] = 0xcfe7;
		col[2] = 0x3f1f;
		col[3] = 0xfe03;
		col[4] = 0xc33;
		col[5] = 0xc7e;
	}
	else
	if (y == 11)
	{
		col[0] = 0x187c;
		col[1] = 0x8dc3;
		col[2] = 0x1e1b;
		col[3] = 0xfe03;
		col[4] = 0xc33;
		col[5] = 0xc3c;
	}
	
	int binary = 0;
	x = x/16;
	// I can't use an indices in arrays!...
	if (x == 0)	binary = col[0];
	else
	if (x == 1)	binary = col[1];
	else
	if (x == 2)	binary = col[2];
	else
	if (x == 3)	binary = col[3];
	else
	if (x == 4)	binary = col[4];
	else  binary = col[5];
	// Get the correct bit from the 16 bit integer...
	return mod(floor(float(binary) / pow(2.0, floor(mod(coord.x, corrupt)))), 2.0);
}

void main(void)
{
	float time2 = time+1.5;

	vec2 uv = gl_FragCoord.xy / resolution.xy;
	vec2 xy = uv * vec2(212.0, 160.0);
	
	// Adjust to centre...
	xy.x += -56.0;

	float blur = .5;
	float tick, t;

 	// Spread blur...	
	tick = mod(time2, 3.0);
	t = step(2.0, tick);
	t -= step(2.1, tick);
	blur += t*2.0;

	// Bend it...
	tick = mod(time2, 4.0);
	t = smoothstep(3.0, 3.1, tick);
	t -= smoothstep(3.25, 3.3, tick);
	t = t*.02;
	t = t * (xy.x*3.0-xy.y*2.0-time2*30.0);
	float si = sin(t);
	float co = cos(t);
	mat2 mat = mat2(co, si, -si,co);
	xy = mat * xy;
	
	// Vertical judder...
	tick = mod(time2, 5.0);
	t = smoothstep(4.0, 4.3, tick);
	t -= smoothstep(4.3, 4.5, tick);
	t = t*4.0 + sin (t * 64.0);
	xy.x -= t*.25;
	xy.y += t;
	
	// Roll...
	tick = mod(time2, 7.0);
	t = smoothstep(5.0, 6.5, tick);
	t -= smoothstep(6.5, 7.0, tick);
	t = smoothstep(-.15, .15, sin (t * time2)) * t*5.0;
	xy.y *= 1.0+t;
	
	// Corrupt...
	tick = mod(time2, 9.0);
	t = smoothstep(7.5, 8.0, tick);
	t -= smoothstep(8.0, 8.3, tick);
	corrupt = 16.0 - t*4.0 + sin (t * 20.0)*t;

	
	xy.y += -67.0;	
	// Find intensity...
	
	float intensity = GetBinary(xy) * .35
					+ GetBinary(xy+vec2(blur, blur))*.25
		 			+ GetBinary(xy+vec2(-blur, blur))*.25
		 			+ GetBinary(xy+vec2(-blur, -blur))*.25
		 			+ GetBinary(xy+vec2(blur, -blur))*.25;
	// Noise...
	tick = mod(time2, 20.0);
	t = smoothstep(11.0, 13.0, tick);
	t -= smoothstep(16.0, 19.0, tick);
	t = t *.55+ t*sin(time2*43.0) * .06;
	vec3 noise = vec3(t, t, t);
	noise += rand(floor(xy.y*20.0)+floor(time2*9.0))*t*.2;
	noise += rand(floor(xy.y*2.0+xy.x)+time2)*t*.1;
	// Vertical hold out of sync bar...
	noise *= noise + (1.0-pow(abs(mod(time2, 2.0)-1.0-uv.y), .27)) * .65;
	// Vignetting...
	noise *= pow( 16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y), 0.3 );
	// Tint...
	vec3 rgb = noise * vec3(1.0, .9, .8);

	rgb.r = mix(rgb.r, 1.0, min(1.0, intensity));
	gl_FragColor = vec4(rgb, 1.0);
}

