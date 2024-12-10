const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const sendCommand = require("./services/mqttServiceActive").sendCommand; // Funzione per inviare comandi MQTT
const mqttClient = require("./services/mqttServiceActive").mqttClient; // Assicurati che il client MQTT sia esportato correttamente
//const startMqttListener =
//require("./services/mqttServicePassive").startMqttListener; // Importa il listener MQTT

const app = express();
const db = new sqlite3.Database("./iot.db");

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve i file statici nella directory "public"

// Endpoint: Serve la pagina HTML principale
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint: Serve la pagina HTML delle charts
app.get("/charts", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "charts.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Endpoint: Recupera tutte le stanze
app.get("/api/rooms", (req, res) => {
  db.all("SELECT * FROM Rooms", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint: Recupera i dispositivi per una stanza specifica
app.get("/api/rooms/:roomId/devices", (req, res) => {
  const { roomId } = req.params;
  db.all("SELECT * FROM Switches WHERE room_id = ?", [roomId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint: Recupera i sensori per una stanza specifica
app.get("/api/rooms/:roomId/sensors", (req, res) => {
  const { roomId } = req.params;
  db.all("SELECT * FROM Sensors WHERE room_id = ?", [roomId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Endpoint: Invia un comando a un dispositivo
app.post("/api/devices/:deviceId/command", (req, res) => {
  const { deviceId } = req.params;
  const { command, toggleAfter } = req.body; // Aggiungi toggleAfter dal corpo della richiesta

  if (!command || !["on", "off"].includes(command)) {
    return res
      .status(400)
      .json({ error: 'Invalid command. Only "on" and "off" are supported.' });
  }

  db.get("SELECT * FROM Switches WHERE id = ?", [deviceId], (err, device) => {
    if (err) {
      console.error(`[ERROR] Database error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }

    if (!device) {
      console.warn(`[WARN] No device found with id ${deviceId}`);
      return res.status(404).json({ error: "Device not found" });
    }

    const topic = device.topic_prefix;

    sendCommand(mqttClient, topic, command, toggleAfter)
      .then(() => {
        db.run(
          "UPDATE Switches SET status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?",
          [command, deviceId],
          (err) => {
            if (err) {
              console.error(
                `[ERROR] Failed to update database: ${err.message}`
              );
              return res.status(500).json({ error: err.message });
            }
            res.json({ message: `Command ${command} sent to ${device.name}` });
          }
        );
      })
      .catch((err) => {
        console.error(`[ERROR] Failed to send command: ${err.message}`);
        res
          .status(500)
          .json({ error: `Failed to send command: ${err.message}` });
      });
  });
});

// Recupera tutte le Rooms
app.get("/api/admin/rooms", (req, res) => {
  db.all("SELECT * FROM Rooms", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Aggiorna una Room
app.put("/api/admin/rooms/:id", (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ error: "Name and description are required." });
  }

  db.run(
    "UPDATE Rooms SET name = ?, description = ? WHERE id = ?",
    [name, description, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Room not found." });
      } else {
        res.json({ message: "Room updated successfully." });
      }
    }
  );
});

// Crea una nuova Room
app.post("/api/admin/rooms", (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json({ error: "Name and description are required." });
  }

  db.run(
    "INSERT INTO Rooms (name, description) VALUES (?, ?)",
    [name, description],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: "Room created successfully.", id: this.lastID });
      }
    }
  );
});

// Elimina una Room
app.delete("/api/admin/rooms/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Rooms WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Room not found." });
    } else {
      res.json({ message: "Room deleted successfully." });
    }
  });
});

// Recupera tutti gli Switches
app.get("/api/admin/switches", (req, res) => {
  db.all("SELECT * FROM Switches", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.put("/api/admin/switches/:id", (req, res) => {
  const { id } = req.params;
  const { name, room_id, topic_prefix } = req.body;

  // Controlla che almeno uno dei campi sia presente
  if (!name && !room_id && !topic_prefix) {
    return res.status(400).json({
      error: "At least one field (name, room_id, topic_prefix) is required.",
    });
  }

  // Costruisci dinamicamente la query per aggiornare solo i campi forniti
  const updates = [];
  const values = [];

  if (name) {
    updates.push("name = ?");
    values.push(name);
  }
  if (room_id) {
    updates.push("room_id = ?");
    values.push(room_id);
  }
  if (topic_prefix) {
    updates.push("topic_prefix = ?");
    values.push(topic_prefix);
  }

  values.push(id); // Aggiungi l'id alla fine dei valori

  const query = `UPDATE Switches SET ${updates.join(", ")} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      console.error(`[ERROR] Failed to update switch: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Switch not found." });
    }
    res.json({ message: "Switch updated successfully." });
  });
});

// Crea un nuovo Switch
app.post("/api/admin/switches", (req, res) => {
  const { room_id, name, topic_prefix, status } = req.body;
  console.log(req.body);

  // Controlla che tutti i campi richiesti siano presenti
  if (!room_id || !name || !topic_prefix || !status) {
    return res
      .status(400)
      .json({ error: "room_id, name, topic_prefix, and status are required." });
  }

  // Abilita i vincoli di chiave esterna
  db.run(`PRAGMA foreign_keys = ON;`);

  // Inserisce il nuovo switch nella tabella
  db.run(
    `INSERT INTO Switches (room_id, name, topic_prefix, status)
     VALUES (?, ?, ?, ?)`,
    [room_id, name, topic_prefix, status],
    function (err) {
      if (err) {
        console.error(`[ERROR] Failed to insert switch: ${err.message}`);
        return res.status(500).json({ error: err.message });
      } else {
        console.log(`[SUCCESS] Switch "${name}" inserted successfully.`);
        return res.json({
          message: "Switch created successfully.",
          id: this.lastID,
        });
      }
    }
  );
});

// Elimina uno Switch
app.delete("/api/admin/switches/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Switches WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Switch not found." });
    } else {
      res.json({ message: "Switch deleted successfully." });
    }
  });
});

// Recupera tutti i Sensors
app.get("/api/admin/sensors", (req, res) => {
  db.all("SELECT * FROM Sensors", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.put("/api/admin/sensors/:id", (req, res) => {
  const { id } = req.params;
  const { name, room_id, topic_prefix } = req.body;

  // Controlla che almeno uno dei campi sia presente
  if (!name && !room_id && !topic_prefix) {
    return res.status(400).json({
      error: "At least one field (name, room_id, topic_prefix) is required.",
    });
  }

  // Costruisci dinamicamente la query per aggiornare solo i campi forniti
  const updates = [];
  const values = [];

  if (name) {
    updates.push("name = ?");
    values.push(name);
  }
  if (room_id) {
    updates.push("room_id = ?");
    values.push(room_id);
  }
  if (topic_prefix) {
    updates.push("topic_prefix = ?");
    values.push(topic_prefix);
  }

  values.push(id); // Aggiungi l'id alla fine dei valori

  const query = `UPDATE Sensors SET ${updates.join(", ")} WHERE id = ?`;

  db.run(query, values, function (err) {
    if (err) {
      console.error(`[ERROR] Failed to update sensor: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Sensor not found." });
    }
    res.json({ message: "Sensor updated successfully." });
  });
});

// Crea un nuovo Sensor
app.post("/api/admin/sensors", (req, res) => {
  const { room_id, name, topic_prefix } = req.body;
  console.log(req.body);

  // Controlla che tutti i campi richiesti siano presenti
  if (!room_id || !name || !topic_prefix) {
    return res
      .status(400)
      .json({ error: "room_id, name, topic_prefix are required." });
  }

  // Abilita i vincoli di chiave esterna
  db.run(`PRAGMA foreign_keys = ON;`);

  // Inserisce il nuovo switch nella tabella
  db.run(
    `INSERT INTO Sensors (room_id, name, topic_prefix)
     VALUES (?, ?, ?)`,
    [room_id, name, topic_prefix],
    function (err) {
      if (err) {
        console.error(`[ERROR] Failed to insert sensor: ${err.message}`);
        return res.status(500).json({ error: err.message });
      } else {
        console.log(`[SUCCESS] Sensor "${name}" inserted successfully.`);
        return res.json({
          message: "Sensor created successfully.",
          id: this.lastID,
        });
      }
    }
  );
});

// Elimina uno Sensor
app.delete("/api/admin/sensors/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM Sensors WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Sensor not found." });
    } else {
      res.json({ message: "Sensor deleted successfully." });
    }
  });
});

// Avvio del server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
