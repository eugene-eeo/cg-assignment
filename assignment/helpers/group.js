function drawableTree(d) {
    this.drawable = d || null;
    this.children = [];
    this.f = () => {}; // apply only to our drawable
    this.g = () => {}; // apply to us and our children
    this.cached = false;
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
    apply_transforms: function(matrix, forced) {
        // assumption: we always call draw on the root of
        // the tree, so any uncached transformations will
        // propagate to us
        if (!this.cached) forced = true;
        if (!forced) return;
        var mat = new Matrix4();
        mat.set(matrix);
        this.g(mat);
        if (this.drawable)
            this.drawable.transform(m => {
                m.set(mat);
                this.f(m);
            });
        this.cached = true;
        for (var i = 0; i < this.children.length; i++)
            this.children[i].apply_transforms(mat, forced);
    },
    just_draw: function(gl) {
        // just draw to gl please
        if (this.drawable)
            this.drawable.draw(gl);
        for (var i = 0; i < this.children.length; i++)
            this.children[i].just_draw(gl);
    },
    draw: function(gl) {
        this.apply_transforms(new Matrix4(), false);
        this.just_draw(gl);
    },
};
