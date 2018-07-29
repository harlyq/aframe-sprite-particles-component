# aframe-sprite-particles-component

The **sprite-particles** component uses shader based points geometry to create a set of particles from texture billboards (camera facing textures).  The particles start spawning once the component is created, and will continue until the **duration** expires. Properties can be used to define the position, velocity, acceleration, color, scale and rotation of the particles.

For a demo goto https://harlyq.github.io/aframe-sprite-particles-component/

![Screenshot](assets/screenshot.jpg)

## Examples
```html
<head>
  <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-sprite-particles-component@^0.3.0/aframe-sprite-particles-component.js"></script>
</head>
<body>
  <a-scene>
    <a-gltf-model id="model" texture="assets/blob.png" scale="0.5 0.5 0.5" visible="false"></a-gltf-model>
    <a-entity position="0 5 -5" sprite-particles="texture: assets/blob.png; velocity: .1 1 .1; acceleration: 0 -1 0..0 -2 0; color: red,yellow"></a-entity>
    <a-entity position="0 0 -5" sprite-particles="radialVelocity: 1..2; color: red"></a-entity>
  </a-scene>
</body>
```

## Values
Some of the properties are listed as type (*range*), which is either a minimum and maximum value separated by `..` (the system will chose a value within that range for each particle) or just a single value.

For example:

`lifeTime: 1` all particles have a life time of 1 (number range)

`lifeTime: 2..4` all particles have a life time between 2 and 4 inclusive (number range)

`velocity: 1 1 .1 .. 2 3 5` velocity value between 1 and 2 for x, 1 and 3 for y, .1 and 5 for z (vec3 range)

Some properties are listed as type (*range array*). This provides different values over the life-time of the particle.  The first value is for when the particle is created, linearly interpolating over values, until the last value is reached at the end of the particle's life.  By default there are a maximum of 5 elements for each over-time array, but this can be changed in the **overTimeSlots** parameter. Each element of the array is of type (*range*) so it may be either a single value or a min and max value separated by `..`

For example:

`scale: 1..2,3,6,.5 .. 1,9` there are 5 values so each value represents 0%, 25%, 50%, 75% 100% of the particles life time. At 0% scale is between 1 and 2, then blend to 3 at 25%, then up to 6 at 50%, a value between .5 and 1 at 75%, then back up to 9 at 100% (number range[])

`rotation: 0,360` there are 2 values, each particle starts at 0 rotation, and linearly interpolates counterclockwise to 360 (rotation about the XY plane) over the lifetime of the particle (number range[])

## Properties
The list of properties in alphabetical order:

**acceleration** : vec3 range = `0 0 0`

range for acceleration of each particle in local coordinates

**alphaTest** : number = `0`

don't draw any pixels from the texture that fall below this alpha level. can be used to hide low alpha parts of the texture, but may leave artefacts around the edges of particles (*number*) default 0

**angularVelocity** : vec3 range = `0 0 0`

range for rotational velocity in degrees per second (counterclockwise) around the local origin. first element is about the X axis, second about Y and third for the Z axis (*vec3 range*) default 0 0 0

**blending** : none | normal | additive | subtractive | multiply = `normal`

control how the particles' color blends with the colors behind the particle system (*none, normal, additive, subtractive, multiply*) default normal

**color** : color range array = `white`

over-time ranges for the particle color. can use names e.g. `blue` or `color`, or hex strings e.g. `#ff0` or `#e7f890`

**depthTest** : boolean = `true`

if true, particles will not be drawn if another object has been drawn previously in front of the particle

**depthWrite** : boolean = `false`

if true, particle pixels will write their depth position to the depth buffer (obscuring objects that appear behind the particle, but were drawn after the particle system). if false, the particles do not affect the depth buffer, so objects drawn after the particle system, but located behind the particle system will be drawn on top


**destination** : selector = null

designates a final destination for particles. How closely the particles get to the destination is defined by **destinationWeight**

**destinationOffset** : vec3 range = `0 0 0`

this defines an offset position on the **destination**. If the **destination** is null and **relative** is `local` the destination offset is relative to the sprite-particles' entity. If **destination** is null and **relative** is `world` the destination is relative to the origin of the world.

**destinationWeight**: number range = `0`

a number between 0 and 1 to determine how closely particles get to their destination (it defines a lerp between the particles regular position and the destination).  If 0 then the destination has no influence.  If 1 then all particles will warrive at the destination.

**direction** : forward | backward = `forward`

the direction to play the particle effect. if playing backward the particle will start at the end of its maximum age and then get younger (**) default forward

**drag** : number = `0`

slows particles as they age.  0, is no drag; 1 is full drag, and will continually slow the particle, finally stopping when it reaches it's halfway point

**duration** : number = `-1`

no new particles will be generated after this time in seconds. if negative, particles are generated forever. changing the duration will restart the particle system

**editorObject** : boolean = `true`

if true, generate a bounding box called "mesh" which helps selecting and provides a selection box in the editor

**emitterColor** : color = `white`

overall color for the emitter. It is cheaper to set the emitter color than using *color* to color each particle, although the emitter color is a single color

**enable** : boolean = `true`

enable or disable the emitter. existing particles will continue their lives, but there will be no new particles

**enableInEditor** : boolean = `false`

if true, the particle system will run while the AFrame Inspector is active

**fog** : boolean = `true`

if true, apply fog to all particles

**frustumCulled** : boolean = `true`

if false then always render the particle system. This is useful for world relative systems that move a lot because the bounds of the particle system are only around the current position, and not all past positions

**lifeTime** : number range = `1`

range for maximum age of each particle

**model** : selector = `null`

the particles spawn in positions on the surface of the model

**orbitalAcceleration** : number range = `0`

acceleration (degrees per second squared) for a particle orbiting around the origin

**orbitalVelocity** : number range = `0`

velocity (degrees per second) for a particle orbiting around the origin

**opacity** : number range array = `1`

over-time ranges for the particle opacity. `0` is transparent, `1` is opaque

**overTimeSlots** : int = `5`

maximum number of slots for over-time attributes. if an attribute has more than **overTimeSlots** slots, then the remainder are ignored (cannot be changed after creation)

**particleOrder** : newest | oldest | original = `original` 

defines the draw order of particles, which can either be `newest` drawn last, `oldest` drawn last or `original` which uses a cylic buffer and reuses old particles so the draw order is indeterminant. The order applies to both particles and their trails.

**particleSize** : number = `100`

the size of each particle in pixels. if **usePerspective** is `true` then this is the size of the particle at 1m from the camera

**position** : veec3 range = `0 0 0`

range for offseting the initial particle position in local coordinates

**radialAcceleration** : number range = `0`

range for an acceleration from the local origin

**radialPosition** : number range = `0`

range for offseting the start position from the local origin

**radialType** : circle | sphere = `circle`

shape for radial parameters, either a circle in XY or a sphere

**radialVelocity** : number range = `0`

range for a radial speed from the local origin

**relative** : world | local = `local`

if local, all particles move relative to the entity. if world, new particles are spawned at the current entity position, but spawned particles are not affected by the entities' movement (cannot be changed after creation)

**rotation** : number range array = `0`

over-time ranges for the particle rotation counterclockwise about the XY plane. all rotations are from min range to max range, and in degrees

**scale** : number range array = `1`

over-time ranges for the particle scale (scaled equally in all dimensions)

**seed** : int = `-1`

initial seed for randomness. if negative, then there is no initial seed

**spawnRate** : number = `10`

number of particles emitted per second. if **spawnType** is `burst`, then **spawnRate * maximum(lifeTime)** particles are spawned on the first frame of each loop

**spawnType** : continuous | burst = `continuous` 

continuous particles are emitted at the spawn rate, whilst burst particles are all emitted once the spawner is activated, and are re-emitted once all particles expire (*continuous, burst*) default continous

**texture** : map = `null`

filename or element reference for the texture. if no texture is defined, a white opaque square is used

**textureCount** : int = `0`

the number of frames in the **texture**. if 0, the number of frames is assumed to be **textureFrame.x * textureFrame.y**

**textureFrame** : vec2 = `1 1`

the number of columns (x) and rows (y) for this texture

**textureLoop** : number = `1`

the number of times to loop the texture over the lifetime of the particle

**trailInterval** : number = `0`

generate trails after particles.  If active, the lead particle but will not change over time, but every **timeInterval** seconds it will drop a particle which will remain stationary and follow the over-time properties. Trails are deactivated if this value if 0

**trailLifeTime** : number range = `0`

range value determining the age of each trail.  If this value is 0, then the trail life time is equal to the **lifeTime** attribute.  Trails only appear if **timeInterval** is larger than 0

**transparent** : boolean = `true`

set to true to make the alpha channel of the texture transparent

**usePerspective** : boolean = `true`

if true, particles will become smaller the further they are from the camera

**velocityScale** : number = `0`

scale and rotate each particle according to it's screen-space velocity. The velocityScale is a multiplier of the particle's screen-space speed, so the higher the number the larger the particle will appear. 
The texture is not rotated if the particles are travelling up the screen. Velocity scaling is only active when the value is greater than 0

**velocityScaleMinMax** : vec2 = `0 3`

this sets the mix and max scaling for all particles when **velocityScale** is applied. This is useful for limiting the scaling on fast moving particles. The first value is the minimum scale, and the last value the maximum scale. Velocity scaling is only active when the **velocityScale** is greater than 0


## Limitations

To toggle **enable**, the attribute must appear in the component at creation time. It it is left out and then added at a later stage, the first transition from enabled to disabled will kill the wrong particles.

Both radial and non-radial values are applied to each particle. So a particle's position will be the sum of the **position** and **radialPosition**, similarly for velocity and acceleration.

Using a **depthWrite** of `false` produces the best results for particles with transparency, but it may mean that objects that should be behind the particle system appear in front of the particle system (especially for large terrain objects which may be partially in-front and partially behind the particle system).  For these cases setting **depthWrite** to true will fix the draw problem, but you may start to see transparent parts of one particle obscuring other particles.  In this case the particles are being drawn at the same depth from the camera, but the first particle drawn is obscuring the other particles.  To fix the transparency problems, use the **alphaTest** value to ignore texture values below a certain alpha value (try a value of .5, if too much of the particle is being lost then decrease the value, or if there is still too much of the background of one particle obscuring other particles then increase the value).  Note that using a non-zero **alphaTest** may result in a thin edge appearing around some of the particles.

For a detailed explaination for depth testing and the depth buffer see https://learnopengl.com/Advanced-OpenGL/Depth-testing

When using **rotation** on textures with frames, parts of the adjacent frames will be visible during the rotation.  So it is important that there is a large buffer of empty space around the non-transparent parts of the frames, so that adjacent frames don't visibly leak into the particle during rotation.

The particle systems uses a cyclic pool of (**spawnRate * maximum(lifeTime)**) particles and particles that have expired are recycled to become new particles.  This impacts the draw order, because a new particle may actually be recycled from a much older particle and hence be drawn before the previous particle. Typically it is not a problem, but it may explain why a particle system appears different after the first loop.

The object3d name matches the attribute name used to define the component e.g. "sprite-particles" or "sprite-particles__fire".  If the particle system is world relative, then the object3d is attached to the sceneEl, and will
be the id name followed by the attribute name e.g. "box_sprite-particles" or "bonfire_sprite-particles__fire".  If there is no id for the particles then a unique number will be used e.g. "sprite-particles2", "sprite-particles5".

If the a-entity containing the particle system also contains some other geometry, then **editorObject** will do nothing because we won't override the other geometry.

In the Inspector it is not possible to click on particle systems that are world relative, because they are attached to the scene element, rather than an a-entity.

The shader for the particles is optimised to use only the code required for a given set of shader attributes, so it is no longer (as of v0.3.4) possible to add new attributes after creation (attributes can still be changed in the Inspector). However, there are no problems changing attributes that existed when the component was created (except *relative* and *overTimeSlots*).

When using **model** the particles spawn at random points on the surface of the model. Each triangle is given even weighting, so on average a large triangle will have as many particles as a small triangle.

The **velocityScale** is a very crude 3D approximation on a 2D camera facing billboard, so it may look odd when viewed extremely closely, or when the particle systems are very thin. The particle systems uses Points, which only have a single scale value so it applies equal in both x and y in screen space. VelocityScaling will only be active if either the **velocityScale** or **velocityScaleMinMax** attribute is defined in the component, and the **velocityScale** is greater than 0.

When particle trails are active, each particle will also spawn trail particles every **trailInterval** seconds, which live for **trailLifeTime** seconds. When particle trails are active, the lead particle follows the motion specified in the particle component, but does not change over time (i.e. ignores **color**, **rotation**, **opacity**, **scale** and textureFrames stay on the first frame). When the trails are spawned they ignore all particle motion, but implement the change over time rules. Visually this looks like each particle is leaving a trail behind it.  The trails will continue to exist even when the main particle has expired.

When trails are active the effective lifespan of a particle is **lifeTime** plus **trailLifeTime**, so when **spawnType** is `burst`, there will be `spawnRate * (lifeTime + trailLifeTime)` particles spawned.

The **particleOrder** is forced to `original` when **relative** is set to `world`. This is done to simplify the work on the CPU, so we just set the particle's position once when spawned.

Destinations can be used without a **destination** entity, whereby the **destinationOffset** is used as the target position. 
