function draw_n_prism(n, color) {
    var r = n_prism(n);
    var vertices = new Float32Array(r.vertices);
    var normals  = new Float32Array(r.normals);
    var indices  = new Uint8Array(r.indices);
    var colors = [];
    for (var i = 0; i < r.vertices.length; i++) {
        colors.push(color[0]);
        colors.push(color[1]);
        colors.push(color[2]);
    }
    colors = new Float32Array(colors);
    return new drawable(vertices, colors, normals, indices);
}
