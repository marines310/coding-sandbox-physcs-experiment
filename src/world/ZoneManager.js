import * as THREE from 'three'
import { Game } from '../core/Game.js'

/**
 * Zone - A trigger area that shows content when the player enters
 */
class Zone {
  constructor(config) {
    this.id = config.id
    this.position = new THREE.Vector3(config.x, 0, config.z)
    this.radius = config.radius || 8
    this.title = config.title
    this.content = config.content
    this.color = config.color || 0x4facfe

    // State
    this.isActive = false
    this.mesh = null

    // Create visual marker
    this.createMarker()
  }

  createMarker() {
    const game = Game.getInstance()

    // Ground circle
    const circleGeometry = new THREE.RingGeometry(this.radius - 0.5, this.radius, 32)
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: this.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    })
    const circle = new THREE.Mesh(circleGeometry, circleMaterial)
    circle.rotation.x = -Math.PI / 2
    circle.position.copy(this.position)
    circle.position.y = 0.1
    game.add(circle)

    // Center pillar/beacon
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8)
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3
    })
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
    pillar.position.copy(this.position)
    pillar.position.y = 1.5
    pillar.castShadow = true
    game.add(pillar)

    // Floating label
    this.createLabel()

    this.mesh = pillar
  }

  createLabel() {
    // Create canvas for text
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')

    // Draw text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.title, 128, 32)

    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.copy(this.position)
    sprite.position.y = 4
    sprite.scale.set(4, 1, 1)

    Game.getInstance().add(sprite)
  }

  checkPlayerInside(playerPosition) {
    const distance = this.position.distanceTo(
      new THREE.Vector3(playerPosition.x, 0, playerPosition.z)
    )
    return distance < this.radius
  }

  setActive(active) {
    if (this.isActive === active) return

    this.isActive = active

    // Animate the pillar
    if (this.mesh) {
      this.mesh.scale.y = active ? 1.5 : 1
      this.mesh.material.emissiveIntensity = active ? 0.8 : 0.3
    }
  }
}

/**
 * ZoneManager - Manages all content zones
 */
export class ZoneManager {
  constructor() {
    this.game = Game.getInstance()
    this.zones = []
    this.activeZone = null

    // Create default portfolio zones
    this.createZones()
  }

  createZones() {
    // Define your portfolio sections here!
    const zoneConfigs = [
      {
        id: 'about',
        x: 0,
        z: -20,
        radius: 10,
        title: 'ABOUT',
        color: 0x4facfe,
        content: {
          title: 'About Me',
          body: `
            <p>Welcome to my interactive portfolio!</p>
            <p>I'm a developer passionate about creating unique web experiences.</p>
            <p>Drive around to explore my work and learn more about what I do.</p>
          `
        }
      },
      {
        id: 'projects',
        x: 30,
        z: 0,
        radius: 10,
        title: 'PROJECTS',
        color: 0x00f2fe,
        content: {
          title: 'My Projects',
          body: `
            <ul>
              <li><strong>Project 1</strong> - Description here</li>
              <li><strong>Project 2</strong> - Description here</li>
              <li><strong>Project 3</strong> - Description here</li>
            </ul>
          `
        }
      },
      {
        id: 'skills',
        x: -30,
        z: 0,
        radius: 10,
        title: 'SKILLS',
        color: 0xa855f7,
        content: {
          title: 'Skills & Tech',
          body: `
            <ul>
              <li>JavaScript / TypeScript</li>
              <li>React / Vue / Three.js</li>
              <li>Node.js / Python</li>
              <li>WebGL / Shaders</li>
            </ul>
          `
        }
      },
      {
        id: 'contact',
        x: 0,
        z: 30,
        radius: 10,
        title: 'CONTACT',
        color: 0xf472b6,
        content: {
          title: 'Get In Touch',
          body: `
            <p>I'd love to hear from you!</p>
            <p><a href="mailto:your@email.com">your@email.com</a></p>
            <p><a href="https://github.com/yourusername" target="_blank">GitHub</a></p>
            <p><a href="https://linkedin.com/in/yourusername" target="_blank">LinkedIn</a></p>
          `
        }
      }
    ]

    for (const config of zoneConfigs) {
      this.zones.push(new Zone(config))
    }
  }

  update(delta) {
    const vehicle = this.game.vehicle
    if (!vehicle) return

    const playerPos = vehicle.getPosition()
    let newActiveZone = null

    // Check which zone the player is in
    for (const zone of this.zones) {
      const isInside = zone.checkPlayerInside(playerPos)
      zone.setActive(isInside)

      if (isInside) {
        newActiveZone = zone
      }
    }

    // Update UI if zone changed
    if (newActiveZone !== this.activeZone) {
      this.activeZone = newActiveZone

      if (this.game.ui) {
        if (newActiveZone) {
          this.game.ui.showZonePanel(newActiveZone.content)
        } else {
          this.game.ui.hideZonePanel()
        }
      }
    }
  }

  getActiveZone() {
    return this.activeZone
  }
}
