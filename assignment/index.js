// Model transformation demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;

uniform mat4 u_NormalMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;

uniform vec3 u_LightColor;
uniform vec3 u_LightDirection;

varying vec4 v_Color;

void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
    float nDotL = max(dot(normal, u_LightDirection), 0.0);

    vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
    v_Color = vec4(diffuse, a_Color.a);
}
`;

// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;
varying vec4 v_Color;
void main() {
    gl_FragColor = v_Color;
}
`;

var g_canvas = document.getElementById('webgl');
var g_drawables = [];
var g_xAngle = 0;
var g_yAngle = 0;
var ANGLE_STEP = 3.0;

function main() {
    // Get the rendering context for WebGL
    var gl = getWebGLContext(g_canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // Set clear color and enable hidden surface removal
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var brown      = [130/255,110/255,87/255];
    var dark_brown = [107/255, 68/255,58/255];

    var base1 = unit_cube(brown).transform(mm => {
        mm.scale(5, 3, 15);
        mm.translate(2, 0, -0.335);
    });

    var base2 = unit_cube(brown).transform(mm => {
        mm.scale(5, 3, 15);
        mm.translate(-1, 0, -0.335);
    });

    var base3 = unit_cube(brown).transform(mm => {
        mm.scale(5, 2.5, 14);
        mm.translate(-0, -0.2, -0.335);
    });

    var roof = make_frustum([0.1, 0.1, 0.1]).transform(mm => {
        mm.translate(2.5, 5.5, -4);
        mm.scale(10, 2, 13);
    });

    var glass = unit_cube([0, 0, 1]).transform(mm => {
        mm.scale(11.5, 2.20, 13.5);
        mm.translate(0.205, 1.5, -0.35);
    });

    var entrace_roof = unit_cube([0.25, 0.25, 0.25]).transform(mm => {
        mm.translate(2.5, 1.25, 10);
        mm.scale(2.86, 0.25, 3.50);
    });

    var entrace_glass = unit_cube([0, 0, 1]).transform(mm => {
        mm.translate(2.5, -1.0, 10.5);
        mm.scale(2.5, 2.0, 2.15);
    });

    var ramp_slope = unit_prism(brown).transform(mm => {
        mm.translate(10, -3, 11);
        mm.scale(5, 0.75, 1);
    });

    var ramp_slab = unit_cube(brown).transform(mm => {
        mm.translate(9, -2.63, 11);
        mm.scale(1.0, 0.375, 1);
    });

    var pillar_template = unit_cube(dark_brown);
    pillar_template.transform(mm => {
        mm.scale(0.1, 4.45, 0.125);
    });

    g_drawables = g_drawables.concat(bulk_translate(pillar_template, [
        // Front left and right pillars
        [5 + -10,  1.45, 10.1],
        [5 + -9.6, 1.45, 10.1],
        [5 + -5.1, 1.45, 10.1],
        [5 + -5.5, 1.45, 10.1],
        [5.1,      1.45, 10.1],
        [5.5,      1.45, 10.1],
        [10,       1.45, 10.1],
        [9.6,      1.45, 10.1],

        // Back left and right pillars
        [5 + -10,  1.45, -20.1],
        [5 + -9.6, 1.45, -20.1],
        [5 + -5.1, 1.45, -20.1],
        [5 + -5.5, 1.45, -20.1],
        [5.1,      1.45, -20.1],
        [5.5,      1.45, -20.1],
        [10,       1.45, -20.1],
        [9.6,      1.45, -20.1],

        // Right side pillars
        [15.1, 1.45, -12],
        [15.1, 1.45, -12.4],
        [15.1, 1.45, -4],
        [15.1, 1.45, -4.4],
        [15.1, 1.45,  4],
        [15.1, 1.45,  4.4],

        // Left side pillars
        [5 + -15.1, 1.45, -12],
        [5 + -15.1, 1.45, -12.4],
        [5 + -15.1, 1.45, -4],
        [5 + -15.1, 1.45, -4.4],
        [5 + -15.1, 1.45,  4],
        [5 + -15.1, 1.45,  4.4],
    ]));

    g_drawables.push(base1);
    g_drawables.push(base2);
    g_drawables.push(base3);
    g_drawables.push(roof);
    g_drawables.push(glass);
    g_drawables.push(entrace_roof);
    g_drawables.push(entrace_glass);
    g_drawables.push(ramp_slope);
    g_drawables.push(ramp_slab);
    draw(gl);
    document.onkeydown = function(ev) {
        keydown(ev, gl);
    };
}

function keydown(ev, gl) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl);
}

function draw(gl) {
    var width = gl.canvas.clientWidth;
    var height = gl.canvas.clientHeight;
    if (gl.canvas.width != width || gl.canvas.height != height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
    }

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Get the storage locations of u_ModelMatrix, u_ViewMatrix, and u_ProjMatrix
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

    if (!u_ViewMatrix || !u_ProjMatrix || !u_LightColor || !u_LightDirection) { 
        console.log('Failed to get storage locations');
        return;
    }

    var viewMatrix = new Matrix4();  // The view matrix
    var projMatrix = new Matrix4();  // The projection matrix

    // Set Light color and direction
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize();
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(0, 0, 50, 0, 0, -100, 0, 1, 0);
    viewMatrix.rotate(g_xAngle, 1, 0, 0);
    viewMatrix.rotate(g_yAngle, 0, 1, 0);

    projMatrix.setPerspective(30, g_canvas.width/g_canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    g_drawables.forEach(function(d) {
        d.draw(gl);
    });
}
