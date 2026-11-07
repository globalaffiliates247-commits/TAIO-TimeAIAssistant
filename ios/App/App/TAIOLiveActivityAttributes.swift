import Foundation
#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct TAIOTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var taskTitle: String
        public var goalName: String
        public var isCountDown: Bool
        public var targetTimestamp: Double
        public var startTimestamp: Double
        public var totalMinutes: Int
        public var remainingMinutes: Int
        public var isPaused: Bool

        public init(
            taskTitle: String,
            goalName: String,
            isCountDown: Bool,
            targetTimestamp: Double,
            startTimestamp: Double,
            totalMinutes: Int,
            remainingMinutes: Int,
            isPaused: Bool
        ) {
            self.taskTitle = taskTitle
            self.goalName = goalName
            self.isCountDown = isCountDown
            self.targetTimestamp = targetTimestamp
            self.startTimestamp = startTimestamp
            self.totalMinutes = totalMinutes
            self.remainingMinutes = remainingMinutes
            self.isPaused = isPaused
        }
    }

    public var blockId: String

    public init(blockId: String) {
        self.blockId = blockId
    }
}
#endif
