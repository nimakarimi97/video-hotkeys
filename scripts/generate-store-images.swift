import AppKit
import ImageIO

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let assets = root.appendingPathComponent("assets")
let iconURL = root.appendingPathComponent("icons/icon-128.png")
let popupURL = assets.appendingPathComponent("popup-preview.png")
let demoURL = assets.appendingPathComponent("video-hotkeys-demo.gif")

func color(_ hex: UInt32) -> NSColor {
  NSColor(
    calibratedRed: CGFloat((hex >> 16) & 0xff) / 255,
    green: CGFloat((hex >> 8) & 0xff) / 255,
    blue: CGFloat(hex & 0xff) / 255,
    alpha: 1
  )
}

let paper = color(0xf4f1e8)
let white = color(0xfffdf7)
let ink = color(0x17211b)
let muted = color(0x576159)
let orange = color(0xd96543)
let green = color(0x71b780)
let paleGreen = color(0xe4eee2)
let line = color(0xd2cec2)

func text(
  _ value: String,
  x: CGFloat,
  y: CGFloat,
  size: CGFloat,
  weight: NSFont.Weight = .regular,
  color: NSColor = ink
) {
  value.draw(
    at: NSPoint(x: x, y: y),
    withAttributes: [
      .font: NSFont.systemFont(ofSize: size, weight: weight),
      .foregroundColor: color
    ]
  )
}

func rounded(_ rect: NSRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, lineWidth: CGFloat = 1) {
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  fill.setFill()
  path.fill()
  if let stroke {
    stroke.setStroke()
    path.lineWidth = lineWidth
    path.stroke()
  }
}

func drawImage(_ image: CGImage, in rect: NSRect, radius: CGFloat = 0) {
  NSGraphicsContext.saveGraphicsState()
  if radius > 0 {
    NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()
  }
  NSImage(cgImage: image, size: rect.size).draw(in: rect)
  NSGraphicsContext.restoreGraphicsState()
}

func loadImage(_ url: URL, frame: Int = 0) -> CGImage {
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, frame, nil) else {
    fatalError("Could not load image at \(url.path)")
  }
  return image
}

func savePNG(width: Int, height: Int, name: String, drawing: () -> Void) {
  let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: width,
    pixelsHigh: height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 32
  )!

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
  paper.setFill()
  NSRect(x: 0, y: 0, width: width, height: height).fill()
  drawing()
  NSGraphicsContext.restoreGraphicsState()

  guard let data = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Could not encode \(name)")
  }
  do {
    try data.write(to: assets.appendingPathComponent(name))
  } catch {
    fatalError("Could not write \(name): \(error)")
  }
}

let icon = loadImage(iconURL)
let popup = loadImage(popupURL)
let demo = loadImage(demoURL, frame: 15)

savePNG(width: 1280, height: 800, name: "store-screenshot-1.png") {
  drawImage(icon, in: NSRect(x: 70, y: 704, width: 54, height: 54), radius: 12)
  text("VIDEO HOTKEYS", x: 140, y: 731, size: 16, weight: .bold, color: orange)
  text("Shortcuts for the video you're watching", x: 70, y: 650, size: 38, weight: .bold)
  text("Seek, change speed, and control playback without reaching for the player.", x: 72, y: 616, size: 18, color: muted)

  rounded(NSRect(x: 64, y: 136, width: 760, height: 438), radius: 18, fill: white, stroke: line, lineWidth: 2)
  drawImage(demo, in: NSRect(x: 82, y: 146, width: 724, height: 407), radius: 9)

  rounded(NSRect(x: 852, y: 126, width: 362, height: 488), radius: 20, fill: white, stroke: line, lineWidth: 2)
  drawImage(popup, in: NSRect(x: 863, y: 135, width: 340, height: 470), radius: 12)

  rounded(NSRect(x: 66, y: 54, width: 1148, height: 54), radius: 15, fill: paleGreen)
  text("Right Arrow", x: 96, y: 73, size: 16, weight: .bold)
  text("= seek 5 seconds", x: 211, y: 73, size: 16, color: muted)
  text("Shift + >", x: 470, y: 73, size: 16, weight: .bold)
  text("= speed up", x: 572, y: 73, size: 16, color: muted)
  text("P", x: 792, y: 73, size: 16, weight: .bold)
  text("= Picture-in-Picture", x: 818, y: 73, size: 16, color: muted)
}

savePNG(width: 1280, height: 800, name: "store-screenshot-2.png") {
  drawImage(icon, in: NSRect(x: 70, y: 704, width: 54, height: 54), radius: 12)
  text("VIDEO HOTKEYS", x: 140, y: 731, size: 16, weight: .bold, color: orange)
  text("Your shortcuts. Your settings.", x: 70, y: 650, size: 38, weight: .bold)
  text("Make playback controls fit the way you watch.", x: 72, y: 616, size: 18, color: muted)

  rounded(NSRect(x: 66, y: 184, width: 560, height: 376), radius: 24, fill: white, stroke: line, lineWidth: 2)
  text("MAKE IT YOURS", x: 100, y: 510, size: 14, weight: .bold, color: orange)
  text("Choose your seek intervals", x: 100, y: 468, size: 25, weight: .bold)
  text("Set short and long jumps, then use the keys", x: 100, y: 433, size: 17, color: muted)
  text("that feel natural.", x: 100, y: 408, size: 17, color: muted)

  rounded(NSRect(x: 100, y: 286, width: 218, height: 78), radius: 14, fill: paper, stroke: line, lineWidth: 1)
  text("SHORT SEEK", x: 120, y: 336, size: 12, weight: .bold, color: muted)
  text("5 seconds", x: 120, y: 304, size: 23, weight: .bold)
  rounded(NSRect(x: 342, y: 286, width: 238, height: 78), radius: 14, fill: paper, stroke: line, lineWidth: 1)
  text("LONG SEEK", x: 362, y: 336, size: 12, weight: .bold, color: muted)
  text("15 seconds", x: 362, y: 304, size: 23, weight: .bold)

  rounded(NSRect(x: 100, y: 220, width: 480, height: 42), radius: 12, fill: paleGreen)
  text("Preferences stay in your browser", x: 122, y: 233, size: 16, weight: .semibold, color: ink)

  rounded(NSRect(x: 676, y: 184, width: 538, height: 376), radius: 24, fill: ink)
  text("PRIVATE BY DESIGN", x: 718, y: 510, size: 14, weight: .bold, color: green)
  text("One permission.", x: 718, y: 444, size: 34, weight: .bold, color: white)
  text("Zero network requests.", x: 718, y: 400, size: 30, weight: .bold, color: white)
  rounded(NSRect(x: 718, y: 320, width: 454, height: 1), radius: 1, fill: color(0x435047))
  text("No analytics or tracking", x: 718, y: 276, size: 19, weight: .medium, color: white)
  text("No account required", x: 718, y: 240, size: 19, weight: .medium, color: white)

  rounded(NSRect(x: 66, y: 86, width: 1148, height: 54), radius: 15, fill: paleGreen)
  text("Arrow keys", x: 98, y: 105, size: 16, weight: .bold)
  text("seek", x: 208, y: 105, size: 16, color: muted)
  text("Shift + < >", x: 378, y: 105, size: 16, weight: .bold)
  text("adjust speed", x: 486, y: 105, size: 16, color: muted)
  text("P", x: 728, y: 105, size: 16, weight: .bold)
  text("PiP", x: 754, y: 105, size: 16, color: muted)
  text("F", x: 914, y: 105, size: 16, weight: .bold)
  text("fullscreen", x: 940, y: 105, size: 16, color: muted)
}

savePNG(width: 440, height: 280, name: "store-promo-small.png") {
  let deep = color(0x17211b)
  deep.setFill()
  NSRect(x: 0, y: 0, width: 440, height: 280).fill()

  drawImage(icon, in: NSRect(x: 32, y: 154, width: 92, height: 92), radius: 20)
  text("VIDEO", x: 154, y: 199, size: 19, weight: .bold, color: green)
  text("HOTKEYS", x: 154, y: 169, size: 26, weight: .bold, color: white)
  rounded(NSRect(x: 34, y: 55, width: 372, height: 1), radius: 1, fill: color(0x435047))
  text("Control playback with a keystroke.", x: 34, y: 27, size: 17, weight: .medium, color: white)
}

print("Created two 1280x800 screenshots and one 440x280 promo tile in assets/.")
