!function() {
    function push3(a, x) {
        a.push(x[0]);
        a.push(x[1]);
        a.push(x[2]);
    }

    function n_face(n) {
        // Calculate vertices for an n-sided shape
        // Idea: Project n lines from the origin (equally spaced apart)
        // and find their intersection with a circle of radius 1.
        var theta = (2 * Math.PI) / n;
        var vertices = [];
        for (var i = 0; i < n; i++)
            vertices.push([
                Math.cos(i * theta),
                Math.sin(i * theta),
            ]);
        return vertices;
    }

    function n_normals(n) {
        // Calculate normals for each of the non-trivial faces
        var theta = (2 * Math.PI) / n;
        var half_theta = theta / 2;
        var normals = [];
        for (var i = 0; i < n; i++)
            normals.push([
                Math.cos(half_theta + i * theta),
                Math.sin(half_theta + i * theta),
                0,
            ]);
        return normals;
    }

    function tri_tile(vertices, V, I) {
        // Compute triangle tiling to cover vertices
        var n = vertices.length;
        var o = I.length ? I[I.length-1] + 1 : 0;
        for (var i = 0; i < n; i++)
            push3(V, vertices[i]);
        for (var i = 0; i < n - 2; i++) {
            I.push(o + 0);
            I.push(o + i + 1);
            I.push(o + i + 2);
        }
    }

    function n_prism(n) {
        var face = n_face(n);
        // front and back faces
        var face_front = face.map(x => x.concat([ 1.0]));
        var face_back  = face.map(x => x.concat([-1.0]));

        var V = [];
        var I = [];
        var N = [];

        // tile front and back
        tri_tile(face_front, V, I);
        tri_tile(face_back,  V, I);

        // tile individual faces
        for (var i = 0; i < n; i++) {
            // T_i---T_i+1
            //  |     |
            //  |     |
            // B_i---B_i+1
            var face = [
                face_front[i % n],  face_front[(i+1) % n],
                face_back[(i+1) % n],  face_back[i % n],
            ];
            tri_tile(face, V, I);
        }

        // normals for front and back face
        for (var i = 0; i < n; i++) push3(N, [0, 0, 1.0]);
        for (var i = 0; i < n; i++) push3(N, [0, 0,-1.0]);
        // push 4 normals for each face
        n_normals(n).forEach(normal => {
            for (var i = 0; i < 4; i++)
                push3(N, normal);
        });

        return {
            vertices: new Float32Array(V),
            normals:  new Float32Array(N),
            indices:  new Uint8Array(I),
        };
    }

    window.n_prism = n_prism;
}();
