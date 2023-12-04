const NA = "NA"
const WE = "WE"
var chart;
var derou_pays;
const URL_DATA_NA = "../../data/survey_results_NA.JSON"
const URL_DATA_WE = "../../data/survey_results_WE.JSON"


$(document).ready(function() {
    recupData(NA, createChart);
});

function moyenneSalairePays(SalairesPays) {
    
    var somme = SalairesPays.reduce(function(acc, valeur) {
        return acc + valeur;
    }, 0);
    return somme/SalairesPays.length;
}

function recupData(continent, functionChart) {
    let url = "";
    if (continent == NA) {
        url = URL_DATA_NA;
    } else {
        url = URL_DATA_WE;
    }
    let request = $.ajax({
        type: "GET",
        url: url
    });

    request.done(function (output) {
        let dataString = JSON.stringify(output);
        const res_questionnaire = JSON.parse(dataString);
        functionChart(res_questionnaire);
    });
}

function createChart(data) {
    createCountriesDropDown(data);

    // Données globales (sans sélection de pays)
    const [EdLevel, moyeLevel] = salaireMoyenParEducation(data);

    if (chart) {
        chart.destroy();
    }

    const chartData = {
        labels: EdLevel,
        datasets: [{
            label: 'Moyenne par Education Level',
            data: moyeLevel
        }]
    };

    const chartConfig = {
        type: 'bar',
        data: chartData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    chart = new Chart(document.getElementById('chart'), chartConfig);

    // Gestion du changement de pays
    $('#select-derou_pays').on('change', function () {
        const paysSelectionne = $(this).val();
        console.log("Pays sélectionné :", paysSelectionne);

        const [EdLevelPays, moyeLevelPays] = salaireMoyenParEducation(data, paysSelectionne);

        if (chart) {
            chart.destroy();
        }

        const chartDataPays = {
            labels: EdLevelPays,
            datasets: [{
                label: 'Moyenne par Education Level : ' + paysSelectionne,
                data: moyeLevelPays
            }]
        };

        const chartConfigPays = {
            type: 'bar',
            data: chartDataPays,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };

        chart = new Chart(document.getElementById('chart'), chartConfigPays);
    });
}



// Liste l'ensemble des salaires par pays 
// Renvoi un dictionnaire avec comme clés les noms de pays et en valeur la liste des revenues enregistré du pays 
function revenusParPays(res_questionnaire) {
    let salairesPays = {} 
    for (let res of res_questionnaire) {
        if (!salairesPays.hasOwnProperty(res["Country"])) {
            salairesPays[res["Country"]] = [];
        }
        if(res["Currency"]!="NA" && res["CompTotal"]!="NA") {
            let monnaie = res["Currency"].split(" ")[0];
            let montant = parseFloat(res["CompTotal"]).toFixed(2);
            salairesPays[res["Country"]].push(convertEuro(monnaie, montant));
        }
    }
    return salairesPays
}

// Renvoie le salaire moyen du pays sélectionné
function revenus1Pays(res_questionnaire, pays) {
    let salairesPays = []
    for (let res of res_questionnaire) {
        if(res["Country"]==pays) {
            let monnaie = res["Currency"].split(" ")[0];
            let montant = convertEuro(monnaie, parseFloat(res["CompTotal"])).toFixed(2);
            if(!isNaN(montant)) {
                salairesPays.push(montant);
            }
        }
    }
    let montantTotal = 0;
    for (let salaire in salairesPays) {
        montantTotal = montantTotal+ parseFloat(salaire);
    }
    return montantTotal/salairesPays.length
}

// Calcul le revenu moyen d'un continent par pays
// retourne un dictionnaire avec comme clés les noms de pays et en valeur le revenu moyen du pays en question
function revenuMoyenParPays(res_questionnaire) {
    let salairesPays = revenusParPays(res_questionnaire)
    listePays = []
    listeSalaires = []
    for (let pays of Object.keys(salairesPays)) {
        let somme = salairesPays[pays].reduce((acc, nombre) => acc + nombre, 0);
        let frequence = salairesPays[pays].length;
        revenueMoyen = parseFloat(somme/frequence).toFixed(2)
        listePays.push(pays)
        listeSalaires.push(revenueMoyen)
    }
    return [listePays, listeSalaires]
}


// Renvoie la liste des pays
function listPays(res_questionnaire) {
    let pays = [];
    for (let res of res_questionnaire) {
        pays.push(res["Country"]);
    }
    let ensemblePaysUnique = new Set(pays);
    let paysUnique = Array.from(ensemblePaysUnique);
    return paysUnique;
}

function createCountriesDropDown(jsonData) {
    const select = document.createElement('select');
    
    select.id = 'select-derou_pays';

    const derou_pays = document.getElementById('derou_pays');
    derou_pays.innerHTML = '';

    const countries = getCountries(jsonData);

    countries.forEach((country) => {
        const option = document.createElement('option');
        option.value = country;
        option.text = country;
        select.appendChild(option);
    });

    derou_pays.appendChild(select);
}


function getCountries(data) {
    const countries = [];
    for (let i = 0; i < data.length; i++) {
        const country = data[i]["Country"];
        if (!countries.includes(country)) {
            countries.push(country);
        }
    }
    return countries;
}

function getEduLevel(data) {
    const countries = [];
    for (let i = 0; i < data.length; i++) {
        const country = data[i]["EdLevel"];
        if (!countries.includes(country)) {
            countries.push(country);
        }
    }
    return countries;
}

function salaireByEducation(data) {
    const incomeByEducation = {};
    let Edlevel = [];
    let moyeLevel = [];
    // Filtrer les données invalides
    const validData = data.filter(edu => edu.CompTotal !== "NA" && edu.EdLevel !== "NA");

    // Regrouper par niveau d'études
    validData.forEach(edu => {
        if (!incomeByEducation.hasOwnProperty(edu.EdLevel)) {
            incomeByEducation[edu.EdLevel] = { sum: 0, count: 0 };
        }
        incomeByEducation[edu.EdLevel].sum += parseFloat(edu.CompTotal);
        incomeByEducation[edu.EdLevel].count += 1;
    });

    for (const level in incomeByEducation) {
        const { sum, count } = incomeByEducation[level];
        const moyenne = sum / count;
        Edlevel.push(level);
        moyeLevel.push(moyenne);
    }

    return [Edlevel, moyeLevel];
}

function salaireMoyenParEducationPays(res_questionnaire, pays) {
    const salairesPays = res_questionnaire.filter(res => res["Country"] === pays);
    let Edlevel = [];
    let moyeLevel = [];
    const incomeByEducation = {};
    salairesPays.forEach(res => {
        const niveauEducation = res["EdLevel"];
        const salaire = parseFloat(res["CompTotal"]);
        
        if (niveauEducation && !isNaN(salaire)) {
            if (!incomeByEducation.hasOwnProperty(niveauEducation)) {
                incomeByEducation[niveauEducation] = { sum: 0, count: 0 };
            }

            incomeByEducation[niveauEducation].sum += salaire;
            incomeByEducation[niveauEducation].count += 1;
        }
    });

    for (const level in incomeByEducation) {
        const { sum, count } = incomeByEducation[level];
        const moyenne = sum / count;
        Edlevel.push(level);
        moyeLevel.push(moyenne.toFixed(2));
    }

    return [Edlevel, moyeLevel];
}


function salaireMoyenParEducation(data, pays = null) {
    let incomeByEducation = {};
    let Edlevel = [];
    let moyeLevel = [];
    
    // Si un pays est spécifié, filtrer les données pour ce pays
    let salairesPays = pays ? data.filter(res => res["Country"] === pays): data;

    // Filtrer les données invalides
    let validData = salairesPays.filter(edu => edu.CompTotal !== "NA" && edu.EdLevel !== "NA");

    // Regrouper par niveau d'études
    validData.forEach(edu => {
        if (!incomeByEducation.hasOwnProperty(edu.EdLevel)) {
            incomeByEducation[edu.EdLevel] = { sum: 0, count: 0 };
        }
        incomeByEducation[edu.EdLevel].sum += parseFloat(edu.CompTotal);
        incomeByEducation[edu.EdLevel].count += 1;
    });

    for (let level in incomeByEducation) {
        let { sum, count } = incomeByEducation[level];
        let moyenne = sum / count;
        Edlevel.push(level);
        moyeLevel.push(moyenne.toFixed(2));
    }

    return [Edlevel, moyeLevel];
}