window.addEventListener("DOMContentLoaded", init);
// Fuckin right bud 
//////////////////// Global Variables ///////////////
var networkState = null;
var searchURL = "";
var linkToGrab = "http://developer.android.com/assets/images/home/ics-android.png";
var locationToPlace = "file://sdcard/ics-android.png";
var foundDir = false;

function init(){
	document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
    // Now safe to use device APIs
	console.log("Device Ready!!");
	// Event listeners
	document.querySelector("#btn").addEventListener("touchstart", showPodcastPage);
	document.querySelector("#btn2").addEventListener("touchstart", showHomePage);
	document.addEventListener("offline", onOffline, false);
	document.addEventListener("online", onOnline, false);
    
    //var buttonToClick = document.querySelector("#downloadImage");
    //buttonToClick.addEventListener('click', downloadFileStart, false);
	
}
//////////////////  Page Changes ////////////////////////
function showPodcastPage(ev){
	ev.preventDefault();
	console.log('Go Podcast Page');
	document.querySelector('#podPage').className = "Active content";
	document.querySelector('#homePage').className = "notActive content";
}

function showHomePage(ev){
	ev.preventDefault();
	console.log('Go Home');
	document.querySelector('#podPage').className = "notActive1 content";
	document.querySelector('#homePage').className = "Active1 content";
	
}
//////////////////   Search //////////////////////
function captureForm(form){
	console.log('FORM');
	
	networkState = navigator.connection.type;
	
	if(networkState == "none"){
		// no connection
		alert('No coneection ' + networkState);
	}else{
		// connection
		alert('Connection ' + networkState);
	}
	
	var searchURL = form.search.value;
	console.log(searchURL);
	
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
	
}
///////////////////// OLD CODE /////////////////////
/**
function test(){
    var input = (document.querySelector("#input").value);
    
    //var directoryExists = checkDirectory(input);
    checkDirectory(input);
    console.log(foundDir);
    //For some reason foundDir only updates on next click
    if (!foundDir){
        alert("Directory did not exist");
        createDirectory(input);
    }
    else{
        alert("Directory did exist");
    }
    
    document.querySelector("#input").value = "";
}*/

///////////////////// TEST FOR DIRECTORY INPUT /////////////////////
function directorySequence(){
    var input = (document.querySelector("#input").value);
    checkDirectory(input);
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

///////////////////// Check if a Directory exists /////////////////////
function checkDirectory(input){

    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onRequestFileSystemSuccess, null); 

    function onRequestFileSystemSuccess(fileSystem) { 
        var entry=fileSystem.root; 
        entry.getDirectory(input, {create: false, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail); 
    } 

    function onGetDirectorySuccess(dir) { 
        console.log("Found Directory");
        foundDir = true;
        alert("Directory did exist");
    } 

    function onGetDirectoryFail(error) { 
        console.log("Did not find directory");
        foundDir = false;
        alert("Directory did not exist");
        createDirectory(input);
    } 
}

///////////////////// Testing for Downloadfile /////////////////////
function downloadFileStart(){
    downloadFile("http://developer.android.com/assets/images/home/ics-android.png","file://sdcard/ics-android.png");
}

///////////////////// Download a File /////////////////////
function downloadFile(linkToGrab, locationToPlace){
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
                        },

                        function(error) {
                            console.log("download error source " + error.source);
                            console.log("download error target " + error.target);
                            console.log("upload error code: " + error.code);
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
