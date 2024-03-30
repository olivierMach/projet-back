import MongoClient from "../db/client.js";

async function pseudoAndPasswordOk(req,res,next){
    let playerData;
    try{
        await MongoClient.connect();
        const db = MongoClient.db(String(process.env.DBNAME));
        const collection = db.collection('runners');
        playerData = await collection.findOne({
            pseudo: req.body.pseudo,
            password : req.body.password
        }, { projection: { _id: 0, password: 0 } })
        if(playerData){
            req.body.playerDataReq = playerData
            req.body.pseudoExist = false;
            next();
        }else{
            req.body.pseudoExist = true;
            next();
        }
    }catch(error){
        console.error(error)
    }finally{
        MongoClient.close();
    }
    
}
export default pseudoAndPasswordOk;