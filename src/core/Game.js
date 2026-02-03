import * as THREE from 'three'
import { Ticker } from './Ticker.js'
import { Renderer } from '../systems/Renderer.js'
import { Physics } from '../systems/Physics.js'
import { Inputs } from '../systems/Inputs.js'
import { Camera } from '../systems/Camera.js'
import { World } from '../world/World.js'
import { Vehicle } from '../world/Vehicle.js'
import { ZoneManager } from '../world/ZoneManager.js'
import { UI } from '../ui/UI.js'

/**
 * Game - Main orchestrator class (Singleton pattern)
 * Inspired by Bruno Simon's architecture
 */
export class Game {
  static instance = null

  static getInstance() {
    return Game.instance
  }

  constructor() {
    if (Game.instance) {
      return Game.instance
    }
    Game.instance = this

    // Core properties
    this.canvas = document.getElementById('canvas')
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue

    // Systems will be initialized async
    this.ticker = null
    this.renderer = null
    this.physics = null
    this.inputs = null
    this.camera = null
    this.world = null
    this.vehicle = null
    this.zoneManager = null
    this.ui = null

    // State
    this.isReady = false
  }

  async init() {
    console.log('Game: Initializing...')

    // Show loading
    this.updateLoadingProgress(10)

    // 1. Create ticker (game loop)
    this.ticker = new Ticker()
    this.updateLoadingProgress(20)

    // 2. Initialize physics (async - loads WASM)
    this.physics = new Physics()
    await this.physics.init()
    this.updateLoadingProgress(40)

    // 3. Create renderer
    this.renderer = new Renderer(this.canvas)
    this.updateLoadingProgress(50)

    // 4. Create camera
    this.camera = new Camera()
    this.updateLoadingProgress(55)

    // 5. Create input system
    this.inputs = new Inputs()
    this.updateLoadingProgress(60)

    // 6. Create world (ground, obstacles, decorations)
    this.world = new World()
    this.updateLoadingProgress(70)

    // 7. Create vehicle
    this.vehicle = new Vehicle()
    this.updateLoadingProgress(80)

    // 8. Create zone manager
    this.zoneManager = new ZoneManager()
    this.updateLoadingProgress(90)

    // 9. Create UI
    this.ui = new UI()
    this.updateLoadingProgress(100)

    // Set up tick events in order (like Bruno's architecture)
    this.setupTickEvents()

    // Hide loading screen
    setTimeout(() => {
      document.getElementById('loading').classList.add('hidden')
    }, 500)

    this.isReady = true
    console.log('Game: Ready!')

    // Start the game loop
    this.ticker.start()
  }

  setupTickEvents() {
    // Order matters! Lower numbers run first
    // 0-10: Input & pre-physics
    this.ticker.on('tick', (delta) => this.inputs.update(delta), 0)
    this.ticker.on('tick', (delta) => this.vehicle.prePhysicsUpdate(delta), 1)

    // 10-20: Physics
    this.ticker.on('tick', (delta) => this.physics.update(delta), 10)

    // 20-30: Post-physics updates
    this.ticker.on('tick', (delta) => this.vehicle.postPhysicsUpdate(delta), 20)
    this.ticker.on('tick', (delta) => this.zoneManager.update(delta), 25)

    // 30-40: Camera
    this.ticker.on('tick', (delta) => this.camera.update(delta), 30)

    // 50: UI
    this.ticker.on('tick', (delta) => this.ui.update(delta), 50)

    // 100: Render (always last)
    this.ticker.on('tick', () => this.render(), 100)
  }

  render() {
    this.renderer.render(this.scene, this.camera.instance)
  }

  updateLoadingProgress(percent) {
    const progressBar = document.querySelector('.loading-progress')
    if (progressBar) {
      progressBar.style.width = `${percent}%`
    }
  }

  // Utility to add objects to scene
  add(object) {
    this.scene.add(object)
  }

  remove(object) {
    this.scene.remove(object)
  }
}
