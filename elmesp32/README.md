# ElmESP32

Code for the ESP32 board.
Operation modes: 
- MONITOR: It connects to the Elm327 scanner by bluetooth and monitor the following events:
    - Sudden acceleration
    - Sudden brake
    - Top speed
    - Fuel level
    - RPM
- WIFI: It connects to a WiFi network and posts the data to an ElmESP-server

Requirements:
- ArduinoIDE with support for ESP32 board