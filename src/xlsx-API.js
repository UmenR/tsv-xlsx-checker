var XLSX = require('xlsx')

function readXLSXFile(filename) {
    var workbook = XLSX.readFile(filename);
    var sheet_name_list = workbook.SheetNames;
    var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    return xlData;
}

module.exports = readXLSXFile;