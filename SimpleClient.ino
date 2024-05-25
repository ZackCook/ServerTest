#include <WiFi.h>
#include <SocketIoClient.h>
#include <ArduinoJson.h>

// Replace these with your network credentials
const char* ssid = "your_SSID";
const char* password = "your_PASSWORD";

// Replace with the IP address and port of your server
const char* serverAddress = "192.168.1.100";  // Example: "192.168.1.100"
const int serverPort = 3000;

SocketIoClient socket;
const char* uniqueId = "esp32-001";  // Unique ID for this ESP32
const char* deviceType = "robot";    // Device type (e.g., "robot", "sensor", "light")

void event(const char * payload, size_t length) {
    Serial.print("Received: ");
    Serial.println(payload);

    // Parse the received command (JSON format expected)
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
    }

    const char* type = doc["type"];
    int value = doc["value"];

    // Handle the command based on its type
    if (strcmp(type, "move") == 0) {
        Serial.print("Moving with intensity: ");
        Serial.println(value);
        // Implement movement logic here
    } else if (strcmp(type, "lights") == 0) {
        if (value == 1) {
            Serial.println("Turning lights on");
            // Implement lights on logic here
        } else {
            Serial.println("Turning lights off");
            // Implement lights off logic here
        }
    }
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);

    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.print("Connected! IP address: ");
    Serial.println(WiFi.localIP());

    socket.on("connect", []() {
        Serial.println("Connected to server");
        String registerMessage = String("\"") + deviceType + "\", \"" + uniqueId + "\"";
        socket.emit("register", registerMessage.c_str());
    });

    socket.on("command", event);

    socket.on("disconnect", []() {
        Serial.println("Disconnected from server");
    });

    socket.begin(serverAddress, serverPort);
    socket.loop();
}

void loop() {
    socket.loop();
}
