const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Abilita CORS
app.use(cors());

// Connessione al database SQLite
const db = new sqlite3.Database("../devices.db");

// Endpoint per l'ultimo record di un dispositivo
app.get("/api/devices/:device_id/latest", (req, res) => {
  const { device_id } = req.params;
  const query = `
        SELECT device_id, timestamp, output, apower, voltage, freq, current, temperature_c
        FROM device_data
        WHERE device_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    `;

  db.get(query, [device_id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(row);
  });
});

// Endpoint per dati storici di un dispositivo
app.get("/api/devices/:device_id/history", (req, res) => {
  const { device_id } = req.params;
  const { from, to } = req.query;

  if (!from || !to) {
    return res
      .status(400)
      .json({ error: "Query parameters 'from' and 'to' are required" });
  }

  const query = `
        SELECT device_id, timestamp, output, apower, voltage, freq, current, temperature_c
        FROM device_data
        WHERE device_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
    `;

  db.all(query, [device_id, from, to], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!rows.length) {
      return res
        .status(404)
        .json({ error: "No data found for the specified range" });
    }

    res.json(rows);
  });
});

// Endpoint per l'ultimo record di un sensore
app.get("/api/sensors/:device_id/latest", (req, res) => {
  const { device_id } = req.params;
  const query = `
        SELECT device_id, timestamp, sensor_type, value
        FROM sensor_data
        WHERE device_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    `;

  db.get(query, [device_id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!row) {
      return res.status(404).json({ error: "Device not found" });
    }

    res.json(row);
  });
});

// Endpoint per dati storici di un dispositivo
app.get("/api/sensors/:device_id/history", (req, res) => {
  const { device_id } = req.params;
  const { from, to } = req.query;

  if (!from || !to) {
    return res
      .status(400)
      .json({ error: "Query parameters 'from' and 'to' are required" });
  }

  const query = `
        SELECT device_id, timestamp, sensor_type, value
        FROM sensor_data
        WHERE device_id = ?
        AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
    `;

  db.all(query, [device_id, from, to], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (!rows.length) {
      return res
        .status(404)
        .json({ error: "No data found for the specified range" });
    }

    res.json(rows);
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
});
