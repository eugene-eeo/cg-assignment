function initArrayBuffer(gl, attribute, data, num, type) {
    var buffer = gl.createBuffer();
    if (!buffer)
        return false;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign buffer object to attribute
    var a_attr = gl.getAttribLocation(gl.program, attribute);
    if (a_attr < 0)
        return false;
    gl.vertexAttribPointer(a_attr, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attr);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return true;
}


function drawable(vertices, colors, normals, indices) {
    this.vertices = vertices;
    this.colors   = colors;
    this.normals  = normals;
    this.indices  = indices;
    this.transforms = [];
    // cache
    this.cached = false;
    this._modelMatrix  = new Matrix4();
    this._normalMatrix = new Matrix4();
}


drawable.prototype.clone = function(fn) {
    var d = new drawable(this.vertices, this.colors, this.normals, this.indices);
    d.transforms = this.transforms.concat([]);
    return d;
};


drawable.prototype.transform = function(fn) {
    this.transforms.push(fn);
    this.cached = false;
    return this;
};


drawable.prototype.writeToVertexBuffer = function(gl) {
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', this.vertices, 3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Color',    this.colors,   3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Normal',   this.normals,  3, gl.FLOAT)) return false;
    // recalculate if necessary
    if (!this.cached) {
        this._modelMatrix.setIdentity();
        for (var i = this.transforms.length - 1; i >= 0; i--) {
            this.transforms[i](this._modelMatrix);
        }
        // recalculate the normal transform matrix
        this._normalMatrix.setInverseOf(this._modelMatrix);
        this._normalMatrix.transpose();
        this.cached = true;
    }

    // Write model matrix and normals
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    gl.uniformMatrix4fv(u_ModelMatrix, false, this._modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this._normalMatrix.elements);

    // index buffer
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
