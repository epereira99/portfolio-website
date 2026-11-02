// Extracts frames first...last (inclusive, at the video's own fps) as PNGs named 000.png, 001.png, …
// usage: swift tools/walk/frames.swift <video> <outDir> <first> <last>
// AVFoundation ships with macOS, so no ffmpeg is needed.
import AVFoundation
import AppKit

let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let out = args[2], first = Int(args[3])!, last = Int(args[4])!
let fps = Double(asset.tracks(withMediaType: .video)[0].nominalFrameRate)
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.appliesPreferredTrackTransform = true
for n in first...last {
  let img = try gen.copyCGImage(at: CMTime(seconds: Double(n) / fps, preferredTimescale: 600), actualTime: nil)
  let png = NSBitmapImageRep(cgImage: img).representation(using: .png, properties: [:])!
  try png.write(to: URL(fileURLWithPath: String(format: "%@/%03d.png", out, n - first)))
}
