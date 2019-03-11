!function() {
    var cache = {};
    window.draw_n_prism = function(n, color) {
        if (!cache[n]) {
            cache[n] = n_prism(n);
        }
        var r = cache[n];
        var colors = [];
        for (var i = 0; i < r.vertices.length; i++) {
            colors.push(color[0]);
            colors.push(color[1]);
            colors.push(color[2]);
        }
        colors = new Float32Array(colors);
        return new drawable(r.vertices, colors, r.normals, r.indices);
    }
}();
