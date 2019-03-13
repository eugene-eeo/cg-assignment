function drawableTree(d) {
    this.drawable = d || null;
    this.children = [];
    this.f = () => {}; // apply only to our drawable
    this.g = () => {}; // apply to us and our children
    this.cached = false;
    this.matrix = new Matrix4();
}

drawableTree.prototype = {
    add: function(dt) {
        if (!(dt instanceof drawableTree)) {
            dt = new drawableTree(dt);
        }
        this.children.push(dt);
        return dt;
    },
    transform: function(f) {
        this.f = f;
        this.cached = false;
    },
    grouped: function(g) {
        this.g = g;
        this.cached = false;
    },
    // assumption: we always call draw on the root of
    // the tree, so any uncached transformations will
    // propagate to us. otherwise this function is not
    // correct in general.
    transform_and_draw: function(gl, matrix, forced) {
        if (!this.cached) forced = true;
        if (forced) {
            this.matrix.set(matrix);
            this.g(this.matrix);
            if (this.drawable)
                this.drawable.transform_inplace(m => this.f(m.set(this.matrix)));
            this.cached = true;
        }
        if (this.drawable)
            this.drawable.draw(gl);
        for (var i = 0; i < this.children.length; i++)
            this.children[i].transform_and_draw(gl, this.matrix, forced);
    },
    draw: function(gl) {
        this.transform_and_draw(gl, this.matrix.setIdentity(), false);
    },
};
