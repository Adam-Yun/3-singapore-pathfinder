
// Initialize the map centered on Singapore using its latitude and longitude
var map = L.map('map').setView([1.3521, 103.8198], 12);

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get Token Key to access OneMap's API
function getToken(){
    return new Promise((resolve, reject) => {
        const email = "adam@natt.world"
        const password = "NattWorld123@"

        const data = JSON.stringify({
            "email": email,
            "password": password
        });
        
        const xhr = new XMLHttpRequest();
            
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                if (this.status === 200) {
                    try {
                        const response = JSON.parse(this.responseText);
                        // console.log("Access Token:", response.access_token);
                        // console.log("Expiry Timestamp:", response.expiry_timestamp);
                        resolve(response.access_token);
                    } catch (e) {
                        console.error("Failed to parse response:", e);
                        reject("Error Status: Failed to parse response");
                        
                    }
                } else {
                    console.error("Error:", this.status, this.statusText);
                    reject("Error Status: " + String(this.status) + String(this.statusText));
                }
            }
        });
            
        xhr.open("POST", "https://www.onemap.gov.sg/api/auth/post/getToken");
            
        xhr.setRequestHeader("Content-Type", "application/json");
            
        xhr.send(data);
    });
}

// Search information about the location from the user
function searchLocation(location){
    return new Promise((resolve, reject) => {

        const xhr = new XMLHttpRequest();
        // Keywords entered by users to filter the results
        const searchVal = String(location)
        // Values: Y, N . Enter Y if user wants the geometry value returned.
        const returnGeom = "Y";
        // Values: Y, N . Enter Y if user wants address details returned.
        const getAddrDetails = "Y";
        // Optional. Specifies the page to retrieve search results.
        const pageNum = "1";
    
        xhr.addEventListener("readystatechange", function () {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        try {
                            const response = JSON.parse(this.responseText);
                            resolve(response);
                        } catch (e) {
                            reject("Error Status: Failed to parse response");
                        }
                    } else {
                        console.error("Error:", this.status, this.statusText);
                        reject("Error Status: " + String(this.status) + String(this.statusText));
                    }
                }
            });
            
        const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(searchVal)}&returnGeom=${encodeURIComponent(returnGeom)}&getAddrDetails=${encodeURIComponent(getAddrDetails)}&pageNum=${encodeURIComponent(pageNum)}`;
        xhr.open("GET", url);
            
        xhr.send();
    });
}

/*  
    The function returns the distance and path between two points
    START_LATITUDE Starting location's latitude
    START_LONGITUDE Starting location's longitude
    END_LATITUDE End location's latitude
    END_LONGITUDE End location's longitude
    ROUTE_TYPE Mode of transport : walk, drive, pt, and cycle. Only lowercase is allowed. 
*/
async function getRoute(START_LATITUDE,START_LONGITUDE,END_LATITUDE,END_LONGITUDE,ROUTE_TYPE){
    return new Promise( async (resolve, reject) => {
        const data = JSON.stringify(false);
        
        const xhr = new XMLHttpRequest();
            
        xhr.addEventListener("readystatechange", function () {
                if (this.readyState === this.DONE) {
                    if (this.status === 200) {
                        try {
                            const response = JSON.parse(this.responseText);
                            resolve(response);
                        } catch (e) {
                            console.error("Failed to parse response:", e);
                            reject("Error Status: Failed to parse response");
                        }
                    } else {
                        console.error("Error:", this.status, this.statusText);
                        reject("Error Status: " + String(this.status) + String(this.statusText));
                    }
                }
            });

        let url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${START_LATITUDE},${START_LONGITUDE}&end=${END_LATITUDE},${END_LONGITUDE}&routeType=${ROUTE_TYPE}`;

        xhr.open("GET", url);

        let token;
        try {
            // Call getToken function which returns a Promise Object with the token access key
            token = await getToken(); 
        } catch (error) {
            // Handle any errors from the Promise
            console.error(error); 
        }
        xhr.setRequestHeader("Authorization", String(token));
            
        xhr.send();
    });
}

// Draws a line between 2 points
function drawPolyLine(start_point,final_point,line_color){

    var latlngs = [
        start_point,
        final_point,
    ];

    var polyline = L.polyline(latlngs, {color: line_color}).addTo(map);
}

// Draw a colored marker icon onto the map
function drawMarker(LOCATIONS, MARKER_COLOR){
    for (const key in LOCATIONS.results){
        let LATITUDE = LOCATIONS.results[key]['LATITUDE']; 
        let LONGITUDE = LOCATIONS.results[key]['LONGITUDE'];
        
        // Creates a colored marker icon for start locations
        var marker = L.AwesomeMarkers.icon({
            markerColor: MARKER_COLOR
        });
            
        L.marker([LATITUDE, LONGITUDE], {icon: marker}).addTo(map);
    }
}

// Groups up the geo location into an array and return it
function getGeoLocation(LOCATIONS){
    let GEOLOCATION = []
    for (const key in LOCATIONS.results){
        let LATITUDE = LOCATIONS.results[key]['LATITUDE'];
        let LONGITUDE = LOCATIONS.results[key]['LONGITUDE'];
        GEOLOCATION.push([LATITUDE,LONGITUDE]);
    }
    return GEOLOCATION   
}

// Draw the routes for all the points from the user
document.getElementById('searchLocation').addEventListener('submit', async function(event) {
    event.preventDefault();

    const startLocationVal = document.getElementById('startLocationVal').value; // Start Location
    const endLocationVal = document.getElementById('endLocationVal').value;     // End Location

    let START_LOCATIONS;
    let END_LOCATIONS;
    try {
        // Store all locations found from start location name
        START_LOCATIONS = await searchLocation(startLocationVal);
        // Store all locations found from end location name
        END_LOCATIONS = await searchLocation(endLocationVal);
    } catch (error) {
        // Handle any errors from the Promise
        console.error(error); 
    }
    
    // Start geo locations into an array
    let START_GEO_LOCATIONS = getGeoLocation(START_LOCATIONS);
    // Draw start geo locations markers
    drawMarker(START_LOCATIONS, 'blue');

    // End geo locations into an array
    let END_GEO_LOCATIONS = getGeoLocation(END_LOCATIONS);
    // Draw end geo locations markers
    drawMarker(END_LOCATIONS, 'red');

    // Combine start and end geo locations
    GEO_LOCATIONS = [...START_GEO_LOCATIONS, ...END_GEO_LOCATIONS]

    for (let i=0; i < GEO_LOCATIONS.length; i++){
        // Ignore drawing if there is only 1 point
        if(GEO_LOCATIONS.length < 2){
            break;
        }

        if( i != GEO_LOCATIONS.length-1){
            // Draw a line between every point
            drawPolyLine(GEO_LOCATIONS[i], GEO_LOCATIONS[i+1], 'red')
        }
        else{
            // Draw a line from the last point to the starting point
            drawPolyLine(GEO_LOCATIONS[GEO_LOCATIONS.length-1], GEO_LOCATIONS[0], 'blue')
        }
    }
});

/*
for (let i=0; i < GEO_LOCATION.length; i++){
        // Ignore drawing if there is only 1 point
        if(GEO_LOCATION.length < 2){
            break;
        }

        if( i != GEO_LOCATION.length-1){
            // Draw a line between every point
            drawPolyLine(GEO_LOCATION[i], GEO_LOCATION[i+1], 'red')
            // getRoute(GEO_LOCATION[i][0],GEO_LOCATION[i][1],GEO_LOCATION[i+1][0],GEO_LOCATION[i+1][1],'drive')
            try {
                // Call searchLocation function which returns a Promise
                // route = await getRoute(GEO_LOCATION[i][0],GEO_LOCATION[i][1],GEO_LOCATION[i+1][0],GEO_LOCATION[i+1][1],'drive'); 
                // console.log(route)
            } catch (error) {
                // Handle any errors from the Promise
                // console.error(error); 
            }
        }
        else{
            // Draw a line from the last point to the starting point
            drawPolyLine(GEO_LOCATION[GEO_LOCATION.length-1], GEO_LOCATION[0], 'blue')
        }
    }
*/
