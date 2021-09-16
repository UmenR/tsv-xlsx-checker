const csv=require('csvtojson')

var readTSVFile = async (filename) => {
  const jsonArray = await csv({delimiter:'\t'}).fromFile(filename);
  return jsonArray;
}

module.exports = readTSVFile;