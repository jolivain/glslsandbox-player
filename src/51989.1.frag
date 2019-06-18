#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;


const float PI = 3.1415926535;
const vec2 c = vec2(0.5);

float rand(vec2 st)
{
	return fract(
		sin(			dot(st, vec2(12.9898, 78.233))			) *  43758.5453);
}

// 0～1を返すsin
float halfSin(float x)
{
	return sin(x) * 0.5 + 0.5;
}

float segmentH(vec2 st, vec2 offset)
{
	float c = 0.5;
	st = st - offset - c;
	float size = 0.1;
	// ラインを引く
	float line = abs(st.y) - size / 2.0;

	// ダイアを描く
	float dia = abs(st.x) - size + abs(st.y) - size;
	return min(step(line, 0.0) , step(dia, 0.0));
}

float segmentV(vec2 st, vec2 offset)
{
	float c = 0.5;
	st = st - offset - c;
	float size = 0.1;
	// ラインを引く
	float line = abs(st.x) - size / 2.0;

	// ダイアを描く
	float dia = abs(st.x) - size + abs(st.y) - size;
	return min(step(line, 0.0) , step(dia, 0.0));
}

float segment1(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg3 = segmentV(st, vec2(0.2 , 0.2));
 	float seg6 = segmentV(st, vec2(0.2 , -0.2));

	return seg3 + seg6;
}

float segment2(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg5 = segmentV(st, vec2(-0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg3 + seg4 + seg5 + seg7;
}

float segment3(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg3 + seg4 + seg6 + seg7;
}

float segment4(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	return seg2 + seg3 + seg4 + seg6;
}

float segment5(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg4 + seg6 + seg7;
}

float segment6(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg5 = segmentV(st, vec2(-0.2 , -0.2));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg4 + seg5 + seg6 + seg7;
}


float segment7(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	return seg1 + seg3 + seg6;
}

float segment8(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg5 = segmentV(st, vec2(-0.2 , -0.2));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg3 + seg4 + seg5 + seg6 + seg7;
}

float segment9(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg3 + seg4 + seg6 + seg7;
}

float segment0(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg3 = segmentV(st, vec2(0.2 , 0.2));
	float seg5 = segmentV(st, vec2(-0.2 , -0.2));
	float seg6 = segmentV(st, vec2(0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg3 + seg5 + seg6 + seg7;
}

float segmentMinus(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg4 = segmentH(st, vec2(0));
	return seg4;
}

float segmentE(vec2 st, vec2 scale, vec2 offset)
{
	st /= scale;
	st -= offset;

	float seg1 = segmentH(st, vec2(0.0, 0.4));
	float seg2 = segmentV(st, vec2(-0.2 , 0.2));
	float seg4 = segmentH(st, vec2(0));
	float seg5 = segmentV(st, vec2(-0.2 , -0.2));
	float seg7 = segmentH(st, vec2(0.0, -0.4));
	return seg1 + seg2 + seg4 + seg5 + seg7;
}

float segment(vec2 st, float num, vec2 scale, vec2 offset)
{
	if(num < 0.0)
		return segmentMinus(st, scale, offset);
	if(num < 0.1)
		return segment0(st, scale, offset);
	if(num < 0.2)
		return segment1(st, scale, offset);
	if(num < 0.3)
  	return segment2(st, scale, offset);
	if(num < 0.4)
		return segment3(st, scale, offset);
	if(num < 0.5)
		return segment4(st, scale, offset);
	if(num < 0.6)
		return segment5(st, scale, offset);
	if(num < 0.7)
		return segment6(st, scale, offset);
	if(num < 0.8)
		return segment7(st, scale, offset);
	if(num < 0.9)
		return segment8(st, scale, offset);
	if(num < 1.0)
		return segment9(st, scale, offset);

	return segmentE(st, scale, offset);

}

float segment(vec2 st, float num)
{
	return segment(st, num, vec2(1.0), vec2(0.0));
}


vec4 map(vec2 st)
{
	float split = 8.0 ;
	vec2 fst = st * split;
  vec2 nst = fract(fst);
	vec2 scale = vec2(1.0);
	vec2 offset = vec2(0.0 , 0.0);

	float ti = mod(rand(floor(vec2(fst.x, fst.y))) + time * 0.7, 1.0); // 0 ~ 1
	float seg = segment(nst, mod(ti , 1.0), scale, offset);

	return vec4(0.0, seg , 0.0, 1.0);
}


void main() {
	// 画面の座標を-1~1の間に正規化
	vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

	// 画面の座標を0~1の間に正規化
	uv = (gl_FragCoord.xy * 1.0) / min(resolution.x, resolution.y);

	// 繰り返し処理
// uv = fract(uv * 1.0);



  vec4 d = map(uv);

	gl_FragColor = vec4(vec3(d) ,1.0);
}

