window.document.addEventListener("DOMContentLoaded", function () {
 
  const signForm = document.getElementById("signForm");
  const modal = document.getElementById("modal");
  const logInForm = document.getElementById('logInForm');
  const spanConnexion = document.getElementById("spanConnexion")
  let keyName = "Space"
  let runnerReady;
  let idSquarre;


  spanConnexion.addEventListener('click', () => {
    let signDiv = document.getElementById('signIn');
    let loginDiv = document.getElementById('logIn')
    signDiv.style.display = "none"
    loginDiv.style.display = "block"
  })



  signForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let inputPseudo = document.getElementById("signInPseudo");
    let inputColor = document.getElementById("avatar-color");
    let inputPassword = document.getElementById("signInPassword");
    let data = {
      pseudo: inputPseudo.value,
      score: 0,
      color: inputColor.value,
      password: inputPassword.value
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
          let pError = document.getElementById('pError')
          if(!pError) {
            pError = document.createElement('p')
            signForm.appendChild(pError)
          }
          pError.id = 'pError'
          pError.textContent = 'Ce pseudo est déjà pris'
        } else {
          const socket = io();
          socket.emit("runnerColor", res.playerData);
          socket.on("numberOfPlayerOn", (numberOfPlayerOn) => {
            let runnerDiv = document.getElementById(idSquarre)
            if(numberOfPlayerOn === 2) {
              onConnexion(socket);   
              if(!runnerDiv) {
                socket.emit('runnerCreation')
              }
              setTimeout(() => {
                socket.emit("timer");
              }, 500)
              let pWaiting = document.getElementById('pWaiting');
              if(pWaiting){
                pWaiting.remove();
              }
            } else {
              let pWaiting = document.createElement('p')
              window.document.body.appendChild(pWaiting);
              pWaiting.id = 'pWaiting';
              pWaiting.textContent = 'En attente du 2eme joueur...'
              console.log("En attente du 2eme joueur")
            }
          })
          setTimeout(() => {
            document.querySelector('p').remove()
            modal.remove();
          }, 500);
        }
      });
  });

  logInForm.addEventListener("submit", (event) => {
    event.preventDefault();
    let inputPseudo = document.getElementById("logInpseudo");
    let inputPassword = document.getElementById("logInpassword");
    let data = {
      pseudo: inputPseudo.value,
      password: inputPassword.value
    };
    fetch("/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if(res.isExist) {
          let pError = document.getElementById('pError')
          if(!pError) {
            pError = document.createElement('p')
            logInForm.appendChild(pError)
          }
          pError.id = 'pError'
          pError.textContent = 'Identifiant ou mot de passe incorrect'
        } else {
          const socket = io();
          socket.emit("runnerColor", res.playerData);
          socket.on("numberOfPlayerOn", (numberOfPlayerOn) => {
            console.log('nombre de joueurs co', numberOfPlayerOn)
            let runnerDiv = document.getElementById(idSquarre)
            if(numberOfPlayerOn === 2) {
              onConnexion(socket);   
              if(!runnerDiv) {
                socket.emit('runnerCreation')
              }
              setTimeout(() => {
                socket.emit("timer");
              }, 500)
              let pWaiting = document.getElementById('pWaiting');
              if(pWaiting){
                pWaiting.remove();
              }
            } else {
              let pWaiting = document.createElement('p')
              window.document.body.appendChild(pWaiting);
              pWaiting.id = 'pWaiting';
              pWaiting.textContent = 'En attente du 2eme joueur...'
              console.log("En attente du 2eme joueur")
            }
          })
          setTimeout(() => {
            document.querySelector('p').remove()
            modal.remove();
          }, 500);
        }
      });
  });

    function onConnexion(socket){
      socket.on("destroyRunner", (runnersDataFromserver) => {
        let runnerReady = window.document.getElementById(runnersDataFromserver.id);
        if (runnerReady) {
          runnerReady.parentNode.removeChild(runnerReady);
        }
      });
      socket.on("runnersCreation", (runnersDataFromserver) => {
        console.log(runnersDataFromserver)
        idSquarre = runnersDataFromserver.id
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
        if (event.code === keyName) {
          const runnerLeft = runnerReady.style.left;
          socket.emit("smashSpace", { runnerLeft });
        };
      });

      socket.on("chrono", (chronoData) => {
        let timerDiv = window.document.getElementById(chronoData.timeId);
        if (!timerDiv) {
          timerDiv = window.document.createElement("div");
          window.document.body.appendChild(timerDiv);
        }
        timerDiv.id = chronoData.timeId;
        timerDiv.textContent = chronoData.time + "s";
        if(chronoData.time === 0) {
          keyName = ''
        }
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
    }

});
