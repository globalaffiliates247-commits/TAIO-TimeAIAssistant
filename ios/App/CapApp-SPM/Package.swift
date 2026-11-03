// swift-tools-version: 5.7
import PackageDescription

let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    targets: [
        .binaryTarget(
            name: "Capacitor",
            path: "../Frameworks/Capacitor.xcframework"
        ),
        .binaryTarget(
            name: "Cordova",
            path: "../Frameworks/Cordova.xcframework"
        ),
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .target(name: "Capacitor"),
                .target(name: "Cordova")
            ]
        )
    ]
)
