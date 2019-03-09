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

    var body = new drawableTree(unit_cube([1, 0, 0]));
    var door = body.add(unit_cube([0, 1, 0]));
    var front_wheels = body.add(new drawableTree());
    var back_wheels  = body.add(new drawableTree());
    var wheel1 = front_wheels.add(draw_n_prism(20, [0, 1, 0]));
    var wheel2 = front_wheels.add(draw_n_prism(20, [0, 1, 0]));
    var wheel3 = back_wheels.add(draw_n_prism(20, [0, 1, 0]));
    var wheel4 = back_wheels.add(draw_n_prism(20, [0, 1, 0]));

    body.transform(mm => {
        mm.translate(0, -1, 0);
        mm.scale(2, 0.8, 5);
    });

    body.grouped(mm => {
        mm.scale(3, 3, 3);
    });

    door.transform(mm => {
        mm.translate(2, -1, 0);
        mm.scale(0.25, 0.8, 1);
    });

    wheel1.transform(mm => {
        mm.translate(2, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    wheel2.transform(mm => {
        mm.translate(-2, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    wheel3.transform(mm => {
        mm.translate(2, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    wheel4.transform(mm => {
        mm.translate(-2, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    var top = body.add(new drawableTree());
    var window_front = top.add(unit_prism([0, 0, 1]));
    var window_mid   = top.add(unit_cube([0, 0, 1]));
    var window_back  = top.add(unit_prism([0, 0, 1]));

    window_mid.transform(mm => {
        mm.translate(0, 0.55, +0);
        mm.scale(2, 0.75, 1.5);
    });

    window_front.transform(mm => {
        mm.translate(0, -0.2, +1.5);
        mm.scale(2, 1.5, 1.5);
        mm.rotate(-90, 0, 1, 0);
    });

    window_back.transform(mm => {
        mm.translate(0, -0.2, -1.5);
        mm.scale(2, 1.5, 1.5);
        mm.rotate(90, 0, 1, 0);
    });

    g_drawables.push(body);

    var t = 0;
    var t_step = 0.025;
    setInterval(function() {
        t += t_step;
        if (t >= 1.0 || t <= 0.0) {
            t_step = -t_step;
        }

        var angle = lerp(-30, 30, t);
        front_wheels.grouped(m => {
            m.translate(0, -2, 2.5);
            // direction
            m.rotate(lerp(20, -20, t), 0, 1, 0);
            // spin
            m.rotate(lerp(0, -360, t), 1, 0, 0);
        });
        back_wheels.grouped(m => {
            m.translate(0, -2, -2.5);
            // spin
            m.rotate(lerp(0, -360, t), 1, 0, 0);
        });
        draw(gl);
    }, 100);
    document.onkeydown = function(ev) {
        keydown(ev, gl);
    };
}

function lerp(y0, y1, t) {
    return y0*(1-t) + y1*(t);
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
