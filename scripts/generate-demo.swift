import AppKit
import ImageIO
import UniformTypeIdentifiers

let width = 720
let height = 405
let frameCount = 60
let outputURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  .appendingPathComponent("assets/video-hotkeys-demo.gif")

let destination = CGImageDestinationCreateWithURL(
  outputURL as CFURL,
  UTType.gif.identifier as CFString,
  frameCount,
  nil
)!

CGImageDestinationSetProperties(destination, [
  kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]
] as CFDictionary)

let background = NSColor(calibratedRed: 0.96, green: 0.95, blue: 0.90, alpha: 1)
let ink = NSColor(calibratedRed: 0.09, green: 0.13, blue: 0.11, alpha: 1)
let muted = NSColor(calibratedRed: 0.35, green: 0.39, blue: 0.36, alpha: 1)
let orange = NSColor(calibratedRed: 0.85, green: 0.31, blue: 0.18, alpha: 1)
let green = NSColor(calibratedRed: 0.28, green: 0.62, blue: 0.39, alpha: 1)

func drawText(_ text: String, at point: NSPoint, size: CGFloat, color: NSColor, weight: NSFont.Weight = .regular) {
  text.draw(at: point, withAttributes: [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: color
  ])
}

func fillRoundedRect(_ rect: NSRect, radius: CGFloat, color: NSColor) {
  color.setFill()
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).fill()
}

func drawKey(_ label: String, x: CGFloat, y: CGFloat, width: CGFloat = 92) {
  fillRoundedRect(NSRect(x: x, y: y, width: width, height: 42), radius: 5, color: .white)
  ink.setStroke()
  let border = NSBezierPath(roundedRect: NSRect(x: x, y: y, width: width, height: 42), xRadius: 5, yRadius: 5)
  border.lineWidth = 2
  border.stroke()
  let textSize = label.size(withAttributes: [.font: NSFont.systemFont(ofSize: 15, weight: .bold)])
  drawText(label, at: NSPoint(x: x + (width - textSize.width) / 2, y: y + 12), size: 15, color: ink, weight: .bold)
}

func drawLandscape(frame: Int) {
  let sceneRect = NSRect(x: 48, y: 105, width: 624, height: 189)
  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: sceneRect, xRadius: 4, yRadius: 4).addClip()

  NSColor(calibratedRed: 0.42, green: 0.68, blue: 0.77, alpha: 1).setFill()
  sceneRect.fill()

  let drift = CGFloat(frame) * 0.35
  let sunX = 514 + sin(Double(frame) * 0.04) * 3
  NSColor(calibratedRed: 1, green: 0.82, blue: 0.55, alpha: 1).setFill()
  NSBezierPath(ovalIn: NSRect(x: sunX, y: 232, width: 32, height: 32)).fill()

  let distantRidge = NSBezierPath()
  distantRidge.move(to: NSPoint(x: 48, y: 155))
  distantRidge.line(to: NSPoint(x: 142, y: 231))
  distantRidge.line(to: NSPoint(x: 208, y: 180))
  distantRidge.line(to: NSPoint(x: 302, y: 248))
  distantRidge.line(to: NSPoint(x: 402, y: 169))
  distantRidge.line(to: NSPoint(x: 492, y: 224))
  distantRidge.line(to: NSPoint(x: 574, y: 174))
  distantRidge.line(to: NSPoint(x: 672, y: 221))
  distantRidge.line(to: NSPoint(x: 672, y: 105))
  distantRidge.line(to: NSPoint(x: 48, y: 105))
  distantRidge.close()
  NSColor(calibratedRed: 0.33, green: 0.52, blue: 0.57, alpha: 1).setFill()
  distantRidge.fill()

  let nearRidge = NSBezierPath()
  nearRidge.move(to: NSPoint(x: 48, y: 142))
  nearRidge.line(to: NSPoint(x: 130, y: 192))
  nearRidge.line(to: NSPoint(x: 231, y: 153))
  nearRidge.line(to: NSPoint(x: 339, y: 202))
  nearRidge.line(to: NSPoint(x: 454, y: 150))
  nearRidge.line(to: NSPoint(x: 566, y: 190))
  nearRidge.line(to: NSPoint(x: 672, y: 148))
  nearRidge.line(to: NSPoint(x: 672, y: 105))
  nearRidge.line(to: NSPoint(x: 48, y: 105))
  nearRidge.close()
  NSColor(calibratedRed: 0.14, green: 0.35, blue: 0.32, alpha: 1).setFill()
  nearRidge.fill()

  NSColor(calibratedRed: 0.34, green: 0.62, blue: 0.56, alpha: 1).setStroke()
  for index in 0..<7 {
    let y = CGFloat(111 + index * 5)
    let waterLine = NSBezierPath()
    waterLine.lineWidth = 1.2
    waterLine.move(to: NSPoint(x: 68 + (drift + CGFloat(index * 37)).truncatingRemainder(dividingBy: 82), y: y))
    waterLine.curve(to: NSPoint(x: 650, y: y), controlPoint1: NSPoint(x: 280, y: y + 3), controlPoint2: NSPoint(x: 430, y: y - 2))
    waterLine.stroke()
  }

  NSGraphicsContext.restoreGraphicsState()
}

for frame in 0..<frameCount {
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
    bitsPerPixel: 0
  )!
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

  background.setFill()
  NSRect(x: 0, y: 0, width: width, height: height).fill()

  drawText("VIDEO HOTKEYS", at: NSPoint(x: 34, y: 362), size: 12, color: orange, weight: .bold)
  drawText("Control the video you're watching", at: NSPoint(x: 34, y: 329), size: 24, color: ink, weight: .bold)

  fillRoundedRect(NSRect(x: 34, y: 72, width: 652, height: 236), radius: 7, color: ink)

  let videoProgress: CGFloat
  if frame < 18 {
    videoProgress = 0.30
  } else if frame < 38 {
    videoProgress = 0.52
  } else {
    videoProgress = 0.65
  }

  drawLandscape(frame: frame)

  muted.setFill()
  NSRect(x: 56, y: 87, width: 608, height: 5).fill()
  green.setFill()
  NSRect(x: 56, y: 87, width: 608 * videoProgress, height: 5).fill()
  drawText("▶", at: NSPoint(x: 56, y: 66), size: 15, color: .white, weight: .bold)
  drawText(frame < 18 ? "02:14" : frame < 38 ? "02:22" : "02:36", at: NSPoint(x: 84, y: 68), size: 12, color: .white, weight: .medium)

  if frame >= 8 && frame < 25 {
    fillRoundedRect(NSRect(x: 238, y: 165, width: 244, height: 70), radius: 6, color: background.withAlphaComponent(0.96))
    drawKey("Right Arrow", x: 256, y: 179, width: 125)
    drawText("+ 5s", at: NSPoint(x: 396, y: 191), size: 16, color: ink, weight: .bold)
  } else if frame >= 25 && frame < 43 {
    fillRoundedRect(NSRect(x: 256, y: 165, width: 208, height: 70), radius: 6, color: background.withAlphaComponent(0.96))
    drawKey("Shift + >", x: 274, y: 179, width: 112)
    drawText("1.25×", at: NSPoint(x: 400, y: 191), size: 16, color: ink, weight: .bold)
  } else if frame >= 43 {
    fillRoundedRect(NSRect(x: 183, y: 158, width: 354, height: 84), radius: 6, color: background.withAlphaComponent(0.97))
    drawText("1 permission", at: NSPoint(x: 211, y: 201), size: 18, color: green, weight: .bold)
    drawText("0 network requests", at: NSPoint(x: 211, y: 174), size: 18, color: ink, weight: .bold)
  }

  if frame >= 3 && frame < 14 {
    drawText("PLAYING VIDEO SELECTED", at: NSPoint(x: 483, y: 277), size: 10, color: .white, weight: .bold)
    green.setStroke()
    let selectedBorder = NSBezierPath(roundedRect: NSRect(x: 48, y: 105, width: 624, height: 189), xRadius: 4, yRadius: 4)
    selectedBorder.lineWidth = 4
    selectedBorder.stroke()
  }

  NSGraphicsContext.restoreGraphicsState()

  if let image = bitmap.cgImage {
    CGImageDestinationAddImage(destination, image, [
      kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFDelayTime: 0.1]
    ] as CFDictionary)
  }
}

guard CGImageDestinationFinalize(destination) else {
  fatalError("Could not write demo GIF")
}

print("Created \(outputURL.path) with \(frameCount) frames")