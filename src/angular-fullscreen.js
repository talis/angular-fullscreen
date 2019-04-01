(function(window) {
   var createModule = function(angular) {
      var module = angular.module('FBAngular', []);

      module.factory('Fullscreen', ['$document', '$rootScope', function ($document,$rootScope) {
         var document = $document[0];

         // ensure ALLOW_KEYBOARD_INPUT is available and enabled
         var isKeyboardAvailbleOnFullScreen = (typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element) && Element.ALLOW_KEYBOARD_INPUT;

         var isSafari51 = / Version\/5\.1(?:\.\d+)? Safari\//.test(navigator.userAgent);

         var emitter = $rootScope.$new();

         // listen event on document instead of element to avoid firefox limitation
         // see https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
         $document.on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', function(){
            emitter.$emit('FBFullscreen.change', serviceInstance.isEnabled());
         });

         function enableWebkitFullScreen() {
            if (isSafari51) {
               // Safari 5.1 reports it supports keyboard input but doesn't work
               element.webkitRequestFullscreen();
            } else if (isKeyboardAvailbleOnFullScreen) {
               element.webkitRequestFullscreen(isKeyboardAvailbleOnFullScreen);
            } else {
               element.webkitRequestFullscreen();
            }
         }

         var serviceInstance = {
            $on: angular.bind(emitter, emitter.$on),
            all: function() {
               serviceInstance.enable( document.documentElement );
            },
            enable: function(element) {
               if(element.requestFullScreen) {
                  element.requestFullScreen();
               } else if(element.mozRequestFullScreen) {
                  element.mozRequestFullScreen();
               } else if(element.webkitRequestFullscreen) {
                  enableWebkitFullScreen();
               } else if (element.msRequestFullscreen) {
                  element.msRequestFullscreen();
               }
            },
            cancel: function() {
               if(document.cancelFullScreen) {
                  document.cancelFullScreen();
               } else if(document.mozCancelFullScreen) {
                  document.mozCancelFullScreen();
               } else if(document.webkitExitFullscreen) {
                  document.webkitExitFullscreen();
               } else if (document.msExitFullscreen) {
                  document.msExitFullscreen();
               }
            },
            isEnabled: function(){
               var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
               return fullscreenElement ? true : false;
            },
            toggleAll: function(){
                serviceInstance.isEnabled() ? serviceInstance.cancel() : serviceInstance.all();
            },
            isSupported: function(){
                var docElm = document.documentElement;
                var requestFullscreen = docElm.requestFullScreen || docElm.mozRequestFullScreen || docElm.webkitRequestFullscreen || docElm.msRequestFullscreen;
                return requestFullscreen ? true : false;
            }
         };

         return serviceInstance;
      }]);

      module.directive('fullscreen', ['Fullscreen', function(Fullscreen) {
         return {
            link : function ($scope, $element, $attrs) {
               // Watch for changes on scope if model is provided
               if ($attrs.fullscreen) {
                  $scope.$watch($attrs.fullscreen, function(value) {
                     var isEnabled = Fullscreen.isEnabled();
                     if (value && !isEnabled) {
                        Fullscreen.enable($element[0]);
                        $element.addClass('isInFullScreen');
                     } else if (!value && isEnabled) {
                        Fullscreen.cancel();
                        $element.removeClass('isInFullScreen');
                     }
                  });

                  // Listen on the `FBFullscreen.change`
                  // the event will fire when anything changes the fullscreen mode
                  var removeFullscreenHandler = Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
                     if(!isFullscreenEnabled){
                        $scope.$evalAsync(function(){
                           $scope.$eval($attrs.fullscreen + '= false');
                           $element.removeClass('isInFullScreen');
                        });
                     }
                  });

                  $scope.$on('$destroy', function() {
                     removeFullscreenHandler();
                  });

               } else {
                  if ($attrs.onlyWatchedProperty !== undefined) {
                     return;
                  }

                  $element.on('click', function (ev) {
                     Fullscreen.enable(  $element[0] );
                  });
               }
            }
         };
      }]);
      return module;
   };

   if (typeof define === "function" && define.amd) {
      define("FBAngular", ['angular'], function (angular) { return createModule(angular); } );
   } else {
      createModule(window.angular);
   }
})(window);
