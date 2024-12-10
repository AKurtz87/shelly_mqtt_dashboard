const API_BASE_URL_ADMIN = "/api/admin";

function createEditButton(onClick) {
  const button = document.createElement("button");
  button.textContent = "Edit";
  button.className = "edit-button";
  button.onclick = onClick; // Collega la funzione clic
  return button;
}

function createDeleteButton(onClick) {
  const button = document.createElement("button");
  button.textContent = "Delete";
  button.className = "delete-button";
  button.onclick = onClick; // Collega la funzione clic
  return button;
}

async function adminFetchRooms() {
  const response = await fetch(`${API_BASE_URL}/rooms`);
  const rooms = await response.json();
  const roomsList = document.getElementById("rooms-list-admin");
  roomsList.innerHTML = "";

  rooms.forEach((room) => {
    const row = document.createElement("tr");

    // Crea le celle per ogni campo
    row.innerHTML = `
        <td>${room.id}</td>
        <td>${room.name}</td>
        <td>${room.description}</td>
        <td></td>
      `;

    // Crea la cella per i pulsanti e aggiungila alla riga
    const actionCell = row.querySelector("td:last-child");
    actionCell.appendChild(createEditButton(() => updateRoom(room.id)));
    actionCell.appendChild(createDeleteButton(() => deleteRoom(room.id)));

    // Aggiungi la riga alla tabella
    roomsList.appendChild(row);
  });
}

async function adminFetchSwitches() {
  const response = await fetch(`${API_BASE_URL_ADMIN}/switches`);
  const switches = await response.json();
  const switchesList = document.getElementById("switches-list");
  switchesList.innerHTML = "";

  switches.forEach((sw) => {
    const row = document.createElement("tr");

    // Crea le celle per i dati dello switch
    row.innerHTML = `
        <td>${sw.id}</td>
        <td>${sw.name}</td>
        <td>${sw.room_id}</td>
        <td>${sw.topic_prefix}</td>
        <td>${sw.status}</td>
        <td></td>
      `;

    // Aggiungi i pulsanti Edit e Delete nella cella delle azioni
    const actionCell = row.querySelector("td:last-child");
    actionCell.appendChild(createEditButton(() => updateSwitch(sw.id)));
    actionCell.appendChild(createDeleteButton(() => deleteSwitch(sw.id)));

    // Aggiungi la riga completa alla tabella
    switchesList.appendChild(row);
  });
}

async function adminFetchSensors() {
  const response = await fetch(`${API_BASE_URL_ADMIN}/sensors`);
  const sensors = await response.json();
  const sensorsList = document.getElementById("sensors-list");
  sensorsList.innerHTML = "";

  sensors.forEach((sr) => {
    const row = document.createElement("tr");

    // Crea le celle per i dati dello switch
    row.innerHTML = `
        <td>${sr.id}</td>
        <td>${sr.name}</td>
        <td>${sr.room_id}</td>
        <td>${sr.topic_prefix}</td>
        <td>${sr.value}</td>
        <td></td>
      `;

    // Aggiungi i pulsanti Edit e Delete nella cella delle azioni
    const actionCell = row.querySelector("td:last-child");
    actionCell.appendChild(createEditButton(() => updateSensor(sr.id)));
    actionCell.appendChild(createDeleteButton(() => deleteSensor(sr.id)));

    // Aggiungi la riga completa alla tabella
    sensorsList.appendChild(row);
  });
}

function createRoom() {
  const name = prompt("Room Name:");
  const description = prompt("Room Description:");
  if (!name || !description)
    return alert("Both name and description are required.");
  fetch(`${API_BASE_URL_ADMIN}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  }).then(adminFetchRooms);
}

function updateRoom(id) {
  const name = prompt("New Room Name:");
  const description = prompt("New Room Description:");
  if (!name || !description)
    return alert("Both name and description are required.");
  fetch(`${API_BASE_URL_ADMIN}/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  }).then(adminFetchRooms);
}

function deleteRoom(id) {
  fetch(`${API_BASE_URL_ADMIN}/rooms/${id}`, { method: "DELETE" }).then(
    adminFetchRooms
  );
}

function createSwitch() {
  const name = prompt("Switch Name:");
  const room_id = prompt("Room ID:");
  const topic_prefix = prompt("Topic Prefix:");
  const status = prompt("Status (on/off/unknown):");
  if (!name || !room_id || !topic_prefix || !status) {
    return alert("All fields are required.");
  }
  fetch(`${API_BASE_URL_ADMIN}/switches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, room_id, topic_prefix, status }),
  }).then(adminFetchSwitches);
}

function updateSwitch(id) {
  const name = prompt("New Switch Name:");
  const room_id = prompt("New Room ID:");
  const topic_prefix = prompt("New Topic Prefix:");

  // Controlla che tutti i campi siano forniti
  if (!name || !room_id || !topic_prefix) {
    return alert("All fields (name, room_id, topic_prefix) are required.");
  }

  fetch(`${API_BASE_URL_ADMIN}/switches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, room_id, topic_prefix }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          throw new Error(error.error);
        });
      }
      return response.json();
    })
    .then(() => {
      alert("Switch updated successfully.");
      adminFetchSwitches(); // Aggiorna la lista degli switch
    })
    .catch((err) => {
      console.error("[ERROR] Failed to update switch:", err.message);
      alert(`Error updating switch: ${err.message}`);
    });
}

function deleteSwitch(id) {
  fetch(`${API_BASE_URL_ADMIN}/switches/${id}`, { method: "DELETE" }).then(
    adminFetchSwitches
  );
}

function createSensor() {
  const name = prompt("Sensor Name:");
  const room_id = prompt("Room ID:");
  const topic_prefix = prompt("Topic Prefix:");

  if (!name || !room_id || !topic_prefix) {
    return alert("All fields are required.");
  }
  fetch(`${API_BASE_URL_ADMIN}/sensors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, room_id, topic_prefix }),
  }).then(adminFetchSensors);
}

function updateSensor(id) {
  const name = prompt("New Sensor Name:");
  const room_id = prompt("New Room ID:");
  const topic_prefix = prompt("New Topic Prefix:");

  // Controlla che tutti i campi siano forniti
  if (!name || !room_id || !topic_prefix) {
    return alert("All fields (name, room_id, topic_prefix) are required.");
  }

  fetch(`${API_BASE_URL_ADMIN}/sensors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, room_id, topic_prefix }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          throw new Error(error.error);
        });
      }
      return response.json();
    })
    .then(() => {
      alert("Sensor updated successfully.");
      adminFetchSensors(); // Aggiorna la lista degli sensori
    })
    .catch((err) => {
      console.error("[ERROR] Failed to update sensor:", err.message);
      alert(`Error updating sensor: ${err.message}`);
    });
}

function deleteSensor(id) {
  fetch(`${API_BASE_URL_ADMIN}/sensors/${id}`, { method: "DELETE" }).then(
    adminFetchSensors
  );
}

function createActionButtons(onEdit, onDelete) {
  return `
    <button class="edit-button" onclick="(${onEdit})()">Edit</button>
    <button class="delete-button" onclick="(${onDelete})()">Delete</button>
  `;
}

// Fetch data on page load
adminFetchRooms();
adminFetchSwitches();
adminFetchSensors();
