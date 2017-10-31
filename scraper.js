/******************************************************************************
// GLOBAL VARIABLES
******************************************************************************/
const         fs = require('fs'), // file system module
        scrapeIt = require('scrape-it'), // content scraper module (scrape-it)
        json2csv = require('json2csv'); // json to csv converter module (json2csv)

const dataFolder = './data', // folder for storing csv files
          fields = ['title', 'price', 'imgURL', 'url', 'time'], // fields for structure
      fieldNames = ["Title", "Price","ImageURL", "URL", "Time"]; // field headers for csv file

/******************************************************************************
// MAIN PROGRAM
// Content Scraper
// This promise function will visit shirts4mike.com/shirts.php and scrape
// for shirts on the page.
******************************************************************************/
scrapeIt("http://www.shirts4mike.com/shirts.php", { // scrape for all shirts using dom selection
    shirts: {
        listItem: ".products li",
        data: {
        url: {
            selector: "a",
            attr: "href"
        }}}
    })
    
    .then(shirts => { // create array of shirt pages with details
        shirts = shirts.shirts;
        let shirtsArray = shirts.map(scrapeShirtData); 
        let allShirts = Promise.all(shirtsArray)
        
        .then(data => { // once promise is fulfilled, map all array elements with timestamp and create folder with csv
            data.map(shirt => shirt.time = new Date().toString("hh:mm tt"));
            createDataFolder();
            createCSV(data);
        })
    })
    .catch(err => {
        console.log(err);
});

/******************************************************************************
// FUNCTIONS
// Shirt Data Scraper
// This function will scrape for the full products details to be pushed
// to the CSV file.
******************************************************************************/
function scrapeShirtData(product) {
    let productUrl = `http://www.shirts4mike.com/${product.url}`;
    
    return scrapeIt(productUrl, { // return scrape-it results pulled for all five column elements
    title: 'title',
    price: '.price',
    imgURL: {
        selector: 'img',
        attr: 'src',
        convert: x => createImageUrl(x)
    },
    url: {
        selector: 'img',
        attr: 'src',
        convert: y => createShirtUrl(y)
    },
    });
};

/******************************************************************************
// Data Folder Creator
// This function will create a Data folder if there already isn't one.
******************************************************************************/
function createDataFolder() {
    if (!fs.existsSync(dataFolder)) { // no data folder exists, create one
        fs.mkdirSync(dataFolder);
        console.log("NOTICE: Creating 'Data' folder for CSV file.")
    } else { // data folder already exists, exit function
        return 0;
    }
    return 0;
};

/******************************************************************************
// Today's Date Getter
// This will determine today's date which is used for CSV filename.
******************************************************************************/
function getDate() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth() +1 ;
    var dd = today.getDate();

    if(mm < 10) {
        mm = '0' + mm;
    } 

    if(dd < 10) {
        dd = '0' + dd;
    } 

    today = yyyy + '-' + mm + '-' + dd;
    return today;
};

/******************************************************************************
// Image URL Creator
// This will pass in a half complete image URL for a shirt, and then
// add the necessary prefix information to make it a complete URL.
******************************************************************************/
function createImageUrl(incompleteImageUrl) {
    incompleteImageUrl = 'http://www.shirts4mike.com/' + incompleteImageUrl;
    return incompleteImageUrl;
};

/******************************************************************************
// Shirt URL Creator
// This will pass in the image URL for a shirt, read it to determine the
// unique ID of the shirt, and then insert that ID into a pre-configured URL.
******************************************************************************/
function createShirtUrl(imageUrl) {
    let shirtId = imageUrl.match(/\d+/g);
    let shirtUrl = `http://www.shirts4mike.com/shirt.php?id=${shirtId}`;
    return shirtUrl;
};

/******************************************************************************
// CSV File Creator
// This will create the CSV file. If a file already exists, the data will
// be overwritten after a file wipe (not a delete).
******************************************************************************/
function createCSV(data) {
    try {
        const todaysDate = getDate(); // grab timestamp to use for csv file naming

        fs.stat(`${dataFolder}/${todaysDate}.csv`, function(err, stat) {
        if(err == null) {  // file exists, clear file then insert data
            console.log('NOTICE: File already exists. Overwriting data in file.');
            fs.truncate(`${dataFolder}/${todaysDate}.csv`, 0);

            let csv = json2csv({ data: data, fields: fields, fieldNames: fieldNames });
            let csvFile = `${dataFolder}/${todaysDate}.csv`;

            fs.writeFile(csvFile, csv);
            console.log("NOTICE: CSV file successfully created.");
        } else if(err.code == 'ENOENT') { // file doesn't exist, insert data
            let csv = json2csv({ data: data, fields: fields, fieldNames: fieldNames });
            let csvFile = `${dataFolder}/${todaysDate}.csv`;

            fs.writeFile(csvFile, csv);
            console.log("NOTICE: CSV file successfully created.");
        }
    })
    } catch (error) {
        console.log(error);
    }
};