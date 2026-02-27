# Unsigned Beta Install Guide

This project can be released in beta mode without code-signing certificates.

## macOS
If macOS shows "app is damaged" or blocks the app:

```bash
xattr -dr com.apple.quarantine /Applications/Classroom.app
```

Then open the app with right click -> Open.

## Windows
If SmartScreen warns about unknown publisher:
1. Click `More info`
2. Click `Run anyway`

For this project, Windows installer uses WebView2 `downloadBootstrapper` mode by default.
That keeps installer size smaller and will only download WebView2 when target machine does not already have it.

## Notes
- This is expected behavior for unsigned beta packages.
- For production public distribution, configure Apple notarization and Windows code signing certificates.
