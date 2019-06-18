/*
 * Original shader from: https://www.shadertoy.com/view/Xds3RN
 */

#ifdef GL_ES
precision mediump float;
#endif

// glslsandbox uniforms
uniform float time;
uniform vec2 resolution;

// shadertoy emulation
#define iTime time
#define iResolution resolution

// --------[ Original ShaderToy begins here ]---------- //
		vec4 permute(vec4 x) {
		  return mod((34.0 * x + 1.0) * x, 289.0);
		}
		
		vec3 cellular2x2p(vec2 P)
		{
				#define K 0.142857142857 // 1/7
				#define K2 0.0714285714285 // K/2
				#define jitter 0.8 // jitter 1.0 makes F1 wrong more often
				
				vec2 Pi = mod(floor(P), 289.0);
				vec2 Pf = fract(P);
				vec4 Pfx = Pf.x + vec4(-0.5, -1.5, -0.5, -1.5);
				vec4 Pfy = Pf.y + vec4(-0.5, -0.5, -1.5, -1.5);
				vec4 p = permute(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));
				p = permute(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));
				vec4 ox = mod(p, 7.0)*K+K2;
				vec4 oy = mod(floor(p*K),7.0)*K+K2;
				vec4 dx = Pfx + jitter*ox;
				vec4 dy = Pfy + jitter*oy;
				vec4 d = dx * dx + dy * dy; 
				
				vec3 f;

				vec2 fo=min(d.xy,d.zw);

//			There may be a smarter way to return the smallest coordinate.... 
//      as the if-statement spagetti replaces the two lines below so that we can return the coordinateds as well as the distance
//
//			vec2 fo=min(d.xy,d.zw);
//			f.z=min(fo.x,fo.y);
				
				if(fo==d.xy){
						if(fo.x<fo.y){
								// x
								f.x=dx.x;
								f.y=dy.x;
								f.z=fo.x;
						}else{
								// y
								f.x=dx.y;
								f.y=dy.y;
								f.z=fo.y;						
						}
				}else if(fo==d.zy){
						if(fo.x<fo.y){
								// z
								f.x=dx.z;
								f.y=dy.z;
								f.z=fo.x;
						}else{
								// y
								f.x=dx.y;
								f.y=dy.y;
								f.z=fo.y;						
						}
				}else if(fo==d.xw){
						if(fo.x<fo.y){
								// x
								f.x=dx.x;
								f.y=dy.x;
								f.z=fo.x;
						}else{
								// w							
								f.x=dx.w;
								f.y=dy.w;
								f.z=fo.y;						
						}
				}else{ 									//fo==d.zw
						if(fo.x<fo.y){
								// z
								f.x=dx.z;
								f.y=dy.z;
								f.z=fo.x;
						}else{
								// w
								f.x=dx.w;
								f.y=dy.w;
								f.z=fo.y;						
						}
				}				

				return f; 
		}

    void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
				vec2 uv = fragCoord.xy / iResolution.xy;
				uv.x*=(iResolution.x/iResolution.y);
				
				vec2 inc;
				
				vec2 scuv=uv*1.5;
				scuv.y-=(iTime*0.1);

				// Moving Bubbles				
				vec3 p=cellular2x2p(scuv*6.0);

				// Stationary Bubbles
				vec3 q=cellular2x2p(uv*3.0);

				// Glass and Bubble Colors				
				vec3 midcol=vec3(0.91,0.73,0.27);
				vec3 bottomcol=vec3(1.0,0.96,0.40);
				vec3 white=vec3(1.0,1.0,1.0);
				vec3 bubcol=vec3(0.63,0.27,0.09);
				vec3 gray=vec3(0.7,0.7,0.7);
				
				// Moving Bubbles
				float ring = smoothstep(0.975,0.985,1.0-p.z);
				float cent = smoothstep(0.98,0.995,1.0-p.z);

				float bubdiv =1.0-clamp(abs(p.y*16.0),0.0,1.0);
				float bubdivx =clamp(abs(p.x*8.0),0.0,1.0);

				float bubtop,bubbot;
				bubtop=clamp(p.y*10.0,0.0,1.0);

				bubtop=(bubtop*0.8)+((bubdivx*bubdivx)*0.2);
				bubbot=(1.0-bubtop)*cent;
				bubtop=bubtop*cent;

				float bub=(ring-cent);

				// Stationary Bubbles
				float ring2 = smoothstep(0.975,0.985,1.0-q.z);
				float cent2 = smoothstep(0.98,0.995,1.0-q.z);

				float bubdiv2 =1.0-clamp(abs(q.y*16.0),0.0,1.0);
				float bubdivx2 =clamp(abs(q.x*8.0),0.0,1.0);

				float bubtop2,bubbot2;
				bubtop2=clamp(q.y*10.0,0.0,1.0);

				bubtop2=(bubtop2*0.8)+((bubdivx2*bubdivx2)*0.2);
				bubbot2=(1.0-bubtop2)*cent2;
				bubtop2=bubtop2*cent2;

				float bub2=(ring2-cent2);

				// Attenuation of layers				
				float glasstop=smoothstep(0.75,0.55,uv.y);
				float foambot=smoothstep(0.80,0.82,uv.y);
				float nobub=1.0-smoothstep(0.85,0.95,uv.y);
				float nofoam=smoothstep(0.75,0.85,uv.y);
				float nostat=smoothstep(0.67,0.68,uv.y);
				
				float d;
				
				// Foam layer bubbles
				float scaf=1.0+(1.0-((uv.y*4.0)-9.0));
				vec3 foamy=cellular2x2p(uv*6.0*scaf);
				d=smoothstep(0.5,0.8,1.0-foamy.z)-smoothstep(0.5,1.0,1.0-foamy.z);
				d+=clamp(foamy.y*10.0,0.0,1.0)*smoothstep(0.5,1.0,1.0-foamy.z)*0.3;


				vec3 col=mix(midcol,bottomcol,glasstop);
				
				bubcol=mix(bubcol,gray,nofoam);
				bubcol=mix(white,bubcol,nobub);
				bottomcol=mix(bottomcol,white,nofoam);

				col=mix(col,white,foambot);

				col=mix(col,bubcol,bub);
				col=mix(col,bottomcol,bubbot);
				col=mix(col,bubcol,bubtop*0.5);

				vec3 foamcol=mix(white,gray,d);
				foamcol=mix(white,foamcol,nobub);

				col=mix(col,foamcol,nofoam);							
				
				col=mix(col,bubcol,bub2*nostat);
				col=mix(col,bottomcol,bubbot2*nostat);
				col=mix(col,bubcol,bubtop2*0.5*nostat);

														
				fragColor = vec4(col,1.0);

    }

// --------[ Original ShaderToy ends here ]---------- //

void main(void)
{
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
