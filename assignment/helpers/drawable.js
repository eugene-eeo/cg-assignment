!function() {
    var attrs = {};
    var uniforms = {};

    function lookup(gl, attribute) {
        if (attrs[attribute] === undefined)
            attrs[attribute] = gl.getAttribLocation(gl.program, attribute);
        return attrs[attribute];
    }

    window.lookupUniform = function(gl, u) {
        if (uniforms[u] === undefined)
            uniforms[u] = gl.getUniformLocation(gl.program, u);
        return uniforms[u];
    };

    window.initArrayBuffer = function(gl, attribute, data, num, type) {
        var buffer = gl.createBuffer();
        if (!buffer)
            return false;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        // Assign buffer object to attribute
        var a_attr = lookup(gl, attribute);
        gl.vertexAttribPointer(a_attr, num, type, false, data.BYTES_PER_ELEMENT * num, 0);
        gl.enableVertexAttribArray(a_attr);
        return true;
    }

    window.disableArrayBuffer = function(gl, attribute) {
        gl.disableVertexAttribArray(lookup(gl, attribute));
    }
}();


function drawable(vertices, colors, normals, indices) {
    this.vertices = vertices;
    this.colors   = colors;
    this.normals  = normals;
    this.indices  = indices;
    // textures
    this.texture_data = null;
    this.texture_coords = null;
    this.setup_texture_gl = function() {};
    // cache
    this._modelMatrix  = new Matrix4();
    this._normalMatrix = new Matrix4();
}


drawable.prototype.clone = function(fn) {
    var d = new drawable(this.vertices, this.colors, this.normals, this.indices);
    var mm = new Matrix4(this._modelMatrix);
    d.transform = function(fn) {
        d._modelMatrix.setIdentity();
        d.transform_inplace(m => {
            fn(m);
            m.multiply(mm);
        });
        return d;
    };
    d._modelMatrix  = new Matrix4(mm);
    d._normalMatrix = new Matrix4(this._normalMatrix);
    return d;
};


drawable.prototype.transform = function(fn) {
    this._modelMatrix.setIdentity();
    this.transform_inplace(fn);
    return this;
};


drawable.prototype.transform_inplace = function(fn) {
    fn(this._modelMatrix);
    this._normalMatrix.setInverseOf(this._modelMatrix);
    this._normalMatrix.transpose();
    return this;
};


drawable.prototype.writeToVertexBuffer = function(gl) {
    // texture support
    var u_UseTextures = lookupUniform(gl, 'u_UseTextures');
    if (this.texture_data === null) {
        // need to disable so that previous lookup for a_TexCoords doesn't affect
        // the current one
        disableArrayBuffer(gl, 'a_TexCoords');
        gl.uniform1i(u_UseTextures, false);
    } else {
        // bind texture coordinates
        if (!initArrayBuffer(gl, 'a_TexCoords', this.texture_coords, 2, gl.FLOAT))
            return false;
        // enable textures
        var u_Sampler = lookupUniform(gl, 'u_Sampler');
        // activate texture unit and bind texture object
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture_data);
        // set texture image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.texture_data.image);
        this.setup_texture_gl(gl);
        gl.uniform1i(u_Sampler, 0);
        gl.uniform1i(u_UseTextures, true);
    }
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', this.vertices, 3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Color',    this.colors,   3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Normal',   this.normals,  3, gl.FLOAT)) return false;

    // Write model matrix and normals
    var u_ModelMatrix = lookupUniform(gl, 'u_ModelMatrix');
    var u_NormalMatrix = lookupUniform(gl, 'u_NormalMatrix');

    gl.uniformMatrix4fv(u_ModelMatrix, false, this._modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this._normalMatrix.elements);

    // index buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer)
        return false;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    return true;
};


drawable.prototype.draw = function(gl) {
    this.writeToVertexBuffer(gl);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_BYTE, 0);
};


function bulk_translate(template, translates) {
    return translates.map(function(xyz) {
        var x = xyz[0];
        var y = xyz[1];
        var z = xyz[2];
        return template.clone().transform(m => m.translate(x, y, z));
    });
}
