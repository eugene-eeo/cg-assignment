function texture(url, configs) {
    var tex = gl.createTexture();
    tex.image = new Image();
    tex.image.onload = function() {
        for (var i = 0; i < configs.length; i++) {
            var obj = configs[i][0];
            var fn  = configs[i][1];
            obj.texture_data = tex;
            fn(obj);
        }
    };
    tex.image.src = url;
}
