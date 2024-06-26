#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Arduino.h>


const char* ssid = "SpectrumSetup-CD";
const char* password = "leastpoet407";
const char* serverAddress = "192.168.1.26"; // e.g., "192.168.1.100"
const int serverPort = 3000;

WebSocketsClient webSocket;//web socket instance that will connect to wqensocket server and handle RTC
String serverSideID;// will be assigned when sent back from the server after a successful client verification (server side)

// LED Pin
const int ledPin = 2;
bool ledState = false;

/*
webSocket event handle, covering all different types of websocket events
WStype_TEXT event type messages are assumed to arrive in JSON format and conforming to the following general structure,
	
	messageType = {
		type: 'messageType',
		data: stuff,
		...,
		...
	}	

@param (WStype_t) type: value specifies which type of websocket event is going to be triggered

@param (uint8_t) *payload: pointer to series of bytes that is the payload of this particular websocket event invokation	

@param (size_t) length: size of payload in bytes

@return void
*/
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {

    const size_t capacity = JSON_OBJECT_SIZE(3) + 128; // Adjust the capacity as needed
        if (length > capacity) {
            Serial.println("Payload size exceeds buffer capacity");
            return;
        }

    if (type == WStype_TEXT) {//if the websocket event type is 'text'
        StaticJsonDocument<200> jsonDoc;//create a json doc, static of size 200 should be plenty of space for now
        DeserializationError error = deserializeJson(jsonDoc, payload, length);//create an error that we will throw if deserialization of the JSON payload fails
        if (error) {
            Serial.print(F("deserializeJson() failed: "));
            Serial.println(error.c_str());
            return;
        }//end DeserializationError check

        Serial.print("Message received: ");
        Serial.println(serializeJson(jsonDoc,Serial));

        const char* msgType = jsonDoc["type"];// msgType is set to jsondoc 'type' field, this is used when determining what message type has been Received
        if (strcmp(msgType, "cmdExe") == 0) {//if the msgType is cmdExe
            Serial.println("allocating json");
            const char* cmdType = jsonDoc["cmdType"];// create a cmdType variale locally and set it to the value stored in the jsondoc 'cmdType' field
            int cmdMagnitude = jsonDoc["cmdMagnitude"];// create a cmdMagnitude cariable locally and set it to the value stored in the jsondoc 'cmdMagnitude' field
            Serial.printf("Received cmdExe: type=%s, magnitude=%d\n", cmdType, cmdMagnitude);
            if(strcmp(cmdType,"LED") == 0){
              if(cmdMagnitude == 1){
                digitalWrite(ledPin, HIGH);
              }else{
                digitalWrite(ledPin,LOW);
              }//end magnitude check
            }//end cmdExe switch logic

        } else if (strcmp(msgType, "assignedID") == 0) {// if the incoming message type is assignedID, an assigned uniqueID is being sent from the server
            serverSideID = jsonDoc["id"].as<String>();//stores the uniqueID as a string, locally
            Serial.printf("Received assignedID: id=%s\n", serverSideID.c_str());
        }
    } else if (type == WStype_DISCONNECTED) {
        Serial.println("WebSocket Disconnected");
		//handle clint side disconnection events
    } else if (type == WStype_CONNECTED) {
        Serial.println("WebSocket Connected");
        sendVerification();//send verification data to the server upon connection event
    }
}//end webSocketEvent()

/*
	Handler for sending verification data when client initially connects to server
*/
void sendVerification() {
    StaticJsonDocument<200> jsonDoc;
    jsonDoc["type"] = "verification";
    jsonDoc["clientType"] = "simple";//hardcoded client type, prevents inadvertent reassignment
    String jsonData;//temp variable to store json data in a string before being serialized.
    serializeJson(jsonDoc, jsonData);//serialize temp string into json
    webSocket.sendTXT(jsonData);//send serialized json to the server for verification.
}//end sendVerification()

/*
	handler for sending local sensor data (telemetry) to the server 
*/
void sendTelemetry() {
    StaticJsonDocument<512> jsonDoc;// static jsondoc of sixe 200 should be plenty to encapsulate any size telemetry message
    jsonDoc["type"] = "telemetry";
    jsonDoc["id"] = serverSideID;//id corresponding with the telemetry being sent
    // Add telemetry data here
    jsonDoc["sensorData"] = 123;  // Example data used for demonstration purposes
    String jsonData;//temp json String
    serializeJson(jsonDoc, jsonData);// serialize temp string into jsondoc
    //webSocket.sendTXT(jsonData);//send telemetry to server
}//end sendTelemetry()

void setup() {
    Serial.begin(115200);//init serial !!!!REMOVE UPON DEPLOYMENT!!!!
    WiFi.begin(ssid, password);//assign wifi credentials

    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }//wait for wifi to connect before proceeding

    Serial.println("Connected to WiFi. IP address: ");
    Serial.println(WiFi.localIP());

    pinMode(ledPin, OUTPUT);
    
    webSocket.begin(serverAddress, serverPort, "/");//set routing for webSocket server
    webSocket.onEvent(webSocketEvent);//set event listener for webSocket events
}//end setup()

void loop() {
    webSocket.loop();
}//end loop()
