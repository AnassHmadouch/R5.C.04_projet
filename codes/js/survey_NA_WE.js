const NA = 'NA';
const WE = 'WE';

const URL_DATA_NA = "../../data/survey_results_NA.json";
const URL_DATA_WE = "../../data/survey_results_WE.json";

var monnaies = new Map();

monnaies.set('AED',4.01)
monnaies.set('AFN',75.14)
monnaies.set('ALL',104.09)
monnaies.set('AMD',438.58)
monnaies.set('ANG',1.96)
monnaies.set('ARS',386.45)
monnaies.set('AUD',1.67)
monnaies.set('AWG',1.97)
monnaies.set('AZN',1.86)
monnaies.set('BAM',1.96)
monnaies.set('BIF',3096.65)
monnaies.set('BRL',5.36)
monnaies.set('CAD',1.50)
monnaies.set('CDF',2869.39)
monnaies.set('CHF',0.97)
monnaies.set('CLP',970.82)
monnaies.set('COP',4462)
monnaies.set('CUP',26.12)
monnaies.set('DJF',193.79)
monnaies.set('EUR',1)
monnaies.set('FJS',2.46)
monnaies.set('FKP',0.87)
monnaies.set('GBP',0.87)
monnaies.set('GHS',13.01)
monnaies.set('GIP',0.87)
monnaies.set('HUF',379.13)
monnaies.set('IDR',16854.83)
monnaies.set('IRR',46191.43)
monnaies.set('LAK',22576.90)
monnaies.set('NOK',11.76)
monnaies.set('PEN',4.21)
monnaies.set('PLN',4.38)
monnaies.set('QAR',3.98)
monnaies.set('SLL',21581.81)
monnaies.set('THB',38.34)
monnaies.set('TWD',34.52)
monnaies.set('UAH',39.32)
monnaies.set('USD',1.09)
monnaies.set('XPF',120.69)
monnaies.set('YER',273.53)
monnaies.set('ZAR',20.07)
monnaies.set('ZMW',25.27)

function loadData(continent) {
    let url = '';

    switch (continent) {
        case NA:
            url = URL_DATA_NA;
            break;
        case WE:
            url = URL_DATA_WE;
            break;
        default:
            console.error("Erreur de Continent");
            return;
    }
    console.log("url du fichier JSON:", url);

    let request = $.ajax({
        type: "GET",
        url: url
    });

    request.done(function(output) {
        let dataString = JSON.stringify(output);
        let jsonData = JSON.parse(dataString);
        
        //console.log(calculateAverageIncomeByEducation(jsonData));

        console.log(loadSalary(jsonData));
    });
}

function convertEuro(Salaire,Monnaie) {
    TC = monnaies.get(Monnaie);
    Sal = Salaire/TC
    return Sal
}

function loadSalary(jsonData){
    const conversions = [];

    jsonData.forEach(person => {
        YearsCodePro = person.YearsCodePro;
        currencyString = person.Currency;
        const monnaie = currencyString.slice(0, 3);
        const convertedSalary = convertEuro(person.CompTotal, monnaie);
        conversions.push({
            Salaire: person.CompTotal,
            Monnaie: monnaie,
            SalaireConverti: convertedSalary
        });
    });
    
    console.log("Liste des conversions :");
    conversions.forEach(result => {
        console.log(`Salaire: ${result.Salaire} ${result.Monnaie} => Salaire converti en Euro: ${result.SalaireConverti} EUR`);
    });
}

function testLoadData() {
    // Test pour le continent NA
    console.log("Test pour le continent NA:");
    loadData(NA);

    // Test pour le continent WE
    console.log("Test pour le continent WE:");
    loadData(WE);
}