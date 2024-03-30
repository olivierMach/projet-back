import path from "node:path";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import "dotenv/config";
import cors from "cors";
import checkIfPseudoExist from "./src/middlewares/ifExist.js";
import pseudoAndPasswordOk from "./src/middlewares/pseudoAndPasswordOk.js";

const port = 32895;
const app = express();

app.use(cors("*"));
app.use(express.json());
app.use("/public", express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(
    path.normalize(path.join(process.cwd(), "./public/html/index.html"))
  );
});

app.post("/subscribe", checkIfPseudoExist, async (req, res) => {
  if (req.body.pseudoExist) {
    res.send(JSON.stringify({ isExist: true }));
  } else {
    res.send(JSON.stringify({ isExist: false }));
  }
});

app.post("/sign-in", pseudoAndPasswordOk, async (req, res) => {
  if (req.body.pseudoExist) {
    res.send(JSON.stringify({ isExist: true}));
  } else {
    res.send(JSON.stringify({ isExist: false,  playerData: req.body.playerDataReq }));
  }
});

const httpServer = app.listen(port, () => {
  console.log("Server started on 32895");
});

const ioServer = new Server(httpServer);

// Création d'un objet pour stocker tous les runners
const allTheRunners = {};

let playersNumber = 0;
// Espacement initial pour les runners
let topOfSet = 35 
let number = 10
ioServer.on("connection", (socket) => {
  const runnerForThisConnection = {
    id: uuidv4(),
    top: `${topOfSet}%`, // Utilisation de l'espacement actuel
    left: "0px",
    width: "50px",
    height: "50px",
    position: "absolute",
    radius: "5px",
    backgroundColor: "grey",
    pseudoId: uuidv4(),
    pseudo: "",
  };

  let timerData = {};
  let time = 10000;

  // Ajout du nouveau runner à la liste
  allTheRunners[runnerForThisConnection.id] = runnerForThisConnection;

  if(playersNumber <= 1) {
    playersNumber++
    console.log('nombre de joueur', playersNumber)
    ioServer.emit("numberOfPlayerOn", playersNumber)
  }
  
  socket.on('runnerCreation', () => {
    // Envoyer le nouveau runner à tous les clients
    for (const id in allTheRunners) {
      console.log(allTheRunners[id].id)
      if(allTheRunners[id].id !== runnerForThisConnection.id) {
       let çacommenceacasserlescoujilles = parseFloat( allTheRunners[id].top) + number;
       allTheRunners[id].top = çacommenceacasserlescoujilles + '%'
       number = number * 2
      }
      ioServer.emit("runnersCreation", allTheRunners[id]);
    }
  })

  socket.on("runnerColor", (runnerData) => {
    console.log(runnerData);
    runnerForThisConnection.backgroundColor = runnerData.color;
    runnerForThisConnection.pseudo = runnerData.pseudo;
  });

  socket.on("disconnect", () => {
    console.log(`${runnerForThisConnection.pseudo} c'est déconnecté`);
    if (allTheRunners[runnerForThisConnection.id]) {
      delete allTheRunners[runnerForThisConnection.id];
      ioServer.emit("destroyRunner", runnerForThisConnection);
    }
  });
  socket.on("smashSpace", (runnerData) => {
    runnerForThisConnection.left = parseInt(runnerData.runnerLeft) + 3 + "px";
    for (const id in allTheRunners) {
      playersNumber--
      ioServer.emit("runnersCreation", allTheRunners[id]);
    }
  });
  socket.on("timer", () => {
    if (time > 0) {
      time--;
      timerData = {
        time: time,
        timeId: "564054",
      };
      socket.emit("chrono", timerData);
    } else {
      const sortedRunners = Object.values(allTheRunners).sort(
        (a, b) => parseInt(a.left) - parseInt(b.left)
      );
      const winnerId = sortedRunners[sortedRunners.length - 1].id;
      const winnerPseudo = sortedRunners[sortedRunners.length - 1].pseudo;
      ioServer.emit("timeEnd", { winnerId, winnerPseudo, timerData }); // Émettre à tous les clients
    }
  });
});
