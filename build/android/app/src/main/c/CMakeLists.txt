# For more information about using CMake with Android Studio, read the
# documentation: https://d.android.com/studio/projects/add-native-code.html

# Sets the minimum version of CMake required to build the native library.

cmake_minimum_required(VERSION 3.10.2)

# Declares and names the project.

project("glslsandbox_player")

# build native_app_glue as a static lib
# set(${CMAKE_C_FLAGS}, "${CMAKE_C_FLAGS}")
add_library(native_app_glue STATIC
    ${ANDROID_NDK}/sources/android/native_app_glue/android_native_app_glue.c)

add_definitions("-DXEGL_STRICT=1 -DXGLES_STRICT=1")
  
# Export ANativeActivity_onCreate(),
# Refer to: https://github.com/android-ndk/ndk/issues/381.
set(CMAKE_SHARED_LINKER_FLAGS
    "${CMAKE_SHARED_LINKER_FLAGS} -u ANativeActivity_onCreate")

set(SRC_DIR ../../../../../../src)
  
set(GSP_SRCS
${SRC_DIR}/egl_helper.c ${SRC_DIR}/egl_helper.h
${SRC_DIR}/gles_helper.c ${SRC_DIR}/gles_helper.h
${SRC_DIR}/glslsandbox-player.c ${SRC_DIR}/glslsandbox-player.h
${SRC_DIR}/glslsandbox-shaders.c ${SRC_DIR}/glslsandbox-shaders.h
${SRC_DIR}/native_gfx_ndk.c ${SRC_DIR}/native_gfx.h
)

add_library(glslsandbox-player SHARED ${GSP_SRCS})

target_include_directories(glslsandbox-player PRIVATE
    ${ANDROID_NDK}/sources/android/native_app_glue)

# Searches for a specified prebuilt library and stores the path as a
# variable. Because CMake includes system libraries in the search path by
# default, you only need to specify the name of the public NDK library
# you want to add. CMake verifies that the library exists before
# completing its build.

find_library( # Sets the name of the path variable.
              log-lib

              # Specifies the name of the NDK library that
              # you want CMake to locate.
              log )

# add lib dependencies
target_link_libraries(glslsandbox-player
    android
    native_app_glue
    EGL
    GLESv2
    ${log-lib})
