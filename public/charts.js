// Configuration
const API_BASE_URL = "http://localhost:3001/api/devices/";
const API_BASE_URL_SENSOR = "http://localhost:3001/api/sensors/";
const urlParams = new URLSearchParams(window.location.search);
const DEVICE_ID = urlParams.get("deviceId") || "003"; // Default to "003"
const UPDATE_INTERVAL = 60000; // Interval in milliseconds

// DOM References
const deviceTitle = document.getElementById("device-title");
const voltageChartCanvas = document.getElementById("voltage-chart");
const powerChartCanvas = document.getElementById("power-chart");
const temperatureChartCanvas = document.getElementById(
  "sensor-chart-temperature"
);
const humidityChartCanvas = document.getElementById("sensor-chart-humidity");

// Tables
const tableVoltage = document.getElementById("table-voltage");
const tableFreq = document.getElementById("table-freq");
const tableCurrent = document.getElementById("table-current");
const tableApower = document.getElementById("table-apower");
const tableTemperature = document.getElementById("table-temperature");
const tableHumidity = document.getElementById("table-humidity");

// Voltage Chart Configuration
const voltageChart = new Chart(voltageChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Voltage (V)",
        data: [],
        borderColor: "blue",
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Frequency (Hz)",
        data: [],
        borderColor: "orange",
        fill: false,
        pointRadius: 0,
      },
      {
        label: "Current (A)",
        data: [],
        borderColor: "purple",
        fill: false,
        pointRadius: 0,
      },
    ],
  },
  options: {
    scales: {
      x: { type: "time", time: { unit: "minute" } },
      y: { title: { display: true, text: "Values" }, suggestedMax: 300 },
    },
  },
});

// Power Chart Configuration
const powerChart = new Chart(powerChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Active Power (W)",
        data: [],
        borderColor: "green",
        fill: false,
        pointRadius: 0,
      },
    ],
  },
  options: {
    scales: {
      x: { type: "time", time: { unit: "minute" } },
      y: { title: { display: true, text: "Power (W)" }, suggestedMax: 100 },
    },
  },
});

// Temperature Chart Configuration
const temperatureChart = new Chart(temperatureChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperature (C°)",
        data: [],
        borderColor: "red",
        fill: false,
        pointRadius: 0,
      },
    ],
  },
  options: {
    scales: {
      x: { type: "time", time: { unit: "minute" } },
      y: {
        title: { display: true, text: "Temperature (C°)" },
        suggestedMax: 35,
      },
    },
  },
});

// Humidity Chart Configuration
const humidityChart = new Chart(humidityChartCanvas, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Humidity (%)",
        data: [],
        borderColor: "blue",
        fill: false,
        pointRadius: 0,
      },
    ],
  },
  options: {
    scales: {
      x: { type: "time", time: { unit: "minute" } },
      y: { title: { display: true, text: "Humidity (%)" }, suggestedMax: 100 },
    },
  },
});

// Update Voltage and Power Charts
async function updateCharts() {
  try {
    const response = await fetch(
      `${API_BASE_URL}${DEVICE_ID}/history?from=2024-12-07T20:00:00Z&to=${new Date().toISOString()}`
    );
    const data = await response.json();

    if (data.length === 0) return;

    const labels = data.map((d) => new Date(d.timestamp));
    const voltage = data.map((d) => d.voltage);
    const frequency = data.map((d) => d.freq);
    const current = data.map((d) => d.current);
    const power = data.map((d) => d.apower);
    const latest = data[data.length - 1];

    // Update title
    deviceTitle.textContent = `Device ID: ${DEVICE_ID}`;

    // Update Voltage Chart
    voltageChart.data.labels = labels;
    voltageChart.data.datasets[0].data = voltage;
    voltageChart.data.datasets[1].data = frequency;
    voltageChart.data.datasets[2].data = current;
    voltageChart.update();

    // Update Power Chart
    powerChart.data.labels = labels;
    powerChart.data.datasets[0].data = power;
    powerChart.options.scales.y.suggestedMax = Math.max(...power) + 100;
    powerChart.update();

    // Update Tables
    tableVoltage.textContent = latest.voltage;
    tableFreq.textContent = latest.freq;
    tableCurrent.textContent = latest.current;
    tableApower.textContent = latest.apower;
  } catch (error) {
    console.error("Error updating charts:", error);
  }
}

// Update Temperature and Humidity Charts
async function updateChartsSensors() {
  try {
    const response = await fetch(
      `${API_BASE_URL_SENSOR}${DEVICE_ID}/history?from=2024-12-07T20:00:00Z&to=${new Date().toISOString()}`
    );
    const data = await response.json();

    if (data.length === 0) return;

    const temperatureData = data.filter((d) => d.sensor_type === "temperature");
    const humidityData = data.filter((d) => d.sensor_type === "humidity");

    const temperatureLabels = temperatureData.map((d) => new Date(d.timestamp));
    const temperatureValues = temperatureData.map((d) => parseFloat(d.value));

    const humidityLabels = humidityData.map((d) => new Date(d.timestamp));
    const humidityValues = humidityData.map((d) => parseFloat(d.value));

    // Update Temperature Chart
    temperatureChart.data.labels = temperatureLabels;
    temperatureChart.data.datasets[0].data = temperatureValues;
    temperatureChart.update();

    // Update Humidity Chart
    humidityChart.data.labels = humidityLabels;
    humidityChart.data.datasets[0].data = humidityValues;
    humidityChart.update();

    // Update Tables
    const latestTemperature = temperatureData[temperatureData.length - 1];
    const latestHumidity = humidityData[humidityData.length - 1];

    tableTemperature.textContent = latestTemperature
      ? latestTemperature.value
      : "N/A";
    tableHumidity.textContent = latestHumidity ? latestHumidity.value : "N/A";
  } catch (error) {
    console.error("Error updating sensor charts:", error);
  }
}

function goBack() {
  window.history.back();
}

// Start periodic updates
setInterval(updateCharts, UPDATE_INTERVAL);
setInterval(updateChartsSensors, UPDATE_INTERVAL);

// Initial data load
updateCharts();
updateChartsSensors();
