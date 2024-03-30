import MongoClient from "../db/client.js";

async function checkIfPseudoExist(req,res,next){
    let samePlayerOrNot = [];
    try{
        await MongoClient.connect();
        const db = MongoClient.db(String(process.env.DBNAME));
        const collection = db.collection('runners');
        samePlayerOrNot = await collection.findOne({
            pseudo: req.body.pseudo
        })
        if(!samePlayerOrNot){
            await collection.insertOne({
                pseudo: req.body.pseudo,
                score: req.body.score,
                color: req.body.color,
                password: req.body.password,
            });
        
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
export default checkIfPseudoExist;