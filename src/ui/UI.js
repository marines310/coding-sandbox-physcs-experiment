import { Game } from '../core/Game.js'

/**
 * UI - Manages HTML UI overlays
 */
export class UI {
  constructor() {
    this.game = Game.getInstance()

    // Get DOM elements
    this.zonePanel = document.getElementById('zone-panel')
    this.zoneTitle = document.getElementById('zone-title')
    this.zoneBody = document.getElementById('zone-body')
    this.minimapCanvas = document.getElementById('minimap-canvas')
    this.speedValue = document.querySelector('#speedometer .speed-value')

    // Initialize minimap
    this.setupMinimap()
  }

  setupMinimap() {
    if (!this.minimapCanvas) return

    this.minimapCanvas.width = 150
    this.minimapCanvas.height = 150
    this.minimapCtx = this.minimapCanvas.getContext('2d')
  }

  update(delta) {
    this.updateMinimap()
    this.updateSpeedometer()
  }

  updateSpeedometer() {
    if (!this.speedValue) return

    const vehicle = this.game.vehicle
    if (!vehicle) return

    // Convert internal speed to a display value (multiply for visual effect)
    const speed = Math.abs(vehicle.currentSpeed) * 60
    this.speedValue.textContent = Math.round(speed)
  }

  updateMinimap() {
    if (!this.minimapCtx) return

    const ctx = this.minimapCtx
    const width = this.minimapCanvas.width
    const height = this.minimapCanvas.height
    const scale = 0.7 // pixels per world unit

    // Clear
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
    ctx.fillRect(0, 0, width, height)

    // Center of minimap
    const centerX = width / 2
    const centerY = height / 2

    // Draw zones
    const zoneManager = this.game.zoneManager
    if (zoneManager) {
      for (const zone of zoneManager.zones) {
        const x = centerX + zone.position.x * scale
        const y = centerY + zone.position.z * scale

        // Zone circle
        ctx.beginPath()
        ctx.arc(x, y, zone.radius * scale, 0, Math.PI * 2)
        ctx.fillStyle = zone.isActive
          ? `#${zone.color.toString(16).padStart(6, '0')}`
          : 'rgba(255, 255, 255, 0.2)'
        ctx.fill()

        // Zone label
        ctx.fillStyle = '#fff'
        ctx.font = '8px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(zone.id.toUpperCase(), x, y + 3)
      }
    }

    // Draw vehicle
    const vehicle = this.game.vehicle
    if (vehicle && vehicle.mesh) {
      const vx = centerX + vehicle.mesh.position.x * scale
      const vy = centerY + vehicle.mesh.position.z * scale

      // Vehicle direction
      ctx.save()
      ctx.translate(vx, vy)
      ctx.rotate(vehicle.mesh.rotation.y)

      // Draw as triangle pointing forward
      ctx.beginPath()
      ctx.moveTo(0, -6)
      ctx.lineTo(-4, 4)
      ctx.lineTo(4, 4)
      ctx.closePath()
      ctx.fillStyle = '#ff6b6b'
      ctx.fill()

      ctx.restore()
    }

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, width, height)
  }

  showZonePanel(content) {
    if (!this.zonePanel || !content) return

    this.zoneTitle.textContent = content.title || ''
    this.zoneBody.innerHTML = content.body || ''

    this.zonePanel.classList.remove('hidden')
  }

  hideZonePanel() {
    if (!this.zonePanel) return

    this.zonePanel.classList.add('hidden')
  }
}
