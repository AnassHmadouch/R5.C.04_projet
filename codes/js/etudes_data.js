const NA = "NA";
const WE = "WE";
var SELECT_TOUS_LES_PAYS="tous"
let continent = $("#select-continent");
var chartMoyen;
var chartFramework;
var chartOS;
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
            // Page revenusMoyen.html
            case "moyenne":
                titreDataset = 'Salaire Moyen par pays';
                titreChart = "Salaire Moyen par pays";
                [dataX, dataY] = revenuMoyenParPays(res_questionnaire_WE);
                loadChart(dataX, dataY, titreDataset, titreChart, idChart);
                break;
            // Page revenusFrameworks.html
            case "framework":
                [dataX, dataY, salaireParTrancheAnneesExp] = revenusMoyenParFrameworkTrancheExp(res_questionnaire_WE, SELECT_TOUS_LES_PAYS);
                loadRadarChart(salaireParTrancheAnneesExp, dataX, dataY, idChart);
                createDropDown("select-derou_pays", listUniqueReponses(res_questionnaire_WE, "Country"));
                break;
            // Page revenusFrameworks.html
            case "os":
                titreDataset = 'OS par pays';
                titreChart = "Top des OS les plus utilisés";
                createDropDown("select-metier", listUniqueReponses(res_questionnaire_WE, "DevType"));
                let metier = $("#select-metier").val();
                [dataX, dataY, nbOS] = NbrOSParMetier(res_questionnaire_WE, metier, n=5);
                $("#nbrElement").attr("max", nbOS);
                loadChart(dataX, dataY, titreDataset, titreChart, idChart);
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
    let dataX;
    let dataY;
    switch (titreDeLaPage) {
        // Page revenusMoyen.html
        case "moyenne":
            titreDataset = 'Salaire Moyen par pays';
            titreChart = "Salaire Moyen par pays";
            [dataX, dataY] = revenuMoyenParPays(res_questionnaire);
            chart = chartMoyen;
            updateChart(chart, dataX, dataY, titreDataSet, titreChart);
            break;
        // Page revenusFrameworks.html
        case "framework":
            let pays = $("#select-derou_pays").val();
            let idchart = "chart_framework";
            [dataX, dataY, salaireParTrancheAnneesExp] = revenusMoyenParFrameworkTrancheExp(res_questionnaire, pays);
            updateChartFramework(dataX, dataY, salaireParTrancheAnneesExp, idchart);
            break;
        case "os":
            let metier = $("#select-metier").val();
            let n = $("#nbrElement").val();
            titreDataset = "OS par pays";
            titreChart = "Top des OS les plus utilisés";
            [dataX, dataY, nbOS] = NbrOSParMetier(res_questionnaire, metier, n);
            $("#nbrElement").attr("max", nbOS);
            chart = chartOS;
            updateChart(chart, dataX, dataY, titreDataSet, titreChart);
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
function loadChart(dataX, dataY, titreDataSet, titreChart, idChart, type="bar") {
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
        type: type,
        data: donnees,
        options: options
    };
    let chart = document.getElementById(idChart);
    switch(idChart){
        case "chart_moyen":
            chartMoyen = new Chart(chart, config);
            break;
        case "chart_OS":
            chartOS = new Chart(chart, config);
            break;
    }
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
    if(titreDataSet)
        chart.options.plugins.title.text = titreChart;
    if(titreChart)
        chart.data.datasets[0].label = titreDataSet;
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

// Permet de créer et mettre à jour la liste des pays de la balise select(dropdown) à l'identifiant select-derou_pays.
// La liste des pays est calculé en fonction du questionnaire (res_questionnaire) choisi (NA ou WE)
function createCountriesDropDown(res_questionnaire) {
    let select = document.getElementById("select-derou_pays");
    let countries = listUniqueReponses(res_questionnaire, "Country");
    countries.forEach((country) => {
        let option = document.createElement('option');
        option.value = country;
        option.text = country;
        select.appendChild(option);
    });
}

// Permet de lister les réponses d'une question en supprimant les doublons.
// titreQuestion est un string faisant référence à une cle dans les dictionnaires de res_questionnaire
// Retourne une liste
function listUniqueReponses(res_questionnaire, titreQuestion) {
    let ReponsesUnique = new Set();
    for (let res of res_questionnaire) {
        let reponse = res[titreQuestion];
        if (ReponsesUnique && typeof reponse === "string") {
            if(reponse!="NA" || reponse!="" || !isNaN(reponse))
                ReponsesUnique.add(reponse);
        }
    }
    return Array.from(ReponsesUnique);
}

// À partir d'une liste créer un dictionnaire. 
// Les éléments sont transformés en clé. On affecte le numérique 0 à chaque clé si list false sinon on affecte une list vide
// Retourne le dictionnaire
function listToDic(list, num) {
    let dic = {};
    for(elem of list) {
        if(!dic.hasOwnProperty(elem)){
            if(num) {
                dic[elem]=0;
            }else {
                dic[elem]=[];
            }
        }
    }
    return dic;
}

// Prend un dictionnaire en paramètre.
// Extrait deux listes. Une liste pour les clés et une liste pour les valeurs.
// Retourne les listes triées par ordre décroissant. 
// Chaque indice dans une liste correspond à la clé ou à la valeur de l'autre liste au même indice.
function trierDictionnaireToList(dictionnaire){
    let dictionnaireV2 = Object.entries(dictionnaire);
    dictionnaireV2.sort(function(a, b) {
        return b[1] - a[1];
    });
    let listCleesTriees = dictionnaireV2.map(function(entry) {
        return entry[0];
    });
    let ListValeursTriees = dictionnaireV2.map(function(entry) {
        return entry[1];
    });
    return [listCleesTriees, ListValeursTriees]
}

// Permet de calculer le nombre d'os en fonction d'un métier.
// Renvoie 1 listes. Indice 1 : liste des os utilisé dans ce métier. Indice 2 nbr utilisateurs de l'os
function NbrOSParMetier(res_questionnaire, metier, n){
    let nbOS= {};
    for (let res of res_questionnaire) {
        if(res["OpSysProfessionaluse"]=="NA" || res["DevType"]=="NA" || res["DevType"]=="" || res["OpSysProfessionaluse"]=="" || res["DevType"]!=metier)
            continue;
        let listOS= res["OpSysProfessionaluse"].split(';'); //Les OS d'une personne
        for(os of listOS) {
            if(!nbOS.hasOwnProperty(os))
                nbOS[os]=0;
            nbOS[os]+=1;
        }
    }
    let [listeOS, nbOSTriees] = trierDictionnaireToList(nbOS)
    return [listeOS.slice(0,n), nbOSTriees.slice(0,n), listeOS.length];
}

// Permet de créer généré les la liste d'informations présent dans un menu déroulant (dropdown).
// Il faut la list d'informations et l'identifiant de la balise html select.
function createDropDown(id, list) {
    let select = document.getElementById(id);
    list.forEach((elem) => {
        let option = document.createElement('option');
        option.value = elem;
        option.text = elem;
        select.appendChild(option);
    });
}
