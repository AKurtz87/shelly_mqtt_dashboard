const mqtt = require("mqtt");

// Configurazione del client MQTT
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://192.168.1.49";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log("MQTT client connected to broker.");
});

mqttClient.on("error", (err) => {
  console.error("MQTT client error:", err.message);
});

module.exports = { mqttClient };

// Initialize MQTT client
const initializeMqttClient = (brokerUrl, username, password) => {
  return mqtt.connect(brokerUrl, {
    username: username || "",
    password: password || "",
  });
};

// Function to send a command to a Shelly switch
const sendCommand = (mqttClient, topicPrefix, command, toggleAfter = null) => {
  const topic = `${topicPrefix}/command/switch:0`;
  const payload = toggleAfter ? `${command},${toggleAfter}` : command;

  return new Promise((resolve, reject) => {
    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(
          `[ERROR] Failed to send command "${payload}" to topic "${topic}":`,
          err.message
        );
        reject(err);
      } else {
        console.log(`[SUCCESS] Command "${payload}" sent to topic "${topic}"`);
        resolve(`[SUCCESS] Command "${payload}" sent to topic "${topic}"`);
      }
    });
  });
};

// Function to disconnect MQTT client
const disconnectMqttClient = (mqttClient) => {
  mqttClient.end();
  console.log("[INFO] MQTT client disconnected.");
};

module.exports = {
  mqttClient,
  initializeMqttClient,
  sendCommand,
  disconnectMqttClient,
};
