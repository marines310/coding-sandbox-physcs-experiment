import * as THREE from 'three'
import { Game } from '../core/Game.js'

/**
 * Camera - Third-person camera that follows the vehicle
 */
export class Camera {
  constructor() {
    this.game = Game.getInstance()

    // Create camera
    this.instance = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    // Camera offset from vehicle
    this.offset = new THREE.Vector3(0, 8, 12)
    this.lookAtOffset = new THREE.Vector3(0, 0, 0)

    // Smoothing
    this.lerpFactor = 0.05
    this.currentPosition = new THREE.Vector3(0, 10, 15)
    this.currentLookAt = new THREE.Vector3(0, 0, 0)

    // Set initial position
    this.instance.position.copy(this.currentPosition)
    this.instance.lookAt(this.currentLookAt)

    // Handle resize
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    this.instance.aspect = window.innerWidth / window.innerHeight
    this.instance.updateProjectionMatrix()
  }

  update(delta) {
    const vehicle = this.game.vehicle
    if (!vehicle || !vehicle.mesh) return

    // Get vehicle position and rotation
    const vehiclePosition = vehicle.mesh.position
    const vehicleRotation = vehicle.mesh.rotation

    // Calculate target camera position (behind and above vehicle)
    const targetPosition = new THREE.Vector3()
    targetPosition.copy(this.offset)

    // Rotate offset based on vehicle rotation
    targetPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleRotation.y)
    targetPosition.add(vehiclePosition)

    // Calculate look-at point (slightly ahead of vehicle)
    const targetLookAt = new THREE.Vector3()
    targetLookAt.copy(this.lookAtOffset)
    targetLookAt.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleRotation.y)
    targetLookAt.add(vehiclePosition)

    // Smooth camera movement
    this.currentPosition.lerp(targetPosition, this.lerpFactor)
    this.currentLookAt.lerp(targetLookAt, this.lerpFactor)

    // Apply to camera
    this.instance.position.copy(this.currentPosition)
    this.instance.lookAt(this.currentLookAt)
  }
}
