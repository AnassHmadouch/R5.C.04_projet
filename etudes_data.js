const NA = "NA"
const WE = "WE"
const URL_DATA_NA = "data/survey_results_NA.JSON"
const URL_DATA_WE = "data/survey_results_WE.JSON"

// Sélectionne le revenu en fonction du continent et du pays choisi
function moyenneSalairePays(SalairesPays) {
    
    var somme = SalairesPays.reduce(function(acc, valeur) {
        return acc + valeur;
    }, 0);
    return somme/SalairesPays.length;
}

function recupData(continent) {
    let url = ""
    let isNA = false
    if(continent==NA) {
        url = URL_DATA_NA
        isNA = true
    } else {
        url = URL_DATA_WE
    }
    let request=$.ajax({
        type:"GET",
        url: url
    });
    request.done(function (output){
        let dataString = JSON.stringify(output);
        res_questionnaire = JSON.parse(dataString);
       // console.log(revenus1Pays(res_questionnaire, "Poland"));
        //console.log(revenuMoyenParPays(res_questionnaire));
        console.log(listCloud(res_questionnaire));
        //console.log(ExpYear(res_questionnaire))
        console.log(listFramework(res_questionnaire))
    })
}

// Liste l'ensemble des salaires par pays 
// Renvoi un dictionnaire avec comme clés les noms de pays et en valeur la liste des revenues enregistré du pays 
function revenusParPays(res_questionnaire) {
    let salairesPays = {} 
    for (let res of res_questionnaire) {
        if (!salairesPays.hasOwnProperty(res["Country"])) {
            salairesPays[res["Country"]] = [];
        }
        let monnaie = res["Currency"].split(" ")[0];
        let montant = parseFloat(res["CompTotal"]).toFixed(2);
        if(!isNaN(montant)) {
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
    let revenueMoyenPays = {}
    for (let pays of Object.keys(salairesPays)) {
        let somme = salairesPays[pays].reduce((acc, nombre) => acc + nombre, 0);
        let frequence = salairesPays[pays].length;
        revenueMoyenPays[pays] = parseFloat(somme/frequence).toFixed(2)
    }
    return revenueMoyenPays
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

function listCloud(res_questionnaire) {
    let Clouds = new Set();
    for (let res of res_questionnaire) {
        if ("PlatformHaveWorkedWith" in res) {
            let cloud = res["PlatformHaveWorkedWith"];
            if (cloud && typeof cloud === "string") {
                if(cloud != "NA") {
                    Clouds.add(...cloud.split(';'));
                }
            }
        }
    }
    return Clouds;
}

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