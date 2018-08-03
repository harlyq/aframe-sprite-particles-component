# aframe-sprite-particles-component

[Examples](#examples) - [Values](#values) - [Properties](#properties) - [Limitations](#limitations) - [Transparency](#transparency)

The **sprite-particles** component uses shader based points geometry to create a set of particles from texture billboards (camera facing textures).  The particles start spawning once the component is created, and will continue until the **duration** expires. Properties can be used to define the position, velocity, acceleration, color, scale and rotation of the particles.

The component also supports trails of particles or ribbons.

For a demo goto https://harlyq.github.io/aframe-sprite-particles-component/

![Screenshot](assets/screenshot.jpg)

## Examples
```html
<head>
  <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-sprite-particles-component@^0.5.0/aframe-sprite-particles-component.js"></script>
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

this defines an offset position on the **destination**. If the **destination** is null the destination offset is relative to the sprite-particles' entity.

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

if false then always render the particle system. This is useful for particles using a **source** that moves a lot because the bounds of the particle system are only around the current position, and not all past positions

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

~~**relative** : world | local~~

replaced by **source**

**ribbonShape** : flat | taperin | taperout | taper = `flat`

define the shape of the ribbon

**ribbonWidth** : number = `1`

width of ribbon trails. 1 is the default, use smaller numbers for a thinner ribbon, and larger numbers for a thicker ribbon.

**rotation** : number range array = `0`

over-time ranges for the particle rotation counterclockwise about the XY plane. all rotations are from min range to max range, and in degrees

**scale** : number range array = `1`

over-time ranges for the particle scale (scaled equally in all dimensions)

**screenDepthOffset** : number = `0`

slightly adjusts the screen for each particle. if 0, this effect is disabled, if 1 the newest particle will appear above all others, if -1 the oldest particle will appear above all others.  This effect is useful for displaying new particles on top of older particles, when the **particleOrder** is `original`, or when **depthWrite** is true. Using large positive or negative numbers may result in particles disappearing.

**seed** : int = `-1`

initial seed for randomness. if negative, then there is no initial seed

**source** : selector = null

new particles will be positioned and oriented to the source's current position and orientation, existing particles are unaffected. This is useful for making particles originate from a moving source, but not follow the source.

**spawnRate** : number = `10`

number of particles emitted per second. if **spawnType** is `burst`, then **spawnRate * maximum(lifeTime)** particles are spawned on the first frame of each loop

**spawnType** : continuous | burst = `continuous` 

continuous particles are emitted at the spawn rate, whilst burst particles are all emitted once the spawner is activated, and are re-emitted once all particles expire (*continuous, burst*) default continous

**texture** : map = null

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

**trailType** : particle | ribbon = `particle`

the type of trails to use, either particles or a ribbon mesh

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

When using **rotation** on textures with frames, parts of the adjacent frames will be visible during the rotation.  So it is important that there is a large buffer of empty space around the non-transparent parts of the frames, so that adjacent frames don't visibly leak into the particle during rotation.

The particle systems uses a cyclic pool of (**spawnRate * maximum(lifeTime)**) particles and particles that have expired are recycled to become new particles.  This impacts the draw order, because a new particle may actually be recycled from a much older particle and hence be drawn before the previous particle. Typically it is not a problem, but it may explain why a particle system appears different after the first loop.

The object3d name matches the attribute name used to define the component e.g. "sprite-particles" or "sprite-particles__fire".

If the a-entity containing the particle system also contains some other geometry, then **editorObject** will do nothing because we won't override the other geometry.

The shader for the particles is optimised to use only the code required for a given set of shader attributes, so it is no longer (as of v0.3.4) possible to add new attributes after creation (attributes can still be changed in the Inspector). However, there are no problems changing attributes that existed when the component was created (except for *overTimeSlots*).

When using **model** the particles spawn at random points on the surface of the model. Each triangle is given even weighting, so on average a large triangle will have as many particles as a small triangle.

The **velocityScale** is a very crude 3D approximation on a 2D camera facing billboard, so it may look odd when viewed extremely closely, or when the particle systems are very thin. The particle systems uses Points, which only have a single scale value so it applies equal in both x and y in screen space. VelocityScaling will only be active if either the **velocityScale** or **velocityScaleMinMax** attribute is defined in the component, and the **velocityScale** is greater than 0.

When particle trails are active, each particle will also spawn trail particles every **trailInterval** seconds, which live for **trailLifeTime** seconds. When particle trails are active, the lead particle follows the motion specified in the particle component, but does not change over time (i.e. ignores **color**, **rotation**, **opacity**, **scale** and textureFrames stay on the first frame). When the trails are spawned they ignore all particle motion, but implement the change over time rules. Visually this looks like each particle is leaving a trail behind it.  The trails will continue to exist even when the main particle has expired.

When trails are active the effective lifespan of a particle is **lifeTime** plus **trailLifeTime**, so when **spawnType** is `burst`, there will be `spawnRate * (lifeTime + trailLifeTime)` particles spawned.

The **particleOrder** is forced to `original` when a **source** is defined. This is done to simplify the work on the CPU, so we can set the particle's position just once when spawned.

Destinations can be used without a **destination** entity, whereby the **destinationOffset** is used as the target position. 

**screenDepthOffset** can be useful to make new particles appear in front of old particles, but because it is hacking the screen depth of each particle, it can give odd results when looking at the particles from an angle.  The offset is multiplied by the particleID, so having many particles will result in large offsets, which can result in particles disappearing or appearing incorrectly around nearby objects.  Try using small offsets to get the desired effect.

When using **source**, the particles positions are based off of the vector from the particle component's entities' position to the source position, so if the particle component's entity moves, then the whole particle system will move as well.  It is recommended that the particle component's entity does not move when using **source**.

Ribbons use a triangle strip, so each interval on the trail has approximately the same cost as two particles.

For **ribbonShape** we can either pick one of the listed shapes, or we can define a glsl function for the shape by using an `=` as the first character.  The function has one parameter p, which is 0 for the beginning of the trail and 1 for the end of the trail.  For example:
```html
ribbonShape: =1. - p
```
will generate a ribbon shape which is 0 at the beginning of the trail, getting larger until it reaches 1 at the end of the trail.  If the function provided is invalid glsl, an error will be sent to the console and the particle system will not be shown.

## Transparency

Manging transparency with particle systems can be tricky. Ideally transparent objects are rendered furthest to closest, but by default AFrame does not sort objects for rendering (for better performance), so looking at two transparent objects from one angle may look correct, but from another angle looks incorrect. Object sorting can only be activated from code:
```javascript
  var myScene = document.querySelector("a-scene")
  myScene.renderer.sortObjects = true
```

Even when sorting objects is enabled, objects are not sorted against individual particles, and particles from one component are not sorted against particles from another component, so there can still be graphical glitches when objects are close to particle systems.  Sorting can also be problematic for large transparent objects because the sort is looking at the distance between the center of the object and camera. For example, a transparent river may look further away than a bush, but because the origin of the river mesh is actually closer to the camera the river is considered to be closer and is drawn over the top of the bush.

The renderer determines how things are drawn by looking at the depth buffer for each pixel (**depthTest** is true) and seeing if another object is closer than our object.  If we are closer, then we put our position in the depth buffer (**depthWrite** is true) and draw our pixel; if another object is closer or at the same distance then we don't draw our pixel.  For transparent pixels we additionally only draw the pixel and write to the z-buffer if the alpha value (opacity) is greater than the **alphaTest**.  By default alphaTest is 0, so even mostly transparent pixels (e.g. opacity = 0.1) will still be drawn, and still write to the z-buffer, and thus occlude other pixels at the same distance or further away - which is why it is important to sort transparent objects and draw them from furthest to closest.

Particle systems can involve hundreds of particles and there are often times when two particles are near each other, so one particle will be drawn first and occlude the other particle. To work around this we can:
* set **depthWrite** to `false`, so particles never occlude each other, but can are occluded by other objects.  However transparent objects drawn after the particles will appear over the top of the particles, so it is important that the objects are sorted correctly.
* set **alphaTest** higher than 0, which will discard pixels with alpha lower than alphaTest. This is good for objects with a sharp edge e.g. a leaf, but poorer results for objects that fade out at the edges over several pixels.  Even with alphaTest set a thin outline may appear around the pixels, unless the alphaTest is near 1.

Once we have fixed particle occlusion there may still be problems with the draw order of the particles.  By default the particleOrder is `original` which means that expired particles will be reused, so a new particle may appear underneath existing particles because it is actually a reused old particle. Workarounds for this are:
* set **particleOrder** to `newest` so the newest particle is drawn last, but this option is not available when **source** is used
* set **screenDepthOffset** to `1` which moves the particles in screen space, so the newest particles appear in front.  Because we are hacking the screen depth, the particle may appear in front of closer objects, or may even disappear because it is behind the camera - using a smaller value will help

For a detailed explaination for depth testing and the depth buffer see https://learnopengl.com/Advanced-OpenGL/Depth-testing

