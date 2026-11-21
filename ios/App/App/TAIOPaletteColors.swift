// TAIO Time App — Palette Colors for Native iOS (PRD v0.3.50 Part B3)
// Note: Keep in sync with src/types/index.ts and scripts/build-css.js
import SwiftUI

public enum TAIOPaletteColors {
    public static func color(for palette: String?) -> Color {
        switch palette?.lowercased() {
        case "bright-blue", "cool":
            return Color(red: 0.0 / 255.0, green: 104.0 / 255.0, blue: 255.0 / 255.0) // #0068FF
        case "calm-blue", "calm":
            return Color(red: 28.0 / 255.0, green: 120.0 / 255.0, blue: 192.0 / 255.0) // #1C78C0
        case "gold":
            return Color(red: 247.0 / 255.0, green: 197.0 / 255.0, blue: 49.0 / 255.0) // #F7C531
        case "neutral":
            return Color(red: 100.0 / 255.0, green: 116.0 / 255.0, blue: 139.0 / 255.0) // #64748B
        default:
            // "red", "warm", or fallback: #E11D2E (TAIO Brand Red)
            return Color(red: 225.0 / 255.0, green: 29.0 / 255.0, blue: 46.0 / 255.0)
        }
    }
}
