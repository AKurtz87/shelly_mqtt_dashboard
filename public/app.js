document.addEventListener("DOMContentLoaded", () => {
  const roomsMenu = document.getElementById("rooms-menu");
  const roomsTable = document.getElementById("rooms-table");
  const roomsList = document.getElementById("rooms-list");
  const selectedRoomSection = document.getElementById("selected-room-section");
  const selectedRoom = document.getElementById("selected-room");
  const roomsSection = document.getElementById("rooms-section");
  const devicesSection = document.getElementById("devices-section");
  const sensorsSection = document.getElementById("sensors-section");
  const deviceList = document.getElementById("device-list");
  const sensorList = document.getElementById("sensor-list");
  const deviceTableHeader = document.getElementById("device-table-header");
  const sensorTableHeader = document.getElementById("sensor-table-header");
  const roomsTitle = document.getElementById("rooms");
  const adminMenu = document.querySelector("#mainAdmin");

  adminMenu.style.display = "none";

  function goAdmin() {
    roomsSection.style.display = "none";
    devicesSection.style.display = "none";
    selectedRoomSection.style.display = "none";
    sensorsSection.style.display = "none";
    adminMenu.style.display = "block";
    removeActiveClassFromMenuItems();
  }

  function goMainPage() {
    // Nascondi altre sezioni e mostra la lista delle stanze
    devicesSection.style.display = "none";
    sensorsSection.style.display = "none";
    selectedRoomSection.style.display = "none";
    adminMenu.style.display = "none";
    roomsSection.style.display = "block";
    roomsTitle.style.display = "block";
    roomsTable.style.display = "table";
    removeActiveClassFromMenuItems();
  }

  function removeActiveClassFromMenuItems() {
    const menuItems = document.querySelectorAll("#rooms-menu li.active");
    menuItems.forEach((item) => {
      item.classList.remove("active");
    });
  }

  // Carica e visualizza tutte le stanze
  async function loadRooms() {
    roomsTitle.style.display = "block";
    roomsList.innerHTML = ""; // Cancella la lista corrente delle stanze
    const rooms = await fetchRooms();

    rooms.forEach((room) => {
      const row = document.createElement("tr");

      // ID della stanza
      const idCell = document.createElement("td");
      idCell.textContent = room.id;
      row.appendChild(idCell);

      // Numero stanza
      const numberCell = document.createElement("td");
      numberCell.textContent = room.name;
      row.appendChild(numberCell);

      // Descrizione
      const descriptionCell = document.createElement("td");
      descriptionCell.textContent = room.description;
      row.appendChild(descriptionCell);

      roomsList.appendChild(row);
    });
  }

  // Carica il menu delle stanze
  async function loadRoomsMenu() {
    roomsMenu.innerHTML = "<ul></ul>";
    const rooms = await fetchRooms();
    const menuList = roomsMenu.querySelector("ul");

    // Aggiungi Home al menu
    const roomsListItem = document.createElement("li");
    roomsListItem.id = "rooms-list-page";
    roomsListItem.textContent = "Home";
    roomsListItem.classList.add("admin-menu-item");
    roomsListItem.addEventListener("click", goMainPage);
    roomsListItem.style.backgroundColor = "gray";
    menuList.appendChild(roomsListItem);

    // Aggiungi le stanze al menu
    rooms.forEach((room) => {
      const menuItem = document.createElement("li");
      menuItem.textContent = room.name;
      menuItem.addEventListener("click", () => showSelectedRoom(room));
      menuList.appendChild(menuItem);
    });

    // Aggiungi Admin Menu al menu
    const adminMenuItem = document.createElement("li");
    adminMenuItem.id = "admin";
    adminMenuItem.textContent = "Admin Menu";
    adminMenuItem.classList.add("admin-menu-item");
    adminMenuItem.addEventListener("click", goAdmin);
    adminMenuItem.style.backgroundColor = "orange";
    menuList.appendChild(adminMenuItem);
  }

  // Mostra la stanza selezionata e i suoi dispositivi
  async function showSelectedRoom(room) {
    adminMenu.style.display = "none";

    // Evidenzia la stanza selezionata
    removeActiveClassFromMenuItems();
    const selectedMenuItem = Array.from(roomsMenu.querySelectorAll("li")).find(
      (item) => item.textContent === room.name
    );
    if (selectedMenuItem) {
      selectedMenuItem.classList.add("active");
    }

    // Nascondi altre sezioni e mostra la stanza selezionata
    roomsTable.style.display = "none";
    roomsTitle.style.display = "none";
    selectedRoomSection.style.display = "block";

    // Mostra i dettagli della stanza
    selectedRoom.innerHTML = "";
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = room.id;
    row.appendChild(idCell);

    const numberCell = document.createElement("td");
    numberCell.textContent = room.name;
    row.appendChild(numberCell);

    const descriptionCell = document.createElement("td");
    descriptionCell.textContent = room.description;
    row.appendChild(descriptionCell);

    selectedRoom.appendChild(row);

    // Carica i dispositivi e i sensori della stanza
    await loadDevices(room.id);
    await loadSensors(room.id);
  }

  // Carica e visualizza i dispositivi di una specifica stanza
  async function loadDevices(roomId) {
    deviceList.innerHTML = ""; // Pulisce i dispositivi precedenti
    const devices = await fetchDevices(roomId);

    // Mostra o nascondi la sezione dispositivi in base alla presenza di dispositivi
    if (devices.length > 0) {
      devicesSection.style.display = "block"; // Mostra la sezione
      deviceTableHeader.style.display = "table-header-group"; // Mostra l'intestazione della tabella
    } else {
      devicesSection.style.display = "none"; // Nascondi la sezione
    }

    // Aggiunge i dispositivi alla tabella
    devices.forEach((device) => {
      const row = document.createElement("tr");

      // Nome dispositivo
      const nameCell = document.createElement("td");
      nameCell.textContent = device.name;
      row.appendChild(nameCell);

      // Stato dispositivo
      const statusCell = document.createElement("td");
      statusCell.textContent = device.status;
      row.appendChild(statusCell);

      // Azione
      const actionCell = document.createElement("td");
      if (device.type !== "sensor") {
        const button = document.createElement("button");
        button.textContent = device.status === "on" ? "Turn Off" : "Turn On";
        button.style.backgroundColor =
          device.status === "on" ? "red" : "seagreen";

        button.addEventListener("click", async () => {
          const newCommand = device.status === "on" ? "off" : "on";
          try {
            await sendDeviceCommand(device.id, newCommand);
            loadDevices(roomId);
          } catch (error) {
            console.error(`Error updating device ${device.id}:`, error);
          }
        });

        actionCell.appendChild(button);
      } else {
        actionCell.textContent = "N/A";
      }
      row.appendChild(actionCell);

      // Visualizza dati
      const viewDataCell = document.createElement("td");
      const viewButton = document.createElement("button");
      viewButton.classList.add("view-charts");
      viewButton.textContent = "Chart";
      viewButton.addEventListener("click", () => {
        window.location.href = `charts.html?deviceId=${device.name}`;
      });
      viewDataCell.appendChild(viewButton);
      row.appendChild(viewDataCell);

      deviceList.appendChild(row);
    });
  }

  function splitString(inputString) {
    if (typeof inputString !== "string") {
      throw new Error("Input must be a string");
    }
    return inputString.split("/");
  }

  // Carica e visualizza i sensori di una specifica stanza
  async function loadSensors(roomId) {
    sensorList.innerHTML = ""; // Pulisce i sensori precedenti
    const sensors = await fetchSensors(roomId);

    // Mostra o nascondi la sezione sensori in base alla presenza di sensori
    if (sensors.length > 0) {
      sensorsSection.style.display = "block"; // Mostra la sezione
      sensorTableHeader.style.display = "table-header-group"; // Mostra l'intestazione della tabella
    } else {
      sensorsSection.style.display = "none"; // Nascondi la sezione
    }

    // Aggiunge i sensori alla tabella
    sensors.forEach((sensor) => {
      const row = document.createElement("tr");

      // Nome switch sensore
      const switchNameCell = document.createElement("td");
      switchNameCell.textContent = splitString(sensor.topic_prefix)[1];
      row.appendChild(switchNameCell);

      // Nome sensore
      const nameCell = document.createElement("td");
      nameCell.textContent = sensor.name;
      row.appendChild(nameCell);

      // Valore sensore
      const valueCell = document.createElement("td");
      valueCell.textContent = sensor.value;
      row.appendChild(valueCell);

      // Visualizza dati
      const viewDataCell = document.createElement("td");
      const viewButton = document.createElement("button");
      viewButton.classList.add("view-charts");
      viewButton.textContent = "Chart";
      viewButton.addEventListener("click", () => {
        window.location.href = `charts.html?deviceId=${
          splitString(sensor.topic_prefix)[1]
        }`;
      });
      viewDataCell.appendChild(viewButton);
      row.appendChild(viewDataCell);

      sensorList.appendChild(row);
    });
  }

  // Inizializzazione
  loadRooms();
  loadRoomsMenu();
  loadSensors();
});
