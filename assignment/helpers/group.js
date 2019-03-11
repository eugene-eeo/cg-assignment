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
    invalidate_cache: function() {
        // initially recursive but we need to keep it fast
        var s = [this];
        while (s.length > 0) {
            var d = s.pop();
            d.cached = false;
            for (var i = 0; i < d.children.length; i++)
                s.push(d.children[i]);
        }
    },
    transform: function(f) {
        this.f = f;
        this.invalidate_cache();
    },
    grouped: function(g) {
        this.g = g;
        this.invalidate_cache();
    },
    apply_transforms: function(fns) {
        // if we're cached then don't even bother
        if (this.cached) return;
        this.cached = true;
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
    just_draw: function(gl) {
        // just draw to gl please
        if (this.drawable)
            this.drawable.draw(gl);
        for (var i = 0; i < this.children.length; i++)
            this.children[i].just_draw(gl);
    },
    draw: function(gl) {
        this.apply_transforms([]);
        this.just_draw(gl);
    },
};
