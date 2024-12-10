const mqtt = require("mqtt");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();

// Carica le variabili di ambiente
dotenv.config();

// Inizializza i database SQLite
const dbDevices = new sqlite3.Database("../devices.db", (err) => {
  if (err)
    console.error(`[ERROR] Failed to connect to devices.db: ${err.message}`);
});

const dbIOT = new sqlite3.Database("../iot.db", (err) => {
  if (err) console.error(`[ERROR] Failed to connect to iot.db: ${err.message}`);
});

// Funzione per salvare i dati del sensore
const saveSensorData = (deviceId, sensorType, value, timestamp) => {
  try {
    const stmt = dbDevices.prepare(`
      INSERT INTO sensor_data (device_id, sensor_type, value, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(deviceId, sensorType, value, timestamp, (err) => {
      if (err) {
        console.error(
          `[ERROR] Failed to save sensor data for device ${deviceId}: ${err.message}`
        );
      } else {
        console.log(
          `[SAVED] Sensor data for device ${deviceId}, type: ${sensorType}, value: ${value}`
        );
      }
    });

    stmt.finalize();
  } catch (error) {
    console.error(`[ERROR] Exception in saveSensorData: ${error.message}`);
  }
};

// Funzione per aggiornare o inserire valori nei sensori nel database IOT
const updateSensorValue = (topicPrefix, sensorName, value) => {
  try {
    const timestamp = new Date().toISOString();
    dbIOT.run(
      `
      INSERT INTO Sensors (room_id, name, topic_prefix, value, last_updated)
      VALUES ((SELECT room_id FROM Switches WHERE topic_prefix = ?), ?, ?, ?, ?)
      ON CONFLICT(topic_prefix, name) DO UPDATE SET
        value = excluded.value,
        last_updated = excluded.last_updated
    `,
      [topicPrefix, sensorName, topicPrefix, value, timestamp],
      (err) => {
        if (err) {
          console.error(
            `[ERROR] Failed to update sensor value for ${topicPrefix} (${sensorName}): ${err.message}`
          );
        } else {
          console.log(
            `[UPDATED] Sensor value for ${topicPrefix} (${sensorName}) to ${value}`
          );
        }
      }
    );
  } catch (error) {
    console.error(`[ERROR] Exception in updateSensorValue: ${error.message}`);
  }
};

// Funzione per gestire i dati del sensore
const handleSensorData = (topic, payload, timestamp) => {
  try {
    const parsedPayload = JSON.parse(payload);
    const topicParts = topic.split("/");
    if (topicParts.length < 2) {
      console.warn(`[WARN] Unexpected topic format: ${topic}`);
      return;
    }
    const topicPrefix = topicParts.slice(0, 2).join("/");
    const deviceId = topicParts[1];
    const sensorName = topic.includes("temperature:100")
      ? "temperature"
      : "humidity";

    let value = "unknown";
    if (sensorName === "temperature" && parsedPayload.tC !== undefined) {
      value = parsedPayload.tC.toFixed(1) - 8.3;
    } else if (sensorName === "humidity" && parsedPayload.rh !== undefined) {
      value = parsedPayload.rh.toFixed(1);
    }

    updateSensorValue(topicPrefix, sensorName, value);
    saveSensorData(deviceId, sensorName, value, timestamp);
  } catch (error) {
    console.error(
      `[ERROR] Exception in handleSensorData for topic ${topic}: ${error.message}`
    );
  }
};

// Funzione per aggiornare lo stato degli interruttori
const updateSwitchStatus = (topicPrefix, status) => {
  try {
    const timestamp = new Date().toISOString();
    dbIOT.run(
      `
      UPDATE Switches
      SET status = ?, last_updated = ?
      WHERE topic_prefix = ?
    `,
      [status, timestamp, topicPrefix],
      (err) => {
        if (err) {
          console.error(
            `[ERROR] Failed to update switch status for ${topicPrefix}: ${err.message}`
          );
        } else {
          console.log(
            `[UPDATED] Switch status for ${topicPrefix} to ${status}`
          );
        }
      }
    );
  } catch (error) {
    console.error(`[ERROR] Exception in updateSwitchStatus: ${error.message}`);
  }
};

// Funzione per salvare dati avanzati nel database
const saveAdvancedDataToDatabase = (data) => {
  try {
    const stmt = dbDevices.prepare(`
      INSERT INTO device_data (
        device_id, timestamp, output, apower, voltage, freq, current,
        aenergy_total, aenergy_minute_ts, temperature_c
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      data.device_id,
      data.timestamp,
      data.output,
      data.apower,
      data.voltage,
      data.freq,
      data.current,
      data.aenergy_total,
      data.aenergy_minute_ts,
      data.temperature_c,
      (err) => {
        if (err) {
          console.error(
            `[ERROR] Failed to save advanced data for device ${data.device_id}: ${err.message}`
          );
        } else {
          console.log(`[SAVED] Advanced data for device ${data.device_id}`);
        }
      }
    );

    stmt.finalize();
  } catch (error) {
    console.error(
      `[ERROR] Exception in saveAdvancedDataToDatabase: ${error.message}`
    );
  }
};

// Funzione per gestire dati avanzati
const handleAdvancedData = (topic, payload, timestamp) => {
  try {
    const topicParts = topic.split("/");
    if (topicParts.length < 2) {
      console.warn(`[WARN] Unexpected topic format: ${topic}`);
      return;
    }
    const deviceId = topicParts[1];
    const parsedPayload = JSON.parse(payload);

    const data = {
      device_id: deviceId,
      timestamp: timestamp || new Date().toISOString(),
      output: parsedPayload.output === true ? 1 : 0,
      apower: parsedPayload.apower || 0,
      voltage: parsedPayload.voltage || 0,
      freq: parsedPayload.freq || 0,
      current: parsedPayload.current || 0,
      aenergy_total: parsedPayload.aenergy?.total || 0,
      aenergy_minute_ts: parsedPayload.aenergy?.minute_ts || 0,
      temperature_c: parsedPayload.temperature?.tC || 0,
    };

    saveAdvancedDataToDatabase(data);
    const topicPrefix = topicParts.slice(0, 2).join("/");
    updateSwitchStatus(topicPrefix, data.output ? "on" : "off");
  } catch (error) {
    console.error(
      `[ERROR] Exception in handleAdvancedData for topic ${topic}: ${error.message}`
    );
  }
};

// Inizializza il client MQTT
const initializeMqttClient = () => {
  const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://192.168.1.49";
  const MQTT_USERNAME = process.env.MQTT_USERNAME || "";
  const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "";

  const client = mqtt.connect(MQTT_BROKER_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
  });

  client.on("connect", () => {
    console.log("[INFO] MQTT client connected to broker.");
    client.subscribe("#", { qos: 1 }, (err) => {
      if (err) {
        console.error("[ERROR] Error subscribing to topics:", err.message);
      } else {
        console.log("[INFO] Successfully subscribed to all topics.");
      }
    });
  });

  client.on("error", (err) => {
    console.error("[ERROR] MQTT connection error:", err.message);
    client.end();
  });

  client.on("close", () => {
    console.log("[INFO] MQTT connection closed.");
  });

  return client;
};

// Avvia l'ascolto MQTT
const startMqttListener = () => {
  const mqttClient = initializeMqttClient();

  mqttClient.on("message", (topic, payload) => {
    try {
      const message = payload.toString();
      const timestamp = new Date().toISOString();

      if (
        topic.includes("status/temperature:100") ||
        topic.includes("status/humidity:100")
      ) {
        handleSensorData(topic, message, timestamp);
      } else if (topic.includes("status/switch:0")) {
        handleAdvancedData(topic, message, timestamp);
      } else {
        console.log(`[INFO] Unhandled topic: ${topic}`);
      }
    } catch (error) {
      console.error(
        `[ERROR] Exception in MQTT message handler for topic ${topic}: ${error.message}`
      );
    }
  });
};

// Chiude i database al termine del programma
process.on("SIGINT", () => {
  console.log("[INFO] Closing databases...");
  dbDevices.close();
  dbIOT.close();
  process.exit();
});

startMqttListener();
