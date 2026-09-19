// DEPENDANCY : jQUery.Actual 
// http://dreamerslab.com/blog/en/get-hidden-elements-width-and-height-with-jquery/
//
// Embedded here to ensure its available
//
;(function(e){e.fn.extend({actual:function(t,n){if(!this[t]){throw'$.actual => The jQuery method "'+t+'" you called does not exist'}var r={absolute:false,clone:false,includeMargin:false};var i=e.extend(r,n);var s=this.eq(0);var o,u;if(i.clone===true){o=function(){var e="position: absolute !important; top: -1000 !important; ";s=s.clone().attr("style",e).appendTo("body")};u=function(){s.remove()}}else{var a=[];var f="";var l;o=function(){if(e.fn.jquery>="1.8.0")l=s.parents().addBack().filter(":hidden");else l=s.parents().andSelf().filter(":hidden");f+="visibility: hidden !important; display: block !important; ";if(i.absolute===true)f+="position: absolute !important; ";l.each(function(){var t=e(this);a.push(t.attr("style"));t.attr("style",f)})};u=function(){l.each(function(t){var n=e(this);var r=a[t];if(r===undefined){n.removeAttr("style")}else{n.attr("style",r)}})}}o();var c=/(outer)/g.test(t)?s[t](i.includeMargin):s[t]();u();return c}})})(jQuery)



// Plugin v2, using UI Widget 'Factory Pattern'

// NOTE!: We are attaching <div id='MrBazDialogRoot' /> to Document.Body
//
// Public function calls will always be from the element used to create the Dialog though.
// eg. $(document.body).Dialog('Dismiss');
//
// You could create (store) the plugin on any element, but its hard coded to add the html to
// the document.body. If it finds the $root already there, it wont re-create it - simply dismiss
// the existing $modalBody element and its contents.


;(function($) {
        
    var self = this;
    var exclude_root = false;
    
    $.widget("MrBazUK.Dialog", {
        
        // Default options
        options: {
            showbuttontray: true,
            bodyClass: '',
            hasCustomCloseHandler: false,
            hideButtonTray:false,
            debugMode: false,
            //General
            dialogType: 'dialog',
            iFrameDelay: 0,
            displayCurtain: true,
            curtainColor: 'solidGrey',
            dismissOnCurtainClick: false,
            width: 600,
            height: 0,
            //Header
            displayHeader: true,
            headerColor: 'grey',
            displayCloseIcon: false,
            
            displayTitle: false,
            displayKeyword: true,
            displayIcon: false,
            
            headerTitle: 'Title here',
            headerKeyword: 'Dialog',
            headerIcon: 'none',
            
            content: 'This is an example message!',
            contentAlignment: 'center',
            // Function that gets called prior to displaying the dialog
            prePresent: null,
            //Buttons
            buttons: [
            {
                id: 'button1',
                faceColor: 'green',
                label: 'OK',
                icon: 'none',
                callback: function(){                     
                    alert('callback of button am i');               
                }
            }]
        },
        
        // Method called to set a plugin option after initialisation
        // usage: $(selector).Dialog({backgroundColor: 'rgba(255, 0, 0, 0.8)'});     
        _setOption: function(option, value) {             
                $.Widget.prototype._setOption.apply( this, arguments );
        },
        
        _create: function(){
            //document.addEventListener('keydown', $.proxy(this._handleKeyPress, this), false);
            this._log('_create: Called'); 
        },
        
        // Init method. Settings get set 1st
        _init: function(){  
            
            var plugin = this;
            var delay = 0;
            if($('#MrBazDialogRoot').length != 0){
                exclude_root = true;
                this._dismiss();
                delay = 300;
            }
            
            setTimeout(function(){       
                // Initialise plugin which will call correct constructor based on settings.dialogType
                if(plugin.options.dialogType === 'dialog'){   
                    plugin._initModalDialog();
                }           
            }, delay); 
            
            //$(document.body).addClass('noScroll');        
        },
        
        
        // Init - Construct a 'Regular' Modal Dialog
        _initModalDialog: function(){
            
            var plugin = this;
            var $root;
            
            // Use existing root if already exists.
            if($('#MrBazDialogRoot').length === 0){
                $root = this._getRoot();
            }  else {
                $root = $('#MrBazDialogRoot');
                // remove previous ROOT classes (eg SignUp form)
                $root.removeAttr('class');
                $root.addClass(plugin.options.bodyClass);

                $('.modalBody').remove();
            }
                     
            var $modalBody = this._getModalBody();         
            var $modalHeader = this._getModalHeader();
            $modalBody.append($modalHeader);
            
            var $modalConent = this._getModalContent();
            $modalBody.append($modalConent);
            
            if (plugin.options.hideButtonTray == false) {
                // Add some buttons, using default buttons in settings. Can pass array instead..
                var $modalButtons = this._getModalButtons(plugin.options.buttons);
                $modalBody.append($modalButtons);
            }

            $root.append($modalBody);
                            
            // Create plugin html in body as 1st element
            $(document.body).prepend($root);
            
            // Set the height offset for centering.
            //$modalBody.css('margin-top', '-' + $modalBody.actual('height', {absolute : true}) / 2 + 'px');
            
            this._present(); 
            //exclude_root = false;
        },
        
        
        // Methods to build the dialog
        _getRoot: function(){
          
            var plugin = this;
            var $root = $("<div id='MrBazDialogRoot' class='MrBazDialogRoot " + plugin.options.bodyClass + "'></div>");
            
            if(plugin.options.displayCurtain){
                var $curtain  = $("<div class='curtain'></div>");
                $curtain.addClass(plugin.options.curtainColor);
                $root.append($curtain);
            }
            
            var $bodyContainer = $("<div class='bodyContainer'></div>");
            $root.append($bodyContainer);
            
            // Add click to curtain if required in settings
            if(plugin.options.dismissOnCurtainClick){
                $root.click(function (e) {
                    if ($(e.target).hasClass('bodyContainer')) {
                        $(document.body).Dialog('Dismiss');
                    }                   
                });
            } else {
                $root.click(function (e) {
                    if ($(e.target).hasClass('bodyContainer')) {
                        $(document.body).Dialog('Bounce');
                    }
                });
            }
            
            return $root;
        },
        
        _getModalBody: function(){
            var plugin = this;
            var $modalBody = $("<div class='modalBody'></div>"); 
            //$modalBody.css('width', plugin.options.width + 'px');
            //$modalBody.css('margin-left', '-' + plugin.options.width / 2 + 'px');

            // Prevent clicks from falling through.
            //$modalBody.off().on('click', function(e){
            //    e.stopPropagation();
            //});
        
            return $modalBody;
        },
    
        _getModalHeader: function(){
            
            var plugin = this;
            
            if(plugin.options.displayHeader){
    
                var $modalHeader = $("<div class='modalHeader white'></div>");
               // $modalHeader.addClass(plugin.options.headerColor);
                
                var $headerLeft = $("<div class='headerLeft'></div>");
                              
                
                var $title = $("<div class='title'>" + plugin.options.headerTitle + "</div>");
                
                if(plugin.options.displayCloseIcon){
                    var $close = $("<div class='close'><i class='fal fa-times'></i></div>");

                    if (plugin.options.hasCustomCloseHandler === false) {
;                        $close.click(function () {
                            $(document.body).Dialog('Dismiss');
                        });
                    }
                }
                             
                
                if(plugin.options.displayTitle){
                   $headerLeft.append($title); 
                }
                
                $modalHeader.append($headerLeft);
                
                if(plugin.options.displayCloseIcon){
                    $modalHeader.append($close);
                }
                
                return $modalHeader;
                
            } else {       
                return null;
            }
            
        },
        
        _getModalContent: function(){
            
            var plugin = this;
            
            var $contDiv = $("<div></div>");
            $contDiv.addClass('contentContainer');
            $contDiv.addClass(plugin.options.contentAlignment);
            $contDiv.html(plugin.options.content);
            
            return $contDiv;
            
        },
        
        _getModalButtons: function(buttonsArray){
            // For each button in the settins.buttons array, make a new button
            // and assign it class / click event / properties.
            var plugin = this;
        
            var $btnDiv = $("<div></div>");
            $btnDiv.addClass('buttonContainer');
            
            var buttonID = 1;

            $.each(buttonsArray, function(i,b){
                
                if (b.id != undefined) {
                    var $btn = $("<div id='" + b.id + "'></div>");
                } else {
                    var $btn = $("<div id='AutoButtonID" + buttonID + "'></div>");
                    buttonID++;
                }

                $btn.addClass('buttonBase');
                if(b.icon !== 'none'){
                    var $icon = $("<div class='btnIcon'></div>");
                    $icon.addClass(b.icon);
                    $btn.append($icon);
                }
                
                var $label = b.label;
                $btn.append($label);
                
                $btn.addClass(b.faceColor);
   
                
                $btn.click(function(e){
                    b.callback.call(this);
                });
                
                               
                $($btnDiv).append($btn); 
            }); 
            
            var $btnBack = $("<div></div>");
            $btnBack.addClass('buttonBackground');

            $btnBack.append($btnDiv);
            return plugin.options.showbuttontray ? $btnBack : '';
        },
        
            
        // Private Internal Functions
        _present: function() {
                     

            var plugin = this;
            var initDelay = plugin.options.iFrameDelay;

            var delay = 0;
            var $modalBody = $('#MrBazDialogRoot > .modalBody');
            var $modalCurtain = $('#MrBazDialogRoot > .curtain');

            if (plugin.options.prePresent != null) plugin.options.prePresent.call();

            setTimeout(function () {

                if (plugin.options.displayCurtain && !exclude_root) {
                    $modalCurtain.css('opacity', 0).show();
                    $modalCurtain.animate({ opacity: 1 }, 500, 'easeOutExpo');
                    delay = 100;
                }

                setTimeout(function () {
                    var endPos = $modalBody.css('margin-top');
                    var startPos = parseInt(($modalBody.css('margin-top').replace("px", ""))) + 20 + "px";

                    $modalBody.css('margin-top', startPos);
                    $modalBody.css('opacity', 0).show();

                    $modalBody.animate({ opacity: 1, 'margin-top': endPos }, 500, 'easeOutQuart',
                       function () {
                           //place call back 'afterDialogShown' here.
                       });

                   
                }, delay);

                exclude_root = false;

            }, initDelay);

            
        },
        
        _dismiss: function(){
            
            var plugin = this;
            
            if(!exclude_root){ 
                
                var $modalBody = $('#MrBazDialogRoot > .modalBody');
                var $modalCurtain = $('#MrBazDialogRoot > .curtain');
                
                var startPos = $modalBody.css('margin-top');
                var endPos = parseInt(($modalBody.css('margin-top').replace("px", ""))) + 20 + "px";
                        
                if(plugin.options.displayCurtain){
                    
                    setTimeout(function(){
                        $modalCurtain.animate({ opacity: 0 }, 300, 'linear',
                        function() {
                            $('#MrBazDialogRoot').remove();
                            $(document.body).removeClass('noScroll');
                            $("body").css({ 'overflow-y': 'visible' });
                        });
                    }, 200); // was 100
                    
                    //$modalBody.addClass('animated').addClass('ZoomForward');
                    $modalBody.animate({ opacity: 0, 'margin-top': endPos}, 200, 'easeOutQuad');
                                       
                    
                } else {
                 
                    $modalBody.animate({ opacity: 0, 'margin-top': endPos}, 300, 'easeOutQuad',
                    function() {
                        $('#MrBazDialogRoot').remove();
                        $(document.body).removeClass('noScroll');
                        $("body").css({ 'overflow-y': 'visible' });
                    });
                    
                }
                
            } else {
                
                var $modalBody = $('#MrBazDialogRoot > .modalBody');
                var startPos = $modalBody.css('margin-top');
                var endPos = parseInt(($modalBody.css('margin-top').replace("px", ""))) + 30 + "px";
                
                $modalBody.animate({ opacity: 0, 'margin-top': endPos}, 200, 'easeOutQuad', function(){
                    $modalBody.remove();
                });
            }
             
        },
        
        
        
        // Log function. Easy to disable with the debugMode:false option
        _log: function(t){
            //console.log(t);
        },
        
        
        // Internal PUBLIC methods that can be called within the callback.
        Dismiss: function(){
            //call internal dismiss method
            this._dismiss();  
        },
        
        Bounce: function(){
            var plugin = this;
            var $modalBody = $('#MrBazDialogRoot > .modalBody'); 
            var $modalRoot = $('#MrBazDialogRoot');
            
            var startPos = $modalBody.css('margin-top');
            var endPos = parseInt(($modalBody.css('margin-top').replace("px", ""))) - 30 + "px";
            
            //if($modalBody.is(':animated')){
            if($modalBody.hasClass('animated')){
                //console.log('Animating. Please wait..');
            } else {
                
//                $modalBody.addClass('wobble').addClass('animated');
//                setTimeout(function(){
//                    $modalBody.removeClass('wobble').removeClass('animated');
//                },1500);
                
                $modalBody.stop().animate({'margin-top': endPos}, 200, 'easeOutSine', function() {
                    $modalBody.animate({'margin-top': startPos}, 500, 'easeOutBounce');
                });
            }
        },
        
         
        // Destroy method. Clean everything up & unbind any functions etc
        _destroy: function() {	

             $.Widget.prototype.destroy.call( this );       
            //$(window).unbind("resize");
        },
        
            
    });
    
})(jQuery);


