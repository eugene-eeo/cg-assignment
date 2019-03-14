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
    tf: function(m) {
        this.f(m.set(this.matrix));
    },
    // assumption: we always call draw on the root of
    // the tree, so any uncached transformations will
    // propagate to us.
    transform_and_draw: function(gl, matrix, forced) {
        if (!this.cached) forced = true;
        this.cached = true;
        this.matrix.set(matrix);
        this.g(this.matrix);
        if (this.drawable) {
            if (forced)
                this.drawable.transform_inplace(this.tf.bind(this));
            this.drawable.draw(gl);
        }
        for (var i = 0; i < this.children.length; i++)
            this.children[i].transform_and_draw(gl, this.matrix, forced);
    },
    draw: function(gl) {
        this.matrix.setIdentity();
        this.transform_and_draw(gl, this.matrix, false);
    },
};
