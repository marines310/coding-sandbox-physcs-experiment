import * as THREE from 'three'
import { Game } from '../core/Game.js'

/**
 * World - Ground, obstacles, and environment
 */
export class World {
  constructor() {
    this.game = Game.getInstance()

    this.createLighting()
    this.createGround()
    this.createGroundSign()
    this.createObstacles()
    this.createDecorations()
  }

  createGroundSign() {
    // Create canvas for the sign text
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    // Background (transparent)
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Blue text
    ctx.fillStyle = '#2196F3'
    ctx.font = 'bold 72px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText("MIKE'S CODING SANDBOX", canvas.width / 2, canvas.height / 3)
    ctx.font = 'bold 56px Arial'
    ctx.fillText('PHYSICS EXPERIMENT', canvas.width / 2, (canvas.height / 3) * 2)

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.anisotropy = 16

    // Create plane geometry for the sign
    const signGeometry = new THREE.PlaneGeometry(30, 7.5)
    const signMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    })

    const sign = new THREE.Mesh(signGeometry, signMaterial)

    // Position flat on the ground, readable from above
    sign.rotation.x = -Math.PI / 2  // Lay flat
    sign.position.set(0, 0.05, -8)  // Slightly above ground, in front of start position

    this.game.add(sign)
  }

  createLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    this.game.add(ambient)

    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1)
    sun.position.set(50, 100, 50)
    sun.castShadow = true

    // Shadow settings
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 10
    sun.shadow.camera.far = 200
    sun.shadow.camera.left = -50
    sun.shadow.camera.right = 50
    sun.shadow.camera.top = 50
    sun.shadow.camera.bottom = -50

    this.game.add(sun)

    // Hemisphere light for nicer ambient
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x98d982, 0.4)
    this.game.add(hemi)
  }

  createGround() {
    // Visual ground
    const groundSize = 200
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 0.9,
      metalness: 0.1
    })

    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.game.add(ground)

    // Grid overlay for visual reference
    const gridHelper = new THREE.GridHelper(groundSize, 40, 0x5d8f36, 0x5d8f36)
    gridHelper.material.opacity = 0.3
    gridHelper.material.transparent = true
    this.game.add(gridHelper)

    // Physics ground
    this.game.physics.createGround(groundSize)

    // Road/path connecting zones
    this.createRoads()
  }

  createRoads() {
    // Create simple road paths between zones
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.95,
      metalness: 0.1
    })

    // Road segments (connecting center to zones)
    const roadConfigs = [
      { start: { x: 0, z: 0 }, end: { x: 0, z: -20 }, width: 4 },   // To About
      { start: { x: 0, z: 0 }, end: { x: 30, z: 0 }, width: 4 },    // To Projects
      { start: { x: 0, z: 0 }, end: { x: -30, z: 0 }, width: 4 },   // To Skills
      { start: { x: 0, z: 0 }, end: { x: 0, z: 30 }, width: 4 },    // To Contact
    ]

    for (const road of roadConfigs) {
      const length = Math.sqrt(
        Math.pow(road.end.x - road.start.x, 2) +
        Math.pow(road.end.z - road.start.z, 2)
      )

      const roadGeometry = new THREE.PlaneGeometry(road.width, length)
      const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)

      // Position at midpoint
      roadMesh.position.x = (road.start.x + road.end.x) / 2
      roadMesh.position.z = (road.start.z + road.end.z) / 2
      roadMesh.position.y = 0.02

      // Rotate to point from start to end
      roadMesh.rotation.x = -Math.PI / 2
      const angle = Math.atan2(road.end.x - road.start.x, road.end.z - road.start.z)
      roadMesh.rotation.z = angle

      roadMesh.receiveShadow = true
      this.game.add(roadMesh)
    }
  }

  createObstacles() {
    // Create some obstacles/ramps for fun
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9800,
      roughness: 0.4,
      metalness: 0.6
    })

    // Ramps
    const rampPositions = [
      { x: 15, z: -10, rotation: 0 },
      { x: -15, z: 10, rotation: Math.PI },
      { x: 20, z: 20, rotation: Math.PI / 4 }
    ]

    for (const pos of rampPositions) {
      this.createRamp(pos.x, pos.z, pos.rotation, obstacleMaterial)
    }

    // Barriers around the edge
    this.createBarriers()
  }

  createRamp(x, z, rotation, material) {
    const rampGeometry = new THREE.BoxGeometry(3, 0.5, 4)
    const ramp = new THREE.Mesh(rampGeometry, material)

    ramp.position.set(x, 0.25, z)
    ramp.rotation.y = rotation
    ramp.rotation.x = -0.2 // Tilt up
    ramp.castShadow = true
    ramp.receiveShadow = true

    this.game.add(ramp)

    // Add physics collider
    this.game.physics.createStaticBox(ramp, 3, 0.5, 4)
  }

  createBarriers() {
    const barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xe53935,
      roughness: 0.6,
      metalness: 0.3
    })

    const barrierGeometry = new THREE.BoxGeometry(100, 2, 1)
    const groundSize = 100

    // North
    const north = new THREE.Mesh(barrierGeometry, barrierMaterial)
    north.position.set(0, 1, -groundSize)
    north.castShadow = true
    this.game.add(north)
    this.game.physics.createStaticBox(north, 100, 2, 1)

    // South
    const south = new THREE.Mesh(barrierGeometry, barrierMaterial)
    south.position.set(0, 1, groundSize)
    south.castShadow = true
    this.game.add(south)
    this.game.physics.createStaticBox(south, 100, 2, 1)

    // East
    const east = new THREE.Mesh(barrierGeometry, barrierMaterial)
    east.position.set(groundSize, 1, 0)
    east.rotation.y = Math.PI / 2
    east.castShadow = true
    this.game.add(east)
    this.game.physics.createStaticBox(east, 1, 2, 100)

    // West
    const west = new THREE.Mesh(barrierGeometry, barrierMaterial)
    west.position.set(-groundSize, 1, 0)
    west.rotation.y = Math.PI / 2
    west.castShadow = true
    this.game.add(west)
    this.game.physics.createStaticBox(west, 1, 2, 100)
  }

  createDecorations() {
    // Simple tree-like decorations
    const treePositions = [
      { x: 10, z: -30 },
      { x: -10, z: -35 },
      { x: 40, z: 15 },
      { x: 45, z: -10 },
      { x: -40, z: 15 },
      { x: -35, z: -15 },
      { x: 25, z: 40 },
      { x: -20, z: 35 },
    ]

    for (const pos of treePositions) {
      this.createTree(pos.x, pos.z)
    }

    // Some random rocks
    const rockPositions = [
      { x: 8, z: 15, scale: 1 },
      { x: -12, z: -8, scale: 0.7 },
      { x: 35, z: -25, scale: 1.2 },
      { x: -25, z: 25, scale: 0.8 },
    ]

    for (const pos of rockPositions) {
      this.createRock(pos.x, pos.z, pos.scale)
    }
  }

  createTree(x, z) {
    const group = new THREE.Group()

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.9
    })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1
    trunk.castShadow = true
    group.add(trunk)

    // Foliage (cone)
    const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8)
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      roughness: 0.8
    })
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
    foliage.position.y = 3.5
    foliage.castShadow = true
    group.add(foliage)

    group.position.set(x, 0, z)
    this.game.add(group)

    // Add collision for trunk
    this.game.physics.createStaticBox(
      { position: { x, y: 1, z } },
      0.8, 2, 0.8
    )
  }

  createRock(x, z, scale) {
    const rockGeometry = new THREE.DodecahedronGeometry(scale, 0)
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x78909c,
      roughness: 0.9,
      flatShading: true
    })
    const rock = new THREE.Mesh(rockGeometry, rockMaterial)
    rock.position.set(x, scale * 0.5, z)
    rock.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )
    rock.castShadow = true
    rock.receiveShadow = true
    this.game.add(rock)

    // Add collision
    this.game.physics.createStaticBox(
      { position: { x, y: scale * 0.5, z } },
      scale * 1.5, scale * 1.5, scale * 1.5
    )
  }
}
