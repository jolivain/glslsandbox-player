// Emscripten: redefine 'printErr' as 'print'
// This will show glslsandbox-player messages directly in the browser
// window. See README.md and
// https://emscripten.org/docs/api_reference/module.html
Module['printErr'] = Module['print'];
