function make_frustum(color) {
    // Create a frustum
    //
    // v7---------v4
    // | \       / |
    // |  v6---v5  |      v1----v0
    // |  |     |  |      /      \
    // |  |     |  |    v2--------v3
    // |  v1---v0  |
    // | /       \ |
    // v2---------v3
    var vertices = new Float32Array([
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.5, 0.0, 1.5,   1.5, 0.0, 1.5, // v0-v1-v2-v3
         1.0, 1.0, 1.0,   1.5, 0.0, 1.5,   1.5, 0.0,-1.5,   1.0, 1.0,-1.0, // v0-v3-v4-v5
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.5, 0.0,-1.5,  -1.5, 0.0, 1.5, // v1-v6-v7-v2
        -1.5, 0.0,-1.5,   1.5, 0.0,-1.5,   1.5, 0.0, 1.5,  -1.5, 0.0, 1.5, // v7-v4-v3-v2
         1.5, 0.0,-1.5,  -1.5,-0.0,-1.5,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5
    ]);

    var colors = [];
    for (var i = 24; i--;) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }
    colors = new Float32Array(colors);

    var normals = new Float32Array([ // Normal
        0.00, 0.89, 0.45,   0.00, 0.89, 0.45,   0.00, 0.89, 0.45,   0.00, 0.89, 0.45,  // v0-v1-v2-v3 front
        0.45, 0.89, 0.00,   0.45, 0.89, 0.00,   0.45, 0.89, 0.00,   0.45, 0.89, 0.00,  // v0-v3-v4-v5 right
        0.00, 1.00, 0.00,   0.00, 1.00, 0.00,   0.00, 1.00, 0.00,   0.00, 1.00, 0.00,  // v0-v5-v6-v1 up
       -0.45, 0.89, 0.00,  -0.45, 0.89, 0.00,  -0.45, 0.89, 0.00,  -0.45, 0.89, 0.00,  // v1-v6-v7-v2 left
        0.00,-1.00, 0.00,   0.00,-1.00, 0.00,   0.00,-1.00, 0.00,   0.00,-1.00, 0.00,  // v7-v4-v3-v2 down
        0.00, 0.89,-0.45,   0.00, 0.89,-0.45,   0.00, 0.89,-0.45,   0.00, 0.89,-0.45   // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    return new drawable(vertices, colors, normals, indices);
}