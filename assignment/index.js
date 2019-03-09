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

function draw_car(gl) {
    var root = new drawableTree();
    var body = root.add(unit_cube([1, 0, 0]));
    var door1 = body.add(unit_cube([0.5, 0, 0]));
    var door2 = body.add(unit_cube([0.5, 0, 0]));
    var front_wheels = body.add(new drawableTree());
    var back_wheels  = body.add(new drawableTree());
    var wheel1 = front_wheels.add(draw_n_prism(15, [0, 1, 0]));
    var wheel2 = front_wheels.add(draw_n_prism(15, [0, 1, 0]));
    var wheel3 = back_wheels.add(draw_n_prism(15, [0, 1, 0]));
    var wheel4 = back_wheels.add(draw_n_prism(15, [0, 1, 0]));

    body.transform(mm => {
        mm.translate(0, -1.5, 0);
        mm.scale(2, 0.8, 5);
    });

    body.grouped(mm => {
        mm.translate(0, -0.75, 20);
        mm.scale(0.75, 0.75, 0.75);
        mm.rotate(90, 0, 1, 0);
    });

    door1.transform(mm => {
        mm.translate(-2, -1.5, 0);
        mm.scale(0.125, 0.8, 1);
    });

    door2.transform(mm => {
        mm.translate(2, -1.5, 0);
        mm.scale(0.125, 0.8, 1);
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
        mm.translate(0, 0.55 - 0.5, +0);
        mm.scale(2, 0.75, 1.5);
    });

    window_front.transform(mm => {
        mm.translate(0, -0.2 - 0.5, +1.5);
        mm.scale(2, 1.5, 1.5);
        mm.rotate(-90, 0, 1, 0);
    });

    window_back.transform(mm => {
        mm.translate(0, -0.2 - 0.5, -1.5);
        mm.scale(2, 1.5, 1.5);
        mm.rotate(90, 0, 1, 0);
    });

    g_drawables.push(root);

    var t = 0;
    var t_step = 0.01;
    setInterval(function() {
        t += t_step;
        if (t >= 1.0 || t <= 0.0) {
            t_step = -t_step;
        }

        root.grouped(m => {
            if (t > 0.25) {
                m.translate(0, 0, lerp(0, 25, (t - 0.25) / 0.75));
            }
            m.translate(8, 0, -4);
            m.rotate(90, 0, 1, 0);
        });

        door1.transform(mm => {
            if (t <= 0.25) {
                var angle = lerp(90, 0, t / 0.25);
                var dz = Math.sin(deg2rad(angle));
                var dx = 0.5 * Math.sin(deg2rad(angle));
                mm.translate(-2 - dx, -1.5, 0 - dz);
                mm.rotate(-angle, 0, 1, 0);
                mm.scale(0.125, 0.8, 1);
            } else {
                mm.translate(-2, -1.5, 0);
                mm.scale(0.125, 0.8, 1);
            }
        });

        front_wheels.grouped(m => {
            m.translate(0, -2, 2.5);
            // stationary
            if (t <= 0.25) {
            } else {
                // spin
                m.rotate(lerp(0, -360, t), 1, 0, 0);
            }
        });
        back_wheels.grouped(m => {
            m.translate(0, -2, -2.5);
            // stationary
            if (t <= 0.25) {
            } else {
                // spin
                m.rotate(lerp(0, -360, t), 1, 0, 0);
            }
        });
        draw(gl);
    }, 100);
}

function lerp(y0, y1, t) {
    return y0*(1-t) + y1*(t);
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

    var glass = unit_cube([0, 0, 0]).transform(mm => {
        mm.scale(11.5, 2.20, 13.5);
        mm.translate(0.205, 1.5, -0.35);
    });

    var entrance_roof = unit_cube([0.25, 0.25, 0.25]).transform(mm => {
        mm.translate(2.5, 1.25, 10);
        mm.scale(2.86, 0.25, 3.50);
    });

    var entrance_glass = unit_cube([0, 0, 0]).transform(mm => {
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

    var entrance_door_left = unit_cube([0.2, 0.2, 0.2]);
    entrance_door_left.transform(mm => {
        mm.translate(1.5, -1, 12.625);
        mm.scale(1, 2, 0.125);
    });

    var entrance_door_right = unit_cube([0.2, 0.2, 0.2]);
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

        entrance_door_left.transform(mm => {
            mm.translate(1.5 - dx, -1, 12.625 + dz);
            mm.rotate(-door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });
        entrance_door_right.transform(mm => {
            mm.translate(4 - 0.5 + dx, -1, 12.625 + dz);
            mm.rotate(door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });
        draw(gl);
    }, 100);

    var road = unit_cube([1, 1, 1]);
    road.transform(mm => {
        mm.translate(10 + 5, -3 -0.125 - 0.0625, 0);
        mm.scale(20, 0.125, 25);
    });
    var RoadTexture = gl.createTexture();
    RoadTexture.image = new Image();
    RoadTexture.image.onload = function() {
        road.texture_data = RoadTexture;
        road.texture_coords = new Float32Array([
            5.0, 5.0,    0.0, 5.0,   0.0, 0.0,   5.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 5.0,    0.0, 0.0,   5.0, 0.0,   5.0, 5.0,  // v0-v3-v4-v5 right
            5.0, 0.0,    5.0, 5.0,   0.0, 5.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            5.0, 5.0,    0.0, 5.0,   0.0, 0.0,   5.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    5.0, 0.0,   5.0, 5.0,   0.0, 5.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    5.0, 0.0,   5.0, 5.0,   0.0, 5.0   // v4-v7-v6-v5 back
        ]);
        road.setup_texture_gl = (gl) => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        draw(gl);
    };
    RoadTexture.image.src = 'resources/road.jpg';

    var pavement = unit_cube([1, 1, 1]);
    pavement.transform(mm => {
        mm.translate(5 + 5, -3, -5);
        mm.scale(15, 0.0625, 20);
    });
    var PavementTexture = gl.createTexture();
    PavementTexture.image = new Image();
    PavementTexture.image.onload = function() {
        pavement.texture_data = PavementTexture;
        pavement.texture_coords = new Float32Array([
            4.0, 4.0,    0.0, 4.0,   0.0, 0.0,   4.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 4.0,    0.0, 0.0,   4.0, 0.0,   4.0, 4.0,  // v0-v3-v4-v5 right
            4.0, 0.0,    4.0, 4.0,   0.0, 4.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            4.0, 4.0,    0.0, 4.0,   0.0, 0.0,   4.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    4.0, 0.0,   4.0, 4.0,   0.0, 4.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    4.0, 0.0,   4.0, 4.0,   0.0, 4.0   // v4-v7-v6-v5 back
        ]);
        pavement.setup_texture_gl = (gl) => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        draw(gl);
    };
    PavementTexture.image.src = 'resources/pavement.jpg';

    var GlassTexture = gl.createTexture();
    GlassTexture.image = new Image();
    GlassTexture.image.onload = function() {
        glass.texture_data = GlassTexture;
        glass.texture_coords = new Float32Array([
            6.0, 1.0,    0.0, 1.0,   0.0, 0.0,   6.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   8.0, 0.0,   8.0, 1.0,  // v0-v3-v4-v5 right
            4.0, 0.0,    4.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            8.0, 1.0,    0.0, 1.0,   0.0, 0.0,   8.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    4.0, 0.0,   4.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        glass.setup_texture_gl = (gl) => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        entrance_glass.texture_coords = entrance_door_left.texture_coords = entrance_door_right.texture_coords = new Float32Array([
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
            1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        entrance_glass.texture_data = GlassTexture;
        entrance_door_left.texture_data = GlassTexture;
        entrance_door_right.texture_data = GlassTexture;
        entrance_glass.setup_texture_gl = entrance_door_left.setup_texture_gl = entrance_door_right.setup_texture_gl = (gl) => {
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        draw(gl);
    };
    GlassTexture.image.src = 'resources/glass2.jpg';

    var BrickTexture = gl.createTexture();
    BrickTexture.image = new Image();
    BrickTexture.image.onload = function() {
        base1.texture_data = BrickTexture;
        base2.texture_data = BrickTexture;
        base3.texture_data = BrickTexture;
        ramp_slab.texture_data = BrickTexture;
        ramp_slope.texture_data = BrickTexture;

        ramp_slab.texture_coords = new Float32Array([
            0.125, 0.125,    0.0, 0.125,   0.0, 0.0,   0.125, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.25,    0.0, 0.0,   0.25, 0.0,   0.25, 0.25,  // v0-v3-v4-v5 right
            0.25, 0.0,    0.25, 0.25,   0.0, 0.25,   0.0, 0.0,  // v0-v5-v6-v1 up
            0.25, 0.25,    0.0, 0.25,   0.0, 0.0,   0.25, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    0.25, 0.0,   0.25, 0.25,   0.0, 0.25,  // v7-v4-v3-v2 down
            0.0, 0.0,    0.25, 0.0,   0.25, 0.25,   0.0, 0.25   // v4-v7-v6-v5 back
        ]);

        ramp_slope.texture_coords = new Float32Array([
            0.125, 0.125,    0.0, 0.125,   0.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.25,    0.0, 0.0,   0.25, 0.0,  // v0-v3-v4-v5 right
            0.25, 0.0,    0.25, 0.25,   0.0, 0.25,   0.0, 0.0,  // v0-v5-v6-v1 up
            0.25, 0.25,    0.0, 0.25,   0.0, 0.0,   0.25, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    0.25, 0.0,   0.25, 0.25,   0.0, 0.25,  // v7-v4-v3-v2 down
        ]);

        base1.texture_coords = base2.texture_coords = base3.texture_coords = new Float32Array([
            2.0, 1.0,    0.0, 1.0,   0.0, 0.0,   2.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   4.0, 0.0,   4.0, 1.0,  // v0-v3-v4-v5 right
            4.0, 0.0,    4.0, 2.0,   0.0, 2.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            4.0, 1.0,    0.0, 1.0,   0.0, 0.0,   4.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    4.0, 0.0,   4.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    2.0, 0.0,   2.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);

        var setup_texture_gl = (gl) => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        base1.setup_texture_gl = setup_texture_gl;
        base2.setup_texture_gl = setup_texture_gl;
        base3.setup_texture_gl = setup_texture_gl;
        ramp_slab.setup_texture_gl = setup_texture_gl;
        ramp_slope.setup_texture_gl = setup_texture_gl;
        draw(gl);
    };
    BrickTexture.image.src = 'resources/brick.jpg';

    var wall1 = unit_cube([1, 0, 0]);
    wall1.transform(mm => {
        mm.translate(-5, -2 - 0.0625, 18 - 1);
        mm.scale(0.25, 1, 8);
    });
    var wall2 = unit_cube([1, 0, 0]);
    wall2.transform(mm => {
        mm.translate(-3, -2 - 0.0625, 25 - 0.25);
        mm.scale(2, 1, 0.25);
    });

    var WallTexture = gl.createTexture();
    WallTexture.image = new Image();
    WallTexture.image.onload = function() {
        wall1.texture_data = WallTexture;
        wall2.texture_data = WallTexture;
        wall1.texture_coords = new Float32Array([
            0.25, 0.5,    0.0, 0.5,   0.0, 0.0,   0.25, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.5,    0.0, 0.0,   2.0, 0.0,   2.0, 0.5,  // v0-v3-v4-v5 right
            2.0, 0.0,    2.0, 0.5,   0.0, 0.5,   0.0, 0.0,  // v0-v5-v6-v1 up
            2.0, 0.5,    0.0, 0.5,   0.0, 0.0,   2.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    2.0, 0.0,   2.0, 0.5,   0.0, 0.5,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        wall2.texture_coords = new Float32Array([
            1.0, 0.5,    0.0, 0.5,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.5,    0.0, 0.0,   3.0, 0.0,   3.0, 0.5,  // v0-v3-v4-v5 right
            3.0, 0.0,    3.0, 0.5,   0.0, 0.5,   0.0, 0.0,  // v0-v5-v6-v1 up
            3.0, 0.5,    0.0, 0.5,   0.0, 0.0,   3.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    3.0, 0.0,   3.0, 0.5,   0.0, 0.5,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 0.5,   0.0, 0.5   // v4-v7-v6-v5 back
        ]);

        var setup_texture_gl = (gl) => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        };
        wall1.setup_texture_gl = setup_texture_gl;
        wall2.setup_texture_gl = setup_texture_gl;
        draw(gl);
    };
    WallTexture.image.src = 'resources/wall.jpg';

    g_drawables.push(wall1);
    g_drawables.push(wall2);
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
    g_drawables.push(road);
    g_drawables.push(pavement);
    draw_car(gl);
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
    viewMatrix.setLookAt(10, 0, 60, 0, 0, -100, 0, 1, 0);
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
