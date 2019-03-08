// Model transformation demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec4 a_Normal;
attribute vec2 a_TexCoords;

uniform mat4 u_NormalMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;

varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;
varying vec2 v_TexCoords;

void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_Position  = vec3(gl_Position);
    v_Normal    = normalize((u_NormalMatrix * a_Normal).xyz);
    v_Color = a_Color;
    v_TexCoords = a_TexCoords;
}
`;

// Fragment shader program
var FSHADER_SOURCE = `
precision mediump float;

uniform bool u_UseTextures;
uniform sampler2D u_Sampler;
uniform vec3 u_LightColor;
uniform vec3 u_AmbientLight;
uniform vec3 u_LightDirection;

varying vec4 v_Color;
varying vec3 v_Position;
varying vec3 v_Normal;
varying vec2 v_TexCoords;

void main() {
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LightDirection - v_Position);
    float nDotL = max(dot(lightDirection, normal), 0.0);
    vec3 diffuse;
    vec3 ambient;
    if (u_UseTextures) {
        vec4 TexColor = texture2D(u_Sampler, v_TexCoords);
        diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;
    } else {
        diffuse = u_LightColor * v_Color.rgb * nDotL;
    }
    ambient = u_AmbientLight * v_Color.rgb;
    gl_FragColor = vec4(diffuse + ambient, v_Color.a);
}
`;

var g_canvas = document.getElementById('webgl');
var g_drawables = [];
var g_xAngle = 0;
var g_yAngle = 0;
var ANGLE_STEP = 3.0;

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/*
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    var cube = unit_cube([1, 0, 0]);
    var Cubetexture = gl.createTexture();
    Cubetexture.image = new Image();
    Cubetexture.image.onload = function() {
        cube.texture_unit = gl.TEXTURE0;
        cube.texture_data = Cubetexture;
        cube.texture_coords = new Float32Array([
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
            1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        draw(gl);
    };
    Cubetexture.image.src = '../resources/sky.jpg';

    g_drawables.push(cube);
    draw(gl);
}
*/

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
        mm.scale(10, 2, 11.8);
    });

    var glass = unit_cube([0, 0, 1]).transform(mm => {
        mm.scale(11.5, 2.20, 13.5);
        mm.translate(0.205, 1.5, -0.35);
    });

    var entrance_roof = unit_cube([0.25, 0.25, 0.25]).transform(mm => {
        mm.translate(2.5, 1.25, 10);
        mm.scale(2.86, 0.25, 3.50);
    });

    var entrance_glass = unit_cube([0, 0, 1]).transform(mm => {
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

    var pillar2_template = unit_cube([0.1, 0.1, 0.1]);
    pillar2_template.transform(mm => {
        mm.scale(0.1, 2, 0.125);
    });

    // Front
    g_drawables = g_drawables.concat(bulk_translate(
        pillar2_template.clone().transform(mm => mm.rotate(30, 1, 0, 0)),
        [
            [5 + -9.8,  4, 10.5],
            [9.8,       4, 10.5],
        ]
    ));

    // Back
    g_drawables = g_drawables.concat(bulk_translate(
        pillar2_template.clone().transform(mm => mm.rotate(-30, 1, 0, 0)),
        [
            [5 + -9.8,  4, -20.0],
            [9.8,       4, -20.0],
        ]
    ));

    // Left side
    g_drawables = g_drawables.concat(bulk_translate(
        pillar2_template.clone().transform(mm => mm.rotate(-15, 0, 0, 1)),
        [
            [15.2,  4, -12.2],
            [15.2,  4, +4.2],
        ]
    ));

    // Right side
    g_drawables = g_drawables.concat(bulk_translate(
        pillar2_template.clone().transform(mm => mm.rotate(+15, 0, 0, 1)),
        [
            [5 + -15.2,  4, -12.2],
            [5 + -15.2,  4, +4.2],
        ]
    ));

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

    var emergency_exit_door = unit_cube([0, 0, 0]);
    emergency_exit_door.transform(mm => {
        mm.translate(9 - 0.30, -1, 10);
        mm.scale(0.70, 1.70, 0.125);
    });

    var entrance_door_left = unit_cube([1, 0, 0]);
    entrance_door_left.transform(mm => {
        mm.translate(1.5, -1, 12.625);
        mm.scale(1, 2, 0.125);
    });

    var entrance_door_right = unit_cube([0, 1, 0]);
    entrance_door_right.transform(mm => {
        mm.translate(4 - 0.5, -1, 12.625);
        mm.scale(1, 2, 0.125);
    });

    var door_angle = 0;
    var door_open  = true;

    setInterval(function() {
        if (door_open) {
            door_angle += 2;
            if (door_angle === 90) {
                door_open = false;
            }
        } else {
            door_angle -= 2;
            if (door_angle === 0) {
                door_open = true;
            }
        }

        var dz = Math.sin(deg2rad(door_angle));
        var dx = 0.5 * Math.sin(deg2rad(door_angle));

        entrance_door_left.transform_inplace(mm => {
            mm.translate(1.5 - dx, -1, 12.625 + dz);
            mm.rotate(-door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });
        entrance_door_right.transform_inplace(mm => {
            mm.translate(4 - 0.5 + dx, -1, 12.625 + dz);
            mm.rotate(door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });
        draw(gl);
    }, 100);

    g_drawables.push(base1);
    g_drawables.push(base2);
    g_drawables.push(base3);
    g_drawables.push(roof);
    g_drawables.push(glass);
    g_drawables.push(entrance_roof);
    g_drawables.push(entrance_glass);
    g_drawables.push(entrance_door_left);
    g_drawables.push(entrance_door_right);
    g_drawables.push(emergency_exit_door);
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
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

    if (!u_ViewMatrix || !u_ProjMatrix || !u_LightColor || !u_LightDirection) { 
        console.log('Failed to get storage locations');
        return;
    }

    var viewMatrix = new Matrix4();  // The view matrix
    var projMatrix = new Matrix4();  // The projection matrix

    // Set Light color and direction
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_LightDirection, 10, 5, 80);
    gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);

    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(0, 0, 60, 0, 0, -100, 0, 1, 0);
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
