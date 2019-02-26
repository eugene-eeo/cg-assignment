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

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
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
    viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    var red  = [1, 0, 0];
    var blue = [0, 0, 1];
    var green = [0, 1, 0];
    var d = unit_cube({
        front: red,
        right: red,
        up:    red,
        left:  red,
        down:  red,
        back:  red,
    });
    d.transform(function(modelMatrix) {
        modelMatrix.rotate(20, 1, 0, 0); // Rotate along x
        modelMatrix.rotate(50, 0, 1, 0); // Rotate along y
        modelMatrix.rotate(25, 0, 0, 1); // Rotate along z
        modelMatrix.translate(-1, 0, 0);
    });

    var d2 = unit_cube({
        front: blue,
        right: blue,
        up:    blue,
        left:  blue,
        down:  blue,
        back:  blue,
    });
    d2.transform(function(modelMatrix) {
        modelMatrix.rotate(20, 1, 0, 0); // Rotate along x
        modelMatrix.rotate(50, 0, 1, 0); // Rotate along y
        modelMatrix.rotate(25, 0, 0, 1); // Rotate along z
        modelMatrix.translate(1, 0, 0);
    });

    var d3 = unit_cube({
        front: green,
        right: green,
        up:    green,
        left:  green,
        down:  green,
        back:  green,
    });
    d3.transform(function(modelMatrix) {
        modelMatrix.rotate(20, 1, 0, 0); // Rotate along x
        modelMatrix.rotate(50, 0, 1, 0); // Rotate along y
        modelMatrix.rotate(25, 0, 0, 1); // Rotate along z
        modelMatrix.translate(3, 0, 0);
    });

    var prism = unit_prism({
        front: [1, 1, 0],
        back:  [1, 1, 0],
        slope: [1, 1, 0],
        base:  [1, 1, 0],
        side:  [1, 1, 0],
    });
    prism.transform(function(mm) {
        mm.rotate(20,  1, 0, 0); // Rotate along x
        mm.rotate(50, 0, 1, 0); // Rotate along y
        mm.rotate(25, 0, 0, 1); // Rotate along z
        mm.rotate(90, 0, 1, 0); // Rotate along y
        mm.translate(-1, 1, 0);
        mm.translate(0, 0, 1);
        mm.scale(2, 1, 3);
        //mm.scale(0, 1, 0);
    });

    d.draw(gl);
    d2.draw(gl);
    d3.draw(gl);
    prism.draw(gl);
}
