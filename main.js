
// Contenu des zones de texte
let ICS = document.getElementById("ics_file");

// Liste contenant les id des champs pour les expressions régulières
var regexIDlist = new Array;
// Liste contenant les valeurs des champs SUMMARY
var SummaryFieldList = new Array();
// Liste contenant les chaînes qui remplacent le contenu des regex
var PartsToKeepList = new Array();
// Nombre de champs d'expressions regulières
var regexNB = 0;

// Bouton pour afficher le champ SUMMARY
let buttonSummary = document.getElementById('resume');
// Evénement lors de l'appui du bouton
buttonSummary.addEventListener('click', ShowSummary);

function ShowSummary() {

	var request;
	var file;	
	// récupérer l'URL
	let URL=GetURL();
	if(URL==''){
		return'';	
	}

	// Ouvrir le fichier
	request = new XMLHttpRequest();
	request.open('GET', URL, true);
    request.send(null);
	request.overrideMimeType('text/calendar');

	// A l'ouverture du fichier
	request.onreadystatechange = function() {
		// Si on n'a pas eu d'erreur
		if(request.status == 200) {
			
			// Récupère le texte du fichier
			file = request.responseText;
			//file=TestText;
		
			// Sépare chaque ligne du fichier
		  	var lines = file.split(/\r\n|\n/);
		
			// Parcourt chaque ligne du fichier
			lines.forEach((line) => 
			{
				// Ligne contenant le champ résumé
				if(line.includes("SUMMARY")){
					// Si on ne met pas cette condition, toutes les lignes du fichier sont en double 
					// Donc on vérifie l'unicité du champ Summary
					if(!SummaryFieldList.includes(line))
					{
						// Ajouter un champ montrant le champ summary et avec une input text pour le remplacer
						AddRegExField(line);
					}
				}
			});
			ICS.disabled = true;
		}
		else{
			alert('erreur lors de la requête');
		}
	}
}


// Ajoute un champ pour une RegEx
function AddRegExField(Summary) {
	// Nombre d'expressions régulières (et de champ summary)
	regexNB ++;
	// Ajout 
	regexIDlist.push('regex' + regexNB);
	SummaryFieldList.push(Summary);
	PartsToKeepList.push('replacement' + regexNB);

	// Ajout du champ regex
	var champ = document.createElement("input");
	champ.setAttribute('type', 'text');
	champ.setAttribute('size', 50);
	champ.setAttribute('placeholder', "Modèle de l'expression de remplacement");
	champ.setAttribute('pattern', '.{1,}');
	champ.setAttribute('id', 'regex' + regexNB);

	// Ajout du champ Remplacement
	var replacement = document.createElement("input");
	replacement.setAttribute('type', 'text');
	replacement.setAttribute('placeholder', 'Expression régulière de remplacement');
	replacement.setAttribute('pattern', '.{1,}');
	replacement.setAttribute('id', 'replacement' + regexNB);

	// Ajout du texte SUMMARY
	var description = document.createElement("p");
	description.setAttribute('id', Summary + regexNB);
	description.innerHTML = Summary;
	
	// Ajout des éléments au div
	var parent = document.getElementById("formulaire");
	parent.appendChild(description);
	parent.appendChild(champ);
	parent.appendChild(replacement);
}



// Bouton d'envoi de formulaire
let buttonSend = document.getElementById('send');
// Evénement lors de l'appui du bouton
buttonSend.addEventListener('click', buttonSendEvent);

function buttonSendEvent() { 

	var URL=GetURL();
	if(URL==''){
		return'';	
	}

	ParseICS(URL);
}

function GetURL(){
	UnsureURL = ICS.value;

	// Vérification si le lien du fichier ICS est bien de type http (le https est inclus puisqu'il contient aussi la chaîne http)
	if(UnsureURL.includes("http") && UnsureURL.includes("://")) { 
		return UnsureURL;
	}
	else { 
		// Notification pour l'utilisateur
		alert("URL Incorrecte");
		return '';
	}
}
	
// Permet d'ouvrir un fichier et séparer chaque ligne
function ParseICS(ICS_URL) {
	var request;
	var file;
	var downloaded=0;

	request = new XMLHttpRequest();
	request.open('GET', ICS_URL, true);
    request.send(null);
	request.overrideMimeType('text/calendar');

	request.onreadystatechange = function() {
		// Si on a déjà téléchargé une fois, on ne relance pas
		if(request.status == 200) {
			if(downloaded == 1) {
				return '';
			}
			// Récupère le texte du fichier
			file = request.responseText;
			if(file == [""]){
				return '';
			}
			// Sépare chaque ligne du fichier
		  	var lines = file.split(/\r\n|\n/);

			var NBfieldsChanged = 0;
			var NewFileContent = '';
			
			// Parcourt chaque ligne du fichier
			lines.forEach((line) => 
			{
				let PreviousNB = NBfieldsChanged;
				// Ligne contenant le champ résumé
				if(line.includes("SUMMARY")){
					let summaryContent=line.replace('SUMMARY:','');
					console.log('cc  ' + SummaryFieldList[NBfieldsChanged]);
					// Récupère la valeur du champ
					let regular_expression = document.getElementById(regexIDlist[NBfieldsChanged]).value;

					let regXP = new RegExp(regular_expression,'ig');
					console.log(regXP);

					var newSummary = summaryContent.replace(regXP, '$1 TD $2');
					console.log('old ' + summaryContent + '\tnew ' + newSummary);
					NewFileContent += 'SUMMARY:' + newSummary + '\r\n';
					NBfieldsChanged++;
				}
				// Si on n'a pas changé
				if(PreviousNB == NBfieldsChanged)
				{
					NewFileContent += line + '\r\n';
				}
			});
			// Créer le fichier ICS
			DownloadICS(NewFileContent,'new_calendar');
			downloaded=1;
		}
		else{
			alert('erreur lors de la requête');
		}
	}
};

function DownloadICS(content, name){
	var ics_blob=new Blob([content], {type : 'text/calendar;charset=utf-8'});
	// Lien pour le téléchargement
	var Download_URL = window.URL.createObjectURL(ics_blob);
	// Balise qui redirige vers le lien de téléchargement
	var link = document.createElement("a");
	link.style = 'display: none';
	link.href = Download_URL;
	link.download = name + '.ics';
	// Simule un clic sur le lien de téléchargement
	link.click();
	// Supprime le lien de téléchargement
	window.URL.revokeObjectURL(Download_URL);
}
