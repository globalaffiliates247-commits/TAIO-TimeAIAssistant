import WidgetKit
import SwiftUI

@main
struct TAIOWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            TAIOWidgetLiveActivity()
        }
    }
}
