const API_BASE_URL = "http://localhost:3000/api";

// Fetch all rooms
async function fetchRooms() {
  const response = await fetch(`${API_BASE_URL}/rooms`);
  console.log("OKfetchRooms");
  return response.json();
}

// Fetch devices for a specific room
async function fetchDevices(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/devices`);
  console.log("OKfetchDevices");
  return response.json();
}

// Fetch sensors for a specific room
async function fetchSensors(roomId) {
  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/sensors`);
  console.log("OKfetchSensors");
  return response.json();
}

// Send a command to a device
async function sendDeviceCommand(deviceId, command) {
  console.log(deviceId, command);
  const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  return response.json();
}
