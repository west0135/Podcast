/*TODO: 
- get thumbnail(s) and store them with podcasts
- implement media player page
- implement podcast episodes page
*/



window.addEventListener("DOMContentLoaded", init);

//////////////////// Global Variables ///////////////
var networkState = null;
var searchURL = "";
var foundDir = false;
var downloadQueue = [];
var downloadCount = 0;
var my_media = null;
var mediaTimer = null;

function init(){
	document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
    // Now safe to use device APIs
	console.log("Device Ready!!");
	//////////////////////// Event listeners /////////////////////////////
	document.querySelector("#backBTN").addEventListener("touchstart", showHomePage);
	document.querySelector("#play").addEventListener("touchend", playClicked);
	document.querySelector("#pause").addEventListener("touchend", pauseClicked);
	document.querySelector("#rewind").addEventListener("touchend", rewindClicked);
	document.querySelector("#fastForward").addEventListener("touchend", forwardClicked);
	document.addEventListener("offline", onOffline, false);
	document.addEventListener("online", onOnline, false);
    
    displayPodcasts();
	
}
//////////////////  Page Changes ////////////////////////
function showPodcastPage(podNumber){

	console.log('Go Podcast Page');
	document.querySelector('#podPage').className = "Active content";
	document.querySelector('#homePage').className = "notActive content";
	
	displayPodcastPage(podNumber);
	
}

function showHomePage(ev){
	ev.preventDefault();
	console.log('Go Home');
	document.querySelector('#podPage').className = "notActive1 content";
	document.querySelector('#homePage').className = "Active1 content";
	document.querySelector('#podcastPageList').innerHTML = null;
	
}

/////////////////// Page Setup ////////////////////
function displayPodcastPage(podNumber){
	
	var retrievedObject = localStorage.getItem('podcastData');
    var podcastObject = JSON.parse(retrievedObject);
	
	
	for(var i = 0; i < podcastObject.podcasts[podNumber].episodes.length; i++){
            console.log(podcastObject.podcasts[podNumber].episodes[i].title);
			var podcastListItems = document.querySelector('#podcastPageList');
			var Podcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn"+i+"' onClick=''><img class='media-object pull-left' src='http://placehold.it/64x64' alt='Placeholder image for Argo's poster'/>                                                                                                                            <div class='media-body'>"+podcastObject.podcasts[podNumber].episodes[i].title+"</div></a></li>"
			podcastListItems.innerHTML += Podcasts;
        }
	
	initializeMedia("file:///data/data/io.cordova.hellocordova/ThrillingAdventureHour/episode1.mp3");
	
}

function displayPodcasts(){
	console.log("display podcasts");
	if (localStorage.getItem('podcastData')){
		console.log('exists');
		
		//Clear existing data
		var podcastListItems = document.querySelector('#podcastList').innerHTML = null;
		
		//Display podcasts
		var retrievedObject = localStorage.getItem('podcastData');
        var podcastObject = JSON.parse(retrievedObject);
        
        for(var i = 0; i < podcastObject.podcasts.length; i++){
            console.log(podcastObject.podcasts[i].title);
			
			var podcastListItems = document.querySelector('#podcastList');
			var Podcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn"+i+"' onClick='showPodcastPage("+i+")'><img class='media-object pull-left' src='http://placehold.it/64x64' alt='Placeholder image for Argo's poster'/>                                                                                                                            <div class='media-body'>"+podcastObject.podcasts[i].title+"<p>2 Episodes Available</p></div></a></li>"
		podcastListItems.innerHTML += Podcasts;
		
		//document.querySelector("#btn"+i+"").addEventListener("touchstart", showPodcastPage);
		console.log("#btn"+i+" Event Listener Added");
        }
		
		
	}else{
		//Clear existing data
		var podcastListItems = document.querySelector('#podcastList').innerHTML = null;
		
		var podcastListItems = document.querySelector('#podcastList');
		var noPodcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn'>                                                                                                                            <div class='media-body'>No Podasts Found</div></a></li>"

		podcastListItems.innerHTML += noPodcasts;

	}
	
}

//////////////////   Search //////////////////////
function captureForm(form){
	console.log('FORM');
	
	networkState = navigator.connection.type;

    var searchURL = form.search.value;
	console.log("network state: " + networkState);
    
    // this if statement not working
	if(networkState == "none"){
		// no connection
		alert('No connection, will download on reconnection');
        downloadQueue.push(searchURL);
	}else{
		// connection
		alert('Downloading podcasts...please be patient, this may take a while');
        loadXML(searchURL);
	}
	

	
}
///////////////////// Network Events /////////////////////

function onOffline() {
    // Handle the offline event
	networkState = navigator.connection.type;
	console.log('Offline ' + networkState);
	
}

function onOnline() {
    // Handle the offline event
	networkState = navigator.connection.type;
	console.log('Online ' + networkState);
    
    console.log("attempting to check downloadQueue");
    if (downloadQueue.length > 0){
        console.log("there is a download queue");
        for(var i=0; i < downloadQueue.length; i++){
            loadXML(downloadQueue[i]);
        }
        
        downloadQueue = [];
    }	
}

///////////////////// Create a Directory /////////////////////
function createDirectory(input){
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null); 

    function onRequestFileSystemSuccess(fileSystem) { 
        var entry=fileSystem.root; 
        entry.getDirectory(input, {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail); 
    } 

    function onGetDirectorySuccess(dir) { 
        console.log("Created dir "+dir.name); 
    } 

    function onGetDirectoryFail(error) { 
        console.log("Error creating directory "+error.code); 
    } 
}

///////////////////// Check if a Directory exists NOT NEEDED ANYMORE?/////////////////////
function checkDirectory(input){

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null); 

    function onRequestFileSystemSuccess(fileSystem) { 
        var entry=fileSystem.root; 
        entry.getDirectory(input, {create: false, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail); 
    } 

    function onGetDirectorySuccess(dir) { 
        console.log("Found Directory");
        foundDir = true;
        console.log("Directory did exist");
    } 

    function onGetDirectoryFail(error) { 
        console.log("Did not find directory");
        foundDir = false;
        console.log("Directory did not exist");
        //createDirectory(input);
    } 
    
    if (foundDir){
        return true;
    }
    else{
        return false;
    }
}

///////////////////// Download a File /////////////////////

/****files are saved to /data/data/io.appname/podcastname
*/
function downloadFile(linkToGrab, locationToPlace, pod){
    
    var localPath;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
             function onFileSystemSuccess(fileSystem){
                 fileSystem.root.getFile("dummy.html", {
                     create: true, exclusive: false
                 },

                function gotFileEntry(fileEntry){
                    var fileTransfer = new FileTransfer();
                    fileEntry.remove();
                    localPath = fileSystem.root.toURL() + locationToPlace;
                    fileTransfer.download(
                        linkToGrab,localPath,function(theFile){
                            console.log("download complete: " + theFile.toURI());
                            showLink(theFile.toURI());
                            countDownloads(pod);
                        },

                        function(error) {
                            console.log("download error source " + error.source);
                            console.log("download error target " + error.target);
                            console.log("error code: " + error.code);
                        }
                    );
                },fail
            );
        },fail
    );
}
function showLink(url){
    alert(url);
}
function fail(evt) {
    console.log(evt.target.error.code);
}

///////////////////// Fetch XML /////////////////////
function loadXML(link) {
    
    link = link + "?fmt=xml";
    console.log("Loading xml");
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", link, false);
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if(xmlhttp.status == 200){
               //console.log(xmlhttp.responseText);
               parseXML(xmlhttp.responseText);
           }
           else if(xmlhttp.status == 400) {
              console.log('There was an error 400')
              alert("Not a valid podcast link");
           }
           else {
               console.log('something else other than 200 was returned')
               console.log(xmlhttp.status);
               alert("Not a valid podcast link");
           }
        }
    }
    xmlhttp.send();
}

///////////////////// Parse XML /////////////////////
function parseXML(txt) {
    var pod = {title:"", episodes:[{title:"", duration:"", thumb:"", link:""},{title:"", duration:"", thumb:"", link:""}]};
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(txt, "text/xml");
    console.log(xmlDoc);
    var itemList = xmlDoc.getElementsByTagName('item');
    
    pod.title = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
    pod.episodes[0].link = itemList[0].getElementsByTagName('origEnclosureLink')[0].childNodes[0].nodeValue;
    pod.episodes[0].title = itemList[0].getElementsByTagName('title')[0].childNodes[0].nodeValue;
    pod.episodes[0].duration = itemList[0].getElementsByTagName('duration')[0].childNodes[0].nodeValue;
    pod.episodes[1].link = itemList[1].getElementsByTagName('origEnclosureLink')[0].childNodes[0].nodeValue;
    pod.episodes[1].title = itemList[1].getElementsByTagName('title')[0].childNodes[0].nodeValue;
    pod.episodes[1].duration = itemList[1].getElementsByTagName('duration')[0].childNodes[0].nodeValue;
    //pod.episodes[0].thumb = 
    
    
    console.log("episode title: "+itemList[0].getElementsByTagName('title')[0].childNodes[0].nodeValue);
    console.log("episode duration: "+itemList[0].getElementsByTagName('duration')[0].childNodes[0].nodeValue);
    console.log("episode link: "+itemList[0].getElementsByTagName('origEnclosureLink')[0].childNodes[0].nodeValue);
    //console.log("Title: "+xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue);
    
    managePodcasts(pod);
   //downloadFile(episode1Link, podcastTitle);

}

////////////////// Manages Podcast Organization //////////////////
function managePodcasts(pod){
    var formattedTitle;
//------OBJECT TEMPLATE-------//
    //var pod = {title:"podcast", episodes:[{title:"ep1", duration:"1:00", thumb:"th.jpg", link:"link.mp3"},{title:"ep2", duration:"2:00", thumb:"th2.jpg", link:"link2.mp3"}]}
    
    console.log(pod.title);
    console.log(pod.episodes[0].title);
    console.log("about to check dir");
    
    if (!checkIfExists(pod.title)){
        formattedTitle = removeAllSpaces(pod.title);
        createDirectory(formattedTitle);
        downloadFile(pod.episodes[0].link, (formattedTitle+"/episode1.mp3"), pod);
        downloadFile(pod.episodes[1].link, (formattedTitle+"/episode2.mp3"), pod);
        
        //window.addEventListener("bothDone", function(){
            //savePodcastData(pod);
            //console.log("YOU DID IT BIG BOY!!!!");
            //},false)
        
    }
    
    else{
        alert("You already have this podcast");
    }
}

function countDownloads(pod){
    downloadCount++;
    if (downloadCount>=2){
        downloadCount=0;
        savePodcastData(pod);
    }
}
//////////////// Checks if podcast exists ///////////////////////
function checkIfExists(title){

    var podExists = false;
    
    if (localStorage.getItem('podcastData')){
        var retrievedObject = localStorage.getItem('podcastData');
        var podcastObject = JSON.parse(retrievedObject);
        
        for(var i = 0; i < podcastObject.podcasts.length; i++){
            if (podcastObject.podcasts[i].title == title){
                podExists = true;
            }
        }
        
        if (podExists){
            return true;
        }
        
        else{
            return false;
        }
    }
    
    else{
        return false;
    }

}

/////////////// Saves podcast info to localstorage ///////////////////
function savePodcastData(pod){

    var retrievedObject = "";
    var podcastList = "";
    
    if (localStorage.getItem('podcastData')){
        retrievedObject = localStorage.getItem('podcastData');
        console.log("retrieved object successfully");
        podcastList = JSON.parse(retrievedObject);
        podcastList.podcasts.push(pod);
        console.log("pushed to array");
    }
    
    else{
        podcastList = {podcasts:[]};
        podcastList.podcasts.push(pod);
        console.log("created podcast list");
    }
    
    localStorage.setItem('podcastData', JSON.stringify(podcastList));
    console.log("set local storage successfully");
    
    displayPodcasts();
}

///////////////  Get Podcast Data Object /////////////////
function getPod()
{
    
    var retrievedObject;
    var podcastList = null;
    
    if (localStorage.getItem('podcastData')){
        retrievedObject = localStorage.getItem('podcastData');
        console.log("retrieved object successfully");
        podcastList = JSON.parse(retrievedObject);
    }
    
    else{
        console.log("no podcast data");
    }
    
    return podcastList;
}

////////////// Remove Podcast /////////////////
//MAKE SURE TO PASS UNFORMATTED TITLE
function removeFile(podcastName, episodeNumber){
    var formattedTitle = removeAllSpaces(podcastName);
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function onFileSystemSuccess(fileSystem){
                             fileSystem.root.getFile(formattedTitle+"/episode"+episodeNumber+".mp3", 
                                                     {create: false, exclusive: false}, gotRemoveFileEntry, deleteFail);
                                removePodcastData(podcastName, episodeNumber);//UNFORMATTED NAME
                             }                       
                             , deleteFail);
    
}

function gotRemoveFileEntry(fileEntry){
    //console.log(fileEntry);
    fileEntry.remove(deleteSuccess, deleteFail);
}

function deleteSuccess(entry) {
    console.log("Removal succeeded");
}

function deleteFail(error) {
    console.log("Error removing file: " + error.code);
}

//////////// Remove Podcast Data ////////////////

function removePodcastData(podcastName, episodeNumber){
    console.log("Removing data now");
//{"podcasts":[{"title":"Thrilling Adventure Hour","episodes":[{"title":"Bonus Episode: Thrilling Adventure Hour and Wits Crossover!","duration":"55:06","thumb":"","link":"http://traffic.libsyn.com/thrillingadventurehour/tahbonus_wits_crossover.mp3"},{"title":"#187: Desdemona Hughes, Diva Detective, in “Lights! Camera! Murder!”","duration":"26:47","thumb":"","link":"http://traffic.libsyn.com/thrillingadventurehour/tah187_murder.mp3"}]}]}
    var pod = getPod();
    var podIndex;
    
    if (localStorage.getItem('podcastData')){
        var retrievedObject = localStorage.getItem('podcastData');
        var podcastObject = JSON.parse(retrievedObject);
        console.log("found podcast data");
        
        for(var i = 0; i < podcastObject.podcasts.length; i++){
            if (podcastObject.podcasts[i].title == podcastName){
                podIndex = i;
                console.log("found podcast in data");
                if (episodeNumber==1)
                {
                    console.log("array length before 1 splice "+podcastObject.podcasts[i].episodes.length);
                    podcastObject.podcasts[i].episodes.splice(0, 1);
                    
                    console.log("removed first episode from local storage");
                    console.log("array length after 1 splice "+podcastObject.podcasts[i].episodes.length);
                    //podcastObject.podcasts[i].episodes[0].remove;
                }
                
                else{
                    if (podcastObject.podcasts[i].episodes.length==1)
                    {
                        console.log("array length before 2 splice "+podcastObject.podcasts[i].episodes.length);
                        podcastObject.podcasts[i].episodes.splice(0, 1);
                        console.log("removed second episode from local storage zero condition");
                        console.log("array length after 2 splice "+podcastObject.podcasts[i].episodes.length);
                        //podcastObject.podcasts[i].episodes[0].remove;
                    }
                    else{
                        console.log("array length before 3 splice "+podcastObject.podcasts[i].episodes.length);
                        podcastObject.podcasts[i].episodes.splice(1, 1);
                        console.log("removed second episode from local storage one condition");
                        console.log("array length after 3 splice "+podcastObject.podcasts[i].episodes.length);
                        //podcastObject.podcasts[i].episodes[1].remove;
                    }
                
                }
            }
        }
        console.log("array length before remove all "+podcastObject.podcasts[podIndex].episodes.length);
        if (podcastObject.podcasts[podIndex].episodes.length == 0)
        {
            podcastObject.podcasts.splice(podIndex, 1);
            console.log("removed podcast from local storage");
        }
        
        localStorage.setItem('podcastData', JSON.stringify(podcastObject));
        console.log("array length saved");
        
        console.log("podcast list length "+podcastObject.podcasts.length);
        if (podcastObject.podcasts.length == 0)
        {
            localStorage.removeItem('podcastData');
            console.log("removed all local storage");
        }
    }
    
    else{
        return false;
    }
}

////////////////Removes all spaces from a string/////////////////
function removeAllSpaces(input){
    var output = "";
    output = input.replace(/ /g,'');
    return output;
}

///////////////////////////// Media Player Events ////////////////////
function initializeMedia(src){
	
	my_media = new Media(src, onSuccess, onError);
	
}
function playClicked(ev){
	ev.preventDefault();
	//change play button into pause button
	document.querySelector("#play").className = "icon icon-play pull-left spacer invisable";
	document.querySelector("#pause").className = "icon icon-pause spacer";	
	//console.log('Play Podcast');
	
	//get title of podcast this being played
	
	playAudio();
	
}

function pauseClicked(ev){
	ev.preventDefault();
	//change play button into pause button
	document.querySelector("#pause").className = "icon icon-pause pull-left spacer invisable";
	document.querySelector("#play").className = "icon icon-play pull-left spacer";	
	console.log('Pause Pressed');
	
	pauseAudio();

}

function rewindClicked(ev){
	ev.preventDefault();
	console.log('Rewind Pressed');
	
	// Update media position every second
   
        // get media position
        my_media.getCurrentPosition(
            // success callback
            function(position) {
                if (position > -1) {
                    console.log((position) + " sec");
					    var rewind = ((position*1000)-10000);
						console.log(rewind);
						my_media.seekTo(rewind);
                }
            },
            // error callback
            function(e) {
                console.log("Error getting pos=" + e);
            }
        );
  
	
}

function forwardClicked(ev){
	ev.preventDefault();
	
	// get media position
        my_media.getCurrentPosition(
            // success callback
            function(position) {
                if (position > -1) {
                    console.log((position) + " sec");
					    var rewind = ((position*1000)+30000);
						console.log(rewind);
						my_media.seekTo(rewind);
                }
            },
            // error callback
            function(e) {
                console.log("Error getting pos=" + e);
            }
        );
	
	
	
}

function playAudio() {
	console.log("Play Pod");
	// Create Media object from src
	
	// Play audio
	my_media.play();
	
		mediaTimer = setInterval(function() {
        // get media position
        my_media.getCurrentPosition(
            // success callback
            function(position) {
				
					var dur = my_media.getDuration();
					var durMil = dur * 1000;
					console.log(durMil+" duration");
				
             		var positionMil = position * 1000;
                    console.log((positionMil) + " Milisec");
					
					if(positionMil < durMil){
					
						console.log('Less then duration'+durMil);
					}
					else{
						alert('Done Playing');	
						//removeFile("Thrilling Adventure Hour",2);
						clearInterval(mediaTimer);
						//removeFile();
						//break;
					}   
            },
            // error callback
            function(e) {
                console.log("Error getting pos=" + e);
            }
        );
    }, 1000);
	
}

// Pause audio
function pauseAudio() {
	if (my_media) {
		 my_media.pause();
		 clearInterval(mediaTimer);
	}
}

function seekPositon(seconds) {
      if (Player.media === null)
         return;
 
      Player.media.seekTo(seconds * 1000);
      Player.updateSliderPosition(seconds);
   }

////////////////////////// Media Player Calls //////////////////////
function onSuccess() {
            console.log("playAudio():Audio Success");
        }
function onError(error) {
	alert('code: '    + error.code    + '\n' +
		  'message: ' + error.message + '\n');
}