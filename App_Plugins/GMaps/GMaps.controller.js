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

                if (status == google.maps.GeocoderStatus.OK) {
                    var location = results[0].formatted_address;

                    $rootScope.$apply(function () {
                        notificationsService.success("Location set to", location);
                        
                        var newLat = marker.getPosition().lat();
                        var newLng = marker.getPosition().lng();

                        $scope.model.value = newLat + "," + newLng;
                        $scope.formattedAddress = location + ' (' + newLat + "," + newLng + ')';
                    });
                } else {
                    notificationsService.error("Oops! Having trouble geocoding specified address! Please try again.");
                }
            });
        }
    });