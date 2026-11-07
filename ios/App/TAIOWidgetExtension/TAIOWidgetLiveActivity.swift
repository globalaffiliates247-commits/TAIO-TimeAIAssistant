import WidgetKit
import SwiftUI
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
struct TAIOWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TAIOTimerAttributes.self) { context in
            // Lock Screen / Banner UI
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.25), lineWidth: 5)
                        .frame(width: 48, height: 48)
                    Circle()
                        .trim(from: 0, to: 0.72)
                        .stroke(Color(red: 0.88, green: 0.25, blue: 0.12), style: StrokeStyle(lineWidth: 5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 48, height: 48)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.taskTitle)
                        .font(.system(size: 14, weight: .bold))
                        .lineLimit(1)
                    Text(context.state.goalName)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text(
                        timerInterval: Date(timeIntervalSince1970: context.state.startTimestamp)...Date(timeIntervalSince1970: context.state.targetTimestamp),
                        countsDown: context.state.isCountDown
                    )
                    .monospacedDigit()
                    .font(.system(size: 18, weight: .black))
                    .foregroundColor(Color(red: 0.88, green: 0.25, blue: 0.12))

                    Text(context.state.remainingMinutes < 60 ? "phút : giây" : "giờ : phút")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.secondary)
                }
            }
            .padding(14)
            .activityBackgroundTint(Color.white)
            .activitySystemActionForegroundColor(Color.black)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.goalName)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(
                        timerInterval: Date(timeIntervalSince1970: context.state.startTimestamp)...Date(timeIntervalSince1970: context.state.targetTimestamp),
                        countsDown: context.state.isCountDown
                    )
                    .monospacedDigit()
                    .font(.caption)
                    .fontWeight(.bold)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.taskTitle)
                        .font(.footnote)
                        .fontWeight(.bold)
                        .lineLimit(1)
                }
            } compactLeading: {
                Text("TAIO")
                    .font(.caption2)
                    .fontWeight(.black)
            } compactTrailing: {
                Text("\(context.state.remainingMinutes)p")
                    .monospacedDigit()
                    .font(.caption2)
                    .fontWeight(.bold)
            } minimal: {
                Text("T")
                    .font(.caption2)
                    .fontWeight(.black)
            }
        }
    }
}
#endif
