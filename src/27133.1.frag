#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float scale = 1.0;

vec2 SPR_SIZE = vec2(6, 8);

vec2 c_a = vec2(0x7228BE, 0x8A2000);
vec2 c_b = vec2(0xF22F22, 0x8BC000);
vec2 c_c = vec2(0x722820, 0x89C000);
vec2 c_d = vec2(0xE248A2, 0x938000);
vec2 c_e = vec2(0xFA0E20, 0x83E000);
vec2 c_f = vec2(0xFA0E20, 0x820000);
vec2 c_g = vec2(0x72282E, 0x89C000);
vec2 c_h = vec2(0x8A2FA2, 0x8A2000);
vec2 c_i = vec2(0xF88208, 0x23E000);
vec2 c_j = vec2(0xF84104, 0x918000);
vec2 c_k = vec2(0x8A4A34, 0x8A2000);
vec2 c_l = vec2(0x820820, 0x83E000);
vec2 c_m = vec2(0x8B6AA2, 0x8A2000);
vec2 c_n = vec2(0x8B2AA6, 0x8A2000);
vec2 c_o = vec2(0x7228A2, 0x89C000);
vec2 c_p = vec2(0xF228BC, 0x820000);
vec2 c_q = vec2(0x7228AA, 0x99E000);
vec2 c_r = vec2(0xF228BC, 0x8A2000);
vec2 c_s = vec2(0x7A0702, 0x0BC000);
vec2 c_t = vec2(0xF88208, 0x208000);
vec2 c_u = vec2(0x8A28A2, 0x89C000);
vec2 c_v = vec2(0x8A28A2, 0x508000);
vec2 c_w = vec2(0x8A28AA, 0xDA2000);
vec2 c_x = vec2(0x8A2722, 0x8A2000);
vec2 c_y = vec2(0x8A2782, 0x89C000);
vec2 c_z = vec2(0xF84210, 0x83E000);
vec2 c_0 = vec2(0x732AA6, 0x89C000);
vec2 c_1 = vec2(0x218208, 0x23E000);
vec2 c_2 = vec2(0x722108, 0x43E000);
vec2 c_3 = vec2(0x722302, 0x89C000);
vec2 c_4 = vec2(0x92491E, 0x104000);
vec2 c_5 = vec2(0xFA0F02, 0x89C000);
vec2 c_6 = vec2(0x72283C, 0x89C000);
vec2 c_7 = vec2(0xF82108, 0x420000);
vec2 c_8 = vec2(0x722722, 0x89C000);
vec2 c_9 = vec2(0x722782, 0x89C000);
vec2 c_per = vec2(0x000000, 0x008000);
vec2 c_exc = vec2(0x208208, 0x008000);
vec2 c_com = vec2(0x000000, 0x008400);
vec2 c_col = vec2(0x008000, 0x008000);
vec2 c_sol = vec2(0x008000, 0x008400);
vec2 c_pls = vec2(0x00823E, 0x208000);
vec2 c_dsh = vec2(0x00003E, 0x000000);
vec2 c_div = vec2(0x002108, 0x420000);
vec2 c_ast = vec2(0x000508, 0x500000);
vec2 c_lbr = vec2(0x084104, 0x102000);
vec2 c_rbr = vec2(0x810410, 0x420000);
vec2 c_lsb = vec2(0x184104, 0x106000);
vec2 c_rsb = vec2(0xC10410, 0x430000);
vec2 c_lcb = vec2(0x184208, 0x106000);
vec2 c_rcb = vec2(0xC10208, 0x430000);
vec2 c_les = vec2(0x084208, 0x102000);
vec2 c_grt = vec2(0x408104, 0x210000);
vec2 c_sqo = vec2(0x208000, 0x000000);
vec2 c_dqo = vec2(0x514000, 0x000000);
vec2 c_que = vec2(0x72208C, 0x008000);
vec2 c_pct = vec2(0x022108, 0x422000);
vec2 c_dol = vec2(0x21EA1C, 0x2BC200);
vec2 c_num = vec2(0x53E514, 0xF94000);
vec2 c_ats = vec2(0x722BAA, 0xA9C000);
vec2 c_equ = vec2(0x000F80, 0xF80000);
vec2 c_tdl = vec2(0x42A100, 0x000000);
vec2 c_rsl = vec2(0x020408, 0x102000);
vec2 c_crt = vec2(0x214880, 0x000000);
vec2 c_amp = vec2(0x42842C, 0x99C000);
vec2 c_bar = vec2(0x208208, 0x208208);
vec2 c_blk = vec2(0xFFFFFF, 0xFFFFFF);
vec2 c_trd = vec2(0xFD5FD5, 0xFD5FD5);
vec2 c_hlf = vec2(0xA95A95, 0xA95A95);
vec2 c_qrt = vec2(0xA80A80, 0xA80A80);
vec2 c_spc = vec2(0x000000, 0x000000);

const int NUM_TONES = 9;
vec2 tones[9];

float ch(vec2 ch, vec2 uv)
{
	uv = floor(uv);
	vec2 b = vec2((SPR_SIZE.x - uv.x - 1.0) + uv.y * SPR_SIZE.x) - vec2(24,0);
	vec2 p = mod(floor(ch / exp2(clamp(b,-1.0, 25.0))), 2.0);
	float o = dot(p,vec2(1)) * float(all(bvec4(greaterThanEqual(uv,vec2(0)), lessThan(uv,SPR_SIZE))));
	return o;
}

void init_arrays()
{
	tones[0] = c_spc;
	tones[1] = c_per;
	tones[2] = c_col;
	tones[3] = c_exc;
	tones[4] = c_pls;
	tones[5] = c_equ;
	tones[6] = c_amp;
	tones[7] = c_num;
	tones[8] = c_ats;
}


vec2 tone(float b)
{
	for(int i = 0;i < NUM_TONES;i++)
	{
		if(b < float(i)/float(NUM_TONES))
		{
			return tones[i];
		}
	}
	
	return tones[NUM_TONES-1];
}

void main( void ) 
{
	init_arrays();
	vec2 fitres = floor(resolution / (SPR_SIZE*scale)) * (SPR_SIZE*scale);	
	vec2 res = floor(resolution.xy / SPR_SIZE) / scale;	
	vec2 uv = floor(gl_FragCoord.xy / scale);
	uv -= (resolution - fitres) / (2.0 * scale);
	
	vec2 tasp = res / min(res.x,res.y);
	vec2 tuv = floor(uv / SPR_SIZE) / min(res.x,res.y);
	
	float plm = sin(tuv.x * 8.0 + sin(tuv.x + tuv.y * 8.0 + time * 3.0) + time) + cos(tuv.y * 8.0 + cos(tuv.x - tuv.y * 9.0 + time * 2.0));
	plm = sin(plm * 4.0 - 8.0*(time+ sin(time*0.5)*4.0));
	plm = (plm / 2.0 + 0.4);
	
	vec2 c = tone(plm);
	
	float pix = ch(c, mod(uv,SPR_SIZE));
	
	pix *= float(all(greaterThan(uv, vec2(0))) && all(lessThan(uv, fitres / scale)));
	
	gl_FragColor = vec4( vec3(0, pix ,0), 1.0 );
}
