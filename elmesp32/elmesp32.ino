#include <EEPROM.h>
#include "BluetoothSerial.h"
#include "ELMduino.h"
#include "WiFi.h"
#include <HTTPClient.h>

#define EEPROM_SIZE 4000

// Define constants for EVENT_TYPES
#define TIME_INITIALIZATION 1
#define TIME_REGISTER 2
#define FUEL_LEVEL 3
#define SUDDEN_ACCELERATION 4
#define SUDDEN_BRAKE 5
#define TOP_SPEED 6
#define TOP_RPM 7

// Define constants for events thresholds
#define MIN_TOP_SPEED 80
#define MAX_TOP_SPEED 140

#define MIN_SUDDEN_DELTA 35
#define MAX_SUDDEN_DELTA 60

#define MAX_TOP_RPM 3000

int globalTrackedAddress = 0;
int globalTrackedSeconds = 0;
int globalTrackedReadAddress = 0;

uint32_t previousSpeed = -1;
uint32_t currentFuel;

ELM327 elmReader;
BluetoothSerial SerialBT;

uint8_t OBD_MAC_ADDRESS[6]  = {0x29, 0x05, 0xE5, 0x8A, 0x43, 0xF7};
char *OBD_PIN = "1234";
bool connected;

// Define constants for operation mode
#define MONITOR 0
#define MEMORY_READ 1
#define MEMORY_CLEAR 2
#define WIFI 3

const char *MODE_NAMES[4] = { 
  "MONITOR", 
  "MEMORY_READ",
  "MEMORY_CLEAR",
  "WIFI"
};

// The operation mode is MONITOR by default. It might be changed later depending
// on digital inputs
int currentMode = MONITOR;

// Wifi credentials (ESP32 does not support 5GHz WiFi networks)
//const char* ssid = "THE RISING SUN";
//const char* password = "AsquilinFantasma2022";

const char* ssid = "Poco Mk";
const char* password = "lechuga.123";

//const char* REPORTS_ENDPOINT = "http://192.168.68.117:3001/api/reports";
const char* REPORTS_ENDPOINT = "http://192.168.22.22:3001/api/reports";

const int OPERATION_MODE_PIN_1 = 34;
const int LED_PIN = 32;


void setup() {
  // Initialize USB serial communication -----------------------------------
  Serial.begin(115200);
  while (!Serial){
    delay(1000);
  }

  // Setup input pins -------------------------------------
  pinMode(OPERATION_MODE_PIN_1, INPUT);
  pinMode(LED_PIN, OUTPUT);

  // 10 seconds to allow new code loading ----------------------
  Serial.println("STATUS: 10 seconds to set-up");
  waitSecondsBlinking(10);

  // Read the operation mode ----------------------------------------
  int operationMode1State = digitalRead(OPERATION_MODE_PIN_1);

  if(operationMode1State == LOW){
    currentMode = MONITOR;
  } else {
    currentMode = WIFI;
  }

  // Hardcode 'currentMode'
  // currentMode = MEMORY_CLEAR;

  // Log current mode ----------------------------------------------
  Serial.print("STATUS: Current mode: ");
  Serial.println(MODE_NAMES[currentMode]);

  // Initialize EEPROM -------------------------------------------------------------------------------
  Serial.println("STATUS: Initializing EEPROM...");
  EEPROM.begin(EEPROM_SIZE);
  
  // Main operations --------------------------------------------------------
  switch(currentMode){
    case MEMORY_READ:
      //readMemory(200, 100);
      readMemoryEvents();
      break;
    case MEMORY_CLEAR:
      clearMemory();
      break;
    case MONITOR:
      clearMemory();
      registerEvent(TIME_INITIALIZATION);
      connectToElm();
      break;
    case WIFI:
      connectToWifi();
      postRequest();
      break;
  }

  Serial.println("STATUS: Starting loop in 3 seconds...");
  delay(3000);
}

void loop(){
  switch(currentMode){
    case MEMORY_READ:
      noOp();
      break;
    case MEMORY_CLEAR:
      noOp();
      break;
    case MONITOR:
      monitorPeriodicEvents();
      monitorSpeedEvents();
      monitorRPMEvents();
      break;
    case WIFI:
      noOp();
      break;
  }
}

void noOp(){
  Serial.println(F("STATUS: No-op in current mode"));
  delay(30000);
}

void monitorPeriodicEvents(){
  if(isInterval(30)){
    int currentFuelLevel = getCurrentFuelLevel();
    
    if(currentFuelLevel != -1){
      // We have a valid FUEL_LEVEL value
      
      // Register events and consider the interval completed
      // registerEvent(TIME_REGISTER);
      registerEvent(FUEL_LEVEL, currentFuelLevel);

      // Update the tracked global seconds
      globalTrackedSeconds = getElapsedSeconds();
    }
  }
}

void monitorSpeedEvents(){
  int currentSpeed = getCurrentSpeed();
  
  if(currentSpeed != -1){
    // We have a valid current speed
    if(previousSpeed != -1){
      // We have a valid previous speed. Calculate delta speed and evaluate SUDDEN change conditions
      int deltaSpeed = currentSpeed - previousSpeed;
      
      if(deltaSpeed >= MIN_SUDDEN_DELTA && deltaSpeed <= MAX_SUDDEN_DELTA){
        registerEvent(SUDDEN_ACCELERATION, previousSpeed, currentSpeed);
      }

      if(deltaSpeed <= (MIN_SUDDEN_DELTA * -1) && deltaSpeed >= (MAX_SUDDEN_DELTA * -1)){
        registerEvent(SUDDEN_BRAKE, previousSpeed, currentSpeed);
      }
    }

    // Evaluate current speed to check TOP_SPEED condition
    if (currentSpeed >= MIN_TOP_SPEED && currentSpeed <= MAX_TOP_SPEED){
      registerEvent(TOP_SPEED, currentSpeed);
    }

    previousSpeed = currentSpeed;
  }
}

void monitorRPMEvents(){
  int currentRPM = getCurrentRPM();

  if(currentRPM != -1){
    // We have a valid RPM

    if (currentRPM >= MAX_TOP_RPM){
      registerEvent(TOP_RPM, currentRPM);
    }
  }
}

void connectToElm(){
  // Initialize Bluetooth serial communication in master mode and wrap it with the ELM327 interface ---------------
  Serial.println("STATUS: Initializing Bluetooth communication");
  SerialBT.begin("ESP32_MK", true); 
  SerialBT.setPin(OBD_PIN);
  
  elmReader.begin(SerialBT, true, 2000);

  connected = SerialBT.connect(OBD_MAC_ADDRESS);
  
  if(connected) {
    Serial.println("STATUS: Connected Succesfully!");
    // Turn on the LED permanently when the Bluetooth conecction completed
    digitalWrite(LED_PIN, HIGH);
  } else {
    while(!SerialBT.connected(10000)) {
      Serial.println("STATUS: Failed to connect. Make sure remote device is available and in range, then restart app."); 
    }
  }
}

int getObdParameter(int parameter){
  if (elmReader.nb_rx_state == ELM_SUCCESS){
    return parameter;
  } else if (elmReader.nb_rx_state != ELM_GETTING_MSG){
    elmReader.printError();
  }

  return -1;
}

int getCurrentSpeed(){
  return getObdParameter(elmReader.mph());
}

int getCurrentFuelLevel(){
  return getObdParameter(elmReader.fuelLevel());
}

int getCurrentRPM(){
  return getObdParameter(elmReader.rpm());
}


int getElapsedSeconds(){
  return (millis() / 1000);
}

int getElapsedMinutes(){
  return (getElapsedSeconds() / 60);
}

bool isInterval(int secondsInterval){
  int elapsedSeconds = getElapsedSeconds();
  
  if(elapsedSeconds % secondsInterval == 0){
    if(elapsedSeconds != globalTrackedSeconds){    
      return true;
    }
  }

  return false;
}

void registerEvent(byte eventType){
  int timestamp = getElapsedSeconds();

  EEPROM.put(globalTrackedAddress, timestamp);
  globalTrackedAddress += sizeof(timestamp);
  
  EEPROM.put(globalTrackedAddress, eventType);
  globalTrackedAddress += sizeof(eventType);

  EEPROM.commit();

  Serial.print("STATUS: Registered event: ");
  Serial.print(eventType);
  Serial.print(" at: ");
  Serial.println(timestamp);
}

void registerEvent(byte eventType, int parameter1){
  registerEvent(eventType);

  EEPROM.put(globalTrackedAddress, parameter1);
  globalTrackedAddress += sizeof(parameter1);

  EEPROM.commit();
}

void registerEvent(byte eventType, int parameter1, int parameter2){
  registerEvent(eventType, parameter1);

  EEPROM.put(globalTrackedAddress, parameter2);
  globalTrackedAddress += sizeof(parameter2);

  EEPROM.commit();
}

void clearMemory(){
  for(int i=0; i<EEPROM_SIZE; i++){
    EEPROM.write(i, 255);
  }

  EEPROM.commit();

  Serial.println("STATUS: Memory cleared");
}

void readMemory(int bytesQuantity, int rateMillis){
  Serial.print("STATUS: Reading memory [");
  Serial.print(bytesQuantity);
  Serial.println(" bytes]");
  
  for(int i=0; i<bytesQuantity; i++){
    Serial.print('[');
    Serial.print(i);
    Serial.print("] ");
    Serial.println(EEPROM.read(i));
    
    delay(rateMillis);
  }
}

void connectToWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("STATUS: Connecting to WiFi ..");

  // LED management -------------------------------------------------------
  bool ledState = false;

  while(WiFi.status() != WL_CONNECTED) {
    Serial.print('.');

    if (ledState){
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(LED_PIN, LOW);
    }

    // Revert the LED state to keep it blinknig while connecting
    ledState = !ledState;
    delay(500);
  }

  // Turn on the LED permanently when the connection is successful
  digitalWrite(LED_PIN, HIGH);

  Serial.println();

  Serial.print("STATUS: Assigned IP: ");
  Serial.println(WiFi.localIP());
}

void getRequest(){
  Serial.println("STATUS: About to send a GET request (3 seconds)...");
  delay(3000);
  
  WiFiClient client;
  HTTPClient http;

  http.begin(client, REPORTS_ENDPOINT);

  // Send HTTP GET request
  int httpResponseCode = http.GET();
  
  if (httpResponseCode>0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String payload = http.getString();
    Serial.println(payload);
  }
}

void waitSecondsBlinking(int secondsToWait){
  // LED management -------------------------------------------------------
  bool ledState = false;

  for (int i=0; i<secondsToWait; i++){
    Serial.print('.');

    if (ledState){
      digitalWrite(LED_PIN, HIGH);
    } else {
      digitalWrite(LED_PIN, LOW);
    }

    // Revert the LED state to keep it blinknig while connecting
    ledState = !ledState;
    delay(1000);
  }

  // Turn off the LED permanently when the wait completed
  digitalWrite(LED_PIN, LOW);
}

void postRequest(){
  Serial.println("STATUS: Starting POST request");
  delay(3000);
  
  WiFiClient client;
  HTTPClient http;

  http.begin(client, REPORTS_ENDPOINT);

  // Build request content using the memory data
  String postJson = readMemoryEvents();

  // Specify content-type header  
  http.addHeader("Content-Type", "application/json");
  
  // Send POST request
  int httpResponseCode = http.POST(postJson);

  // Print response
  Serial.print("STATUS: Completed POST with a response code: ");
  Serial.println(httpResponseCode);
        
  // Free resources
  http.end();
}

String buildPostJson(){
  String json = "{\"carId\": \"JHZ9036\", \"events\": [";

  json += "{\"timestamp\": 15, \"event-type\": \"FUEL_LEVEL\", \"fuel-level\": 74}]}";
  
  return json;
}


String readMemoryEvents(){
  Serial.println("STATUS: Reading events from memory...");
  
  String fullJson= "{\"carId\": \"MRN1228\", \"events\": [";

  // Read first event
  String nextEventJson = readNextEvent();
  
  // Include the event only when it contains data and we are reading under the max limit
  while(nextEventJson.length() > 0 && globalTrackedReadAddress < EEPROM_SIZE){
    //Serial.print("STATUS: Reading ");
    //Serial.println(String(globalTrackedReadAddress));

    fullJson += nextEventJson + ",";
    nextEventJson = readNextEvent();
  }

  // Remove trailing comma
  if (fullJson.endsWith(",")){
    fullJson.remove(fullJson.length()-1);
  }
  
  fullJson += "]}";

  Serial.print("DATA: ");
  Serial.println(fullJson);

  return fullJson;
}

String readNextEvent(){
  //Serial.println("STATUS: Reading event from memory");
  String eventJson = "{";

  // Read 4 bytes timestamp ------------------------------
  int timestamp;
  EEPROM.get(globalTrackedReadAddress, timestamp);

  // Early return when detecting invalid timestamp (Free memory)
  if (timestamp == -1){
    return "";
  }
  
  eventJson += "\"timestamp\":";
  eventJson += String(timestamp) + ",";
  
  globalTrackedReadAddress += sizeof(timestamp);


  // Read 1 byte eventType --------------------------------
  byte eventType;
  EEPROM.get(globalTrackedReadAddress, eventType);
  eventJson += "\"eventType\":";
  eventJson += String(eventType);

  globalTrackedReadAddress += sizeof(eventType);

  
  // Evaluate the eventType to read the proper event parameters and complete the event json
  switch(eventType){
    case TIME_INITIALIZATION:
      // There is no parameters. Do nothing...
      break;
    case TIME_REGISTER:
      // There is no parameters. Do nothing...
      break;
    case FUEL_LEVEL:
      // Read 4 bytes fuelLevel parameter
      int fuelLevel;
      EEPROM.get(globalTrackedReadAddress, fuelLevel);

      eventJson += ", \"fuelLevel\":";
      eventJson += String(fuelLevel);

      globalTrackedReadAddress += sizeof(fuelLevel);
      break;
    case SUDDEN_ACCELERATION:
    case SUDDEN_BRAKE:
      // Read 4 bytes initialSpeed parameter
      int initialSpeed;
      EEPROM.get(globalTrackedReadAddress, initialSpeed);

      eventJson += ", \"initialSpeed\":";
      eventJson += String(initialSpeed);

      globalTrackedReadAddress += sizeof(initialSpeed);

      // Read 4 bytes finalSpeed parameter
      int finalSpeed;
      EEPROM.get(globalTrackedReadAddress, finalSpeed);

      eventJson += ", \"finalSpeed\":";
      eventJson += String(finalSpeed);

      globalTrackedReadAddress += sizeof(finalSpeed);
      break;
    case TOP_SPEED:
      // Read 4 bytes topSpeed parameter
      int topSpeed;
      EEPROM.get(globalTrackedReadAddress, topSpeed);

      eventJson += ", \"topSpeed\":";
      eventJson += String(topSpeed);

      globalTrackedReadAddress += sizeof(topSpeed);
      break;
    case TOP_RPM:
      // Read 4 bytes topRPM parameter
      int topRPM;
      EEPROM.get(globalTrackedReadAddress, topRPM);

      eventJson += ", \"topRPM\":";
      eventJson += String(topRPM);

      globalTrackedReadAddress += sizeof(topRPM);
      break;
  }

  eventJson += "}";

  return eventJson;
}
