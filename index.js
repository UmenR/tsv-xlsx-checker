var readXLSXFile = require('./src/xlsx-API');
var readTSVFile = require('./src/tsv-API');
var settings = require('./settings.json');
var tsv = require('tsv');
var fs = require('fs');
var util = require('util');
var log_stdout = process.stdout;

var log_file = fs.createWriteStream(__dirname + '/logs/debug.log', { flags: 'w' });
console.log = function (d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

var inputDirXLSX = settings['input-xlsx-dir'];
var inputDirTSV = settings['input-tsv-dir'];
var outputDir = settings['output-dir'];
var dryRun = false;

async function main() {
    var languages = settings.languages;
    for (element of languages) {
        await checkSettings(element.language);
    }
}

async function checkSettings(language) {
    console.log("|*|*|*|*|*|*|*| Processing Language " + language + " |*|*|*|*|*|*|*|");
    console.log("\n");

    var languages = settings.languages;
    var languageSetting = null;

    languages.forEach(element => {
        // console.log(element.language);
        if (element.language === language) {
            languageSetting = element;
        }
    });
    if (languageSetting) {
        // console.log(languageSetting)
        var xlsxFileName = languageSetting['excel-file-name'];
        var tsvFileName = languageSetting['tsv-file-name'];

        if (xlsxFileName && tsvFileName && checkFileExists("./" + inputDirXLSX + "/" + xlsxFileName) &&
            checkFileExists("./" + inputDirTSV + "/" + tsvFileName)) {

            var columnNameTranslation = languageSetting['translationRow'];
            var columnNamePriority = languageSetting['priorityRow'];

            if (columnNamePriority && columnNameTranslation) {
                await checkDiffAndUpdate("./" + inputDirXLSX + "/" + xlsxFileName,
                    "./" + inputDirTSV + "/" + tsvFileName, {
                    "translationRow": languageSetting['translationRow'],
                    "priorityRow": languageSetting['priorityRow'],
                    "keyRow": settings["keyRow"]
                }, languageSetting['output-file-name']);
            } else {
                console.log("*** Error! *** ")
                console.log("Column Names Not defined");
                console.log("\n");
            }
        } else {
            console.log("*** Error! *** ")
            console.log("Excel sheet or TSV file not found");
            console.log("\n");
        }
    } else {
        console.log("*** Error! *** ")
        console.log("Settings Not found for Langugage : '" + language + "'");
        console.log("\n");
    }
}

async function checkDiffAndUpdate(excelFileName, tsvFileName, ColumnNames, outputFileName) {

    // tsvJsonArray contains all the rows in the TSV File
    var tsvJsonArray = await readTSVFile(tsvFileName);

    // xlsxJsonArray contains all the rows in the XLSX File
    var xlsxJsonArray = await readXLSXFile(excelFileName);

    // Use a MAP to store the translation value for each key.
    var translatedContentMap = new Map();

    xlsxJsonArray.forEach(row => {
        // Each row will contain an Object with Column Names as keys & there values.
        // A Column will be present as a field only if that Coulumn has a value.
        // Therefore We do not have to deal with empty values.
        if (row[ColumnNames.priorityRow] != undefined) {
            translatedContentMap.set(row[ColumnNames.keyRow], row[ColumnNames.priorityRow]);
        } else if (row[ColumnNames.translationRow] != undefined) {
            translatedContentMap.set(row[ColumnNames.keyRow], row[ColumnNames.translationRow]);
        }
    });

    tsvJsonArray.forEach(element => {
        // Check if EXCEL sheet contains key for languageID
        var excelVal = translatedContentMap.get(element.LanguageId);
        if (excelVal !== undefined) {
            if (element.LanguageValue.normalize("NFKC").trim() == excelVal.normalize("NFKC").trim()) {
                // Values are same no need to change

            } else {
                console.log("--------------- Changed Value Detected ---------------");
                console.log("Key : " + element.LanguageId);
                console.log("\n")
                console.log("New : " + element.LanguageValue.trim());
                console.log("Old : " + excelVal.trim());
                element.LanguageValue = excelVal.trim();
                console.log(element.LanguageValue.normalize("NFKC").trim() == excelVal.normalize("NFKC").trim());
                console.log("\n");
                console.log("\n");
            }
        }
    });

    var writeTsvString = await tsv.stringify(tsvJsonArray);
    
    try {
         fs.writeFileSync("./" + outputDir + "/" + outputFileName, writeTsvString);
        console.log("New TSV file created at : " + "./" + outputDir + "/" + outputFileName);
    } catch (err) {
        console.error(err);
        console.log("Could not create new TSV file!");
    }
    // console.log(settings);
}

function checkFileExists(filename) {
    if (fs.existsSync(filename))
        return true;
    return false;
}

main();


// Depricated Method kept for reference.
// await readTSVFile(tsvFileName).then(async function (tsvJsonArray) {
    //     // tsvJsonArray contains all the rows in the TSV File
    //     // xlsxJsonArray contains all the rows in the XLSX File
    //     var xlsxJsonArray = await readXLSXFile(excelFileName);

    //     // Use a MAP to store the translation value for each key.
    //     var translatedContentMap = new Map();

    //     xlsxJsonArray.forEach(row => {
    //         // Each row will contain an Object with Column Names as keys & there values.
    //         // A Column will be present as a field only if that Coulumn has a value.
    //         // Therefore We do not have to deal with empty values.
    //         if (row[ColumnNames.priorityRow] != undefined) {
    //             translatedContentMap.set(row[ColumnNames.keyRow], row[ColumnNames.priorityRow]);
    //         } else if (row[ColumnNames.translationRow] != undefined) {
    //             translatedContentMap.set(row[ColumnNames.keyRow], row[ColumnNames.translationRow]);
    //         }
    //     });

    //     tsvJsonArray.forEach(element => {
    //         // Check if EXCEL sheet contains key for languageID
    //         var excelVal = translatedContentMap.get(element.LanguageId);
    //         if (excelVal !== undefined) {
    //             if (element.LanguageValue.normalize("NFKC").trim() == excelVal.normalize("NFKC").trim()) {
    //                 // Values are same no need to change

    //             } else {
    //                 console.log("--------------- Changed Value Detected ---------------");
    //                 console.log("Key : " + element.LanguageId);
    //                 console.log("\n")
    //                 console.log("New : " + element.LanguageValue.trim());
    //                 console.log("Old : " + excelVal.trim());
    //                 element.LanguageValue = excelVal.trim();
    //                 console.log(element.LanguageValue.normalize("NFKC").trim() == excelVal.normalize("NFKC").trim());
    //                 console.log("\n");
    //                 console.log("\n");
    //             }
    //         }
    //         // console.log(element.LanguageId);
    //         // console.log(element.LanguageValue);
    //     });

    //     // for(const entry of translatedContentMap.entries()) {
    //     //     console.log(entry);
    //     // }
    //     // console.log(translatedContentMap.get("asdasd"));
    //     // console.log(tsvJsonArray);
    //     var writeTsvString = tsv.stringify(tsvJsonArray);
    //     // console.log(writeTsvString);
    //     try {
    //         fs.writeFile("./" + outputDir + "/" + outputFileName, writeTsvString, function (err, result) {
    //             if (err) {
    //                 console.log("Could not create new TSV file!");
    //                 console.log(err);
    //             } else {
    //                 console.log("New TSV file created at : " + "./" + outputDir + "/" + outputFileName);
    //             }
    //         });
    //     } catch (err) {
    //         console.error(err);
    //     }
    //     // console.log(settings);
    // });