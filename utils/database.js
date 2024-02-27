const { MongoClient } = require("mongodb");

let _db;

exports.mongoConnect = async (callback) => {
  try {
    // Imprimir la variable de entorno
    const urlMongo = process.env.DB || "mongodb://192.168.100.5:27017/test";
    const client = await MongoClient.connect(urlMongo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    _db = client.db("exercise-tracker");
    callback();
  } catch (err) {
    console.log(err);
    throw err;
  }
};

exports.getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found";
};
