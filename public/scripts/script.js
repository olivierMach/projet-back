window.document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const form = document.getElementById("form");
  let runnerReady;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let inputPseudo = document.getElementById("pseudo");
    let inputColor = document.getElementById("avatar-color");
    let data = {
      pseudo: inputPseudo.value,
      score: 0,
      color: inputColor.value,
    };
    fetch("/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if(res.isExist) {
          let pError = document.createElement('p')
          form.appendChild(pError)
          pError.textContent = 'Ce pseudo est déjà pris'
        } else {
          socket.emit("runnerColor", data);
          socket.emit("timer");
          setTimeout(() => {
            form.remove();
          }, 500);
        }
      });
  });

  socket.on("destroyRunner", (runnersDataFromserver) => {
    let runnerReady = window.document.getElementById(runnersDataFromserver.id);
    if (runnerReady) {
      runnerReady.parentNode.removeChild(runnerReady);
    }
  });
  socket.on("runnersCreation", (runnersDataFromserver) => {
    let runnerPseudo = window.document.getElementById(
      runnersDataFromserver.pseudoId
    );
    runnerReady = window.document.getElementById(runnersDataFromserver.id);
    if (!runnerReady && !runnerPseudo) {
      runnerReady = window.document.createElement("div");
      window.document.body.appendChild(runnerReady);
      runnerPseudo = window.document.createElement("span");
      window.document.body.appendChild(runnerPseudo);
    }
    runnerReady.id = runnersDataFromserver.id;
    runnerReady.style.top = runnersDataFromserver.top;
    runnerReady.style.left = runnersDataFromserver.left;
    runnerReady.style.width = runnersDataFromserver.width;
    runnerReady.style.height = runnersDataFromserver.height;
    runnerReady.style.borderRadius = runnersDataFromserver.radius;
    runnerReady.style.position = runnersDataFromserver.position;
    runnerReady.style.backgroundColor = runnersDataFromserver.backgroundColor;
    runnerPseudo.id = runnersDataFromserver.pseudoId;
    runnerPseudo.textContent = runnersDataFromserver.pseudo;
    runnerPseudo.style.top = parseInt(runnersDataFromserver.top) + -3 + "%";
    runnerPseudo.style.left = runnersDataFromserver.left;
    runnerPseudo.style.position = runnersDataFromserver.position;
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      const runnerLeft = runnerReady.style.left;
      socket.emit("smashSpace", { runnerLeft });
    }
  });

  socket.on("chrono", (chronoData) => {
    let timerDiv = window.document.getElementById(chronoData.timeId);
    if (!timerDiv) {
      timerDiv = window.document.createElement("div");
      window.document.body.appendChild(timerDiv);
    }
    timerDiv.id = chronoData.timeId;
    console.log(chronoData.timeId);
    timerDiv.textContent = chronoData.time + "s";
    socket.emit("timer");
  });

   socket.on("timeEnd", (data) => {
     let timerDiv = window.document.getElementById(data.timerData.timeId)
     const { winnerId } = data;
     const allRunners = document.querySelectorAll("div");
     allRunners.forEach((runner) => {
       if (runner.id === winnerId) {
         runner.textContent = "winner";
       } else {
         runner.textContent = "loser";
         timerDiv.textContent = data.winnerPseudo + ' a gagné la course !'
        }
     });
   });
});
