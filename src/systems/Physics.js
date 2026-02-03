import RAPIER from '@dimforge/rapier3d'

/**
 * Physics - Rapier physics world wrapper
 */
export class Physics {
  constructor() {
    this.world = null
    this.rapier = null
    this.bodies = new Map() // Map mesh to rigid body
    this.colliders = new Map() // Map mesh to collider
  }

  async init() {
    // Initialize Rapier (loads WASM)
    // Must call init() to load the WASM module
    await RAPIER.init()
    this.rapier = RAPIER

    // Create physics world with gravity
    const gravity = { x: 0, y: -9.81, z: 0 }
    this.world = new this.rapier.World(gravity)

    console.log('Physics: Rapier initialized')
  }

  update(delta) {
    if (!this.world) return

    // Step the physics simulation
    this.world.step()

    // Update Three.js meshes from physics bodies
    for (const [mesh, body] of this.bodies) {
      if (body.isDynamic()) {
        const position = body.translation()
        const rotation = body.rotation()

        mesh.position.set(position.x, position.y, position.z)
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
      }
    }
  }

  /**
   * Create a static ground plane
   */
  createGround(size = 200) {
    const groundDesc = this.rapier.RigidBodyDesc.fixed()
    const groundBody = this.world.createRigidBody(groundDesc)

    const groundColliderDesc = this.rapier.ColliderDesc.cuboid(size / 2, 0.1, size / 2)
    groundColliderDesc.setFriction(0.8)
    this.world.createCollider(groundColliderDesc, groundBody)

    return groundBody
  }

  /**
   * Create a dynamic box body
   */
  createDynamicBox(mesh, width, height, depth, mass = 1) {
    const position = mesh.position

    const bodyDesc = this.rapier.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)

    const body = this.world.createRigidBody(bodyDesc)

    const colliderDesc = this.rapier.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setMass(mass)
      .setFriction(0.5)
      .setRestitution(0.2)

    const collider = this.world.createCollider(colliderDesc, body)

    this.bodies.set(mesh, body)
    this.colliders.set(mesh, collider)

    return { body, collider }
  }

  /**
   * Create a static box collider
   */
  createStaticBox(mesh, width, height, depth) {
    const position = mesh.position

    const bodyDesc = this.rapier.RigidBodyDesc.fixed()
      .setTranslation(position.x, position.y, position.z)

    const body = this.world.createRigidBody(bodyDesc)

    const colliderDesc = this.rapier.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setFriction(0.8)

    const collider = this.world.createCollider(colliderDesc, body)

    return { body, collider }
  }

  /**
   * Create vehicle chassis body
   */
  createVehicleChassis(position, dimensions) {
    const { width, height, length } = dimensions

    const bodyDesc = this.rapier.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.5)

    const body = this.world.createRigidBody(bodyDesc)

    // Main chassis
    const chassisCollider = this.rapier.ColliderDesc.cuboid(width / 2, height / 2, length / 2)
      .setMass(2.5)
      .setFriction(0.5)
      .setRestitution(0.1)

    this.world.createCollider(chassisCollider, body)

    // Lower center of mass for stability
    body.setAdditionalMass(0.5, false)

    return body
  }

  /**
   * Apply force to a body
   */
  applyForce(body, force) {
    body.addForce(force, true)
  }

  /**
   * Apply torque to a body
   */
  applyTorque(body, torque) {
    body.addTorque(torque, true)
  }

  /**
   * Get body velocity
   */
  getVelocity(body) {
    return body.linvel()
  }

  /**
   * Set body velocity
   */
  setVelocity(body, velocity) {
    body.setLinvel(velocity, true)
  }
}
