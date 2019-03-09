!function() {
    // Create a prism
    //      v4
    //     /| \
    //    / |  \
    //   /  |   \
    //  v0  v5---v3
    //  | \/     /
    //  | /\    /
    //  |/  \  /
    //  v1---v2
    var vertices = new Float32Array([
         0.0, 1.0, 1.0,    0.0, 0.0, 1.0,    1.0, 0.0, 1.0, // v0-v1-v2 front
         0.0, 1.0,-1.0,    0.0, 0.0,-1.0,    1.0, 0.0,-1.0, // v3-v4-v5 back
         0.0, 1.0, 1.0,    1.0, 0.0, 1.0,    1.0, 0.0,-1.0,    0.0, 1.0,-1.0, // v0-v2-v3-v4 slope
         1.0, 0.0, 1.0,    0.0, 0.0, 1.0,    0.0, 0.0,-1.0,    1.0, 0.0,-1.0, // v2-v1-v5-v3 base
         0.0, 1.0, 1.0,    0.0, 1.0,-1.0,    0.0, 0.0,-1.0,    0.0, 0.0, 1.0, // v0-v4-v5-v1 side
    ]);

    // 1/sqrt(2) ~= 0.71
    var normals = new Float32Array([
         0.00, 0.00, 1.00,    0.00, 0.00, 1.00,    0.00, 0.00, 1.00, // v0-v1-v2 front
         0.00, 0.00,-1.00,    0.00, 0.00,-1.00,    0.00, 0.00,-1.00, // v3-v4-v5 back
         0.71, 0.71, 0.00,    0.71, 0.71, 0.00,    0.71, 0.71, 0.00,    0.71, 0.71, 0.00, // v0-v2-v3-v4 slope
         0.00,-1.00, 0.00,    0.00,-1.00, 0.00,    0.00,-1.00, 0.00,    0.00,-1.00, 0.00, // v0-v2-v3-v4 base
        -1.00, 0.00, 0.00,   -1.00, 0.00, 0.00,   -1.00, 0.00, 0.00,   -1.00, 0.00, 0.00, // v0-v4-v5-v1 side
    ]);

    var indices = new Uint8Array([
        0, 1, 2,  // front
        3, 4, 5,  // back
        6, 7, 8,  6, 8, 9, // slope
       10,11,12, 10,12,13, // base
       14,15,16, 14,16,17, // side
    ]);

    window.unit_prism = function(color) {
        var colors = [];
        for (var i = 18; i--;) {
            colors.push(color[0]);
            colors.push(color[1]);
            colors.push(color[2]);
        }
        colors = new Float32Array(colors);
        return new drawable(vertices, colors, normals, indices);
    };
}();
