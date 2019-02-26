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
    this.modelMatrix = new Matrix4();
    this.modelMatrix.setIdentity();
    this.g_normalMatrix = new Matrix4();
    // shape data
    this.vertices = vertices;
    this.colors   = colors;
    this.normals  = normals;
    this.indices  = indices;
}

drawable.prototype.transform = function(fn) {
    fn(this.modelMatrix);
};


drawable.prototype.getNumVertices = function() {
    return this.indices.length;
};


drawable.prototype.writeToVertexBuffer = function(gl) {
    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', this.vertices, 3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Color',    this.colors,   3, gl.FLOAT)) return false;
    if (!initArrayBuffer(gl, 'a_Normal',   this.normals,  3, gl.FLOAT)) return false;

    // recalculate the normal transform matrix
    this.g_normalMatrix.setInverseOf(this.modelMatrix);
    this.g_normalMatrix.transpose();

    // Write model matrix and normals
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, this.g_normalMatrix.elements);

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
    gl.drawElements(gl.TRIANGLES, this.getNumVertices(), gl.UNSIGNED_BYTE, 0);
};
