import * as THREE from 'three'
import { Game } from '../core/Game.js'

/**
 * Vehicle - Drivable car with physics
 */
export class Vehicle {
  constructor() {
    this.game = Game.getInstance()

    // Vehicle parameters - tuned for gentle, controllable movement
    this.params = {
      maxSpeed: 1,
      maxSpeedBoost: 2,
      acceleration: 0.8,
      boostMultiplier: 1.5,
      steeringSpeed: 2,
      maxSteering: 0.5,
      friction: 0.92,
      turnFriction: 0.9
    }

    // State
    this.currentSpeed = 0
    this.currentSteering = 0
    this.velocity = new THREE.Vector3()

    // Create visual mesh
    this.mesh = this.createMesh()
    this.game.add(this.mesh)

    // Create physics body
    this.body = this.game.physics.createVehicleChassis(
      { x: 0, y: 2, z: 0 },
      { width: 1.3, height: 0.4, length: 2 }
    )

    // Wheel visuals (simple cylinders)
    this.wheels = this.createWheels()
  }

  createMesh() {
    const group = new THREE.Group()

    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.3, 0.4, 2)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      metalness: 0.6,
      roughness: 0.4
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Cabin
    const cabinGeometry = new THREE.BoxGeometry(1, 0.35, 0.9)
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    })
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
    cabin.position.set(0, 0.35, -0.2)
    cabin.castShadow = true
    group.add(cabin)

    // Headlights
    const lightGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.05)
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    })

    const leftLight = new THREE.Mesh(lightGeometry, lightMaterial)
    leftLight.position.set(-0.4, 0, 1)
    group.add(leftLight)

    const rightLight = new THREE.Mesh(lightGeometry, lightMaterial)
    rightLight.position.set(0.4, 0, 1)
    group.add(rightLight)

    group.position.set(0, 2, 0)

    return group
  }

  createWheels() {
    const wheels = []
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16)
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.3,
      roughness: 0.8
    })

    const positions = [
      { x: -0.6, y: -0.2, z: 0.7 },  // Front left
      { x: 0.6, y: -0.2, z: 0.7 },   // Front right
      { x: -0.6, y: -0.2, z: -0.7 }, // Back left
      { x: 0.6, y: -0.2, z: -0.7 }   // Back right
    ]

    for (const pos of positions) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos.x, pos.y, pos.z)
      wheel.castShadow = true
      this.mesh.add(wheel)
      wheels.push(wheel)
    }

    return wheels
  }

  prePhysicsUpdate(delta) {
    const input = this.game.inputs.getInput()
    const { forward, steering, boost, brake } = input

    // UP arrow pressed = forward > 0
    // DOWN arrow pressed = forward < 0
    const upPressed = forward > 0
    const downPressed = forward < 0

    // SPACE = full brake - immediately stop the car
    if (brake) {
      this.currentSpeed = 0
      if (this.body) {
        this.body.setLinvel({ x: 0, y: this.body.linvel().y, z: 0 }, true)
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }
      return // Skip rest of physics update when braking
    }

    // Calculate max speeds
    const maxForwardSpeed = boost ? this.params.maxSpeedBoost : this.params.maxSpeed
    const maxReverseSpeed = 0.5
    const acceleration = boost ? this.params.acceleration * this.params.boostMultiplier : this.params.acceleration
    const stopRate = 10  // How fast car stops when pressing opposite direction
    const naturalDeceleration = 8  // High resistance - car stops quickly when no input

    // UP ARROW: Stop if reversing, otherwise go forward
    if (upPressed) {
      if (this.currentSpeed < 0) {
        // Currently reversing - UP stops the car
        this.currentSpeed += stopRate * delta
        if (this.currentSpeed > 0) this.currentSpeed = 0
      } else {
        // Stopped or moving forward - accelerate forward
        this.currentSpeed += acceleration * delta
      }
    }
    // DOWN ARROW: Stop if going forward, otherwise go in reverse
    else if (downPressed) {
      if (this.currentSpeed > 0) {
        // Currently moving forward - DOWN stops the car
        this.currentSpeed -= stopRate * delta
        if (this.currentSpeed < 0) this.currentSpeed = 0
      } else {
        // Stopped or moving backward - accelerate in reverse
        this.currentSpeed -= acceleration * 0.7 * delta
      }
    }
    // No input - coast to a stop
    else {
      if (this.currentSpeed > 0) {
        this.currentSpeed -= naturalDeceleration * delta
        if (this.currentSpeed < 0) this.currentSpeed = 0
      } else if (this.currentSpeed < 0) {
        this.currentSpeed += naturalDeceleration * delta
        if (this.currentSpeed > 0) this.currentSpeed = 0
      }
    }

    // Clamp speed
    this.currentSpeed = Math.max(-maxReverseSpeed, Math.min(maxForwardSpeed, this.currentSpeed))

    // STEERING: Left/Right arrows turn the front wheels
    // steering > 0 means LEFT pressed, steering < 0 means RIGHT pressed
    const targetSteering = steering * this.params.maxSteering

    // Smoothly turn wheels towards target angle
    this.currentSteering += (targetSteering - this.currentSteering) * 0.2

    // Apply forces to physics body
    if (this.body) {
      const rotation = this.body.rotation()
      const euler = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      )

      // Calculate forward direction based on car's current rotation
      const forwardDir = new THREE.Vector3(0, 0, 1)
      forwardDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.y)

      // Apply forward/backward force
      const force = {
        x: forwardDir.x * this.currentSpeed * 3,
        y: 0,
        z: forwardDir.z * this.currentSpeed * 3
      }
      this.game.physics.applyForce(this.body, force)

      // Apply steering torque only when car is moving
      if (Math.abs(this.currentSpeed) > 0.1) {
        // Steering effect is based on speed and wheel angle
        // When reversing, steering is inverted (like a real car)
        const steeringEffect = this.currentSteering * Math.sign(this.currentSpeed)
        const torque = {
          x: 0,
          y: -steeringEffect * Math.min(Math.abs(this.currentSpeed), 3) * 4,
          z: 0
        }
        this.game.physics.applyTorque(this.body, torque)
      }

      // Only fully stop when no input is pressed and speed is very low
      const noInput = !upPressed && !downPressed
      const shouldStop = noInput && Math.abs(this.currentSpeed) < 0.02

      if (shouldStop) {
        this.currentSpeed = 0
        this.body.setLinvel({ x: 0, y: this.body.linvel().y, z: 0 }, true)
        this.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      } else if (noInput) {
        // Apply heavy drag when coasting (no input)
        const vel = this.body.linvel()
        this.body.setLinvel({ x: vel.x * 0.5, y: vel.y, z: vel.z * 0.5 }, true)

        // Reduce angular velocity when not steering
        if (Math.abs(steering) < 0.1) {
          const angVel = this.body.angvel()
          this.body.setAngvel({ x: 0, y: angVel.y * 0.85, z: 0 }, true)
        }
      }
      // When input is pressed, let the car move freely
    }
  }

  postPhysicsUpdate(delta) {
    if (!this.body) return

    // Sync mesh with physics body
    const position = this.body.translation()
    const rotation = this.body.rotation()

    this.mesh.position.set(position.x, position.y, position.z)
    this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

    // Animate wheels
    const wheelRotation = this.currentSpeed * delta * 5
    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].rotation.x += wheelRotation

      // Front wheels steer
      if (i < 2) {
        this.wheels[i].rotation.y = this.currentSteering
      }
    }

    // Keep car upright (prevent flipping)
    const vel = this.body.linvel()
    if (position.y < 0) {
      this.body.setTranslation({ x: position.x, y: 2, z: position.z }, true)
      this.body.setLinvel({ x: vel.x * 0.5, y: 0, z: vel.z * 0.5 }, true)
    }
  }

  getPosition() {
    return this.mesh.position.clone()
  }

  getSpeed() {
    return Math.abs(this.currentSpeed)
  }
}
