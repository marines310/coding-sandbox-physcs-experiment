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
    // --- Edit these to update your site's content ---
    const BLOG_URL = 'https://your-blog-url.com' // TODO: replace with your real blog/Substack/Medium URL
    const EMAIL = 'skhylee0416@gmail.com'
    const LINKEDIN_URL = 'https://www.linkedin.com/in/mikeshlee'
    const GITHUB_URL = 'https://github.com/marines310'

    const zoneConfigs = [
      {
        id: 'about',
        x: 0,
        z: -20,
        radius: 10,
        title: 'ABOUT',
        color: 0x4facfe,
        content: {
          title: "'Mike' Sukhyung Lee, PMP",
          body: `
            <p><strong>Product &amp; Venture Strategy Leader</strong> — Financial Services, AI</p>
            <p>New Business Building · GTM · 0→1 Initiatives · Partnerships · Global Expansion</p>
            <p>San Francisco, CA</p>
            <p>AI product, project management, and corporate innovation leader with 10+ years of experience building new ventures, digital products, and operating models across financial services, AI, e-commerce, healthcare, defense, and corporate venture environments.</p>
            <p>Currently leading project management standards and deputy operations for Hanwha AI Center, supporting AI initiatives across Hanwha's financial subsidiaries.</p>
          `
        }
      },
      {
        id: 'projects',
        x: 30,
        z: 0,
        radius: 10,
        title: 'EXPERIENCE',
        color: 0x00f2fe,
        content: {
          title: 'Ventures & Experience',
          body: `
            <ul>
              <li><strong>Head of PMO, Hanwha AI Center</strong> (2025–Present) — Leading New Product Development practice; deputy for operations overseeing a $20M budget; scaled to 6–10 projects/year targeting an $800M market (4x throughput).</li>
              <li><strong>Interim COO, Hanwha AI Center</strong> (Jan–Jun 2025) — Stood up a new joint AI R&D center across Hanwha's financial subsidiaries; grew the management team 4x; oversaw a $12M annual budget.</li>
              <li><strong>Head of Ops &amp; PMO, Hanwha Life Digital Lab (DREAMPLUS SF)</strong> (2019–2024) — Founding member; developed new business opportunities in healthcare, cyber, investments, and mobility; bridged SF and Korea HQ.</li>
              <li><strong>DREAMPLUS Alliance</strong> — Built a network of 13 accelerators and VCs across 12 nations to help startups expand into new markets.</li>
              <li><strong>Republic of Korea Air Force</strong> — First Lieutenant, Command Staff &amp; Crisis Action Group (2010–2013).</li>
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
          title: 'Skills & Certifications',
          body: `
            <ul>
              <li>Agile Project Management &amp; Administration</li>
              <li>Project Management Professional (PMP)®</li>
              <li>Professional Scrum Master™ I (PSM I)</li>
              <li>Generative AI &amp; Prompt Engineering for Project Managers</li>
              <li>0→1 Venture Building, GTM, Partnerships, Global Expansion</li>
              <li>Bilingual — Korean &amp; English (native/bilingual)</li>
            </ul>
          `
        }
      },
      {
        id: 'blog',
        x: 30,
        z: -25,
        radius: 10,
        title: 'BLOG',
        color: 0xfbbf24,
        content: {
          title: 'Writing',
          body: `
            <p>Notes on AI product strategy, venture building, and lessons from launching innovation centers.</p>
            <p><a href="${BLOG_URL}" target="_blank" rel="noopener">Read the blog →</a></p>
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
            <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
            <p><a href="${LINKEDIN_URL}" target="_blank" rel="noopener">LinkedIn</a></p>
            <p><a href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub</a></p>
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
