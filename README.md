glslsandbox-player
==================

![Logo](glslsandbox.png)

Quick Start
-----------

  GLSL Sandbox standalone player allow one to run and render (most of)
nice shaders available online on the http://glslsandbox.com/ website,
but without the need of an Internet connection, a web browser or any
of its dependencies. Instead, the only requirement of
glslsandbox-player is a working EGL and GLESv2 libraries.

  Quick instructions for the impatient wanting to test on X11:

Install dependencies:

For Ubuntu from 14.04 to 20.04 LTS:

    sudo apt-get install \
      pkg-config \
      git curl make gcc autoconf automake libx11-dev \
      libegl1-mesa-dev libgles2-mesa-dev

For Fedora (tested on version 21 to 32):

    sudo dnf install \
      git curl make gcc autoconf automake libX11-devel \
      mesa-libEGL-devel mesa-libGLES-devel

Build:

    git clone https://github.com/jolivain/glslsandbox-player.git
    cd glslsandbox-player
    autoreconf -vfi
    ./configure
    make

Run a demo:

    ./scripts/run-demo-random.sh
or:

    ./scripts/run-demo.sh

  For the less impatient user, continue reading...


Introduction
------------

  The http://glslsandbox.com/ website (and all its shaders) is using
WebGL (See https://www.khronos.org/webgl/) and JavaScript for the
rendering which are now available in common web browsers. Those web
browsers are generally using X11. All of this pulls a lot of
dependencies, which generally requires a full desktop system. It also
require a working Internet connection. Since WebGL 1.0 is based on
OpenGL ES 2.0, it's relatively straightforward to run those shaders
directly on an OpenGL ES 2.0 driver.

  The goal of this program is to stress OpenGL ES 2.0 and greater
drivers (and its online shader compiler) on very restricted embedded
environment (i.e. a boot-loader, a kernel, the GL ES driver and this
program, no network connectivity, no file-system, no input devices)
with unusual shader load or program constructions.

  To overcome the lack of a network connectivity and a file-system on
a target device, the code of a selection of fragment shaders is
downloaded at compilation time, processed and then compiled inside the
final binary. The list of shader code to embed into the binary is
maintained in the file `shader.list`, in the root of this source
package. The source distribution includes a ready to use `shader.list`
file of an arbitrary pseudo-random selection of nice looking shaders.

  One would be tempted to include all available shaders on the website
(after all, more tests would mean more chances to find bugs). Users
should be aware that a lot of glslsandbox.com shaders are forks and
have a lot of similitude. Moreover some shaders just include syntax
error or typos (e.g. 8477.0). Some other shaders, may include driver
workaround that may not be fully GLSL compliant (e.g. shader 2606.0
with OS X AMD cos workaround that redefine the cos() function). Other
compilation failures may be due to garbage after #else or #endif
preprocessor directive present in some shaders (e.g. shader
26529.0). Moreover, some web browsers are using OpenGL to implement
WebGL (instead of OpenGL ES). There is slight differences in the GL
shading language between ES and non-ES version, that could make a
glslsandbox shader work in such a browser, but fail on a conformant
GLES2 driver. For example, GLSL ES 1.0.17 explicitly forbids the usage
of a user-defined function as a constant expression initializer (even
if the function evaluates to something constant). This is the case for
several glslsandbox shaders (for example 4040.0), which should be seen
as non-conformant shaders with respect to the WebGL 1.0, OpenGL ES 2.0
and GLSL 1.0.17 specifications. Such shaders should not be used for
testing a driver without a correction. Use the online Khronos WebGL
conformance to check is the implementation of a web browser, for this
case:

https://www.khronos.org/registry/webgl/sdk/tests/conformance/glsl/misc/global-variable-init.html

  Some extra care is taken to make sure that all the shaders included
in the default reference list are conformant to the GLSL
specification. See the section [Validating Builtin
Shaders](#validating-builtin-shaders).

  Finally, some shaders can be GPU-time consuming depending of the GPU
being tested. This is why a relevant selection of shader suited for
your driver and GPU would be better that a bare dump of the whole
glslsandbox.com site.

  The original player at http://glslsandbox.com/ is interactive, and
reacts to user mouse interactions. The glslsandbox-player instead can
emulates mouse movements by updating the shader uniforms and varying.


Supported glslsandbox Features
------------------------------

  The supported features of the original http://glslsandbox.com/
shader player are:

- the `time` float uniform is set to the number of seconds since the
  beginning of the rendering. In case the `-T` command line argument
  is used, the time is increased with this step at each frame,
  regardless the frame rate and computation time.

- the `mouse` vec2 uniform is updated with cyclic movement (two
  components of the vec2 encodes the mouse coordinates as float
  [-1.0:1.0]).

- the `resolution` vec2 uniform, which encodes the dimension of the
  surface in pixel to render.

- the `surfacePosition` vec2 varying, which define the viewport of the
  quad surface to be rendered (default is -1,-1 for lower left corner,
  1,1 for the upper right). This varying is used for the pan/zoom
  feature of the mouse (in the original http://glslsandbox.com/
  player). In glslsandbox-player, this varying is updated with cyclic
  movements of pan/zoom.

- the `surfaceSize` vec2 uniform, which defines the relative size
  ratio of the surface. It's value is:
  `vec2(resolution.x / resolution.y, 1.0)`

- the `backbuffer` uniform sampler2D gives access to the previous
  frame (back buffer) as a texture. It will work only when the FBO
  rendering is active (`-B`, `-R` or `-X`/`-Y` command line
  arguments). See for example shader 424.12.


Building glslsandbox-player
---------------------------

The build dependencies of glslsandbox are:
- a C compiler (gcc and clang are good candidates)
- GNU Make (an old Posix make isn't enough)
- curl (for downloading shaders)
- sed
- awk
- grep
- coreutils (sort, cat)
- Python 3.x or greater (also works with older Python >= 2.6)
- Development files for an OpenGL ES 2.0 and EGL library
- One of the following native window library: X11, Vivante/libGAL,
  Raspberry Pi, Wayland EGL, SDL2, libdrm and libgbm (for KMS)
- optional: libpng library and header files for texture support
- optional: netpbm commands are used by testsuite
- optional: glslang to validate builtin shaders

  Compiling glslsandbox-player should be straightforward if all
dependencies are present since it's an autotools package (aka
`./configure && make`). Make sure to enable/disable the proper native
windowing library for your system.

  The configure script takes an option to select the native windowing
system:

    --with-native-gfx   Define the native gfx backend: x11(default),vivfb,rpi,wl,sdl2,kms,tisgx,mali

  For example, compiling for using the the Vivante frame buffer native
windowing support, use `./configure --with-native-gfx=vivfb`.


Important Note about Shader Copyright, Licenses and Author Credits
------------------------------------------------------------------

  Users of glslsandbox-player should be aware and very careful about
the fact that the produced binary may include the source code (as a
character string) of fragment shaders that could be distributed under
various licenses. Also, please don't forget to give credit to original
shader code author(s), or original code URL.

  Also note that the glslsandbox-player source distribution does not
include any fragment shader source itself. It only include a file
containing a list pointing to online code. The downloading will be
done at compilation time.


Running glslsandbox-player
--------------------------

  If glslsandbox-player is executed without any option, it will run
infinitely the builtin shader id 0, on a full screen window. It will
render 3 warmup frames (defined later in [Note about Performance
Counting](#note-about-performance-counting) section) and will report
frame rate every 100 frames. By default, the program is started with a
verbosity level 1, which means info messages will be printed. Original
URL of the shader is also printed to easily check the rendering from a
WebGL enabled web browser.

  Command line arguments of glslsandbox-player are:

    Usage: glslsandbox-player [options]
     -h: show this help
     -l: list builtin shaders and exit
     -L: list builtin shaders URLs and exit
     -S <shader-name>: select the shader to be rendered by nickname
     -i <shader-id>: select the shader by internal id
     -I <shader-glslid>: select the shader by glslsandbox.com id
     -F <file>: run glslsandbox shader from file
     -p: print builtin shader code
     -f <n>: run n frames of shader(s)
     -t <n>: run n seconds of shader(s)
     -T <f>: time step at each frame instead of using real time
     -o <timespec>: set an absolute time origin
     -O <f>: time offset for the animation
     -m: disable mouse movement emulation
     -M <f>: set mouse movement speed factor
     -s <f>: set time speed factor
     -u: disable surfacePosition varying animation
     -U <f>: set surfacePosition animation speed factor
     -e <f:f:f:f>: set fixed surfacePosition values
     -W <n>: set window width to n
     -H <n>: set window height to n
     -x <n>: set window x position to n (if supported)
     -y <n>: set window y position to n (if supported)
     -B: Enable FBO usage (default to window size)
     -N: Set FBO filtering to NEAREST instead of LINEAR
     -R <n>: set FBO size to the window size divided by n
     -X <n>: set FBO height to n pixels
     -Y <n>: set FBO height to n pixels
     -r <n>: report frame rate every n frames
     -w <n>: set the number of warmup frames
     -V <n>: set EGL swap interval to n
     -P <n>: sleep n milliseconds between frames
     -Q <precision>: force shader precision to low, medium or high
     -d: dump each frame as PPM
     -D: dump only the last frame as PPM
     -E: disable dithering
     -0 <file.png>: Load "file.png" and bind it to TEXTURE0
     -1 to -7: same as -0 for TEXTUREn
     -v: increase verbosity level
     -q: run quietly

  In case `-t` and `-f` are used in the same command line, the program
will terminate when the first condition is satisfied.

Command line examples:

List builtin shader, sorted by internal id:

    glslsandbox-player -l

List builtin shader, sorted by glslsandbox id:

    glslsandbox-player -l | sort -k2 -n

List the 20 biggest builtin shader:

    glslsandbox-player -l | sort -k5 -r -n | head -20

Render 5000 frames of the shader id 109 in a 128x128 window and report
frame rate every 500 frames:

    glslsandbox-player -W128 -H128 -f5000 -r500 -i109

Renders shader id 123 in a 256x256 window using a 64x64 FBO (reduce
resolution by 4):

    glslsandbox-player -W256 -H256 -i123 -X64 -Y64

Render a frozen animation when time=100:

    glslsandbox-player -S Mountains -w0 -W720 -H480 -s0 -O100
or

    glslsandbox-player -S Mountains -w0 -W720 -H480 -T0 -O100

Render and save a frame of an animation when time=100:

    glslsandbox-player -S Mountains -w0 -W720 -H480 -s0 -O100 -f1 -D

Generate 100 PPM frames of an animation at 20fps, then encode to a video:

    glslsandbox-player -S BouncingBalls -W720 -H480 -w0 -T0.05 -f100 -d
    ffmpeg -r 20 -i BouncingBalls-%05d.ppm BouncingBalls.mp4

Generate the glslsandbox.png image:

    glslsandbox-player -I 26379.3 -W640 -H200 -s0 -f1 -d
    convert GLSLSandbox-00000.ppm glslsandbox.png

Two by two split screen rendering for 30 seconds:

    O="$(date +%s)"
    glslsandbox-player -q -t30 -S MandelZoom2 -W320 -H240 -o "$O" -e -1:-1:1:1 &
    glslsandbox-player -q -t30 -S MandelZoom2 -W320 -H240 -o "$O" -e  0:-1:1:1 &
    glslsandbox-player -q -t30 -S MandelZoom2 -W320 -H240 -o "$O" -e -1:0:1:1  &
    glslsandbox-player -q -t30 -S MandelZoom2 -W320 -H240 -o "$O" -e  0:0:1:1  &

Force fragment shader precision to use `lowp` precision:

    glslsandbox-player -W320 -H240 -Q low -S GPUPrecisionMedium

Force fragment shader precision to use `highp` precision:

    glslsandbox-player -W320 -H240 -Q high -S GPUPrecisionMedium

  Since glslsandbox-player was designed for testing purposes, it will
execute one shader per process execution. This initial design choice
is to easily catch driver crash without interrupting a test sequence
(provided the kernel driver and GPU hardware are able to recover the
crash). A caller script is needed to run all the shaders embedded in
the program. For this purpose, two demo scripts are provided
`scripts/run-demo.sh` and `scripts/run-demo-random.sh`.

  The script `scripts/run-url.sh` is also provided to show how to run
a shader directly from the http://glslsandbox.com/ website that was
not embedded in the binary at compilation time.

  Since glslsandbox-player could use a lot of resources (CPU time or
RAM for shader compilation, or GPU time), it could make the computer
running it unstable. Make sure there is not important application
running in case of a crash. When running glslsandbox-player, it could
be safe to use resources limits. See the `ulimit` bash builtin and the
`timeout` command (see `scripts/run-demo.sh` for an example how to use
those).

  By default, glslsandbox-player renders the selected shader code
directly on the screen. There is options to change this behavior and
render to an off-screen frame buffer object (FBO) instead, then render
this buffer on screen. The main purpose of this feature is to reduce
the shader resolution without actually reducing the displayed
surface. This rendered FBO is textured on the whole window
surface. The FBO usage can be enabled with the `-B` command line
argument, in which case it will be sized to the same size of the
rendering window. The FBO size can be set with the `-X` and `-Y`
command line arguments, which respectively sets its width and
height. By default, the FBO is textured on screen with linear
filtering, which can produce a blurred result. This filter can be
changed to a nearest neighbor using the `-N` command line option.

  By default, glslsandbox-player does not call `eglSwapInterval()` EGL
function. It will default to 1 (as per EGL specification). The `-V`
command line argument will set the swap interval by calling
`eglSwapInterval()`. Some EGL implementation will return a failure if
it cannot be set. If glslsandbox-player is built with strict EGL/GLES
error checking (which is the default), it will abort execution.

  Since the swap internal can be silently clamped or ignored by some
implementations, the `-P` option can be used to virtually slow down
the frame rate be sleeping for some defined time between frame.
Frames will not be synchronized, but this will reduce system load.

  Window position command line arguments (`-x`/`-y`) are passed to the
native windowing system. Not all windowing systems are supporting
window positioning and could be silently ignored. Other windowing
systems may also use those values as a hint and may not exactly honor
the requested values.

  The range and precision for different shader numeric formats is
printed when glslsandbox-player is executed with a verbosity level of
2 (with `-vv` command line argument).  For the details for
interpreting data, refer to the documentation of
`glGetShaderPrecisionFormat()` function:
https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glGetShaderPrecisionFormat.xml

  OpenGL ES implementations may have different fragment shader
precision for floating point values and math functions. Most fragment
shaders uses the `mediump` precision. On desktop GPUs, this medium
precision is usually enough to achieve a good rendering. On the other
hand, on embedded devices, this precision can sometimes be to small
for noise generation function, producing poor rendering. The `-Q`
option can be used to force a different float precision than the one
present in shader code (low, medium or high). This is achieved by
redefining GLSL precision keywords with preprocessor macros. Some
shaders are included to test precision. For example, see:
`GPUPrecisionLow`, `GPUPrecisionMedium`, `GPUPrecisionHigh`,
`SinPrecisionLow`, `SinPrecisionMedium`, `SinPrecisionHigh`.


Additional Features not Present in GLSL Sandbox
-----------------------------------------------

  For testing purposes, a feature for loading PNG textures is added to
glslsandbox-player. This feature is not in the original
http://glslsandbox.com/ site.

  Using the `-0 <file.png>` to `-7 <file.png>` command line option
will load the `file.png` file and bind it to the texture unit
corresponding to the number of the option. Each texture can be
accessed in fragment shaders through the `textureN` sampler2D uniform,
where `N` is the number of the texture.

  Example, for just displaying a PNG image with glslsandbox-player,
use the following fragment shader, the the file `texture.glslf`:

    #ifdef GL_ES
    precision mediump float;
    #endif
    
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D texture0;
    
    void main(void) {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      uv.y = 1.0 - uv.y;
      // Uncomment for a basic texture animation:
      // uv += sin((uv.yx * 4. + time) * 3.1416) * 0.02;
      gl_FragColor = texture2D(texture0, uv);
    }

  Then, to run glslsandbox-player with the command-line:
  
    glslsandbox-player -F texture.glslf -0 image.png

  For now, supported PNG formats are one to four 8-bit channels
(Luminance, Luminance+Alpha, RGB and RGBA). Palette and 16-bit PNG
files are not supported. Use an image converter if an image is in an
unsupported format.

  glslsandbox-player also provide an integer uniform named "frame",
passing the rendered frame number to the shader. This allow one to
have an accurate synchronization with the frame sequence, disregarding
the actual frame rate, frame time, or vertical synchronization with
the display.


Testing the glslsandbox-player program
--------------------------------------

  As glslsandbox-player can be used to stress test an OpenGL ES 2.0
implementation by running shaders, it also include a testsuite to
validate all its options and features.

  In case of a native compilation, use configure command:

    ./configure --enable-testing

  In case of automated build, it's advised to use the shader list
including test shaders only, to reduce the load on
http://glslsandbox.com/ servers. In that case, use the configure
command:

    ./configure --enable-testing --with-shader-list=shader-tests.list

  The test suite can be executed from the build directory, with the
command:

    make check

  For parallel execution of tests, use command:

    make check TESTSUITEFLAGS="-j$(nproc)"

  In order to better test the program itself, and to prevent any
unknown external behaviors from an OpenGL ES 2.0 implementation, the
test suite can be executed into the virtual frame buffer X11 server
(Xvfb). The Mesa 3D software implementation will be used. This can
done with the command:

    xvfb-run --server-args="-screen 0 640x360x24" make check

  When the package is cross-compiled (for embedded devices for
example), it is not possible to execute the test suite directly from
the build directory. The test suite and test data can be installed to
the target file system. In that case, use the configure command:

    ./configure --enable-testing --enable-install-testsuite

  The `make install` command will also install a wrapper script
`glslsandbox-player-testsuite` that will execute the test suite, as
same as the `make check` command for native tests.


Validating Builtin Shaders
--------------------------

  To make sure builtin shaders included in a glslsandbox-player build
are conformant to the GLSL specification, it is possible to add an
extra validation step at configuration time. This step pass the
included shaders into the Khronos Group glslang reference
compiler/validator. See https://github.com/KhronosGroup/glslang

  If the command `glslangValidator` is found in the PATH, this feature
is automatically enabled. If the `glslangValidator` is available, but
the shader validation is not desired, it can be explicitly disabled at
configuration time, with:

    ./configure --disable-shader-validation

  If the `glslangValidator` program is installed to a custom path, or
under some other names, it can be forced with the command:

    ac_cv_path_GLSLANGVALIDATOR=/path/to/customValidator ./configure


Using glslsandbox-player for Automatic Testing
----------------------------------------------

  In addition to the `scripts/run-demo.sh` and
`scripts/run-demo-random.sh` demo scripts which are more for
demonstrating the player, another helper script example is provided in
`scripts/run-tests.sh`. It will use a Makefile to run tests and
collect results, which is more suited for automated testing.

  When called without any argument, it will run all builtin shaders in
the binary, collect the output in a log file, render 3 frames and save
the last one in a PPM file. The computation is not time dependent: it
will render frames for time=3,4,5. Parameters can be adjusted in the
`scripts/tests/Makefile` file. This time invariance will make output
comparison easier. Once all tests are executed, all PPM images are
converted to PNG to save some space using ImageMagick `convert`.

  All the generated output will be stored in the
`scripts/tests/output/` directory by default. For each shader, output
is stored in files the shader name as a base name. Each execution is
marked with a `.done` file whatever the success or failure of the
execution. This is for preventing to retest again all failed tests
when interrupting the execution. In case the execution succeed, a
`.passed` file is created. Otherwise, a `.failed` file is created
containing the error code. Since the execution is made in a `timeout`
command, a return code of `124` means a timeout. Standard output
(stdout and stderr) is saved in the ".log" file. The last frame is
saved as a `.ppm` file. When all shaders are executed, all the PPM
files are converted to `.png`.

  When using the `scripts/run-tests.sh` script, a test execution can
be named to save result in another directory, for comparison.

  For example, it can be useful when modifying an OpenGL ES
implementation. Before change, run:

    ./scripts/run-tests.sh run before-change

  Then make your changes in the GLESv2 library, then run:

    ./scripts/run-tests.sh run after-change

  Those commands will respectively put results in directories:
`./scripts/tests/{before,after}-change/`. Then, output logs can be
compared to check for regressions or unexpected behavior. Then output
PNG images can be compared with the script:

    ./scripts/compare-images.sh \
        ./scripts/tests/before-change/ \
        ./scripts/tests/after-change/ \
        /var/tmp/before-after-compare/

  Those scripts are provided as an example working out of the box
without any fancy dependencies. They will probably need to be adjusted
to specific needs or test framework.


Note about Performance Counting
-------------------------------

  glslsandbox-player can also be used to benchmark a GLESv2 driver and
its corresponding GPU. It will report by default some timings about
setup calls (including shader compilation), then frame rate during
rendering.

  It can also be useful benchmark the shader compiler, or detect
bottlenecks in it. For example shader 25424.0 `MonaLisa` may reveal
long compilation times if compiler is inlining/unrolling too
aggressively. Another example is the shader 4285.0 `Commodore64Heavy`
that could reach a high memory usage at compilation time.

  Some driver implementation may have a big command pipeline,
dedicated thread for command dispatch, command buffers, etc. This may
result to variation of frame rate at the beginning of the rendering
(faster if the driver is accepting command faster while the pipe
buffers are filling, or slower if there is some deferred
initialization).

  In order to give some idea of this special case, glslsandbox-player
renders some "warmup" frames which will not be counted for the average
frame rate estimation. Moreover, the very first frame can also be
special. This is because some GLES drivers could do lazy
initialization. The rendering time of this first frame could be bigger
than the average time of other frames. This is why when warmup frames
are enabled, the rendering time of the first frame is displayed apart.

  By default, there is 3 warmup frames. The number of warmup frames
can be changed with the `-w` command line argument. When warmup frames
are enabled, the `time` uniform is not updated between the first two
frames (i.e. the first frame is rendered twice), in case the rendering
time of the first frame is long (due to some lazy initialization
inside the GLES driver), it will not create a big visual discontinuity
in the animation.

  Finally, at the end of setup, there is always a black frame which is
rendered. This frame will make sure all the setup commands will be
flushed, and the first frame timing will not be mixed with setup
calls.

  In case an accurate time measurement is needed, make sure to check
if computer running glslsandbox-player is doing CPU frequency scaling
and what is the current strategy.

  Moreover for detailed frame analysis, glslsandbox-player can be used
with apitrace (the profiling with GLES is not supported though):

Usage example:

    apitrace trace --api=egl glslsandbox-player -H256 -W256 -i0 -f30

then:

    qapitrace glslsandbox-player.trace

For more details, refer to apitrace documentation:
http://apitrace.github.io/


Notes on X11 Native Windowing
-----------------------------

  By default, the program will start a X11 window with decoration
covering the full screen. The actual window surface will depend on the
window manager (menu bars, etc). The window size can be controlled
with `-W` and `-H` command line arguments. The program can be
terminated with keys `q`, `Q` or `Escape`. The program can also be
close by using the "Close Window" X button in window title bar.

  By default, the window name (title) is "glslsandbox-player". The
name of the window can be changed by setting the `GSP_X11_WIN_NAME`
environment variable. If the variable is set to the empty string "",
window will have an empty title. This is useful to work with X11
programs (`xprop`, `xwininfo`, `wmctrl`, ...) identifying windows with
their name, and there is several instance of the program running.

  The window stacking order can be controlled with the
`GSP_X11_WIN_STACKING` environment variable. If set to `above` the
window will be always on top other windows (which have a default
stacking order). If set to `below`, the window will be below other
windows (this can be useful to put the the program behind other
windows having transparent areas).

  Complete full screen can be requsted by setting `GSP_X11_FULLSCREEN`
environment variable to `1`. If the window manager honor the request,
the window surface will have the same dimension as the screen.

  Mouse cursor can be disabled/hidden by setting `GSP_X11_CURSOR`
environment variable to `0`. When the variable is unset, the standard
cursor is kept in windowed mode, and automatically disabled when
fullscreen is requested. The mouse cursor can be forced to be shown by
setting `GSP_X11_CURSOR` to `1`.

  Window decorations can be disabled by setting `GSP_X11_DECORATION`
environment variable to `0`. Note this function is implemented using
the "_MOTIF_WM_HINTS" X11 window property. The window manager must
respond to that property to actually disable the decoration.


Notes on KMS DRM Native Windowing
---------------------------------

  For building with DRM/KMS support, on Fedora system, package build
dependencies needs to be installed with the command:

    sudo dnf install libdrm-devel mesa-libgbm-devel

  For building, use the configure command:

    ./configure --with-native-gfx=kms

  By default, the program will try to load all DRM drivers, stopping
at the first one that will successfully load.  This behavior can be
changed to try to load only one DRM driver, setting the driver name to
the environment variable `GSP_DRM_DRIVER`.

glslsandbox-player will select, by default, the first connected DRM
connector for display output. In case of multiple display system, this
behavior can be changed by setting the desired connector ID to the
`GSP_DRM_CONN` environment variable (ex: `export GSP_DRM_CONN=42`).
Valid connector IDs can be found with the `modetest` command.

The default CRTC selected is the current one bound to the encoder
connected to the selected connector (see `man drm-kms` for
definitions). If no CRTC is bound, then a suitable one is selected
from the "possible CRTCs" exposed by the DRM driver. A specific CRTC
can be selected by setting the desired CRTC ID to the `GSP_DRM_CRTC`
environment variable.

The default display mode (resolution) is the one marked as "preferred"
by the DRM driver (see `modetest` output). This mode can be changed by
setting the mode name in the `GSP_DRM_MODE` environment variable (ex:
`export GSP_DRM_MODE="640x480"`).


Notes on Emscripten/WebAssembly Native Windowing
------------------------------------------------

glslsandbox-player includes a native windowing for WebAssembly/Wasm to
run into a web browser. See https://webassembly.org/

Wait a minute?! The very purpose of glslsandbox-player _is_ to run
glslsandbox shaders _without_ a web browser or any of its
dependency. So why adding a web browser support?

Well, there is several answers to that: because we can! because it's
fun! because it give closure to extract shaders from the browser then
put it back, because it adds yet another runtime environment in which
this program run shaders. This also gives an example how to write
simple C/C++ OpenGL ES2 code targetting embedded systems AND other
web-based targets.

For testing this native windowing, use the following instructions.


### Step 1: Install the Emscripten SDK ###

Follow instructions from:
https://emscripten.org/docs/getting_started/downloads.html

Typically, this is done with commands:

    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    git pull
    ./emsdk install latest
    ./emsdk activate latest
    source ./emsdk_env.sh
    cd ..

Those commands were tested with Emscripten version 2.0.10.


### Step 2: Compile using the Emscripten SDK ###

Start with standard commands:

    git clone https://github.com/jolivain/glslsandbox-player.git
    cd glslsandbox-player
    autoreconf -vfi

Then, continue with Emscripten specific commands:

    emconfigure ./configure \
        --with-native-gfx=em \
        --without-libpng \
        --with-shader-list=shader-local.list \
        LDFLAGS="-s FULL_ES2=1 --emrun"
    emmake make EXEEXT=.html

Note 1: those commands will only build a simple program with a single
builtin shader. For more complex examples, see notes at the end of
this section.

Note 2: the `FULL_ES2=1` link option is needed for this program to
run. See:
https://emscripten.org/docs/porting/multimedia_and_graphics/OpenGL-support.html#opengl-es-2-0-3-0-emulation


### Step 3: Execute the program in a browser ###

There is several options for executing Emscripten compiled code.


#### Option 1: Using the `emrun` helper tool ####

Emscripten SDK provides the `emrun` helper tool, to emulate command
line program invocations and terminal experience. It automatically
setup a local web server, and start a browser pointing to it. It can
read program command arguments and pass those to the program running
in the browser. It also forward the standard output/error streams of
the program to print messages and the calling console.

Simple invocation example:

    emrun --browser firefox src/glslsandbox-player.html

Example passing arguments to the program:

    emrun --browser chrome src/glslsandbox-player.html -- -W 512 -H 512 -v

Example killing the browser, when program exit is caught:

    emrun --kill_exit --browser firefox src/glslsandbox-player.html -- -f 300

See `emrun --help` and documentation at:
https://emscripten.org/docs/compiling/Running-html-files-with-emrun.html


#### Option 2: Using a local web server ####

Note: for security reasons, browsers are not always allowing direct
file system access for execution of javascript. It's better to go
trough a local network access.

A simple, minimalistic web server can be started with Python:

    python3 -m http.server -d src &

Or with busybox:

    busybox httpd -h src -p 8000

Then, program can be started by launching a browser, with command:

    firefox http://localhost:8000/glslsandbox-player.html &

Command line arguments can be passed in URL parameters:

    firefox 'http://localhost:8000/glslsandbox-player.html?-W&512&-H&512&-vvv' &

Note that argument passing will work only if the program was linked
with the `--emrun` option.


#### Option 3: using a real web server ####

Copy `glslsanbox-player.{html,js,wasm}` files on your web server and
point to it.

    scp \
        src/glslsanbox-player.{html,js,wasm} \
        user@ssh.example.org:/path/to/www/html/dir/

Then access your web server URL, for example:
http://www.example.org/dir/glslsandbox-player.html


### Note on shell template ###

The default Emscripten shell template can be changed by adding a
`--shell-file` option in LDFLAGS. See Emscripten `emcc` documentation
for more details. For example, to use Emscripten `minimal_shell`:

    emconfigure ./configure \
        --with-native-gfx=em \
        --without-libpng \
        --with-shader-list=shader-local.list \
        LDFLAGS="-s FULL_ES2=1 --shell-file html_template/shell_minimal.html"

A fully customized shell can also be created, starting from this
minimal shell distributed with Emscripten:
https://github.com/emscripten-core/emscripten/blob/2.0.10/src/shell_minimal.html
Copy this file in the project, giving it another name (for example in:
`src/my_customized_shell.html`), then add `--shell-file
$PWD/src/my_customized_shell.html` in LDFLAGS.


### Note on memory limits ###

Emscripten is limiting initial program memory to 16M by default. See:
https://github.com/emscripten-core/emscripten/blob/2.0.10/src/settings.js#L152

In order to include more shaders, this limit needs to be inceased. For
example, to increase to 32M:

    emconfigure ./configure \
        --with-native-gfx=em \
        --without-libpng \
        LDFLAGS="-s FULL_ES2=1 -s INITIAL_MEMORY=33554432 --emrun"
    emmake make EXEEXT=.html


### Note on redirecting stderr in browser ###

The default Emscripten shell has a console output in the browser. This
console output shows only `stdout`. The `stderr` is logged in the
browser javascript console (which can generally be displayed when
pressing the F12 key). Since glslsandbox-player print all its messages
on `stderr`, they are not displayed in the main Emscripten console. To
show glslsandbox-player message on the main console, `strerr` can be
redirected to `stdout`, by redefining the `printErr` function to
`print`, using the `--pre-js` option of `emcc`. See:
https://emscripten.org/docs/tools_reference/emcc.html#emcc-pre-js
https://emscripten.org/docs/api_reference/module.html

This can be achieved by adding `--pre-js=$PWD/src/em-pre.js` to
LDFLAGS. For example, with configuration command:

    emconfigure ./configure \
        --with-native-gfx=em \
        --without-libpng \
        LDFLAGS="-s FULL_ES2=1 -s INITIAL_MEMORY=33554432 --pre-js=$PWD/src/em-pre.js --emrun"
    emmake make EXEEXT=.html


Adding a New Native Windowing Library to glslsandbox-player
-----------------------------------------------------------

  The code currently supports five native windowing libraries: X11,
Vivante/libGAL framebuffer, Raspberry Pi DispManX,SDL2 (SDL2 will
support native windowing systems configured at its compilation time)
and KMS (Kernel Mode Setting using libdrm and libgbm). Adding support
to a new native library should not be too hard.

  Create a file for your native window file
(e.g. `src/native_gfx_mynatwin.c`). You could start from an existing
one (for example `native_gfx_vivfb.c` or `native_gfx_x11.c`).

  Declare a `native_gfx_s` structure that will hold all needed data
for the new native system.

  Implement all the functions declared in `src/native_gfx.h`. See this
file content for function documentation.

  Finally, the `configure.ac` file should be adjusted to search for
the new native library, adjust `CFLAGS` and `LDFLAGS` if needed. Your
newly created `native_gfx_mynatwin.c` also need to be added in the
`src/Makefile.am` file.


Notes About Image Comparison
----------------------------

  glslsandbox-player can be used to check non-regression of rendering
of a driver. Command line arguments `-d` and `-D` can be used to dump
reference and test frames as PPM files.

  This section describes several ways to compare frames, and how to track
down image content differences.

  First, PPM files generated with glslsandbox-player does not include
any varying content between different executions (no timestamp, no
random). So if two image content are the same (bit correct), both
generated PPM will also be the same. So files can by compared with
standard tools like `cmp`, `md5sum` and other check-summing tools. For
performing reproducible animation, it's important to take care that
configuration should also be the same (display resolution, color
depth, etc.) and also glslsandbox-player does not rely on unstable
parameters (see `-d`, `-f`, `-T` and `-O` command line arguments).

  For comparing rendered output, there is various ways to track
differences. Standard tools are good starting points (coreutils,
ImageMagick and GraphicsMagick, netpbm-progs, ...)

ImageMagick examples to compare rendering:
http://www.imagemagick.org/Usage/compare/
http://www.imagemagick.org/script/compare.php

GraphicsMagick equivalent:
http://www.graphicsmagick.org/compare.html

Relevant Netpbm programs:
http://netpbm.sourceforge.net/doc/directory.html
http://netpbm.sourceforge.net/doc/pamarith.html
http://netpbm.sourceforge.net/doc/ppmhist.html

For visually comparing two PPM images (`img1.ppm` and `img2.ppm`),
producing the result in `img1-img2-diff.png`:

    compare img1.ppm img2.ppm img1-img2-diff.png

For using the absolute error metric, returning the number of different
pixels:

    compare -metric ae img1.ppm img2.ppm img1-img2-diff.png

For generating the mask of changed pixels, for overlaying in Gimp, for
example:

    compare -compose src -metric ae -lowlight-color none \
            img1.png img2.png PNG32:img1-img2-diff.png

For automatically comparing images, ImageMagick compare returns 0 for
identical images or 1 when they are different:

    compare -metric ae -quiet \
            img1.png img2.png /dev/null 2> /dev/null \
                    && echo SAME || echo different

Raw image content can also be check-summed:

    convert img1.png -depth 8 RGBA: | md5sum

Counting differences with netpbm-progs:

    pnmarith -difference img1.ppm img2.ppm | pnmhist

Using pnmpsnr:

    pnmpsnr img1.ppm img2.ppm


Notes on Distributed Rendering
------------------------------

  Shaders using the `surfacePosition` varying can be rendered on split
screens, using the `-e` option (see examples). Since the animation is
computed from the local clock time, such shaders can be rendered on
remotes computers, provided their clock are properly synchronized
(using ntp or ptp for example). Note that accurate clock
synchronization is usually better on wired network (compared to
wireless networks) since they have smaller jitter. This can be used
to build screen walls.

  In order to properly synchronize the rendering, an accurate time
origin needs to be set on all renderers. This can be done with `-o`
command line argument. This option take a `timespec` time, which the
number of second since 1970-01-01 00:00:00 UTC, and optionally a the
number of nanosecond. The current time can be shown in that format
with the command `date +%s` for one-second resolution, or `date
+%s.%N` for a nano-second resolution.

  Distributing this time origin to slaves can be done for example via
HTTP, using the following simple shell scripts and Busybox httpd.

  On the master host:

    GLSLSANDBOX_RUN_DIR=/tmp/glslsandbox-master
    mkdir -p "${GLSLSANDBOX_RUN_DIR}"
    date +%s > "${GLSLSANDBOX_RUN_DIR}/origin.txt"
    busybox httpd -p 8080 -h "${GLSLSANDBOX_RUN_DIR}"

  On rendering slaves:

    TIME_ORIGIN="$(wget -q -O - masterhost:8080/origin.txt | grep -m1 -o '[0-9.]*')"
    glslsandbox-player \
        -q -t30 -S MandelZoom2 -W320 -H240 \
        -o "${TIME_ORIGIN}"

  In case security is important (for example, if running on public
networks), consider using SSL/TLS certificates, SSH or any other
system providing security.


Miscellaneous Notes
-------------------

  In case glslsandbox-player crashes, please make sure to properly
identify your environment before reporting bugs. For example, Linux
distributions usually include a specific Mesa release, and the issue
could be already fixed upstream in a development branch. The source
archive include the `scripts/bug-report-info.sh` script to help
gathering some information. There is no sensitive information in
gathered data, but it's recommended to the user to review information
before sending it. Moreover, the output of glslsandbox-player
triggering the issue in verbose mode (`-v` command line argument)
could be helpful.

  An easy way to chase down a shader compiler issue is to get the
shader code generating the error (either with the `-p` command line
argument, using the `dl-shader` script or directly from the
glslsandbox.com website), then to modify it a bit (commenting parts,
rewriting differently, ...) then reload the modified code with the
`-F` command line argument to see what changed. You can also use the
`-T` and `-d` command line arguments to generate images for comparing the
results.

  In case an issue is encountered with Mesa, a software rendering
backend should be attempted, by setting the environment variable
`LIBGL_ALWAYS_SOFTWARE=1` alone or with `GALLIUM_DRIVER=swrast` (in
last chance). Refer to the Mesa documentation for details.

  User should be careful when using virtual machines. Various GPU can
be emulated and could result to a non working configuration. For
example, running a Ubuntu 12.04.5 LTS guest in a qemu-kvm emulating a
Cirrus (which is the default on qemu-kvm 2.1.3) will result in a white
window. Emulating a 'vmware' will workaround the issue (i.e. `qemu-kvm
-vga vmware`).

  Thanks to Sébastien Fagard and Vincent Stehlé for all their
suggestions and interesting discussions. Thanks to Marouen Ghodhbane
for the initial Wayland EGL support. Thanks to Petr Cach and Santiago
Mejia for the QNX support. Finally, many, many thanks to all
http://glslsandbox.com/ authors and all its contributors.

  This glslsandbox-player code is distributed under the 2-Clause BSD
License. See the LICENSE file for details.

Julien Olivain <ju.o@free.fr>
