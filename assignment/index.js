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

uniform bool u_SecondLightSource;
uniform vec3 u_SecondLightColor;
uniform vec3 u_SecondLightDirection;

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
    vec4 TexColor;
    if (u_UseTextures) {
        TexColor = texture2D(u_Sampler, v_TexCoords);
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
var g_xAngle = 10;
var g_yAngle = -35;
var g_z = 0;
var g_x = 0;
var g_y = 0;
var g_changed = false;

// to be animated
var g_car = null;
var g_car_back_wheels = null;
var g_car_front_wheels = null;
var g_car_door1 = null;
var g_car_boot = null;
var g_entrance_left = null;
var g_entrance_right = null;
var g_animate = () => {};

var ANGLE_STEP = 3.0;

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function random_color() {
    var r = Math.random(),
        g = Math.random(),
        b = Math.random();
    return [r, g, b];
}

function darken(color, f) {
    var r = color[0] * f,
        g = color[1] * f,
        b = color[2] * f;
    return [r, g, b];
}

function draw_car(gl, no_animation) {
    var main_color = random_color();
    var dark = darken(main_color, 0.5);

    var root = new drawableTree();
    var body = root.add(unit_cube(main_color));
    // doors
    var door1 = body.add(unit_cube(dark));
    var door2 = body.add(unit_cube(dark));

    // boot
    var boot = body.add(new drawableTree());
    var boot_roof = boot.add(unit_cube(dark));
    var boot_back = boot.add(unit_cube(dark));

    // wheels
    var front_wheels = body.add(new drawableTree());
    var back_wheels  = body.add(new drawableTree());
    var grey   = [0.2, 0.2, 0.2];
    var silver = [0.8, 0.8, 0.8];

    var headlight1 = body.add(draw_n_prism(10, [1, 1, 0]));
    var headlight2 = body.add(draw_n_prism(10, [1, 1, 0]));

    var plate = body.add(unit_cube(silver));

    var wheel1 = front_wheels.add(new drawableTree());
    var wheel2 = front_wheels.add(new drawableTree());
    var wheel3 = back_wheels.add(new drawableTree());
    var wheel4 = back_wheels.add(new drawableTree());

    var tyre1 = wheel1.add(draw_n_prism(15, grey));
    var tyre2 = wheel2.add(draw_n_prism(15, grey));
    var tyre3 = wheel3.add(draw_n_prism(15, grey));
    var tyre4 = wheel4.add(draw_n_prism(15, grey));
    var rim1  = wheel1.add(draw_n_prism(10, silver));
    var rim2  = wheel2.add(draw_n_prism(10, silver));
    var rim3  = wheel3.add(draw_n_prism(10, silver));
    var rim4  = wheel4.add(draw_n_prism(10, silver));

    var side_mirror1 = body.add(draw_n_prism(3, dark));
    var side_mirror2 = body.add(draw_n_prism(3, dark));

    var top = body.add(new drawableTree());
    var window_front = top.add(unit_prism([0.5, 0.5, 1]));
    var window_mid   = top.add(unit_cube([0.5, 0.5, 1]));
    var window_back  = top.add(unit_prism([0.5, 0.5, 1]));

    body.transform(mm => {
        mm.translate(0, -1.5, 0);
        mm.scale(2, 0.8, 5);
    });

    body.grouped(mm => {
        mm.translate(0, no_animation ? -1 + 0.125 : -1, 20);
        mm.scale(0.7, 0.7, 0.7);
        mm.rotate(90, 0, 1, 0);
    });

    side_mirror2.transform(mm => {
        mm.translate(-2, -0.5, -1);
        mm.scale(0.25, 0.5, 0.5);
        mm.rotate(90, 0, 1, 0);
    });

    side_mirror1.transform(mm => {
        mm.translate(2, -0.5, -1);
        mm.scale(0.25, 0.5, 0.5);
        mm.rotate(90, 0, 1, 0);
    });

    plate.transform(mm => {
        mm.translate(0, -1.75, -5);
        mm.scale(1.0, 0.25, 0.125);
    });

    boot_roof.transform(mm => {
        mm.translate(0, -0.5 - 0.125, +4 + 0.125);
        mm.scale(1.8, 0.125, 1.125);
    });

    boot_back.transform(mm => {
        mm.translate(0, -1.125, +5 + 0.125);
        mm.scale(1.8, 0.6, 0.125);
    });

    headlight1.transform(mm => {
        mm.translate(1.5, -1.25, -5);
        mm.scale(0.25, 0.25, 0.125);
    });

    headlight2.transform(mm => {
        mm.translate(-1.5, -1.25, -5);
        mm.scale(0.25, 0.25, 0.125);
    });

    door1.transform(mm => {
        mm.translate(-2, -1.5, 0);
        mm.scale(0.125, 0.8, 1);
    });

    door2.transform(mm => {
        mm.translate(2, -1.5, 0);
        mm.scale(0.125, 0.8, 1);
    });

    rim1.transform(mm => {
        mm.translate(1.925, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.5, 0.5, 0.35);
    });

    rim2.transform(mm => {
        mm.translate(-1.925, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.5, 0.5, 0.35);
    });

    rim3.transform(mm => {
        mm.translate(1.925, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.5, 0.5, 0.35);
    });

    rim4.transform(mm => {
        mm.translate(-1.925, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.5, 0.5, 0.35);
    });

    tyre1.transform(mm => {
        mm.translate(1.8, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    tyre2.transform(mm => {
        mm.translate(-1.8, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    tyre3.transform(mm => {
        mm.translate(1.8, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    tyre4.transform(mm => {
        mm.translate(-1.8, 0, 0);
        mm.rotate(90, 0, 1, 0);
        mm.scale(1, 1, 0.35);
    });

    window_mid.transform(mm => {
        mm.translate(0, 0.05, +0);
        mm.scale(1.8, 0.75, 1.5);
    });

    window_front.transform(mm => {
        mm.translate(0, -0.2 - 0.5, +1.5);
        mm.scale(1.8, 1.5, 1.5);
        mm.rotate(-90, 0, 1, 0);
    });

    window_back.transform(mm => {
        mm.translate(0, -0.2 - 0.5, -1.5);
        mm.scale(1.8, 1.5, 1.5);
        mm.rotate(90, 0, 1, 0);
    });

    front_wheels.grouped(m => m.translate(0, -2, 2.5));
    back_wheels.grouped(m => m.translate(0, -2, -2.5));

    g_drawables.push(root);

    if (no_animation)
        return root;

    root.grouped(m => {
        m.translate(8, 0, -4);
        m.rotate(90, 0, 1, 0);
    });
    g_car = root;
    g_car_boot = boot;
    g_car_back_wheels = back_wheels;
    g_car_front_wheels = front_wheels;
    g_car_door1 = door1;
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

    var alarm = draw_n_prism(6, [0.976, 0.741, 0.176]).transform(mm => {
        mm.translate(14, 2, 10.125);
        mm.scale(0.35, 0.35, 0.125);
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

    var railing1 = unit_cube([0.8, 0.8, 0.8]);
    var railing2 = unit_cube([0.8, 0.8, 0.8]);
    var railing3 = unit_cube([0.8, 0.8, 0.8]);
    var railing4 = unit_cube([0.8, 0.8, 0.8]);
    var railing5 = unit_cube([0.8, 0.8, 0.8]);
    var railing6 = unit_cube([0.8, 0.8, 0.8]);
    var railing7 = unit_cube([0.8, 0.8, 0.8]);
    var railing8 = unit_cube([0.8, 0.8, 0.8]);
    var railing9 = unit_cube([0.8, 0.8, 0.8]);

    var railing10 = unit_cube([0.8, 0.8, 0.8]);
    var railing11 = unit_cube([0.8, 0.8, 0.8]);
    var railing12 = unit_cube([0.8, 0.8, 0.8]);
    var railing13 = unit_cube([0.8, 0.8, 0.8]);
    var railing14 = unit_cube([0.8, 0.8, 0.8]);
    var railing15 = unit_cube([0.8, 0.8, 0.8]);
    var railing16 = unit_cube([0.8, 0.8, 0.8]);

    railing1.transform(mm => {
        mm.translate(8 - 0.0625, -1, 11);
        mm.scale(0.0625, 0.0625, 1);
    });
    railing2.transform(mm => {
        mm.translate(9 + 0.0625 * 2, -1, 12);
        mm.scale(1.25, 0.0625, 0.0625);
    });
    railing3.transform(mm => {
        mm.translate(12.125 + 0.0625 * 2, -1.5, 12);
        mm.rotate(-15, 0, 0, 1);
        mm.scale(2, 0.0625, 0.0625);
    });
    railing4.transform(mm => {
        mm.translate(8 - 0.05, -1 -0.35, 11);
        mm.scale(0.05, 0.05, 1);
    });
    railing5.transform(mm => {
        mm.translate(9 + 0.05 * 2, -1 -0.35, 12);
        mm.scale(1.25, 0.05, 0.05);
    });
    railing6.transform(mm => {
        mm.translate(12.125 + 0.05 * 2, -1.5 - 0.35, 12);
        mm.rotate(-15, 0, 0, 1);
        mm.scale(1.95, 0.05, 0.05);
    });
    railing7.transform(mm => {
        mm.translate(8 - 0.05, -1 -0.70, 11);
        mm.scale(0.05, 0.05, 1);
    });
    railing8.transform(mm => {
        mm.translate(9 + 0.05 * 2, -1 -0.70, 12);
        mm.scale(1.25, 0.05, 0.05);
    });
    railing9.transform(mm => {
        mm.translate(12.125 + 0.05 * 2, -1.5 - 0.70, 12);
        mm.rotate(-15, 0, 0, 1);
        mm.scale(1.95, 0.05, 0.05);
    });

    railing10.transform(mm => {
        mm.translate(8, -1 -0.70, 12);
        mm.scale(0.05, 0.75, 0.05);
    });

    railing11.transform(mm => {
        mm.translate(8 + 1, -1 -0.70, 12);
        mm.scale(0.05, 0.75, 0.05);
    });

    railing12.transform(mm => {
        mm.translate(8 + 2, -1 -0.70, 12);
        mm.scale(0.05, 0.75, 0.05);
    });

    railing13.transform(mm => {
        mm.translate(8 + 3, -1 -0.70 - 0.16, 12);
        mm.scale(0.05, 0.75, 0.05);
    });

    railing14.transform(mm => {
        mm.translate(8 + 4, -1 -0.70 - 0.33, 12);
        mm.scale(0.05, 0.65, 0.05);
    });

    railing15.transform(mm => {
        mm.translate(8 + 5, -1 -0.70 - 0.55, 12);
        mm.scale(0.05, 0.6, 0.05);
    });

    railing16.transform(mm => {
        mm.translate(8 + 6, -1 -0.70 - 0.75, 12);
        mm.scale(0.05, 0.50, 0.05);
    });

    g_drawables.push(railing1);
    g_drawables.push(railing2);
    g_drawables.push(railing3);
    g_drawables.push(railing4);
    g_drawables.push(railing5);
    g_drawables.push(railing6);
    g_drawables.push(railing7);
    g_drawables.push(railing8);
    g_drawables.push(railing9);
    g_drawables.push(railing10);
    g_drawables.push(railing11);
    g_drawables.push(railing12);
    g_drawables.push(railing13);
    g_drawables.push(railing14);
    g_drawables.push(railing15);
    g_drawables.push(railing16);

    var wall1_railing1 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing2 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing3 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing4 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing5 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing6 = unit_cube([0.8, 0.8, 0.8]);
    var wall1_railing7 = unit_cube([0.8, 0.8, 0.8]);

    var wall2_railing1 = unit_cube([0.8, 0.8, 0.8]);
    var wall2_railing2 = unit_cube([0.8, 0.8, 0.8]);
    var wall2_railing3 = unit_cube([0.8, 0.8, 0.8]);
    var wall2_railing4 = unit_cube([0.8, 0.8, 0.8]);

    wall1_railing1.transform(mm => {
        mm.translate(-5, -1, 17.5);
        mm.scale(0.0625, 0.0625, 7.5);
    });

    wall1_railing2.transform(mm => {
        mm.translate(-5, -1.5, 17.5);
        mm.scale(0.0625, 0.0625, 7.5);
    });

    wall1_railing3.transform(mm => {
        mm.translate(-5, -1 - 0.5, 13);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall1_railing4.transform(mm => {
        mm.translate(-5, -1 - 0.5, 16);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall1_railing5.transform(mm => {
        mm.translate(-5, -1 - 0.5, 19);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall1_railing6.transform(mm => {
        mm.translate(-5, -1 - 0.5, 22);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall1_railing7.transform(mm => {
        mm.translate(-5, -1 - 0.5, 25 - 0.0625);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall2_railing1.transform(mm => {
        mm.translate(-5 + 2, -1, 25 - 0.0625);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.0625, 0.0625, 2);
    });

    wall2_railing2.transform(mm => {
        mm.translate(-5 + 2, -1.5, 25 - 0.0625);
        mm.rotate(90, 0, 1, 0);
        mm.scale(0.0625, 0.0625, 2);
    });

    wall2_railing3.transform(mm => {
        mm.translate(-5 + 2, -1 - 0.5, 25 - 0.0625);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    wall2_railing4.transform(mm => {
        mm.translate(-5 + 4 - 0.0625, -1 - 0.5, 25 - 0.0625);
        mm.rotate(90, 1, 0, 0);
        mm.scale(0.0625, 0.0625, 0.56);
    });

    g_drawables.push(wall1_railing1);
    g_drawables.push(wall1_railing2);
    g_drawables.push(wall1_railing3);
    g_drawables.push(wall1_railing4);
    g_drawables.push(wall1_railing5);
    g_drawables.push(wall1_railing6);
    g_drawables.push(wall1_railing7);
    g_drawables.push(wall2_railing1);
    g_drawables.push(wall2_railing2);
    g_drawables.push(wall2_railing3);
    g_drawables.push(wall2_railing4);

    var grass = unit_cube([0, 1, 0]);
    grass.transform(mm => {
        mm.translate(10, -2, -24);
        mm.scale(15, 1, 1);
    });

    var GrassTexture = gl.createTexture();
    GrassTexture.image = new Image();
    GrassTexture.image.onload = function() {
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, GrassTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, GrassTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        grass.texture_unit = 5;
        grass.texture_coords = new Float32Array([
            5.0, 1.0,    0.0, 1.0,   0.0, 0.0,   5.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
            5.0, 0.0,    5.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    5.0, 0.0,   5.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        g_changed = true;
    };
    GrassTexture.image.src = 'resources/grass.jpg';

    var road = unit_cube([1, 1, 1]);
    road.transform(mm => {
        mm.translate(10 + 5, -3 -0.125 - 0.0625, 0);
        mm.scale(20, 0.125, 25);
    });
    var RoadTexture = gl.createTexture();
    RoadTexture.image = new Image();
    RoadTexture.image.onload = function() {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, RoadTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, RoadTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        road.texture_unit = 0;
        road.texture_coords = new Float32Array([
            5.0, 5.0,    0.0, 5.0,   0.0, 0.0,   5.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 5.0,    0.0, 0.0,   5.0, 0.0,   5.0, 5.0,  // v0-v3-v4-v5 right
            5.0, 0.0,    5.0, 5.0,   0.0, 5.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            5.0, 5.0,    0.0, 5.0,   0.0, 0.0,   5.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    5.0, 0.0,   5.0, 5.0,   0.0, 5.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    5.0, 0.0,   5.0, 5.0,   0.0, 5.0   // v4-v7-v6-v5 back
        ]);
        g_changed = true;
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
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, PavementTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, PavementTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        // end config
        pavement.texture_unit = 1;
        pavement.texture_coords = new Float32Array([
            4.0, 4.0,    0.0, 4.0,   0.0, 0.0,   4.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 4.0,    0.0, 0.0,   4.0, 0.0,   4.0, 4.0,  // v0-v3-v4-v5 right
            4.0, 0.0,    4.0, 4.0,   0.0, 4.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            4.0, 4.0,    0.0, 4.0,   0.0, 0.0,   4.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    4.0, 0.0,   4.0, 4.0,   0.0, 4.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    4.0, 0.0,   4.0, 4.0,   0.0, 4.0   // v4-v7-v6-v5 back
        ]);
        g_changed = true;
    };
    PavementTexture.image.src = 'resources/pavement.jpg';

    var GlassTexture = gl.createTexture();
    GlassTexture.image = new Image();
    GlassTexture.image.onload = function() {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, GlassTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, GlassTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        // end config
        glass.texture_unit = 2;
        glass.texture_coords = new Float32Array([
            6.0, 1.0,    0.0, 1.0,   0.0, 0.0,   6.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   8.0, 0.0,   8.0, 1.0,  // v0-v3-v4-v5 right
            4.0, 0.0,    4.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            8.0, 1.0,    0.0, 1.0,   0.0, 0.0,   8.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    4.0, 0.0,   4.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        entrance_glass.texture_coords = entrance_door_left.texture_coords = entrance_door_right.texture_coords = new Float32Array([
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
            1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
            0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        entrance_glass.texture_unit = 2;
        entrance_door_left.texture_unit = 2;
        entrance_door_right.texture_unit = 2;
        g_changed = true;
    };
    GlassTexture.image.src = 'resources/glass2.jpg';

    var BrickTexture = gl.createTexture();
    BrickTexture.image = new Image();
    BrickTexture.image.onload = function() {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, BrickTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, BrickTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);

        base1.texture_unit = 3;
        base2.texture_unit = 3;
        base3.texture_unit = 3;
        ramp_slab.texture_unit = 3;
        ramp_slope.texture_unit = 3;

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
        g_changed = true;
    };
    BrickTexture.image.src = 'resources/brick.jpg';

    var wall1 = unit_cube([1, 0, 0]);
    wall1.transform(mm => {
        mm.translate(-5, -2 - 0.0625 - 0.5, 18 - 1);
        mm.scale(0.25, 0.5, 8);
    });
    var wall2 = unit_cube([1, 0, 0]);
    wall2.transform(mm => {
        mm.translate(-3, -2 - 0.0625 - 0.5, 25 - 0.25);
        mm.scale(2, 0.5, 0.25);
    });

    var WallTexture = gl.createTexture();
    WallTexture.image = new Image();
    WallTexture.image.onload = function() {
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, WallTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, WallTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);

        wall1.texture_unit = 4;
        wall2.texture_unit = 4;
        wall1.texture_coords = new Float32Array([
            0.25, 0.25,    0.0, 0.25,   0.0, 0.0,   0.25, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.25,    0.0, 0.0,   2.0, 0.0,   2.0, 0.25,  // v0-v3-v4-v5 right
            0.25, 0.0,    0.25, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 0.25,    0.0, 0.25,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   2.0, 0.25,   0.0, 0.25,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
        ]);
        wall2.texture_coords = new Float32Array([
            1.0, 0.25,    0.0, 0.25,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
            0.0, 0.25,    0.0, 0.0,   1.0, 0.0,   1.0, 0.25,  // v0-v3-v4-v5 right
            0.25, 0.0,    0.25, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
            1.0, 0.25,    0.0, 0.25,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
            0.0, 0.0,    1.0, 0.0,   3.0, 0.25,   0.0, 0.25,  // v7-v4-v3-v2 down
            0.0, 0.0,    6.0, 0.0,   6.0, 0.25,   0.0, 0.25   // v4-v7-v6-v5 back
        ]);
        g_changed = true;
    };
    WallTexture.image.src = 'resources/wall.jpg';

    g_entrance_left = entrance_door_left;
    g_entrance_right = entrance_door_right;

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
    g_drawables.push(grass);
    g_drawables.push(alarm);
    draw_car(gl);
    draw_car(gl, true).grouped(m => m.translate(20, 0, -15));
    draw_car(gl, true).grouped(m => m.translate(20, 0, -20));
    draw_car(gl, true).grouped(m => m.translate(20, 0, -30));
    document.onkeydown = function(ev) {
        keydown(ev, gl);
    };
    mainLoop(gl);
}


function on_animate_clicked() {
    var door_open = true;
    var door_angle = 0;
    var t = 0;

    g_car.grouped(m => {
        if (t > 0.25) {
            m.rotate(lerp(0, -45, (t - 0.25) / 0.75), 0, 1, 0);
        }
        m.translate(8, 0, -4);
        m.rotate(90, 0, 1, 0);
    });

    g_car_boot.grouped(m => {
        if (t <= 0.25) {
            var angle = lerp(90, 0, t / 0.25);
            var l = 4 + 0.125;
            var dx = (l / 2) - (l / 2) * Math.cos(deg2rad(angle));
            var dy = (l / 2) * Math.sin(deg2rad(angle));
            m.translate(0, -1.8*dy, dx);
            m.rotate(-angle, 1, 0, 0);
        }
    });

    g_car_door1.transform(mm => {
        if (t <= 0.25) {
            var angle = lerp(90, 0, t / 0.25);
            var dz = Math.sin(deg2rad(angle));
            var dx = 0.5 * Math.sin(deg2rad(angle));
            mm.translate(-2 - dx, -1.5, 0 - dz);
            mm.rotate(-angle, 0, 1, 0);
        } else {
            mm.translate(-2, -1.5, 0);
        }
        mm.scale(0.125, 0.8, 1);
    });

    g_car_front_wheels.grouped(m => {
        m.translate(0, -2, 2.5);
        if (t > 0.25) {
            m.rotate(lerp(0, -360, (t - 0.25) / 0.75), 1, 0, 0); // wheel spin
        }
    });

    g_car_back_wheels.grouped(m => {
        m.translate(0, -2, -2.5);
        if (t > 0.25) {
            var b = (t - 0.25) / 0.75;
            m.rotate(lerp(0, -30, b), 0, 1, 0);  // wheel direction
            m.rotate(lerp(0, -360, b), 1, 0, 0); // wheel spin
        }
    });

    g_animate = function(dt) {
        t += 0.01 * (dt / 100);
        if (t > 1.0) {
            g_animate = () => {};
        }
        g_car.cached = false;
        g_changed = true;

        if (door_open) {
            door_angle += 2 * (dt / 100);
            if (door_angle >= 90) {
                door_open = false;
                door_angle = 90;
            }
        } else {
            door_angle -= 2 * (dt / 100);
            if (door_angle <= 0) {
                door_open = true;
                door_angle = 0;
            }
        }
        var dz = Math.sin(deg2rad(door_angle));
        var dx = 0.5 * Math.sin(deg2rad(door_angle));

        g_entrance_left.transform(mm => {
            mm.translate(1.5 - dx, -1, 12.625 + dz);
            mm.rotate(-door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });

        g_entrance_right.transform(mm => {
            mm.translate(4 - 0.5 + dx, -1, 12.625 + dz);
            mm.rotate(door_angle, 0, 1, 0);
            mm.scale(1, 2, 0.125);
        });
    };
}


document.getElementById('animate').onclick = on_animate_clicked;


function mainLoop(gl) {
    var t_prev = 0;
    function animate(t) {
        t_prev = t_prev || t;
        g_animate(t - t_prev);
        t_prev = t;
        if (g_changed) {
            g_changed = false;
            draw(gl);
        }
        window.requestAnimationFrame(animate);
    }
    // animate one step first
    g_changed = true;
    animate(0);
}

function keydown(ev, gl) {
    switch (ev.keyCode) {
        case 72:  /* h */ g_x -= 1; break;
        case 74:  /* j */ g_y -= 1; break;
        case 75:  /* k */ g_y += 1; break;
        case 76:  /* l */ g_x += 1; break;
        case 173: /* - */ g_z += 1; break;
        case 61:  /* = */ g_z -= 1; break;
        case 40:  /* Up */   g_xAngle = (g_xAngle + ANGLE_STEP) % 360; break;
        case 38:  /* Down */ g_xAngle = (g_xAngle - ANGLE_STEP) % 360; break;
        case 39: /* Right */ g_yAngle = (g_yAngle + ANGLE_STEP) % 360; break;
        case 37: /* Left */  g_yAngle = (g_yAngle - ANGLE_STEP) % 360; break;
        default: return;
    }
    ev.preventDefault();
    g_changed = true;
}

function draw(gl) {
    // Get the storage locations of u_ModelMatrix, u_ViewMatrix, and u_ProjMatrix
    var u_ViewMatrix     = lookupUniform(gl, 'u_ViewMatrix');
    var u_ProjMatrix     = lookupUniform(gl, 'u_ProjMatrix');
    var u_LightColor     = lookupUniform(gl, 'u_LightColor');
    var u_AmbientLight   = lookupUniform(gl, 'u_AmbientLight');
    var u_LightDirection = lookupUniform(gl, 'u_LightDirection');
    var viewMatrix = new Matrix4();  // The view matrix
    var projMatrix = new Matrix4();  // The projection matrix

    // Set Light color and direction
    gl.uniform3f(u_LightDirection, 10, 5, 80);
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.1, 0.1, 0.1);

    // Calculate the view matrix and the projection matrix
    viewMatrix.setLookAt(10 + g_x, 0 + g_y, 60 + g_z, 0, 0, -100 - g_z, 0, 1, 0);
    viewMatrix.rotate(g_xAngle, 1, 0, 0);
    viewMatrix.rotate(g_yAngle, 0, 1, 0);

    projMatrix.setPerspective(30, g_canvas.width/g_canvas.height, 1, 100);
    // Pass the model, view, and projection matrix to the uniform variable respectively
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    for (var i = 0; i < g_drawables.length; i++)
        g_drawables[i].draw(gl);
}
