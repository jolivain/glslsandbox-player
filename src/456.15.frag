#ifdef GL_ES
precision highp float;
#endif

// Not-so-mega-ball!
// Wasting more processor cycles to deliver an inferior breakout clone than ever before possible!
// Original URL: http://glsl.heroku.com/456

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;

vec3 Brick(float x, float y) {
	// Make random(ish) brick color based on floored x, y
	x += y * 17.23523;
	float ang = pow(46.0 + x, 2.8234) + pow(52.0 + y, 3.9234);
	return vec3(0.7 + 0.19 * sin(ang), 0.7 + 0.19 * sin(ang + 2.094), 0.7 + 0.19 * sin(ang - 2.094));
}

vec3 Ball(bool x, bool y) {
	// Draw ball with indicated direction
	return vec3(1.0, x ? 0.9 : 1.0, y ? 0.9 : 1.0);
}

bool IsUninitialized(vec3 color) {
	return (color == vec3(0.0, 0.0, 0.0));
}

bool IsBall(vec3 color, bool x, bool y) {
	// Test for ball with specific direction
	if (color.r < 0.95) {return false;}
	if (abs(color.g - (x ? 0.9 : 1.0)) > 0.05) {return false;}
	if (abs(color.b - (y ? 0.9 : 1.0)) > 0.05) {return false;}
	return true;
}

bool IsAnyBall(vec3 color) {
	return ((color.r > 0.95) && (color.g > 0.85) && (color.b > 0.85));
}

bool IsWall(vec3 color) {
	return (length(color - vec3(0.5, 0.7, 0.6)) < 0.1);
}

bool IsBrick(vec3 color) {
	if (color.r < 0.5) {return false;}
	if (color.g < 0.5) {return false;}
	if (color.b < 0.5) {return false;}
	if (color.r > 0.9) {return false;}
	if (color.g > 0.9) {return false;}
	if (color.b > 0.9) {return false;}
	return true;
}

bool IsBlocked(vec3 color) {
	return (IsWall(color) || IsBrick(color));
}

bool IsExplosion(vec3 color, bool orball) {
	if (orball) {if ((color.r > 0.95) && (color.g > 0.85) && (color.b > 0.85)) {return true;}}
	return ((color.r > 0.5) && (color.r < 1.0) && (color.g > 0.5) && (color.b < 0.25));
}

bool IsBonus(vec3 color) {
	return ((color.b > 0.95) && (color.r < 0.5));
}

bool IsStealthBonus(vec3 color) {
	return (color.b > 0.15);
}

void main( void ) {
	vec2 position = ( gl_FragCoord.xy / resolution.xy );
	vec2 pixel = 1./resolution;
	vec2 mousepx = mouse * pixel;

	vec3 space = vec3(0.02, 0.04, 0.1);
	vec3 explosion = vec3(0.8, 0.8, 0.2);
	vec3 wall = vec3(0.5, 0.7, 0.6);
	vec3 fakeball = vec3(0.9, 1.0, 1.0);
	vec3 bonus = vec3(0.0, 0.5 + 0.5 * sin(time * 5.0), 1.0);
	vec3 fakebonus = vec3(0.0, 0.5 + 0.5 * sin(time * 5.0), 0.9);
	vec3 stealthbonus = vec3(0.9, 1.0, 1.0);

	vec4 old = texture2D(backbuffer, position);
	vec4 me = vec4(space.r, space.g, space.b, 1.0);
	float ballspeed = floor(0.002 * resolution.x) + 1.0;

	if (position.y < pixel.y) {
		// bonus-signalling column
		if (IsStealthBonus(texture2D(backbuffer, position + vec2(6.0, 0.0) * pixel).rgb)) {me.rgb = stealthbonus;}
		if (abs(position.x - mouse.x) < 0.04) {
			for (int n=0; n<5; n++) {
				if (float(n) <= 0.005 * resolution.y) {
					if (IsBonus(texture2D(backbuffer, vec2(position.x, 0.045) + vec2(0.0, float(n)) * pixel).rgb)) {
						me.rgb = stealthbonus;
					}
				}
			}
		}
	} else if ((position.x < 2.0 * pixel.x) || (position.x > (resolution.x - 2.0) * pixel.x) || (position.y > (resolution.y - 2.0) * pixel.y)) {
		// borders
		me.rgb = wall;
	} else if ((position.y > 0.02) && (position.y < 0.045) && (abs(position.x - mouse.x) < 0.04)) {
		// Player paddle
		me.rgb = wall;
	} else {
		// Playing field

		// Draw fake ball and bonus pixels around actuals from last frame
		for (float x = -2.0; x <= 2.0; x += 1.0) {
			for (float y = -2.0; y <= 2.0; y += 1.0) {
				if (IsBonus(texture2D(backbuffer, position + vec2(x, y) * pixel).rgb)) {me.rgb = fakebonus;}
				if ((abs(x) < 2.0) || (abs(y) < 2.0)) {
					if (IsAnyBall(texture2D(backbuffer, position + vec2(x, y) * pixel).rgb)) {me.rgb = fakeball;}
				}
			}
		}

		if (IsUninitialized(old.rgb)) {
			// draw blocks for first time
			float enemyrow = (1.0 - position.y - 0.05) * 25.0;
			float enemyrowmod = mod(enemyrow, 1.0);
			float enemycol = position.x * 20.4 - 0.275;
			float enemycolmod = mod(enemycol, 1.0);
			bool oddrow = (floor(mod(enemyrow, 2.0)) == 1.0);

			if ((enemyrow >= 0.0) && (enemyrow < 6.0)) {
				if ((enemycol >= 0.0) && (enemycol < 20.0)) {
					me.rgb = ((enemyrowmod < 0.8) && (enemycolmod < 0.85)) ? Brick(floor(enemycol), floor(enemyrow)) : space;
				}
			}

			if (length(gl_FragCoord.xy - vec2(floor(0.5 * resolution.x) + 0.5, floor(0.1852 * resolution.y) + 0.5)) < 1.0) {
				me.rgb = Ball(true, true);
			}
		} else if (IsBrick(old.rgb)) {
			// Grow explosions to consume whole block
			bool exploding = 
				(IsExplosion(texture2D(backbuffer, position + vec2(1.0, 0.0) * pixel).rgb, true)) ||
				(IsExplosion(texture2D(backbuffer, position + vec2(-1.0, 0.0) * pixel).rgb, true)) ||
				(IsExplosion(texture2D(backbuffer, position + vec2(0.0, 1.0) * pixel).rgb, true)) ||
				(IsExplosion(texture2D(backbuffer, position + vec2(0.0, -1.0) * pixel).rgb, true));
			me.rgb = exploding ? explosion : old.rgb;
			for (int n=0; n<4; n++) {
				bool bx = (n == 1) || (n == 3);
				bool by = (n >= 2);
				vec2 ballpos = position + vec2(bx ? -ballspeed : ballspeed, by ? -ballspeed : ballspeed) * 2.0 * pixel;
				if (IsAnyBall(texture2D(backbuffer, ballpos).rgb)) {
					me.rgb = explosion;
				}
			}
		} else if ((IsExplosion(old.rgb, false)) && (mod(fract(sin(dot(position + time * 0.001, vec2(14.9898,78.233))) * 43758.5453), 1.0) < 0.5 / resolution.x)) {

			// Explosions sometimes drop bonuses
			me.rgb = bonus;
		} else if (IsBonus(texture2D(backbuffer, position + vec2(0.0, 0.005)).rgb)) {
			// Existing bonuses fall
			me.rgb = bonus;
		}


		// If ball is going to land at this pixel this cycle, figure out which direction it needs to take for next cycle
		for (int n=0; n<4; n++) {
			bool bx = (n == 1) || (n == 3);
			bool by = (n >= 2);
			vec2 ballpos = position + vec2(bx ? -ballspeed : ballspeed, by ? -ballspeed : ballspeed) * pixel;
			if (IsBall(texture2D(backbuffer, ballpos).rgb, bx, by)) {
				ballpos = position + vec2(bx ? ballspeed : -ballspeed, by ? ballspeed : -ballspeed) * pixel;
				bool blocked_diag = IsBlocked((texture2D(backbuffer, ballpos).rgb));
				ballpos = position + vec2(bx ? ballspeed : -ballspeed, by ? -ballspeed : ballspeed) * pixel;
				bool blocked_x = IsBlocked((texture2D(backbuffer, ballpos).rgb));
				ballpos = position + vec2(bx ? -ballspeed : ballspeed, by ? ballspeed : -ballspeed) * pixel;
				bool blocked_y = IsBlocked((texture2D(backbuffer, ballpos).rgb));
				if (blocked_x && (!blocked_y)) {
					bx = !bx;
				} else if (blocked_y && (!blocked_x)) {
					by = !by;
					if (position.y < 0.1) {
						bx = (position.x > mouse.x);
					}
				} else if (blocked_x || blocked_y || blocked_diag) {
					bx = !bx;
					by = !by;
				}
				me.rgb = Ball(bx, by);
			}

			// Bonus activation makes ball split
			if (IsBall(old.rgb, bx, by)) {
	 			for (int n=0; n<=5; n++) {
					if (IsStealthBonus(texture2D(backbuffer, vec2(float(n) + 0.5, 0.5) * pixel).rgb)) {
						me.rgb = Ball(!bx,by);
					}
				}
			}
		}
	}

	gl_FragColor = me;
}
