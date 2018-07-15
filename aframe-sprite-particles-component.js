// Copyright 2018 harlyq
// License MIT

(function() {

  const TIME_PARAM = 0 // [0].x
  const WORLD_RELATIVE_ID_PARAM = 1 // [0].y
  const RADIAL_PARAM = 2 // [0].z
  const DURATION_PARAM = 3 // [0].w
  const SPAWN_TYPE_PARAM = 4 // [1].x
  const SPAWN_RATE_PARAM = 5 // [1].y
  const SEED_PARAM = 6 // [1].z
  const PARTICLE_COUNT_PARAM = 7 // [1].w
  const PARTICLE_SIZE_PARAM =  8 // [2].x
  const USE_PERSPECTIVE_PARAM = 9 // [2].y
  const DIRECTION_PARAM = 10 // [2].x

  const RANDOM_REPEAT_COUNT = 262144; // random numbers will start repeating after this number of particles

  const degToRad = THREE.Math.degToRad

  // Bring all sub-array elements into a single array e.g. [[1,2],[[3],4],5] => [1,2,3,4,5]
  const flattenDeep = arr1 => arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])

  // Convert a vector range string into an array of elements. def defines the default elements for each vector
  const parseVecRange = (str, def) => {
    let parts = str.split("..").map(a => a.trim().split(" ").map(b => {
      const num = Number(b)
      return isNaN(num) ? undefined : num
    }))
    if (parts.length === 1) parts[1] = parts[0] // if there is no second part then copy the first part
    parts.length = 2
    return flattenDeep( parts.map(a => def.map((x,i) => typeof a[i] === "undefined" ? x : a[i])) )
  }

  // parse a ("," separated) list of vector range elements
  const parseVecRangeArray = (str, def) => {
    return flattenDeep( str.split(",").map(a => parseVecRange(a, def)) )
  }

  // parse a ("," separated) list of color range elements
  const parseColorRangeArray = (str) => {
    return flattenDeep( str.split(",").map(a => { 
      let parts = a.split("..")
      if (parts.length === 1) parts[1] = parts[0] // if there is no second part then copy the first part
      parts.length = 2
      return parts.map(b => new THREE.Color(b.trim())) 
    }) )
  }

  const toLowerCase = x => x.toLowerCase()

  // console.assert(AFRAME.utils.deepEqual(parseVecRange("", [1,2,3]), [1,2,3,1,2,3]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("5", [1,2,3]), [5,2,3,5,2,3]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("5 6", [1,2,3]), [5,6,3,5,6,3]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("5 6 7 8", [1,2,3]), [5,6,7,5,6,7]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("8 9..10", [1,2,3]), [8,9,3,10,2,3]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("..5 6 7", [1,2,3]), [1,2,3,5,6,7]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("2 3 4..5 6 7", [1,2,3]), [2,3,4,5,6,7]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRange("5 6 7..", [1,2,3]), [5,6,7,1,2,3]))

  // console.assert(AFRAME.utils.deepEqual(parseVecRangeArray("5 6 7..,9..10 11 12", [1,2,3]), [5,6,7,1,2,3,9,2,3,10,11,12]))
  // console.assert(AFRAME.utils.deepEqual(parseVecRangeArray("1,2,,,3", [10]), [1,1,2,2,10,10,10,10,3,3]))

  // console.assert(AFRAME.utils.deepEqual(parseColorRangeArray("black..red,blue,,#ff0..#00ffaa").map(a => a.getHexString()), ["000000","ff0000","0000ff","0000ff","ffffff","ffffff","ffff00","00ffaa"]))

  let WHITE_TEXTURE = new THREE.DataTexture(new Uint8Array(3).fill(255), 1, 1, THREE.RGBFormat)
  WHITE_TEXTURE.needsUpdate = true

  const BLENDING_MAP = {
    "none": THREE.NoBlending,
    "normal": THREE.NormalBlending,
    "additive": THREE.AdditiveBlending,
    "subtractive": THREE.SubtractiveBlending,
    "multiply": THREE.MultiplyBlending,
  }

  let uniqueID = 0 // used to make unique IDs for world relative meshes that are registered on the scene

  AFRAME.registerComponent("sprite-particles", {
    schema: {
      enableInEditor: { default: false },
      texture: { type: "map" },
      duration: { default: -1 },
      spawnType: { default: "continuous", oneOf: ["continuous", "burst"], parse: toLowerCase },
      spawnRate: { default: 10 },
      relative: { default: "local", oneOf: ["local", "world"], parse: toLowerCase },
      textureFrame: { type: "vec2", default: {x: 1, y: 1} },
      textureCount: { type: "int", default: 0 },
      textureLoop: { default: 1 },

      lifeTime: { default: "1" },
      position: { default: "0 0 0" },
      velocity: { default: "0 0 0" },
      acceleration: { default: "0 0 0" },
      radialType: { default: "circle", oneOf: ["circle", "sphere"], parse: toLowerCase },
      radialPosition: { default: "0" },
      radialVelocity: { default: "0" },
      radialAcceleration: { default: "0" },
      angularVelocity: { default: "0 0 0" },
      angularAcceleration: { default: "0 0 0" },
      scale: { default: "1" },
      color: { default: "white", parse: toLowerCase },
      rotation: { default: "0" }, // if rotating textureFrames important to have enough space so overlapping parts of frames are blank (circle of sqrt(2) around the center of the frame will be viewable while rotating)
      opacity: { default: "1" },

      direction: { default: "forward", oneOf: ["forward", "backward"] },
      alphaTest: { default: 0 }, 
      fog: { default: false },
      depthWrite: { default: false },
      depthTest: { default: true },
      blending: { default: "normal", oneOf: ["none", "normal", "additive", "subtractive", "multiply"], parse: toLowerCase },
      transparent: { default: true },
      particleSize: { default: 100 },
      usePerspective: { default: true },
      seed: { type: "float", default: -1 },
      overTimeSlots: { type: "int", default: 5 },
      frustumCulled: { default: true },
      editorObject: { default: true },
    },
    multiple: true,
    help: "https://github.com/harlyq/aframe-sprite-particles-component",

    init() {
      this.pauseTick = this.pauseTick.bind(this)
      this.count = 0
      this.overTimeArrayLength = this.data.overTimeSlots*2 + 1 // each slot represents 2 glsl array elements pluse one element for the length info
      this.emitterTime = 0
      this.lifeTime = [1,1]
      this.useTransparent = false
      this.textureFrames = new Float32Array(4) // xy is TextureFrame, z is TextureCount, w is TextureLoop
      this.offset = new Float32Array(4*2).fill(0) // xyz is position, w is radialPosition
      this.velocity = new Float32Array(4*2).fill(0) // xyz is velocity, w is radialVelocity
      this.acceleration = new Float32Array(4*2).fill(0) // xyz is acceleration, w is radialAcceleration
      this.angularVelocity = new Float32Array(4*2).fill(0) // xyz is angularVelocity, w is lifeTime
      this.angularAcceleration = new Float32Array(4*2).fill(0) // xyz is angularAcceleration
      this.colorOverTime = new Float32Array(4*this.overTimeArrayLength).fill(0) // color is xyz and opacity is w
      this.rotationScaleOverTime = new Float32Array(4*this.overTimeArrayLength).fill(0) // xyz is rotation, w is scale
      this.params = new Float32Array(4*3).fill(0) // see _PARAM constants
      this.nextID = 0
      this.nextTime = 0
      this.relative = this.data.relative // cannot be changed at run-time

      this.textureLoader = new THREE.TextureLoader()
    },

    remove() {
      if (this.mesh) {
        this.parentEl.removeObject3D(this.mesh.name)
      } 
    },

    update(oldData) {
      const data = this.data
      
      let boundsDirty = data.particleSize !== oldData.particleSize

      if (data.relative !== this.relative) {
        console.error("sprite-particles 'relative' cannot be changed at run-time")
      }

      if (data.overTimeSlots !== (this.overTimeArrayLength - 1)/2) {
        console.error("sprite-particles 'overTimeSlots' cannot be changed at run-time")
      }

      this.params[PARTICLE_SIZE_PARAM] = data.particleSize
      this.params[USE_PERSPECTIVE_PARAM] = data.usePerspective ? 1 : 0
      this.params[RADIAL_PARAM] = data.radialType === "circle" ? 0 : 1
      this.params[DIRECTION_PARAM] = data.direction === "forward" ? 0 : 1
      this.textureFrames[0] = data.textureFrame.x
      this.textureFrames[1] = data.textureFrame.y
      this.textureFrames[2] = data.textureCount > 0 ? data.textureCount : data.textureFrame.x * data.textureFrame.y
      this.textureFrames[3] = data.textureLoop

      if (this.material) {
        this.material.alphaTest = data.alphaTest
        this.material.depthTest = data.depthTest
        this.material.depthWrite = data.depthWrite
        this.material.blending = BLENDING_MAP[data.blending]
        this.material.fog = data.fog
      }

      if (data.seed !== oldData.seed) {
        this.seed = data.seed
        this.params[SEED_PARAM] = data.seed >= 0 ? data.seed : Math.random()
      }

      if (this.mesh && data.frustumCulled !== oldData.frustumCulled) {
        this.mesh.frustumCulled = data.frustumCulled
      }

      if (data.position !== oldData.position || data.radialPosition !== oldData.radialPosition) {
        this.updateVec4XYZRange(data.position, "offset")
        this.updateVec4WRange(data.radialPosition, [0], "offset")
        boundsDirty = true
      }

      if (data.velocity !== oldData.velocity || data.radialVelocity !== oldData.radialVelocity) {
        this.updateVec4XYZRange(data.velocity, "velocity")
        this.updateVec4WRange(data.radialVelocity, [0], "velocity")
        boundsDirty = true
      }

      if (data.acceleration !== oldData.acceleration || data.radialAcceleration !== oldData.radialAcceleration) {
        this.updateVec4XYZRange(data.acceleration, "acceleration")
        this.updateVec4WRange(data.radialAcceleration, [0], "acceleration")
        boundsDirty = true
      }

      if (data.rotation !== oldData.rotation || data.scale !== oldData.scale) {
        this.updateRotationScaleOverTime()
        boundsDirty = true
      }

      if (data.color !== oldData.color || data.opacity !== oldData.opacity) {
        this.updateColorOverTime()
      }

      if (data.angularVelocity !== oldData.angularVelocity || data.lifeTime !== oldData.lifeTime) {
        this.updateAngularVec4XYZRange(data.angularVelocity, "angularVelocity")
        this.lifeTime = this.updateVec4WRange(data.lifeTime, [1], "angularVelocity")
      }

      if (data.angularAcceleration !== oldData.angularAcceleration) {
        this.updateAngularVec4XYZRange(data.angularAcceleration, "angularAcceleration")
      }

      if (data.duration !== oldData.duration) {
        this.params[DURATION_PARAM] = data.duration
        this.emitterTime = 0 // if the duration is changed then restart the particles
      }

      if (data.spawnType !== oldData.spawnType || data.spawnRate !== oldData.spawnRate || data.lifeTime !== oldData.lifeTime) {
        this.params[SPAWN_TYPE_PARAM] = data.spawnType === "burst" ? 0 : 1
        this.params[SPAWN_RATE_PARAM] = data.spawnRate
        this.count = Math.max(1, this.lifeTime[1]*data.spawnRate)
        this.params[PARTICLE_COUNT_PARAM] = this.count
        this.updateAttributes()
      }

      if (data.enableInEditor !== oldData.enableInEditor) {
        this.enablePauseTick(data.enableInEditor)
      }

      // create the mesh once all of the paramters have been setup
      if (!this.mesh) {
        this.createMesh()
      }

      if (boundsDirty) {
        this.updateBounds() // call after createMesh()
      }

      // call loadTexture() after createMesh() to ensure that the material is available to accept the texture
      if (data.texture !== oldData.texture) {
        this.loadTexture(data.texture)
      }
    },

    tick(time, deltaTime) {
      if (deltaTime > 100) deltaTime = 100 // ignore long pauses
      const dt = deltaTime/1000 // dt is in seconds

      this.emitterTime += dt
      this.params[TIME_PARAM] = this.emitterTime

      this.updateWorldTransform(this.emitterTime) // before we update emitterTime
    },

    pause() {
      this.enablePauseTick(this.data.enableInEditor)
    },

    play() {
      this.enablePauseTick(false)
    },

    enablePauseTick(enable) {
      if (enable) {
        this.pauseRAF = requestAnimationFrame(this.pauseTick)
      } else {
        cancelAnimationFrame(this.pauseRAF)
      }
    },

    pauseTick() {
      this.tick(0, 16) // time is not used
      this.enablePauseTick(true)
    },

    loadTexture(filename) {
      this.textureLoader.load(filename, texture => {
        this.material.uniforms.map.value = texture
      }, 
      undefined,
      err => {
        this.material.uniforms.map.value = WHITE_TEXTURE
      })
    },

    createMesh() {
      const data = this.data

      this.geometry = new THREE.BufferGeometry()

      this.updateAttributes()

      this.material = new THREE.ShaderMaterial({
        uniforms: {
          map: { type: "t", value: WHITE_TEXTURE },
          textureFrames: { value: this.textureFrames },

          params: { value: this.params },
          offset: { value: this.offset },
          velocity: { value: this.velocity },
          acceleration: { value: this.acceleration },
          angularVelocity: { value: this.angularVelocity },
          angularAcceleration: { value: this.angularAcceleration },
          colorOverTime: { value: this.colorOverTime },
          rotationScaleOverTime: { value: this.rotationScaleOverTime },

          emitterColor: { value: new THREE.Vector3(1,1,1) },
          emitterOpacity: { value: 1 },
        },

        fragmentShader: particleFragmentShader,
        vertexShader: particleVertexShader,

        transparent: data.transparent,
        alphaTest: data.alphaTest,
        blending: BLENDING_MAP[data.blending],
        fog: data.fog,
        depthWrite: data.depthWrite,
        depthTest: data.depthTest,
        defines: {
          OVER_TIME_ARRAY_LENGTH: this.overTimeArrayLength,
          RANDOM_REPEAT_COUNT,
          USE_MAP: true,
        }
      })

      if (this.relative === "world") {
        this.material.defines.WORLD_RELATIVE = true
      }

      this.mesh = new THREE.Points(this.geometry, this.material)
      this.mesh.frustumCulled = data.frustumCulled

      this.parentEl = this.relative === "world" ? this.el.sceneEl : this.el
      if (this.relative === "local") {
        this.mesh.name = this.attrName
      } else if (this.el.id) { // world relative with id
        this.mesh.name = this.el.id + "_" + this.attrName
      } else { // world relative, no id
        this.parentEl.spriteParticleshUniqueID = (this.parentEl.spriteParticleshUniqueID || 0) + 1
        this.mesh.name = this.attrName + (this.parentEl.spriteParticleshUniqueID > 1 ? this.parentEl.spriteParticleshUniqueID.toString() : "")
      }
      // console.log(this.mesh.name)

      this.material.name = this.mesh.name
      this.parentEl.setObject3D(this.mesh.name, this.mesh)
    },

    updateColorOverTime() {
      let color = parseColorRangeArray(this.data.color)
      let opacity = parseVecRangeArray(this.data.opacity, [1])

      const maxSlots = this.data.overTimeSlots
      if (color.length > maxSlots*2) color.length = maxSlots*2
      if (opacity.length > maxSlots*2) opacity.length = maxSlots*2

      this.colorOverTime.fill(0)

      // first colorOverTime block contains length information
      // divide by 2 because each array contains min and max values
      this.colorOverTime[0] = color.length/2  // glsl colorOverTime[0].x
      this.colorOverTime[1] = opacity.length/2 // glsl colorOverTime[0].y

      // set k to 4 because the first vec4 of colorOverTime is use for the length params
      let n = color.length
      for (let i = 0, k = 4; i < n; i++, k += 4) {
        let col = color[i]
        this.colorOverTime[k] = col.r // glsl colorOverTime[1..].x
        this.colorOverTime[k+1] = col.g // glsl colorOverTime[1..].y
        this.colorOverTime[k+2] = col.b // glsl colorOverTime[1..].z
      }

      n = opacity.length
      for (let i = 0, k = 4; i < n; i++, k += 4) {
        let alpha = opacity[i]
        this.colorOverTime[k+3] = alpha // glsl colorOverTime[1..].w
        this.useTransparent = this.useTransparent || alpha < 1
      }
    },

    updateRotationScaleOverTime() {
      const maxSlots = this.data.overTimeSlots
      let rotation = parseVecRangeArray(this.data.rotation, [0,0,0])
      let scale = parseVecRangeArray(this.data.scale, [1])


      if (rotation.length/3 > maxSlots*2) rotation.length = maxSlots*2*3 // 3 numbers per rotation, 2 rotations per range
      if (scale.length > maxSlots*2) scale.length = maxSlots*2 // 2 scales per range

      // first vec4 contains the lengths of the rotation and scale vectors
      this.rotationScaleOverTime.fill(0)
      this.rotationScaleOverTime[0] = rotation.length/6
      this.rotationScaleOverTime[1] = scale.length/2

      // set k to 4 because the first vec4 of rotationScaleOverTime is use for the length params
      // update i by 3 becase rotation is 3 numbers per vector, and k by 4 because rotationScaleOverTime is 4 numbers per vector
      let n = rotation.length
      for (let i = 0, k = 4; i < n; i += 3, k += 4) {
        this.rotationScaleOverTime[k] = degToRad(rotation[i]) // glsl rotationScaleOverTime[1..].x
        this.rotationScaleOverTime[k+1] = degToRad(rotation[i+1]) // glsl rotationScaleOverTime[1..].y
        this.rotationScaleOverTime[k+2] = degToRad(rotation[i+2]) // glsl rotationScaleOverTime[1..].z
      }

      n = scale.length
      for (let i = 0, k = 4; i < n; i++, k += 4) {
        this.rotationScaleOverTime[k+3] = scale[i] // glsl rotationScaleOverTime[1..].w
      }
    },

    updateVec4XYZRange(vecData, uniformAttr) {
      const vecRange = parseVecRange(vecData, [0,0,0])
      for (let i = 0, j = 0; i < vecRange.length; ) {
        this[uniformAttr][j++] = vecRange[i++] // x
        this[uniformAttr][j++] = vecRange[i++] // y
        this[uniformAttr][j++] = vecRange[i++] // z
        j++ // skip the w
      }
    },

    updateAngularVec4XYZRange(vecData, uniformAttr) {
      const vecRange = parseVecRange(vecData, [0,0,0])
      for (let i = 0, j = 0; i < vecRange.length; ) {
        this[uniformAttr][j++] = degToRad(vecRange[i++]) // x
        this[uniformAttr][j++] = degToRad(vecRange[i++]) // y
        this[uniformAttr][j++] = degToRad(vecRange[i++]) // z
        j++ // skip the w
      }
    },

    // update just the w component
    updateVec4WRange(floatData, def, uniformAttr) {
      let floatRange = parseVecRange(floatData, def)
      this[uniformAttr][3] = floatRange[0] // floatData value is packed into the 4th part of each vec4
      this[uniformAttr][7] = floatRange[1]

      return floatRange
    },

    updateBounds() {
      const data = this.data
      const maxAge = Math.max(this.lifeTime[0], this.lifeTime[1])
      const STRIDE = 4
      let extent = [new Array(STRIDE), new Array(STRIDE)] // extent[0] = min values, extent[1] = max values

      // Use offset, velocity and acceleration to determine the extents for the particles
      for (let j = 0; j < 2; j++) { // index for extent
        const compare = j === 0 ? Math.min: Math.max

        for (let i = 0; i < STRIDE; i++) { // 0 = x, 1 = y, 2 = z, 3 = radial
          const offset = compare(this.offset[i], this.offset[i + STRIDE])
          const velocity = compare(this.velocity[i], this.velocity[i + STRIDE])
          const acceleration = compare(this.acceleration[i], this.acceleration[i + STRIDE])
  
          // extent at time tmax
          extent[j][i] = offset + (velocity + 0.5 * acceleration * maxAge) * maxAge
  
          // extent at time t0
          extent[j][i] = compare(extent[j][i], offset)
  
          // extent at turning point
          const turningPoint = -velocity/acceleration
          if (turningPoint > 0 && turningPoint < maxAge) {
            extent[j][i] = compare(extent[j][i], offset - 0.5*velocity*velocity/acceleration)
          }
        }
      }

      // apply the radial extents to the XYZ extents
      const maxScale = Math.max(this.rotationScaleOverTime[3], this.rotationScaleOverTime[7])
      const maxRadial = Math.max(Math.abs(extent[0][3]), Math.abs(extent[1][3])) + data.particleSize*0.00045*maxScale
      extent[0][0] -= maxRadial
      extent[0][1] -= maxRadial
      extent[0][2] -= data.radialType === "sphere" ? maxRadial : 0
      extent[1][0] += maxRadial
      extent[1][1] += maxRadial
      extent[1][2] += data.radialType === "sphere" ? maxRadial : 0

      // discard the radial element
      extent[0].length = 3
      extent[0].length = 3

      const maxR = Math.max(...extent[0].map(Math.abs), ...extent[1].map(Math.abs))
      if (!this.geometry.boundingSphere) {
        this.geometry.boundingSphere = new THREE.Sphere()
      }
      this.geometry.boundingSphere.radius = maxR

      // this does not work correctly if there are multiple particles on an entity
      if (data.editorObject) {
        const existingMesh = this.el.getObject3D("mesh")

        if (!existingMesh || existingMesh.isParticlesEditorObject) {
          // Add a box3 that can be used to make the particle clickable in the inspector (does not work for world
          // relative particles), and show a bounding box
          // Provide some min extents 0.25, in case the particle system is very thin
          let box3 = new THREE.Box3(new THREE.Vector3(...extent[0].map(x => Math.min(x,-0.25))), new THREE.Vector3(...extent[1].map(x => Math.max(x, 0.25))))
          let box3Mesh = new THREE.Box3Helper(box3, 0xffff00)
          box3Mesh.visible = false
          box3Mesh.isParticlesEditorObject = true
          this.el.setObject3D("mesh", box3Mesh) // the inspector puts a bounding box around the "mesh" object
        }
      }
    },

    updateAttributes() {
      if (this.geometry) {
        const n = this.count

        let vertexIDs = new Float32Array(n)
        for (let i = 0; i  < n; i++) {
          vertexIDs[i] = i
        }

        this.geometry.addAttribute("vertexID", new THREE.Float32BufferAttribute(vertexIDs, 1)) // gl_VertexID is not supported, so make our own id
        this.geometry.addAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n*3).fill(0), 3))

        if (this.relative === "world") {
          this.geometry.addAttribute("quaternion", new THREE.Float32BufferAttribute(new Float32Array(n*4).fill(0), 4))
        }
      }
    },

    updateWorldTransform: (function() {
      let position = new THREE.Vector3()
      let quaternion = new THREE.Quaternion()
      let scale = new THREE.Vector3()

      return function(emitterTime) {
        const data = this.data

        // for world relative particle the CPU sets the instancePosition and instanceQuaternion
        // of the new particles to the current object3D position/orientation, and tells the GPU
        // the ID of last emitted particle (this.params[WORLD_RELATIVE_ID_PARAM])
        if (this.geometry && this.relative === "world") {
          const spawnRate = this.data.spawnRate
          const isBurst = data.spawnType === "burst"
          const spawnDelta = isBurst ? 0 : 1/spawnRate // for burst particles spawn everything at once

          let particlePosition = this.geometry.getAttribute("position")
          let particleQuaternion = this.geometry.getAttribute("quaternion")
          this.el.object3D.matrixWorld.decompose(position, quaternion, scale)

          this.geometry.boundingSphere.center.copy(position)

          let startID = this.nextID
          let numSpawned = 0
          let id = startID

          // the nextTime represents the startTime for each particle, so while the nextTime
          // is less than this frame's time, keep emitting particles. Note, if the spawnRate is
          // low, we may have to wait several frames before a particle is emitted, but if the 
          // spawnRate is high we will emit several particles per frame
          while (this.nextTime < emitterTime && numSpawned < this.count) {
            id = this.nextID
            particlePosition.setXYZ(id, position.x, position.y, position.z)
            particleQuaternion.setXYZW(id, quaternion.x, quaternion.y, quaternion.z, quaternion.w)

            numSpawned++
            this.nextTime += spawnDelta
            this.nextID = (this.nextID + 1) % this.count // wrap around to 0 if we'd emitted the last particle in our stack
          }

          if (numSpawned > 0) {
            this.params[WORLD_RELATIVE_ID_PARAM] = id

            if (isBurst) { // if we did burst emit, then wait for maxAge before emitting again
              this.nextTime += this.lifeTime[1]
            }

            // if the buffer was wrapped, we cannot send just the end and beginning of a buffer, so submit everything
            if (this.nextID < startID) { 
              startID = 0
              numSpawned = this.count
            }
  
            particlePosition.updateRange.offset = startID
            particlePosition.updateRange.count = numSpawned
            particlePosition.needsUpdate = numSpawned > 0

            particleQuaternion.updateRange.offset = startID
            particleQuaternion.updateRange.count = numSpawned
            particleQuaternion.needsUpdate = numSpawned > 0
          }
        }
      }
    })(),
  })

  // based upon https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/points_vert.glsl
  const particleVertexShader = `
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

attribute float vertexID;

#if defined(WORLD_RELATIVE)
attribute vec4 quaternion;
#endif

uniform vec4 params[3];
uniform vec4 offset[2];
uniform vec4 velocity[2];
uniform vec4 acceleration[2];
uniform vec4 angularVelocity[2];
uniform vec4 angularAcceleration[2];
uniform vec4 colorOverTime[OVER_TIME_ARRAY_LENGTH];
uniform vec4 rotationScaleOverTime[OVER_TIME_ARRAY_LENGTH];
uniform vec4 textureFrames;

varying vec4 vParticleColor;
varying float vAgeRatio;
varying float vRotation;

// each call to random will produce a different result by varying randI
float randI = 0.0;
float random( const float seed )
{
  randI += 0.001;
  return rand( vec2( seed, randI ));
}

vec3 randVec3Range( const vec3 range0, const vec3 range1, const float seed )
{
  vec3 lerps = vec3( random( seed ), random( seed ), random( seed ) );
  return mix( range0, range1, lerps );
}

vec2 randVec2Range( const vec2 range0, const vec2 range1, const float seed )
{
  vec2 lerps = vec2( random( seed ), random( seed ) );
  return mix( range0, range1, lerps );
}

float randFloatRange( const float range0, const float range1, const float seed )
{
  float lerps = random( seed );
  return mix( range0, range1, lerps );
}

// theta.x is the angle in XY, theta.y is the angle in XZ
vec3 radialToVec3( const float r, const vec2 theta )
{
  vec2 cosTheta = cos(theta);
  vec2 sinTheta = sin(theta);
  float rc = r * cosTheta.x;
  float x = rc * cosTheta.y;
  float y = r * sinTheta.x;
  float z = rc * sinTheta.y;
  return vec3( x, y, z );
}

// array lengths are stored in the first slot, followed by actual values from slot 1 onwards
// colors are packed min,max,min,max,min,max,...
// color is packed in xyz and opacity in w, and they may have different length arrays

vec4 calcColorOverTime( const float r, const float seed )
{
  vec3 color = vec3(1.0);
  float opacity = 1.0;
  int colorN = int( colorOverTime[0].x );
  int opacityN = int( colorOverTime[0].y );

  if ( colorN == 1 )
  {
    color = randVec3Range( colorOverTime[1].xyz, colorOverTime[2].xyz, seed );
  }
  else if ( colorN > 1 )
  {
    float ck = r * ( float( colorN ) - 1.0 );
    float ci = floor( ck );
    int i = int( ci )*2 + 1;
    vec3 sColor = randVec3Range( colorOverTime[i].xyz, colorOverTime[i + 1].xyz, seed );
    vec3 eColor = randVec3Range( colorOverTime[i + 2].xyz, colorOverTime[i + 3].xyz, seed );
    color = mix( sColor, eColor, ck - ci );
  }

  if ( opacityN == 1 )
  {
    opacity = randFloatRange( colorOverTime[1].w, colorOverTime[2].w, seed );
  }
  else if ( opacityN > 1 )
  {
    float ok = r * ( float( opacityN ) - 1.0 );
    float oi = floor( ok );
    int j = int( oi )*2 + 1;
    float sOpacity = randFloatRange( colorOverTime[j].w, colorOverTime[j + 1].w, seed );
    float eOpacity = randFloatRange( colorOverTime[j + 2].w, colorOverTime[j + 3].w, seed );
    opacity = mix( sOpacity, eOpacity, ok - oi );
  }

  return vec4( color, opacity );
}

// as per calcColorOverTime but euler rotation is packed in xyz and scale in w

vec4 calcRotationScaleOverTime( const float r, const float seed )
{
  vec3 rotation = vec3(0.);
  float scale = 1.0;
  int rotationN = int( rotationScaleOverTime[0].x );
  int scaleN = int( rotationScaleOverTime[0].y );

  if ( rotationN == 1 )
  {
    rotation = randVec3Range( rotationScaleOverTime[1].xyz, rotationScaleOverTime[2].xyz, seed );
  }
  else if ( rotationN > 1 )
  {
    float rk = r * ( float( rotationN ) - 1.0 );
    float ri = floor( rk );
    int i = int( ri )*2 + 1; // *2 because each range is 2 vectors, and +1 because the first vector is for the length info
    vec3 sRotation = randVec3Range( rotationScaleOverTime[i].xyz, rotationScaleOverTime[i + 1].xyz, seed );
    vec3 eRotation = randVec3Range( rotationScaleOverTime[i + 2].xyz, rotationScaleOverTime[i + 3].xyz, seed );
    rotation = mix( sRotation, eRotation, rk - ri );
  }

  if ( scaleN == 1 )
  {
    scale = randFloatRange( rotationScaleOverTime[1].w, rotationScaleOverTime[2].w, seed );
  }
  else if ( scaleN > 1 )
  {
    float sk = r * ( float( scaleN ) - 1.0 );
    float si = floor( sk );
    int j = int( si )*2 + 1; // *2 because each range is 2 vectors, and +1 because the first vector is for the length info
    float sScale = randFloatRange( rotationScaleOverTime[j].w, rotationScaleOverTime[j + 1].w, seed );
    float eScale = randFloatRange( rotationScaleOverTime[j + 2].w, rotationScaleOverTime[j + 3].w, seed );
    scale = mix( sScale, eScale, sk - si );
  }

  return vec4( rotation, scale );
}

// assumes euler order is YXZ (standard convention for AFrame)
vec4 eulerToQuaternion( const vec3 euler )
{
  // from https://github.com/mrdoob/three.js/blob/master/src/math/Quaternion.js

  vec3 c = cos( euler * 0.5 );
  vec3 s = sin( euler * 0.5 );

  return vec4(
    s.x * c.y * c.z + c.x * s.y * s.z,
    c.x * s.y * c.z - s.x * c.y * s.z,
    c.x * c.y * s.z - s.x * s.y * c.z,
    c.x * c.y * c.z + s.x * s.y * s.z
  );
}

vec3 applyQuaternion( const vec3 v, const vec4 q )
{
  return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

void main() {

  float time = params[0].x;
  float worldRelativeID = params[0].y;
  float radialType = params[0].z;
  float duration = params[0].w;
  float spawnType = params[1].x;
  float spawnRate = params[1].y;
  float baseSeed = params[1].z;
  float vertexCount = params[1].w;
  float maxAge = angularVelocity[1].w; // lifeTime packed into w component of angularVelocity

#if defined(WORLD_RELATIVE)
  // current ID is set from the CPU so we can synchronize the position correctly
  float ID0 = worldRelativeID; 
#else
  float ID0 = floor( mod( time, maxAge ) * spawnRate ); // this will lose precision eventually
#endif

  // particles are either emitted in a burst (spawnType == 0) or spread evenly
  // throughout 0..maxAge.  We calculate the ID of the last spawned particle ID0 
  // for this frame, any vertex IDs after ID0 are assumed to belong to the previous loop

  float loop = floor( time / maxAge ) - spawnType * (vertexID > ID0 ? 1.0 : 0.0);
  float startTime = loop * maxAge + vertexID / spawnRate * spawnType;
  float age = startTime >= 0.0 ? time - startTime : -1.0; // if age is -1 we won't show the particle

  // we use the id as a seed for the randomizer, but because the IDs are fixed in 
  // the range 0..vertexCount we calculate a virtual ID by taking into account
  // the number of loops that have occurred (note, vertexIDs above ID0 are assumed 
  // to be in the previous loop).  We use the modoulo of the RANDOM_REPEAT_COUNT to
  // ensure that the virtualID doesn't exceed the floating point precision

  float virtualID = mod( vertexID + loop * vertexCount, float( RANDOM_REPEAT_COUNT ) );
  float seed = mod(1664525.*virtualID*(baseSeed*110.) + 1013904223., 4294967296.)/4294967296.; // we don't have enough precision in 32-bit float, but results look ok

  float lifeTime = randFloatRange( angularVelocity[0].w, maxAge, seed ); 

  // don't show particles that would be emitted after the duration
  if ( duration > 0.0 && time - age >= duration ) 
  {
    age = -1.0;
  } 
  else
  {
    float direction = params[2].z; // 0 is forward, 1 is backward

    age = age + direction * ( maxAge - 2.0 * age );
  }

  // the vAgeRatio will be used for the lerps on over-time attributes
  vAgeRatio = age/lifeTime;
  vec3 transformed = vec3(0.0);
  float particleScale = 1.0;

  if ( vAgeRatio >= 0.0 && vAgeRatio < 1.0 )
  {
    vec2 radialDir = vec2( 1.0, radialType );

    vec2 ANGLE_RANGE[2];
    ANGLE_RANGE[0] = vec2( 0.0, 0.0 ) * radialDir;
    ANGLE_RANGE[1] = vec2( 2.0*PI, 2.0*PI ) * radialDir;

    vec3 p = randVec3Range( offset[0].xyz, offset[1].xyz, seed );
    vec3 v = randVec3Range( velocity[0].xyz, velocity[1].xyz, seed );
    vec3 a = randVec3Range( acceleration[0].xyz, acceleration[1].xyz, seed );

    vec2 theta = randVec2Range( ANGLE_RANGE[0], ANGLE_RANGE[1], seed );

    float pr = randFloatRange( offset[0].w, offset[1].w, seed );
    vec3 p2 = radialToVec3( pr, theta );

    float vr = randFloatRange( velocity[0].w, velocity[1].w, seed );
    vec3 v2 = radialToVec3( vr, theta );

    float ar = randFloatRange( acceleration[0].w, acceleration[1].w, seed );
    vec3 a2 = radialToVec3( ar, theta );

    vec4 rotScale = calcRotationScaleOverTime( vAgeRatio, seed );

    vec3 va = randVec3Range( angularVelocity[0].xyz, angularVelocity[1].xyz, seed );
    vec3 aa = randVec3Range( angularAcceleration[0].xyz, angularAcceleration[1].xyz, seed );

    vec3 rotationalVelocity = ( va + 0.5*aa*age );
    vec4 angularQuaternion = eulerToQuaternion( rotationalVelocity * age );

    vec3 velocity = ( v + v2 + 0.5*( a + a2 )*age );

    transformed = applyQuaternion( p + p2 + velocity * age, angularQuaternion );

  #if defined(WORLD_RELATIVE)
    transformed = applyQuaternion( transformed, quaternion );
  #endif

    transformed += position;

    particleScale = rotScale.w;
    vParticleColor = calcColorOverTime( vAgeRatio, seed ); // rgba format
    vRotation = rotScale.x;
  }

  #include <color_vertex>
  // #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <project_vertex>

  float particleSize = params[2].x;
  float usePerspective = params[2].y;

  gl_PointSize = particleSize * particleScale * mix( 1.0, 1.0 / - mvPosition.z, usePerspective );

  #include <logdepthbuf_vertex>
  #include <clipping_planes_vertex>
  #include <worldpos_vertex>
  #include <fog_vertex>
}`

  // based upon https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/points_frag.glsl
  const particleFragmentShader = `
#include <common>
#include <packing>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

uniform vec3 emitterColor;
uniform float emitterOpacity;
uniform vec4 textureFrames;

varying vec4 vParticleColor;
varying float vAgeRatio;
varying float vRotation;

void main() {
  if ( vAgeRatio < 0.0 || vAgeRatio > 1.0 ) {
    discard;
  }

  #include <clipping_planes_fragment>

  vec3 outgoingLight = vec3( 0.0 );
  vec4 diffuseColor = vec4( emitterColor, emitterOpacity );
  mat3 uvTransform = mat3(1.0);

  {
    vec2 invTextureFrame = 1.0 / textureFrames.xy;
    float textureCount = textureFrames.z;
    float textureLoop = textureFrames.w;
  
    float frame = floor( mod( vAgeRatio * textureCount * textureLoop, textureCount ) );
    float angle = vRotation;
    float c = cos(vRotation);
    float s = sin(vRotation);
    float tx = mod( frame, textureFrames.x ) * invTextureFrame.x;
    float ty = (textureFrames.y - 1.0 - floor( frame * invTextureFrame.x )) * invTextureFrame.y; // assumes textures are flipped on y
    float sx = invTextureFrame.x;
    float sy = invTextureFrame.y;
    float cx = tx + invTextureFrame.x * .5;
    float cy = ty + invTextureFrame.y * .5;
  
    uvTransform[0][0] = sx * c;
    uvTransform[0][1] = -sx * s;
    uvTransform[1][0] = sy * s;
    uvTransform[1][1] = sy * c;
    uvTransform[2][0] = c * tx + s * ty - ( c * cx + s * cy ) + cx;
    uvTransform[2][1] = -s * tx + c * ty - ( -s * cx + c * cy ) + cy;
  }

  #include <logdepthbuf_fragment>
  #include <map_particle_fragment>
  #include <color_fragment>
  #include <alphatest_fragment>

  diffuseColor *= vParticleColor;
  outgoingLight = diffuseColor.rgb;

  gl_FragColor = vec4( outgoingLight, diffuseColor.a );

  #include <premultiplied_alpha_fragment>
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
}`

})()
