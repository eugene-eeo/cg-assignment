function drawableTree(d) {
    this.drawable = d || null;
    this.children = [];
    this.f = () => {}; // apply only to our drawable
    this.g = () => {}; // apply to us and our children
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
    apply_transforms: function(fns) {
        // put our transformation on the stack
        fns.push(this.g);
        // transform our own drawable first
        if (this.drawable)
            this.drawable.transform(m => {
                for (var i = 0; i < fns.length; i++)
                    fns[i](m);
                this.f(m);
            });
        // transform our children
        for (var i = 0; i < this.children.length; i++)
            this.children[i].apply_transforms(fns);
        // remove our transformation
        fns.pop();
    },
    draw: function(gl, at) {
        // first transform
        if (!at)
            this.apply_transforms([]);
        if (this.drawable)
            this.drawable.draw(gl);
        for (var i = 0; i < this.children.length; i++)
            this.children[i].draw(gl, true);
    },
};
