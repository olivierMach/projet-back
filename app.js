import path from "node:path";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import MongoClient from "./src/db/client.js";
import "dotenv/config";
import cors from "cors"

const port = 3030;
const app = express();

app.use(cors('*'));
app.use(express.json());
app.use("/public", express.static("./public"));

app.get("/", (req, res) => {
  res.sendFile(
    path.normalize(path.join(process.cwd(), "./public/html/index.html"))
  );
});

app.post("/subscribe", async (req, res) => {
 try {
      await MongoClient.connect();
      const db = MongoClient.db(String(process.env.DBNAME));
      const collection = db.collection('runners');
      const findPlayerOrNot = await collection
      .find({pseudo: req.body.pseudo}, { projection: { _id: 0, score: 0 } })
      .toArray();
      console.log(findPlayerOrNot)
      if(findPlayerOrNot.length > 0) {
        res.send(JSON.stringify({response : 'Ce pseudo existe déjà', isExist: true}))
      } else {
        await collection.insertOne({
          pseudo: req.body.pseudo,
          score: req.body.score
        });
        res.send(JSON.stringify({isExist: false}))
      }
    } catch (error) {
      console.error(error);
    } finally {
      MongoClient.close();
    }
});

const httpServer = app.listen(port, () => {
  console.log("Server started on 3030");
});

const ioServer = new Server(httpServer);

// Création d'un objet pour stocker tous les runners
const allTheRunners = {};
const allTheRunnersWrapped = [];

// Espacement initial pour les runners
let topOffset = 35;

ioServer.on("connection", (socket) => {
  const runnerForThisConnection = {
    id: uuidv4(),
    top: `${topOffset}%`, // Utilisation de l'espacement actuel
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
  let time = 5000;

  // Ajout du nouveau runner à la liste
  allTheRunners[runnerForThisConnection.id] = runnerForThisConnection;

  // Envoyer le nouveau runner à tous les clients
  for (const id in allTheRunners) {
    ioServer.emit("runnersCreation", allTheRunners[id]);
    topOffset += 5;
  }

  socket.on("runnerColor", async (runnerData) => {
    console.log(runnerData);
    runnerForThisConnection.backgroundColor = runnerData.color;
    runnerForThisConnection.pseudo = runnerData.pseudo;
  });
  // Augmenter l'espacement pour le prochain runner
  // topOffset += 120; // 100px (hauteur du runner) + 20px (espacement)
  socket.on("disconnect", () => {
    console.log("déconnecté");
    if (allTheRunners[runnerForThisConnection.id]) {
      delete allTheRunners[runnerForThisConnection.id];
      ioServer.emit("destroyRunner", runnerForThisConnection);
    }
  });
  socket.on("smashSpace", (runnerData) => {
    runnerForThisConnection.left = parseInt(runnerData.runnerLeft) + 3 + "px";
    for (const id in allTheRunners) {
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
      const sortedRunners = Object.values(allTheRunners).sort((a, b) => parseInt(a.left) - parseInt(b.left));
      const winnerId = sortedRunners[sortedRunners.length - 1].id;
      const winnerPseudo = sortedRunners[sortedRunners.length - 1].pseudo;
    ioServer.emit('timeEnd', { winnerId, winnerPseudo, timerData }); // Émettre à tous les clients

    }
  });
});
