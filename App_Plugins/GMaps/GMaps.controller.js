angular.module("umbraco").controller("GMaps.GoogleMapsController",
    function ($rootScope, $scope, notificationsService, dialogService, assetsService) {

        var map,
            marker,
            place,
            geocoder,
            mapCenter,

            //Getting prevalues
            defaultLat = $scope.model.config.lat,
            defaultLng = $scope.model.config.lng,
            defaultZoomLvl = parseInt($scope.model.config.zoomlevel);

        assetsService.loadJs('http://www.google.com/jsapi')
            .then(function () {
                google.load("maps", "3", { callback: initializeMap, other_params: "sensor=false&libraries=places" });
            });

        function initializeMap() {
            //Getting text for the reset button
            $scope.resetTxt = $scope.model.config.resetTxt;

            var location = $scope.model.value,
                resetBtn = document.getElementById("umb-googlemaps-reset");

            if(location != ''){
                var latLngArray = location.split(',');

                mapCenter = new google.maps.LatLng(latLngArray[0], latLngArray[1]);
            }
            else {
                mapCenter = new google.maps.LatLng(defaultLat, defaultLng);
            }

            var mapElement = document.getElementById($scope.model.alias + '_map');
            var mapOptions = { zoom: defaultZoomLvl, center: mapCenter, mapTypeId: google.maps.MapTypeId.ROADMAP };

            geocoder = new google.maps.Geocoder();
            map = new google.maps.Map(mapElement, mapOptions);

            if (location != '') {
                var latLngArray = location.split(',');
                
                marker = new google.maps.Marker({
                    map: map,
                    position: new google.maps.LatLng(latLngArray[0], latLngArray[1]),
                    draggable: true
                });
                marker.setMap(map);

                lookupPosition(new google.maps.LatLng(latLngArray[0], latLngArray[1]));
                addMarkerDragEndListener();
            }

            var lookupInputElement = document.getElementById($scope.model.alias + '_lookup');
            var options = {};

            place = new google.maps.places.Autocomplete(lookupInputElement, options);

            addPlaceChangedListener();

            //Calls the resetMap() function
            google.maps.event.addDomListener(resetBtn,'click',resetMap);
        }

        function resetMap () {
            
            mapCenter = new google.maps.LatLng(defaultLat, defaultLng);
            mapElement = document.getElementById($scope.model.alias + '_map');
            mapOptions = { zoom: defaultZoomLvl, center: mapCenter, mapTypeId: google.maps.MapTypeId.ROADMAP };
            map = new google.maps.Map(mapElement, mapOptions);

            var latLng = new google.maps.LatLng(defaultLat,defaultLng);

            if (marker != null) {
                marker.setMap(null);
            }

            marker = new google.maps.Marker({
                map: map,
                position: latLng,
                draggable: true
            });
            marker.setMap(map);

            lookupPosition(latLng);
            addMarkerDragEndListener();

            return false;
        }

        function addMarkerDragEndListener() {

            google.maps.event.addListener(marker, "dragend", function (e) {

                lookupPosition(marker.getPosition());
            });
        }

        function addPlaceChangedListener() {

            google.maps.event.addListener(place, 'place_changed', function () {
                var geometry = place.getPlace().geometry;

                if (geometry) {
                    var newLocation = place.getPlace().geometry.location;

                    if (marker != null) {
                        marker.setMap(null);
                    }

                    marker = new google.maps.Marker({
                        map: map,
                        position: newLocation,
                        draggable: true
                    });
                    marker.setMap(map);

                    lookupPosition(newLocation);
                    addMarkerDragEndListener();

                    map.setCenter(newLocation);
                    map.panTo(newLocation);
                }
            });
        }

        function lookupPosition(latLng) {

            geocoder.geocode({ 'latLng': latLng }, function (results, status) {

            //Fetches the translations from the view - it's a bit of a hack currently. It's also run each time a change happens
            var geoCodeError = document.getElementById("geoCodeError").innerText,
                locationSet = document.getElementById("locationSet").innerText;

                if (status == google.maps.GeocoderStatus.OK) {
                    var location = results[0].formatted_address;

                    $rootScope.$apply(function () {
                        notificationsService.success(locationSet, location);
                        
                        var newLat = marker.getPosition().lat();
                        var newLng = marker.getPosition().lng();

                        $scope.model.value = newLat + "," + newLng;
                        $scope.formattedAddress = location + ' (' + newLat + "," + newLng + ')';
                    });
                } else {
                    notificationsService.error(geoCodeError);
                }
            });
        }

        //Loading the styles
        assetsService.loadCss("/app_plugins/GMaps/assets/css/gmaps.css");

    });

//Translation directive
angular.module("umbraco.directives").directive('gmapsLocalize', function (gmapsLocalizationService) {
    var linker = function (scope, element, attrs){

        var key = scope.key;
        
        gmapsLocalizationService.localize(key).then(function(value){
            if(value){
                element.html(value);
            }
        });
    }   

    return {
        restrict: "E",
        rep1ace: true,
        link: linker,
        scope: {
            key: '@'
        }
    }
});


//Translation service
angular.module('umbraco.services').factory('gmapsLocalizationService', function($http, $q, userService){
    var service = {
        resourceFileLoaded: false,
        dictionary: {},
        localize: function(key) {
            var deferred = $q.defer();

            if(service.resourceFileLoaded){
                var value = service._lookup(key);
                deferred.resolve(value);
            }
            else{
                service.initLocalizedResources().then(function(dictionary){
                   var value = service._lookup(key);
                   deferred.resolve(value); 
                });
            } 

            return deferred.promise;
        },
        _lookup: function(key){
            return service.dictionary[key];
        },
        initLocalizedResources:function () {
            var deferred = $q.defer();
            userService.getCurrentUser().then(function(user){
                $http.get("/App_plugins/GMaps/langs/" + user.locale + ".js") 
                    .then(function(response){
                        service.resourceFileLoaded = true;
                        service.dictionary = response.data;

                        return deferred.resolve(service.dictionary);
                    }, function(err){
                        return deferred.reject("Lang file missing");
                    });
            });
            return deferred.promise;
        }
    }

    return service;
});