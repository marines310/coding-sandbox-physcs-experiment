/**
 * Inputs - Keyboard and touch input handling
 */
export class Inputs {
  constructor() {
    // Current input state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
      brake: false
    }

    // Touch controls
    this.touch = {
      active: false,
      joystick: { x: 0, y: 0 },
      boost: false
    }

    // Bind event handlers
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)

    // Set up listeners
    this.setupKeyboard()
    this.setupTouch()
  }

  setupKeyboard() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  setupTouch() {
    // Only on touch devices
    if ('ontouchstart' in window) {
      window.addEventListener('touchstart', this.onTouchStart)
      window.addEventListener('touchmove', this.onTouchMove)
      window.addEventListener('touchend', this.onTouchEnd)
    }
  }

  onKeyDown(event) {
    // Prevent default for arrow keys to avoid page scrolling
    if (event.code.startsWith('Arrow')) {
      event.preventDefault()
    }

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true
        this.keys.backward = false  // Ensure backward is off
        break
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true
        this.keys.forward = false  // Ensure forward is off
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = true
        break
      case 'Space':
        this.keys.brake = true
        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = false
        break
      case 'Space':
        this.keys.brake = false
        break
    }
  }

  onTouchStart(event) {
    this.touch.active = true
    this.updateTouchPosition(event)
  }

  onTouchMove(event) {
    if (this.touch.active) {
      this.updateTouchPosition(event)
    }
  }

  onTouchEnd(event) {
    this.touch.active = false
    this.touch.joystick = { x: 0, y: 0 }
  }

  updateTouchPosition(event) {
    if (event.touches.length === 0) return

    const touch = event.touches[0]
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Normalize to -1 to 1
    this.touch.joystick.x = (touch.clientX - centerX) / (window.innerWidth / 4)
    this.touch.joystick.y = (touch.clientY - centerY) / (window.innerHeight / 4)

    // Clamp
    this.touch.joystick.x = Math.max(-1, Math.min(1, this.touch.joystick.x))
    this.touch.joystick.y = Math.max(-1, Math.min(1, this.touch.joystick.y))

    // Two finger touch = boost
    this.touch.boost = event.touches.length >= 2
  }

  update(delta) {
    // Input processing happens automatically via events
  }

  /**
   * Get combined input values (keyboard + touch)
   */
  getInput() {
    let forward = 0
    let steering = 0
    let boost = false
    let brake = false

    // Keyboard
    if (this.keys.forward) forward = 1
    if (this.keys.backward) forward = -1
    if (this.keys.left) steering += 1
    if (this.keys.right) steering -= 1
    boost = this.keys.boost
    brake = this.keys.brake

    // Touch (override if active)
    if (this.touch.active) {
      forward = -this.touch.joystick.y
      steering = -this.touch.joystick.x
      boost = this.touch.boost
    }

    return { forward, steering, boost, brake }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('touchstart', this.onTouchStart)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('touchend', this.onTouchEnd)
  }
}
