import { txPlayers, modPlayer } from './classes';
// FIXME: Remove jQuery, we really don't need it

let txPlayer = new txPlayers();



//================================================================
//============================================== Playerlist
//================================================================
//Vars and elements
let cachedPlayers = [];
let playerlistElement = document.getElementById("playerlist");
let plistMsgElement = document.getElementById("playerlist-message");
let plistCountElement = document.getElementById("plist-count");
let plistSearchElement = document.getElementById("plist-search");

//Apply filter
function applyPlayerlistFilter() {
  let search = plistSearchElement.value.toLowerCase();
  Array.from(playerlistElement.children).forEach((el) => {
    if (el.id == "playerlist-message") return;
    if (
      search == "" ||
      (typeof el.dataset["pname"] == "string" &&
        el.dataset["pname"].includes(search))
    ) {
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });
}

//Search function
plistSearchElement.addEventListener("input", function (ev) {
  applyPlayerlistFilter();
});

//TODO: try this again, currently doesn't feel a very polished experience
// Clear search when the user clicks away
// plistSearchElement.addEventListener('focusout', (event) => {
//     setTimeout(() => {
//         event.target.value = ''
//         Array.from(playerlistElement.children).forEach(el => {
//             if(el.id == 'playerlist-message') return;
//             el.hidden = false;
//         });
//     }, 1000);
// });

//Handle Remove, Add and Update playerlist
function removePlayer(player) {
  document.getElementById(`divPlayer${player.id}`).remove();
}

function addPlayer(player) {
  let div = `<div class="list-group-item list-group-item-accent-secondary player text-truncate" 
                onclick="showPlayer('${player.license}')" id="divPlayer${player.id}">
                    <span class="pping text-secondary">&nbsp;??</span>
                    <span class="pname">#${player.id}</span>
            </div>`;
  $("#playerlist").append(div);
}

function updatePlayer(player) {
  let el = document.getElementById(`divPlayer${player.id}`);

  let pingClass;
  player.ping = parseInt(player.ping);
  if (player.ping === NaN || player.ping < 0) {
    pingClass = "secondary";
    player.ping = "??";
  } else if (player.ping < 60) {
    pingClass = "success";
  } else if (player.ping < 100) {
    pingClass = "warning";
  } else {
    pingClass = "danger";
  }

  el.classList.remove(
    "list-group-item-accent-secondary",
    "list-group-item-accent-success",
    "list-group-item-accent-warning",
    "list-group-item-accent-danger"
  );
  el.classList.add("list-group-item-accent-" + pingClass);
  el.firstElementChild.classList.remove(
    "text-secondary",
    "text-success",
    "text-warning",
    "text-danger"
  );
  el.firstElementChild.classList.add("text-" + pingClass);
  el.firstElementChild.innerHTML = player.ping
    .toString()
    .padStart(3, "x")
    .replace(/x/g, "&nbsp;");
  el.lastElementChild.textContent = player.name;
  el.dataset["pname"] = player.name.toLowerCase();
}

function processPlayers(players) {
  //If invalid playerlist or error message
  if (!Array.isArray(players)) {
    Array.from(playerlistElement.children).forEach((el) => (el.hidden = true));
    if (typeof players == "string") {
      plistMsgElement.textContent = players;
    } else if (players === false) {
      plistMsgElement.textContent = "Playerlist not available.";
    } else {
      plistMsgElement.textContent = "Invalid playerlist";
    }
    plistMsgElement.hidden = false;
    return;
  }
  plistMsgElement.hidden = true;
  applyPlayerlistFilter();

  let newPlayers, removedPlayers, updatedPlayers;
  try {
    newPlayers = players.filter((p) => {
      return !cachedPlayers.filter((x) => x.id === p.id).length;
    });

    removedPlayers = cachedPlayers.filter((p) => {
      return !players.filter((x) => x.id === p.id).length;
    });

    updatedPlayers = cachedPlayers.filter((p) => {
      return players.filter((x) => x.id === p.id).length;
    });
  } catch (error) {
    console.log(
      `Failed to process the playerlist with message: ${error.message}`
    );
  }

  removedPlayers.forEach(removePlayer);
  newPlayers.forEach(addPlayer);
  updatedPlayers.forEach(updatePlayer);

  if (!players.length) {
    plistMsgElement.hidden = false;
    plistMsgElement.textContent = "No Players Online";
  }
  cachedPlayers = players;
  plistCountElement.textContent = players.length;
}

// Open Modal
function showPlayer(license, altName = "unknown", altIDs = "") {
  //Reset active player
  modPlayer.curr.id = false;
  modPlayer.curr.license = false;
  modPlayer.curr.identifiers = false;

  //Reset modal
  modPlayer.Message.innerHTML = spinnerHTML;
  modPlayer.Message.classList.remove("d-none");
  modPlayer.Content.classList.add("d-none");
  modPlayer.Title.innerText = "loading...";

  modPlayer.Main.tab.classList.add("active");
  modPlayer.Main.body.classList.add("show", "active");
  modPlayer.Main.joinDate.innerText = "--";
  modPlayer.Main.playTime.innerText = "--";
  modPlayer.Main.sessionTime.innerText = "--";
  modPlayer.Main.notesLog.innerText = "--";
  modPlayer.Main.notes.value = "";

  modPlayer.IDs.tab.classList.remove("active");
  modPlayer.IDs.body.classList.remove("show", "active");
  modPlayer.IDs.list.innerText = "loading...";

  modPlayer.History.tab.classList.remove("active");
  modPlayer.History.body.classList.remove("show", "active");
  modPlayer.History.list.innerText = "loading...";

  modPlayer.Ban.tab.classList.remove("nav-link-red", "active");
  modPlayer.Ban.body.classList.remove("show", "active");
  modPlayer.Ban.tab.classList.add("nav-link-disabled", "disabled");

  modPlayer.Ban.reason.value = "";
  modPlayer.Ban.durationSelect.value = "2 days";
  modPlayer.Ban.durationMultiplier.value = "";
  modPlayer.Ban.durationUnit.value = "days";
  modPlayer.Ban.durationMultiplier.disabled = true;
  modPlayer.Ban.durationUnit.disabled = true;
  modPlayer.Buttons.search.disabled = true;
  modPlayer.Buttons.message.disabled = true;
  modPlayer.Buttons.kick.disabled = true;
  modPlayer.Buttons.warn.disabled = true;
  modPlayer.Modal.show();

  //Perform request
  $.ajax({
    url: "/player/" + license,
    type: "GET",
    dataType: "json",
    timeout: timeoutMedium,
    success: function (data) {
      if (data.logout) {
        window.location = "/auth?logout";
        return;
      } else if (data.type == "danger") {
        modPlayer.Title.innerText = "Error";
        modPlayer.Message.innerHTML = `<h4 class=text-danger>${xss(
          data.message
        )}</h4>`;
        return;
      } else if (data.type == "offline") {
        modPlayer.Title.innerText = altName;
        const idsArray = altIDs.split(";");
        const idsString = idsArray.join(";\n");
        let msgHTML = `<h4 class=text-danger>${xss(data.message)}</h4>\n`;
        msgHTML += `Player Identifiers:<br>\n`;
        msgHTML += `<code>${xss(idsString)}</code>`;
        modPlayer.Message.innerHTML = msgHTML;
        modPlayer.curr.identifiers = idsArray;
        modPlayer.Buttons.search.disabled = false;
        return;
      }
      modPlayer.curr.id = data.id;
      modPlayer.curr.license = data.license;
      modPlayer.curr.identifiers = data.identifiers;
      modPlayer.Title.innerText = data.id
        ? `[${data.id}] ${data.name}`
        : data.name;

      modPlayer.Main.joinDate.innerText = data.joinDate;
      modPlayer.Main.playTime.innerText = data.playTime;
      modPlayer.Main.sessionTime.innerText = data.sessionTime;
      modPlayer.Main.notesLog.innerText = data.notesLog;
      modPlayer.Main.notes.disabled = data.isTmp;
      modPlayer.Main.notes.value = data.notes;
      modPlayer.IDs.list.innerText = data.identifiers.join(",\n");

      if (!Array.isArray(data.actionHistory) || !data.actionHistory.length) {
        modPlayer.History.list.innerHTML = `<h3 class="mx-auto pt-3 text-secondary">nothing here...</h3>`;
      } else {
        data.actionHistory.reverse();
        const elements = data.actionHistory.map((log) => {
          return `<div class="list-group-item list-group-item-accent-${xss(
            log.color
          )} player-history-entry">
                                [${xss(log.date)}]<strong>[${xss(
            log.action
          )}]</strong>
                                ${xss(log.reason)} (${xss(log.author)})
                            </div>`;
        });
        // FIXME: make the log scrollable instead of this?
        elements.push(`<div class="text-center text-info">
                    For more events, click on the Search button below.
                </div>`);
        modPlayer.History.list.innerHTML = elements.join("\n");
      }

      modPlayer.Buttons.search.disabled = false;
      modPlayer.Buttons.message.disabled = data.funcDisabled.message;
      modPlayer.Buttons.kick.disabled = data.funcDisabled.kick;
      modPlayer.Buttons.warn.disabled = data.funcDisabled.warn;

      //TODO: Show message disabling ban form if the user is already banned?
      //      Or maybe just warn "this user is already banned"
      if (!data.funcDisabled.ban) {
        modPlayer.Ban.tab.classList.add("nav-link-red");
        modPlayer.Ban.tab.classList.remove("nav-link-disabled", "disabled");
      }

      modPlayer.Content.classList.remove("d-none");
      modPlayer.Message.classList.add("d-none");
    },
    error: function (xmlhttprequest, textstatus, message) {
      modPlayer.Title.innerText = "error";
      modPlayer.Content.classList.add("d-none");
      modPlayer.Message.classList.remove("d-none");
      modPlayer.Message.innerText = `Error loading player info:\n${message}`;
    },
  });
}

// Save Note
//function setNoteMessage(msg, type) {
//  if (typeof type == "string") {
//    modPlayer.Main.notesLog.innerHTML = `<span class="text-${type}">${msg}</span>`;
//  } else {
//    modPlayer.Main.notesLog.innerText = msg;
//  }
//}
modPlayer.Main.notes.addEventListener("keydown", (event) => {
    txPlayer.noteMessage(`Press enter to save`);
  if (event.keyCode == 13 && !event.shiftKey) {
    event.preventDefault();
    txPlayer.noteMessage(`Saving...`, "warning");
    //setNoteMessage(`Saving...`, "warning");
    const data = {
      license: modPlayer.curr.license,
      note: modPlayer.Main.notes.value,
    };
    $.ajax({
      type: "POST",
      url: "/player/save_note",
      timeout: timeoutLong,
      data: data,
      dataType: "json",
      success: function (data) {
        if (typeof data.message == "string" && typeof data.type == "string") {
            txPlayer.noteMessage(data.message, data.type)
        } else {
            txPlayer.noteMessage(`Failed to save with error: wrong return format`, "danger")
        }
      },
      error: function (xmlhttprequest, textstatus, message) {
        txPlayer.noteMessage(`Failed to save with error: ${message}`, "danger");
      },
    });
  }
});

// Redirect to player search page
function searchPlayer() {
  modPlayer.Modal.hide();
  if (modPlayer.curr.identifiers == false) return;
  const idsString = modPlayer.curr.identifiers.join(";");
  if (window.location.pathname == "/player/list") {
    searchInput.value = idsString;
    performSearch();
  } else {
    window.location = "/player/list#" + encodeURI(idsString);
  }
}

// Message player

function messagePlayer() {
  txPlayer.messagePlayer()
}

// kick player
function kickPlayer() {
  txPlayer.kick();
}


//Warn Player
function warnPlayer() {
  txPlayer.warnPlayer();
}

modPlayer.Ban.durationSelect.onchange = () => {
  const isDefault = modPlayer.Ban.durationSelect.value !== "custom";
  modPlayer.Ban.durationMultiplier.disabled = isDefault;
  modPlayer.Ban.durationUnit.disabled = isDefault;
};


// Ban Player
function banPlayer() {
  txPlayer.banPlayer();
}
