const NA = "NA";
const WE = "WE";
let continent = $("#select-continent");
var chart;
var ChartSalaires;
var res_questionnaire_WE;
var res_questionnaire_NA;

const URL_DATA_NA = "../../data/survey_results_NA.JSON";
const URL_DATA_WE = "../../data/survey_results_WE.JSON";

let DATA_NA;
let DATA_WE;

// Créer le chart lors du chargement de la page
$(document).ready(function () {
    ChargerData().then(function () {
        loadChart();
    });
});

// Permet de sélectionner le continent ainsi que la base de données à utiliser avant de mettre à jour le graphique
function majChart() {
    continent = $("#select-continent").val();
    if(continent==WE)
        updateChart(res_questionnaire_WE);
    else   
        updateChart(res_questionnaire_NA);
}

// Sélectionne le revenu en fonction du continent et du pays choisi
function moyenneSalairePays(SalairesPays) {
    var somme = SalairesPays.reduce(function(acc, valeur) {
        return acc + valeur;
    }, 0);
    return somme/SalairesPays.length;
}

// Créer un chart avec les données présentes dans à l'url au format JSON 
function loadChart() {
    let [pays, salaires] = revenuMoyenParPays(res_questionnaire_WE);
    const donnees = {
        labels: pays,
        datasets: [{
            label: 'Salaire Moyen',
            data: salaires
        }]
    }
    const options = { scales: {y: {beginAtZero: true}}}
    config = {
        type: 'bar',
        data: donnees,
        options: options
    }
    chart = document.getElementById('Revenu-Moyen-Pays-Continent');
    ChartSalaires = new Chart(chart, config);
}

// Récupère les données au format JSON stocké dans un fichier à l'endroit "url"
function recupData(url) {
    let request=$.ajax({
        type:"GET",
        url: url
    });
    request.done(function (output){
        let dataString = JSON.stringify(output);
        res_questionnaire = JSON.parse(dataString);
        loadChart(res_questionnaire)
    });
    return null;
}

function ChargerData() {
    return new Promise((resolve, reject) => {
        let request1 = $.ajax({
            type: "GET",
            url: URL_DATA_NA
        });
        request1.done(function (output) {
            let dataString = JSON.stringify(output);
            res_questionnaire_NA = JSON.parse(dataString);
        });
        let request2 = $.ajax({
            type: "GET",
            url: URL_DATA_WE
        });
        request2.done(function (output) {
            let dataString = JSON.stringify(output);
            res_questionnaire_WE = JSON.parse(dataString);
        });
        $.when(request1, request2).done(function () {
            resolve();
        });
    });
}


// Liste l'ensemble des salaires par pays 
// Renvoi un dictionnaire avec comme clés les noms de pays et en valeur la liste des revenues enregistré du pays 
function revenusParPays(res_questionnaire) {
    let salairesPays = {} ;
    for (let res of res_questionnaire) {
        if(res["Currency"]=="NA" || res["CompTotal"]=="NA")
            continue;
        if (!salairesPays.hasOwnProperty(res["Country"]))
            salairesPays[res["Country"]] = [];
        let monnaie = res["Currency"].split(" ")[0];
        let montant = parseFloat(res["CompTotal"]).toFixed(2);
        salairesPays[res["Country"]].push(convertEuro(monnaie, montant));
    }
    return salairesPays
}

// Renvoie le salaire moyen du pays sélectionné
function revenus1Pays(res_questionnaire, pays) {
    let salairesPays = [];
    for (let res of res_questionnaire) {
        if(res["Country"]==pays) {
            if(res["Currency"]!="NA" && res["CompTotal"]!="NA") {
                let monnaie = res["Currency"].split(" ")[0];
                let montant = convertEuro(monnaie, parseFloat(res["CompTotal"])).toFixed(2);
                salairesPays.push(montant);
            } 
        }
    }
    let montantTotal = 0;
    for (let salaire in salairesPays) {
        montantTotal = montantTotal+ parseFloat(salaire);
    }
    return montantTotal/salairesPays.length;
}

// Calcul le revenu moyen d'un continent par pays
// retourne un dictionnaire avec comme clés les noms de pays et en valeurs le revenu moyen du pays en question
function revenuMoyenParPays(res_questionnaire) {
    let salairesPays;
    salairesPays = revenusParPays(res_questionnaire);
    listePays = [];
    listeSalaires = [];
    for (let pays of Object.keys(salairesPays)) {
        let somme = 0;
        for(let salaire of salairesPays[pays]){
            if(isNaN(salaire))
                continue;
            somme += salaire;
        }
        let frequence = salairesPays[pays].length;
        let revenueMoyen = parseFloat(somme/frequence).toFixed(2);
        listePays.push(pays);
        listeSalaires.push(revenueMoyen);
    }
    return [listePays, listeSalaires];
}

function updateChart(res_questionnaire) {
    let [pays, salaires] = revenuMoyenParPays(res_questionnaire);
    document.ChartSalaires = ChartSalaires.data.datasets[0].data = salaires;
    document.ChartSalaires = ChartSalaires.data.labels = pays;
    ChartSalaires.update();
}