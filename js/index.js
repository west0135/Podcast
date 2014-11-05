/*TODO: 
- Find out why pages aren't clearing properly
*/

window.addEventListener("DOMContentLoaded", init);

//////////////////// Global Variables ///////////////

var networkState = null;                //holds current value of network state (online or offline)
var searchURL = "";                     //container for URL entered into search bar
//var foundDir = false;                   //boolean to decide if a directory was found or not
var downloadQueue = [];                 //download queue that gets filled up if requests are made while offline
var downloadCount = 0;                  //counter to tell when both episodes are done downloading
var my_media = null;                    //media object
var mediaTimer = null;                  //media timer
var currentMedia = {};                  //Object that contains data about currently playing podcast
var dataToRemove = {};

function init(){
	document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
    // Now safe to use device APIs
	console.log("Device Ready!!");
    console.log(cordova.file.dataDirectory);
    
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

function showHomePage(){
	//ev.preventDefault();
	console.log('Go Home');
	document.querySelector('#podPage').className = "notActive1 content";
	document.querySelector('#homePage').className = "Active1 content";
	document.querySelector('#podcastPageList').innerHTML = null;
	
}

/////////////////// Page Setup ////////////////////
function displayPodcastPage(podNumber){
	var podcastTitle;          //Podcast title formatted with no spaces
    var unformattedTitle;       //Unformatted podcast title
    var episodeNumber;
    //pull out/parse podcast list
	var retrievedObject = localStorage.getItem('podcastData');
    var podcastObject = JSON.parse(retrievedObject);
    
    //set up podcast title containers to have formatted and unformatted
    unformattedTitle = podcastObject.podcasts[podNumber].title;
    podcastTitle = removeAllSpaces(unformattedTitle);

    console.log("CLEARING ALL ITEMS ON PAGE, REBUILD");
    // var podcastListItems = document.querySelector('#podcastPageList');
    var podcastListItems = document.getElementById('podcastPageList');
    console.log(podcastListItems);
    podcastListItems.innerHTML = "";
    
    //while (podcastListItems.firstChild) {
    //    podcastListItems.removeChild(podcastListItems.firstChild);
    //}
    
    console.log("Number of podcasts left: "+podcastObject.podcasts[podNumber].episodes.length); // 2 the second time
    //Loop through all the podcast episodes and display them on the page//
	for(var i = 0; i < podcastObject.podcasts[podNumber].episodes.length; i++){
            episodeNumber = podcastObject.podcasts[podNumber].episodes[i].episodeNumber;
            console.log(podcastObject.podcasts[podNumber].episodes[i].title);
          
            //The anchor tag here contains onClick event to start playing the specified media
            var Podcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn"+i+"' onClick=\"initializeInitMedia('"+unformattedTitle+"','"+episodeNumber+"')\"><img class='media-object pull-left' src='http://placehold.it/64x64' alt='Placeholder image for Argo's poster'/>                                                                                                                            <div class='media-body'>"+podcastObject.podcasts[podNumber].episodes[i].title+"</div></a></li>";
			podcastListItems.innerHTML += Podcasts;
        }
    
    //This logic structure determines which episode should be on auto play
    if(podcastObject.podcasts[podNumber].episodes[0].episodeNumber==1){
        initializeMedia(cordova.file.dataDirectory+podcastTitle+"/episode1.mp3",unformattedTitle,1);
        currentMedia.podNumber = podNumber;
        currentMedia.podcastTitle = unformattedTitle;
        currentMedia.episodeNumber = 1;
        
    }
    else{
        initializeMedia(cordova.file.dataDirectory+podcastTitle+"/episode2.mp3",unformattedTitle,2);
        currentMedia.podNumber = podNumber;
        currentMedia.podcastTitle = unformattedTitle;
        currentMedia.episodeNumber = 2;
    }
	

}

//This function serves to get necessary podcast data to send to initiazlizeMedia to prepare
function initializeInitMedia(podcastTitle,episodeNumber){
    pauseAudio();
    var pod = getPod();
    var formattedTitle = removeAllSpaces(podcastTitle);
    
    initializeMedia(cordova.file.dataDirectory+formattedTitle+"/episode"+episodeNumber+".mp3",podcastTitle,episodeNumber);
}

//This function creates the main podcast list page
function displayPodcasts(){
	console.log("display podcasts");
	if (localStorage.getItem('podcastData')){
		console.log('exists');
		
		//Clear existing data
		var podcastListItems;
        document.querySelector('#podcastList').innerHTML = "";
		
		//Display podcasts
		var retrievedObject = localStorage.getItem('podcastData');
        var podcastObject = JSON.parse(retrievedObject);
        
        //Iterate through all of the podcasts to create the list
        for(var i = 0; i < podcastObject.podcasts.length; i++){
            console.log(podcastObject.podcasts[i].title);
			
			var podcastListItems = document.querySelector('#podcastList');
			var Podcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn"+i+"' onClick='showPodcastPage("+i+")'><img class='media-object pull-left' src='http://placehold.it/64x64' alt='Placeholder image for Argo's poster'/>                                                                                                                            <div class='media-body'>"+podcastObject.podcasts[i].title+"<p>"+podcastObject.podcasts[i].episodes.length+" Episodes Available</p></div></a></li>"
		podcastListItems.innerHTML += Podcasts;
		console.log("#btn"+i+" Event Listener Added");
        }
		
		
	}else{
		//Clear existing data
		document.querySelector('#podcastList').innerHTML = "";
		
		var podcastListItems = document.querySelector('#podcastList');
		var noPodcasts = 	"<li class='table-view-cell media'>                                                                                                                             	<a class='navigate-right' id='btn'>                                                                                                                            <div class='media-body'>No Podcasts Found</div></a></li>"

		podcastListItems.innerHTML += noPodcasts;

	}
	
}

//////////////////   Search //////////////////////
function captureForm(form){
	console.log('FORM');
	
	networkState = navigator.connection.type;

    var searchURL = form.search.value;
	console.log("network state: " + networkState);
    
    //If the network is offline, queue up the request to be downloaded when it comes online
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

//When the device comes online, check if there is a download queue and if there is, process it
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
//Create a directory with the specified input name
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
/*
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
*/


///////////////////// Download a File /////////////////////

/****files are saved to /data/data/io.appname/podcastname
*/
//This function takes a link to download from, a relative location to save it, and the pod data to pass through
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
                    //localPath = fileSystem.root.toURL() + locationToPlace;
                    localPath = cordova.file.dataDirectory + locationToPlace;
                    
                    fileTransfer.download(
                        linkToGrab,localPath,function(theFile){
                            console.log("download complete: " + theFile.toURI());
                            showLink(theFile.toURI());
                            countDownloads(pod);        //This method will make sure data is not saved until both episodes are downloaded
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
//This function does an XHR request and passes the repsonse to the parser
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
    //This object will become the list of all podcasts and their attributes to be saved in localstorage
    var pod = {title:"", episodes:[{title:"", duration:"", thumb:"", link:""},{title:"", duration:"", thumb:"", link:""}]};
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(txt, "text/xml");
    console.log(xmlDoc);
    var itemList = xmlDoc.getElementsByTagName('item');
    
    pod.title = xmlDoc.getElementsByTagName("title")[0].childNodes[0].nodeValue;
    pod.episodes[0].link = itemList[0].getElementsByTagName('origEnclosureLink')[0].childNodes[0].nodeValue;
    pod.episodes[0].title = itemList[0].getElementsByTagName('title')[0].childNodes[0].nodeValue;
    pod.episodes[0].duration = itemList[0].getElementsByTagName('duration')[0].childNodes[0].nodeValue;
    pod.episodes[0].episodeNumber = 1;
    pod.episodes[1].link = itemList[1].getElementsByTagName('origEnclosureLink')[0].childNodes[0].nodeValue;
    pod.episodes[1].title = itemList[1].getElementsByTagName('title')[0].childNodes[0].nodeValue;
    pod.episodes[1].duration = itemList[1].getElementsByTagName('duration')[0].childNodes[0].nodeValue;
    pod.episodes[1].episodeNumber = 2;
    
    managePodcasts(pod); //This will handle whether or not to download the episodes

}

////////////////// Manages Podcast Organization //////////////////
function managePodcasts(pod){
    var formattedTitle;
//------OBJECT TEMPLATE-------//
    //var pod = {title:"podcast", episodes:[{title:"ep1", duration:"1:00", thumb:"th.jpg", link:"link.mp3"},{title:"ep2", duration:"2:00", thumb:"th2.jpg", link:"link2.mp3"}]}
    
    console.log(pod.title);
    console.log(pod.episodes[0].title);
    console.log("about to check dir");
    
    //Download the files if the podcast is not already on the device
    if (!checkIfExists(pod.title)){
        formattedTitle = removeAllSpaces(pod.title);
        createDirectory(formattedTitle);
        downloadFile(pod.episodes[0].link, (formattedTitle+"/episode1.mp3"), pod);
        downloadFile(pod.episodes[1].link, (formattedTitle+"/episode2.mp3"), pod);
    }
    
    else{
        alert("You already have this podcast");
    }
}

//This function counts to 2 and resets, allows us to ensure data is only saved if both episodes download successfully
function countDownloads(pod){
    downloadCount++;    //This HAS to be global
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
        
        //This structure is so that a return only happens once in this function
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
    
    //If there is existing data, pull it out, append new data and save it again
    if (localStorage.getItem('podcastData')){
        retrievedObject = localStorage.getItem('podcastData');
        console.log("retrieved object successfully");
        podcastList = JSON.parse(retrievedObject);
        podcastList.podcasts.push(pod);
        console.log("pushed to array");
    }
    
    //Otherwise just create a new object to be saved
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
//Convenience function simply returns parsed podcast data object
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
    console.log("Removing Episode "+episodeNumber);
    var formattedTitle = removeAllSpaces(podcastName);
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, deleteSuccesses, deleteFail);
    window.resolveLocalFileSystemURL(cordova.file.dataDirectory + formattedTitle+"/episode"+episodeNumber+".mp3", gotRemoveFileEntry, deleteFail);
    
}

function gotRemoveFileEntry(fileEntry){
    //console.log(fileEntry);
    fileEntry.remove(deleteSuccess, deleteFail);
}

function deleteSuccesses(entry) {
    console.log("Bugfix");
}

function deleteSuccess(entry) {
    console.log("Removal succeeded");
    removePodcastData(dataToRemove.podcastTitle, dataToRemove.episodeNumber);
}

function deleteFail(error) {
    console.log("Error removing file: " + error.code);
}

//////////// Remove Podcast Data ////////////////
//This incredibly ridiculously nested function deals with removing data from the podcast object saved in localstorage
function removePodcastData(podcastName, episodeNumber){
    console.log("Removing data now");
    var pod = getPod();
    var podIndex;
    
    if (localStorage.getItem('podcastData')){
        var retrievedObject = localStorage.getItem('podcastData');
        var podcastObject = JSON.parse(retrievedObject);
        console.log("found podcast data");
        
        //Loop through to locate the index value of the podcast being removed
        for(var i = 0; i < podcastObject.podcasts.length; i++){
            if (podcastObject.podcasts[i].title == podcastName){
                podIndex = i;
                console.log("found podcast in data");
            }
        }
                //This part is handled differently if the episode being deleted is the first or second one
                if (episodeNumber==1)
                {
                    console.log("array length before 1 splice "+podcastObject.podcasts[podIndex].episodes.length);
                    podcastObject.podcasts[podIndex].episodes.splice(0, 1);
                    
                    console.log("removed first episode from local storage");
                    console.log("array length after 1 splice "+podcastObject.podcasts[podIndex].episodes.length);
                    //podcastObject.podcasts[i].episodes[0].remove;
                }
                
                else{
                    //If the episode is the second and final one, all the positions in the array will be different.
                    if (podcastObject.podcasts[podIndex].episodes.length==1)
                    {
                        console.log("array length before 2 splice "+podcastObject.podcasts[podIndex].episodes.length);
                        podcastObject.podcasts[podIndex].episodes.splice(0, 1);
                        console.log("removed second episode from local storage zero condition");
                        console.log("array length after 2 splice "+podcastObject.podcasts[podIndex].episodes.length);
                    }
                    else{
                        console.log("array length before 3 splice "+podcastObject.podcasts[podIndex].episodes.length);
                        podcastObject.podcasts[podIndex].episodes.splice(1, 1);
                        console.log("removed second episode from local storage one condition");
                        console.log("array length after 3 splice "+podcastObject.podcasts[podIndex].episodes.length);
                    }
                
                }
            
        
        console.log("array length before remove all "+podcastObject.podcasts[podIndex].episodes.length);
        
        //If this podcast has no more episodes, remove from memory
        if (podcastObject.podcasts[podIndex].episodes.length == 0)
        {
            podcastObject.podcasts.splice(podIndex, 1);
            localStorage.setItem('podcastData', JSON.stringify(podcastObject));
            console.log("removed podcast from local storage");
            displayPodcasts();
            showHomePage();
        }
        
        else{
            console.log("Should be re-writing page now");
            console.log("pre rewrite length: "+podcastObject.podcasts[podIndex].episodes.length);
            localStorage.setItem('podcastData', JSON.stringify(podcastObject));
            displayPodcastPage(currentMedia.podNumber);
        }
        
        
        console.log("array length saved");
        
        console.log("podcast list length "+podcastObject.podcasts.length);
        
        //If there are no more podcasts left, wipe the memory
        if (podcastObject.podcasts.length == 0)
        {
            localStorage.removeItem('podcastData');
            console.log("removed all local storage");
            displayPodcasts();
            showHomePage();
        }
        else{
            localStorage.setItem('podcastData', JSON.stringify(podcastObject));
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
function initializeMedia(src,podcastTitle,episodeNumber){
	
    console.log("initializing episode "+episodeNumber);
	my_media = new Media(src, onSuccess, onError);
    currentMedia.podcastTitle=podcastTitle;
    currentMedia.episodeNumber=episodeNumber;
	
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
                        document.querySelector("#pause").className = "icon icon-pause pull-left spacer invisable";
	                    document.querySelector("#play").className = "icon icon-play pull-left spacer";
                        //Remove file when it is finished playing
                        dataToRemove.podcastTitle = currentMedia.podcastTitle;
                        dataToRemove.episodeNumber = currentMedia.episodeNumber;
                        removeFile(currentMedia.podcastTitle,currentMedia.episodeNumber);
						clearInterval(mediaTimer);
                        	
						
						//break;
					}
                    //This handles a bug where the mediaTimer gets stuck at -1 if you skip past the end
                    if(positionMil == (-1))
                    {
                        alert('Done Playing');	
                        document.querySelector("#pause").className = "icon icon-pause pull-left spacer invisable";
	                    document.querySelector("#play").className = "icon icon-play pull-left spacer";
                        dataToRemove.podcastTitle = currentMedia.podcastTitle;
                        dataToRemove.episodeNumber = currentMedia.episodeNumber;
                        removeFile(currentMedia.podcastTitle,currentMedia.episodeNumber);
						clearInterval(mediaTimer);
                        
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
	console.log('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
}