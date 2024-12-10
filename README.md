# Shelly IoT MQTT Dashboard

## Overview

This project is an IoT management system designed to monitor and control Shelly devices. It combines a robust backend built with Node.js and SQLite with an interactive frontend using HTML, CSS, and JavaScript. The project supports managing rooms, switches, and sensors, with features like real-time monitoring, historical data analysis, and MQTT integration.

---

## Features

- **Room and Device Management**: Add, update, and delete rooms, switches, and sensors via the Admin interface.
- **Real-time Monitoring**: View sensor data and device metrics on interactive charts.
- **Command Execution**: Send commands to devices via MQTT.
- **Data Analysis**: Fetch and display historical data for devices and sensors.
- **API Integration**: RESTful endpoints for frontend-backend communication.

---

## Project Structure

### Backend
1. **Main Server**
   - `server.js`: The central server script, handling API endpoints, MQTT command sending, and serving static files like HTML pages.

2. **Services**
   - `mqttServiceActive`: Contains logic to send MQTT commands to devices.
   - `mqttServiceAnalysisPassive.js`: Handles passive MQTT data processing, storing sensor values, and updating database records.

3. **Database**
   - SQLite databases (`iot.db` and `devices.db`) store room, device, and sensor data.
   - Database schema and initialization scripts provided in the repository.

4. **Dependencies**
   - Core libraries include `express`, `mqtt`, `sqlite3`, `dotenv`, and `body-parser`.
   - Listed in `package.json`.

### Frontend
1. **HTML Pages**
   - `index.html`: Main dashboard for room, device, and sensor management.
   - `charts.html`: Displays interactive charts for device metrics.
   - `admin.html`: Interface for administrative management of rooms, switches, and sensors.

2. **JavaScript**
   - `app.js`: Manages dynamic updates for the dashboard.
   - `charts.js`: Fetches historical data and renders charts using Chart.js.
   - `admin.js`: Implements CRUD functionality for administrative tasks.
   - `api.js`: Handles API interactions.

3. **CSS**
   - `styles.css` and `charts.css`: Define the visual design of the dashboard and charts.

---

## Setup

### Prerequisites
- Node.js
- SQLite
- An MQTT broker (e.g., Mosquitto)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory and install dependencies:
   ```bash
   cd <repository-directory>
   npm install
   ```

### Configuration
- Create a `.env` file and configure environment variables for the MQTT broker, database paths, and other settings.

### Running the Application

To start the application, it is necessary to execute three scripts: `server.js`, `devices_api.js`, and `mqttServiceAnalysisPassive.js`. These scripts work together to manage the backend, API endpoints, and MQTT data processing.

1. Start the backend server:
   ```bash
   node server.js
   ```

2. Start the devices API service:
   ```bash
   node devices_api.js
   ```

3. Start the MQTT passive analysis service:
   ```bash
   node mqttServiceAnalysisPassive.js
   ```

Once all three scripts are running, open `http://localhost:3000` in a browser to access the dashboard.

## Usage

1. **Dashboard**: View and interact with devices and sensors in the main interface.
2. **Admin Menu**: Manage rooms, switches, and sensors via the `/admin` endpoint.
3. **Charts**: Analyze device metrics and sensor data at `/charts`.

<img width="490" alt="Screenshot 2024-12-10 at 10 12 11" src="https://github.com/user-attachments/assets/8e34ec0f-dbed-4b62-9645-24d4fd294b49">

<img width="491" alt="Screenshot 2024-12-10 at 10 15 49" src="https://github.com/user-attachments/assets/46701331-3ee7-46d8-a595-3bf7fed3b0d5">

---

### Testing the Application

The application was tested using the following Shelly devices: **Shelly 1 PM Mini 3 Gen**, **Shelly PLUS 1 PM**, **Shelly PLUS ADD ON**, and the **DHT22 AM2302 sensor**. The testing setup involved electrically connecting these devices to a standard home AC network, with a single load (a lamp) used for operational verification.

<img width="629" alt="Screenshot 2024-12-10 at 10 09 31" src="https://github.com/user-attachments/assets/6597afed-b50c-45c8-a19d-412452fe4fc3">

The Shelly application was used to enable the MQTT protocol on the devices. Subsequently, the devices were managed locally through the implementation of a Mosquitto broker, which facilitated the communication between the application and the devices via MQTT. This setup allowed for thorough testing of the application’s features, including real-time monitoring, device control, and data visualization.

---

## License

This project is licensed under the ISC License.

## Author

Developed by **Alex Kurtz**.

---

Let me know if you need further modifications or additions!
