import WidgetKit
import SwiftUI

// PRD FIX v0.3.30 Part E1 (Widget): Home Screen & Lock Screen Widget with Timeline Generation
struct WidgetScheduleItem: Codable {
    let title: String
    let subtitle: String
    let startTimestamp: Double
    let targetTimestamp: Double
    let mode: String           // "task" | "gap" | "template_or_current"
    let isCountDown: Bool
}

struct TAIOTimelineEntry: TimelineEntry {
    let date: Date
    let item: WidgetScheduleItem
}

struct TAIOProvider: TimelineProvider {
    typealias Entry = TAIOTimelineEntry

    private func defaultItem() -> WidgetScheduleItem {
        let now = Date().timeIntervalSince1970
        return WidgetScheduleItem(
            title: "TAIO Time",
            subtitle: "Đồng hồ tập trung",
            startTimestamp: now,
            targetTimestamp: now + 3600,
            mode: "template_or_current",
            isCountDown: false
        )
    }

    func placeholder(in context: Context) -> TAIOTimelineEntry {
        TAIOTimelineEntry(date: Date(), item: defaultItem())
    }

    func getSnapshot(in context: Context, completion: @escaping (TAIOTimelineEntry) -> Void) {
        let entry = TAIOTimelineEntry(date: Date(), item: loadCurrentItem())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TAIOTimelineEntry>) -> Void) {
        let items = loadAllItems()
        let now = Date()
        var entries: [TAIOTimelineEntry] = []

        if items.isEmpty {
            entries.append(TAIOTimelineEntry(date: now, item: defaultItem()))
        } else {
            // Build timeline entries for each schedule boundary
            for item in items {
                let startDate = Date(timeIntervalSince1970: item.startTimestamp)
                let targetDate = Date(timeIntervalSince1970: item.targetTimestamp)
                // Include if in the future or currently active
                if targetDate > now {
                    let entryDate = startDate > now ? startDate : now
                    entries.append(TAIOTimelineEntry(date: entryDate, item: item))
                }
            }
            if entries.isEmpty {
                entries.append(TAIOTimelineEntry(date: now, item: defaultItem()))
            }
        }

        // Reload at end of current timeline or after 15 minutes
        let nextReload = Calendar.current.date(byAdding: .minute, value: 15, to: now) ?? now.addingTimeInterval(900)
        let timeline = Timeline(entries: entries, policy: .after(nextReload))
        completion(timeline)
    }

    private func loadCurrentItem() -> WidgetScheduleItem {
        let items = loadAllItems()
        let now = Date().timeIntervalSince1970
        for item in items {
            if now >= item.startTimestamp && now < item.targetTimestamp {
                return item
            }
        }
        return items.first ?? defaultItem()
    }

    private func loadAllItems() -> [WidgetScheduleItem] {
        let userDefaults = UserDefaults(suiteName: "group.club.taio.timeapp") ?? UserDefaults.standard
        guard let jsonString = userDefaults.string(forKey: "taio_widget_schedule"),
              let data = jsonString.data(using: .utf8) else {
            return []
        }
        do {
            return try JSONDecoder().decode([WidgetScheduleItem].self, from: data)
        } catch {
            return []
        }
    }
}

struct TAIOWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: TAIOProvider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            smallWidgetView
        case .systemMedium:
            mediumWidgetView
        #if os(iOS)
        case .accessoryRectangular:
            accessoryRectangularView
        case .accessoryInline:
            accessoryInlineView
        #endif
        default:
            smallWidgetView
        }
    }

    private var smallWidgetView: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Circle()
                    .fill(statusColor)
                    .frame(width: 8, height: 8)
                Text(modeLabel)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
                Spacer()
            }

            Spacer()

            Text(entry.item.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.primary)
                .lineLimit(2)

            if entry.item.isCountDown && entry.item.targetTimestamp > entry.item.startTimestamp {
                Text(
                    timerInterval: Date(timeIntervalSince1970: entry.item.startTimestamp)...Date(timeIntervalSince1970: entry.item.targetTimestamp),
                    countsDown: true
                )
                .font(.system(size: 20, weight: .black, design: .monospaced))
                .foregroundColor(statusColor)
            } else {
                Text(entry.item.subtitle)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(12)
        .containerBackground(Color.white, for: .widget)
    }

    private var mediumWidgetView: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 8, height: 8)
                    Text(modeLabel)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)
                }

                Text(entry.item.title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.primary)
                    .lineLimit(2)

                Text(entry.item.subtitle)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                if entry.item.isCountDown && entry.item.targetTimestamp > entry.item.startTimestamp {
                    Text(
                        timerInterval: Date(timeIntervalSince1970: entry.item.startTimestamp)...Date(timeIntervalSince1970: entry.item.targetTimestamp),
                        countsDown: true
                    )
                    .font(.system(size: 22, weight: .black, design: .monospaced))
                    .foregroundColor(statusColor)

                    Text("còn lại")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                } else {
                    Text(Date(), style: .time)
                        .font(.system(size: 22, weight: .black, design: .monospaced))
                        .foregroundColor(.primary)
                }
            }
        }
        .padding(14)
        .containerBackground(Color.white, for: .widget)
    }

    #if os(iOS)
    private var accessoryRectangularView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.item.title)
                .font(.system(size: 12, weight: .bold))
                .lineLimit(1)
            if entry.item.isCountDown && entry.item.targetTimestamp > entry.item.startTimestamp {
                Text(
                    timerInterval: Date(timeIntervalSince1970: entry.item.startTimestamp)...Date(timeIntervalSince1970: entry.item.targetTimestamp),
                    countsDown: true
                )
                .font(.system(size: 14, weight: .black, design: .monospaced))
            } else {
                Text(entry.item.subtitle)
                    .font(.system(size: 10))
                    .lineLimit(1)
            }
        }
        .containerBackground(Color.clear, for: .widget)
    }

    private var accessoryInlineView: some View {
        HStack(spacing: 2) {
            Text(entry.item.title)
            if entry.item.isCountDown && entry.item.targetTimestamp > entry.item.startTimestamp {
                Text("•")
                Text(
                    timerInterval: Date(timeIntervalSince1970: entry.item.startTimestamp)...Date(timeIntervalSince1970: entry.item.targetTimestamp),
                    countsDown: true
                )
            }
        }
        .containerBackground(Color.clear, for: .widget)
    }
    #endif

    private var statusColor: Color {
        if entry.item.mode == "task" {
            return Color(red: 0.88, green: 0.25, blue: 0.12)
        } else if entry.item.mode == "gap" {
            return Color(red: 0.15, green: 0.68, blue: 0.38)
        } else {
            return Color(red: 0.25, green: 0.45, blue: 0.88)
        }
    }

    private var modeLabel: String {
        if entry.item.mode == "task" {
            return "Đang làm"
        } else if entry.item.mode == "gap" {
            return "Khoảng trống"
        } else {
            return "TAIO Time"
        }
    }
}

// Widget definition
struct TAIOWidget: Widget {
    let kind: String = "TAIOWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TAIOProvider()) { entry in
            TAIOWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Đồng hồ TAIO Time")
        .description("Hiển thị công việc hiện tại và thời gian còn lại.")
        #if os(iOS)
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
        #else
        .supportedFamilies([.systemSmall, .systemMedium])
        #endif
    }
}
