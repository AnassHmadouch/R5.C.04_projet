const NA = "NA";
const WE = "WE";
var SELECT_TOUS_LES_PAYS="tous"
let continent = $("#select-continent");
var chartMoyen;
var chartFramework;
var res_questionnaire_WE;
var res_questionnaire_NA;

const URL_DATA_NA = "../../data/survey_results_NA.JSON";
const URL_DATA_WE = "../../data/survey_results_WE.JSON";

let DATA_NA;
let DATA_WE;

// Créer un chart lors du chargement de la page. Le chart dépend de la page en question
$(document).ready(function () {
    let titreDeLaPage = document.title;
    let titreDataset;
    let dataX;
    let dataY;
    let idChart = $('canvas:first').attr('id');
    ChargerData().then(function () {
        switch (titreDeLaPage) {
            case "moyenne":
                titreDataset = 'Salaire Moyen par pays';
                titreChart = "Salaire Moyen par pays";
                // idChart = "chart_moyen"
                [dataX, dataY] = revenuMoyenParPays(res_questionnaire_WE);
                loadChart(dataX, dataY, titreDataset, titreChart, idChart);
                break;
            case "framework":
                titreDataset = 'Salaire Moyen des développeurs en fonction des frameworks utilisés';
                // idChart = "chart_framework";
                [dataX, dataY, salaireParTrancheAnneesExp] = revenusMoyenParFrameworkTrancheExp(res_questionnaire_WE, SELECT_TOUS_LES_PAYS);
                loadRadarChart(salaireParTrancheAnneesExp, dataX, dataY, idChart);
                createCountriesDropDown(res_questionnaire_WE);
                break;
            default:
                titreDataset = 'Salaire Moyen';
                [dataX, dataY] = revenuMoyenParPays(res_questionnaire_WE);
        }
    });
});

// Permet de sélectionner le bon graphique ainsi que les bonnes données à mettre à jour en fonction de la page de l'utilisateur. 
function majChart() {
    let titreDataSet;
    let titreChart;
    let res_questionnaire = whichContinent()
    let titreDeLaPage = document.title;
    let chart;
    switch (titreDeLaPage) {
        // Page revenusMoyen.html
        case "moyenne":
            titreDataset = 'Salaire Moyen par pays';
            titreChart = "Salaire Moyen par pays";
            let [dataX1, DataY1] = revenuMoyenParPays(res_questionnaire);
            chart = chartMoyen;
            updateChart(chart, dataX1, DataY1, titreDataSet, titreChart);
            break;
        // Page revenusFrameworks.html
        case "framework":
            let pays = $("#select-derou_pays").val();
            let idchart = "chart_framework"
            let [dataX2, DataY2, salaireParTrancheAnneesExp] = revenusMoyenParFrameworkTrancheExp(res_questionnaire, pays);
            updateChartFramework(dataX2, DataY2, salaireParTrancheAnneesExp, idchart);
            break;
    }
}

// Retourne le dataset json en fonction du continent choisi
function whichContinent() {
    continent = $("#select-continent").val();
    if(continent==WE){
        return res_questionnaire_WE;
    } else{
        return res_questionnaire_NA;
    }
}

// Créer un chart avec un seul dataset
// dataX correspond au données des abscisses (liste de string)
// dataY orrespond au données des ordonnées (liste de valeurs réels)
// titreDataSet sera le titre en string du dataset
// titreChart sera le titre du graphique
// idChart correspond à l'identifiant de la balise canvas pour le chart
function loadChart(dataX, dataY, titreDataSet, titreChart, idChart) {
    const donnees = {
        labels: dataX,
        datasets: [{
            label: titreDataSet,
            data: dataY
        }]
    };
    const options = {
        responsive: true, 
        scales: {
            y: {beginAtZero: true}
        },
        plugins: {
            title: { 
                display: true,
                text: titreChart
            }
        }
    };
    let config = {
        type: 'bar',
        data: donnees,
        options: options
    };
    let chart = document.getElementById(idChart);
    chartMoyen = new Chart(chart, config);
}

// Charge les deux fichier (NA, WE) de données json sur le questionnaire (survey)
// Une promesse est mise en place pour attendre le chargement des données avant de continuer l'exécution de code.
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

// Permet de mettre à jour un chart avec 1 seul dataset.
// dataX correspond au données des abscisses (liste de string)
// dataY orrespond au données des ordonnées (liste de valeurs réels)
// titreDataSet sera le titre en string du dataset
// titreChart sera le titre du graphique
function updateChart(chart, dataX, dataY, titreDataSet, titreChart) {
    chart.options.plugins.title.text = titreChart
    chart.data.datasets[0].label = titreDataSet
    chart.data.datasets[0].data = dataY;
    chart.data.labels = dataX;
    chart.update();
}

// Met à jour le chart des frameworks
function updateChartFramework(dataX, dataY, salaireParTrancheAnneesExp, idchart) {
    if(chartFramework)
        chartFramework.destroy();
    loadRadarChart(salaireParTrancheAnneesExp, dataX, dataY, idchart);
}

// Liste sans doublons des différentes années expériences par ordre croissant
// Le paramètre res_questionnaire correspond à l'ensemble des résultats d'un des deux questionnaire survey_results_NA/WE.json. 
function ExpYear(res_questionnaire){
    let Annees = []
    for(let res of res_questionnaire){
        if(res["WorkExp"] != "NA") {
            Annees.push(res["WorkExp"])
        }
    }
    let AnneesUnique = new Set(Annees);
    let AnneeUnique = Array.from(AnneesUnique);
    AnneeUnique.sort(function (a, b) {
        return a - b;
    });
    return AnneeUnique
}

// renvoie un ensemble Set des frameworks utilisés (sans doublon)
// Le paramètre res_questionnaire correspond à l'ensemble des résultats d'un des deux questionnaire survey_results_NA/WE.json. 
function listFramework(res_questionnaire) {
    let Frameworks = new Set();
    for (let res of res_questionnaire) {
        let FrameWork = res["WebframeHaveWorkedWith"];
        if (FrameWork && typeof FrameWork === "string") {
            if(FrameWork != "NA") {
                Frameworks.add(...FrameWork.split(';'));
            }
        }
    }
    return Frameworks;
}

// Le paramètre pays permet de sélectionner un pays. Peut avoir la valeur SELECT_TOUS_LES_PAYS ("tous") pour sélectionner tous les pays d'un continent
// Le paramètre res_questionnaire correspond à l'ensemble des résultats d'un des deux questionnaire survey_results_NA/WE.json. 
// Le questionnaire est choisi en fonction de la valeur sélectionné dans le dropdown select-continents
// retourne une liste avec à l'indice 0 : salaireParTrancheAnneesExp et l'indice 1 : nbrGroupe
// nbrGroupe correspond au nombre de tranche d'âge sélectionné dans l'input number nbrTranches du DOM
// salaireParTrancheAnneesExp est un dictionnaire avec comme clés les numéro de groupe de tranche d'expérience 
// (exemple, si 2 tranches sélectionnées alors deux clé : 0 et 1)
// Chaque clé se voit associer un dictionnaire ayant comme clé min, max et values. min et max sont les bornes des tranches d'expériences.
// values est un nouveau dictionnaire contennant pour chaque clé le nom d'un framework.
// Chaque valeur du framework contient la liste des salaires(en €) d'un développeur associé à sa tranche d'expérience et son pays(si sélectionné sinon continent)
function revenusParFrameworkEtPaysParTrancheExp(res_questionnaire, pays) {
    let allAnneesExp = ExpYear(res_questionnaire);
    const nbrGroupe = $("#nbrTranches").val();
    let maxAnneesExp = Math.max(...allAnneesExp);
    let tailleGroupe= Math.ceil(maxAnneesExp / nbrGroupe);
    let salaireParTrancheAnneesExp = {};
    for (let i = 0; i < nbrGroupe; i++) {
        let start = i * tailleGroupe;
        let end = start + tailleGroupe;
        salaireParTrancheAnneesExp[i] = {};
        salaireParTrancheAnneesExp[i]["min"] = start;
        salaireParTrancheAnneesExp[i]["max"] = end;
        salaireParTrancheAnneesExp[i]["values"] = {};
    }

    for (let res of res_questionnaire) {
        // Si pas de pays/salaire/monnaie/annéeExp renseigné ou que pays non selectionné alors on passe
        if(pays==null || (res["Country"]!=pays && pays!=SELECT_TOUS_LES_PAYS) || res["Currency"]=="NA" || res["CompTotal"]=="NA" || res["WorkExp"]=="NA")
            continue;
        let anneesExp = parseInt(res["WorkExp"]);
        let monnaie = res["Currency"].split(" ")[0];
        let montant = parseFloat(res["CompTotal"]).toFixed(2);
        for(let framework of res["WebframeHaveWorkedWith"].split(';')) {
            if(framework=="NA")
                continue;
            for(let groupeExp=0; groupeExp<nbrGroupe; groupeExp++) {
                if( (anneesExp<=salaireParTrancheAnneesExp[groupeExp]["max"]) && (anneesExp>=salaireParTrancheAnneesExp[groupeExp]["min"]) ){
                    if (!salaireParTrancheAnneesExp[groupeExp]["values"].hasOwnProperty(framework))
                        salaireParTrancheAnneesExp[groupeExp]["values"][framework] = [];
                    salaireParTrancheAnneesExp[groupeExp]["values"][framework].push(convertEuro(monnaie, montant));
                    break;
                }
            }
        }
    }
    return [salaireParTrancheAnneesExp, nbrGroupe]
}


// liste de framework par tranche d'expérience. Donc autant de liste que de tranche d'exp
// Liste des revenus moyens des dévellopeurs en fonction du framework et de sa tranche. Donc autant de liste que de tranche d'exp
function revenusMoyenParFrameworkTrancheExp(res_questionnaire, pays=SELECT_TOUS_LES_PAYS) {
    let [salaireParTrancheAnneesExp, nbrGroupe] = revenusParFrameworkEtPaysParTrancheExp(res_questionnaire, pays);
    let listeFrameworks = Array.from(listFramework(res_questionnaire));
    let listeSalairesParTranche = [];
    for(let groupeExp=0; groupeExp<nbrGroupe; groupeExp++) {
        let listeSalaires = [];
        for (let framework of listeFrameworks) {
            let somme = 0;
            if(!salaireParTrancheAnneesExp[groupeExp]["values"].hasOwnProperty(framework)){
                listeSalaires.push(parseFloat("0.00"));
                continue;
            }
            for(let salaire of salaireParTrancheAnneesExp[groupeExp]["values"][framework]){
                if(isNaN(salaire))
                    continue;
                somme += salaire;
            }
            let frequence = salaireParTrancheAnneesExp[groupeExp]["values"][framework].length;
            let revenueMoyen = parseFloat(somme/frequence).toFixed(2);
            listeSalaires.push(parseFloat(revenueMoyen));
        }
        listeSalairesParTranche.push(listeSalaires);
    }
    return [listeFrameworks, listeSalairesParTranche, salaireParTrancheAnneesExp];
}

// Création des différents dataset du chart en fonction des tranches d'âges (utilisé pour la page revenusFrameWork.html)
// salaireParTrancheAnneesExp permet d'établir le titre des datasets (les tranches d'âges)
// salaireMoyen est une liste contenant. Chaque élément est une liste correspondant à une tranche d'âge. 
// Chaque élément des tranches d'âges correspondent à la moyenne des salaires des développeurs d'un pays(si selectionné) en euro par framework.
function creationDatasetFramework(salaireParTrancheAnneesExp, salaireMoyen) {
    let data_DataSets = [];
    for(let i=0; i<salaireMoyen.length; i++) {
        let titreDataSet = salaireParTrancheAnneesExp[i]["min"]+" à "+salaireParTrancheAnneesExp[i]["max"]+" d'expériences";
        let dataset = {
            label: titreDataSet,
            data: salaireMoyen[i]
        };
        if(i!=0)
            dataset.hidden = true;
        data_DataSets.push(dataset);
    }
    return data_DataSets;
}

// Créer le radarChart (utilisé pour la page revenusFrameWork.html)
// salaireParTrancheAnneesExp permet d'établir le titre des datasets (les tranches d'âges)
// frameworks c'est une liste de frameworks
// salaireMoyen est une liste contenant. Chaque élément est une liste correspondant à une tranche d'âge. 
// Chaque élément des tranches d'âges correspondent à la moyenne des salaires des développeurs d'un pays(si selectionné) en euro par framework.
function loadRadarChart(salaireParTrancheAnneesExp, frameworks, salaireMoyen, idchart) {
    data_DataSets = creationDatasetFramework(salaireParTrancheAnneesExp, salaireMoyen);
    const donnees = {
        labels: frameworks,
        datasets: data_DataSets
    };
    const options = { 
        responsive: true, 
        scales: { y: { beginAtZero: true }},
        plugins: {
            title: { display: true,
                text: "Salaire moyen en euro des développeurs par framework et par tranche d'expérience"
            }
        }
    };
    let config = {type: 'radar', data: donnees, options: options};
    let chart = document.getElementById(idchart);
    chartFramework = new Chart(chart, config);
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

// Permet de créer et mettre à jour la liste des pays de la balise select(dropdown) à l'identifiant select-derou_pays.
// La liste des pays est calculé en fonction du questionnaire (res_questionnaire) choisi (NA ou WE)
function createCountriesDropDown(res_questionnaire) {
    let select = document.getElementById("select-derou_pays");
    let countries = listPays(res_questionnaire);
    countries.forEach((country) => {
        let option = document.createElement('option');
        option.value = country;
        option.text = country;
        select.appendChild(option);
    });
}

