

function OpenDevelopmentLink($target) {

    var url = '/' + $target.data('url');

    window.location.href = url;

}


function TryInitCheckBoxes() {
    $('input[type="checkbox"]:not(.custom)').checkboxpicker();
}

$(document).ready(function () {




    $(document).on('click', '.btn-delete-comment', function () {

        var $btn = $(this);
        var commentId = $(this).closest('.delete-root').data('comment-id');

        $.ajax({
            url: '/Articles/DeleteComment/',
            type: 'GET',
            data: {
                commentid: commentId
            },
            success: function (data) {

                $commentOuter = $btn.closest('.comment-outer');
                $commentOuter.fadeOut(300, function () { $commentOuter.remove(); });
                //$btn.closest('.article').find('.comments-total-root').text(data.Counter);
            }
        });


    });



    $(document).on('click', '.addsubcomment', function () {
        var addSubCommentRoot = $(this).closest('.comment-outer').find('.add-sub-comment').first();
        addSubCommentRoot.slideToggle();
    });

    $(document).on('click', '.blogging .addsubcommentsubmit', function () {

        if ($(this).hasClass('disabled')) return;

        var $btn = $(this);
        var $root = $(this).closest('.add-sub-comment');
        var commentid = $root.data('comment-id');
        var rootcommentid = $root.closest('.root-comment').data('id');

        var content = $root.find('#comment').val();
        var displayname = $root.find('#displayname').val();
        var privateemail = $root.find('#privateemail').val();

        if (content.length > 0 && displayname.length > 0 && isValidEmailAddress(privateemail)) {

            $.ajax({
                url: '/Articles/AddSubComment/',
                type: 'GET',
                data: {
                    commentid: commentid,
                    rootcommentid: rootcommentid,
                    content: content,
                    publicname: displayname,
                    privateemail: privateemail
                },
                success: function (data) {

                    if (data.Success === true) {
                        var $view = $(data.View);

                        $btn.addClass('disabled');
                        $root.find('#comment').val('');

                        $root.closest('.comment-outer').find('.sub-comments').first().append($view);

                        $root.closest('.comments-root').find('.current-comments-title')
                            .text(data.Counter + 'Comment');

                        $root.closest('.article').find('.comments-total-root').text(data.Counter);

                        $root.slideToggle();

                        createCookie('comment-name', displayname);
                        createCookie('comment-email', privateemail);

                        AutoFillCommentBoxes();
                    }
                }
            });

        } else {
            alert('Missing post info');
        }

    });

    $(document).on('click', '.blogging .addrootcomment', function () {

        if ($(this).hasClass('disabled')) return;

        var $btn = $(this);

        var $root = $(this).closest('.add-root-comment');
        var postId = $root.data('blog-post');

        var comment = $root.find('#comment').val();
        var displayname = $root.find('#displayname').val();
        var privateemail = $root.find('#privateemail').val();

        if (comment.length > 0 && displayname.length > 0 && isValidEmailAddress(privateemail)) {

            $.ajax({
                url: '/Articles/AddRootComment/',
                type: 'GET',
                data: {
                    id: postId,
                    comment: comment,
                    publicname: displayname,
                    privateemail: privateemail
                },
                success: function (data) {
                    if (data.Success === true) {
                        var $view = $(data.View);

                        $root.find('#comment').val('');
                        $btn.addClass('disabled');

                        $view.insertBefore($root.closest('.comments-root').find('.add-comment-title'));

                        $root.closest('.comments-root').find('.add-comment-title').text('Leave a comment');
                        $root.closest('.comments-root').find('.current-comments-title')
                            .text(data.Counter > 1 ? data.Counter + ' Comments' : data.Counter + 'Comment').removeClass('hidden');

                        $root.closest('.article').find('.comments-total-root').text(data.Counter);

                        createCookie('comment-name', displayname);
                        createCookie('comment-email', privateemail);

                        AutoFillCommentBoxes();
                    }
                }
            });

        } else {
            alert('Missing post info');
        }

    });

    $(document).on('keyup', '.displayname, .privateemail, .comment', function () {

        var $root = $(this).closest('.c-root');
        var $btn = $root.find('.btn-add-comment');

        var comment = $root.find('#comment').val();
        var displayname = $root.find('#displayname').val();
        var privateemail = $root.find('#privateemail').val();

        if (comment.length > 0 && displayname.length > 0 && isValidEmailAddress(privateemail)) {
            $btn.removeClass('disabled');
        } else {
            $btn.addClass('disabled');
        }

    });




    $(document).on('click', '.btn-like', function () {

        if ($(this).hasClass('liked')) return;

        var $btn = $(this);
        var postId = $(this).data('blog-post-id');
        var likedCookieName = postId + '-liked';

        if (readCookie(likedCookieName) === null) {

            $.ajax({
                url: '/Articles/LikePost/',
                type: 'GET',
                data: {
                    id: postId
                },
                success: function (data) {
                    createCookie(likedCookieName, 'liked');
                    $btn.addClass('liked');
                    $btn.closest('.article').find('.likes-total-root').text(data);
                }
            });

        }

    });

    function AutoUpdateLikeButtons() {

        var $btns = $(document).find('.btn-like');

        $btns.each(function () {
            var postId = $(this).data('blog-post-id');
            var likedCookieName = postId + '-liked';

            if (readCookie(likedCookieName) !== null) {
                $(this).addClass('liked');
            }
        });
    }

    AutoUpdateLikeButtons();

    function AutoFillCommentBoxes() {

        var savedName = readCookie('comment-name');
        var savedEmail = readCookie('comment-email');

        if (savedName !== null) {
            var $nameInputs = $(document).find('.displayname');
            $nameInputs.each(function () {
                $(this).val(savedName);
            });
        }

        if (savedEmail !== null) {
            var $emailInputs = $(document).find('.privateemail');
            $emailInputs.each(function () {
                $(this).val(savedEmail);
            });
        }
    }

    AutoFillCommentBoxes();




    $('.development:not(.link-to-all)').on('click', function (e) {
        OpenDevelopmentLink($(this));
    });

    $('.glossaryitem').tipso({
        speed: 100,
        //size: 'default',
        background: '#cccccc',
        titleBackground: '#333333',
        color: '#ffffff',
        titleColor: '#ffffff',
        titleContent: '',
        showArrow: true,
        position: 'top',
        width: 300,
        maxWidth: '',
        delay: 100,
        hideDelay: 200,
        animationIn: 'fadeIn',
        animationOut: 'fadeOut',
        offsetX: 0,
        offsetY: 0,
        tooltipHover: false,
        content: '',
        useTitle: true,
        onBeforeShow: function ($ele, tipso) {

            var title = $ele.data('keyword');
            var description = $ele.data('description');

            $ele.tipso('update', 'content', description);
            $ele.tipso('update', 'titleContent', title);
        }
    });

    function InitSitePlan() {
        $('#SitePlan').smoothZoom({
            width: '100%',
            height: '100%',
            responsive: true,
            responsive_maintain_ratio: true,
            button_ALIGN: 'top right',
            initial_ZOOM: '50'
        });
    }

    function initMap() {

        var target = 'map';
        var isPremium = $('#main-stage').hasClass('premium');

        //var propertyICON = '/Content/images/svg/mapicon.svg';
        var propertyICON = $('#location-root').data('icon-path');

        if ($('#location-root').length === 0) return false;

        var propertyICONPREM = '/Content/images/svg/mapiconPremium.svg';

        var icon = {
            url: isPremium ? propertyICONPREM : propertyICON,
            anchor: new google.maps.Point(25, 25),
            scaledSize: new google.maps.Size(50, 50)
        };

        var mapTypeIds = [];

        //mapTypeIds.push("OSM");
        //mapTypeIds.push(google.maps.MapTypeId.HYBRID);

        google.maps.visualRefresh = true;

        var Lat = parseFloat($('#map').data('lat'));
        var Lon = parseFloat($('#map').data('lon'));
        var SVHeading = parseFloat($('#map').data('heading'));
        var SVPitch = parseFloat($('#map').data('pitch'));

        if (Lat === 0 && Lon === 0) {
            return;
        }

        var myLatLng = { lat: Lat, lng: Lon };
        propertyLoc = new google.maps.LatLng(Lat, Lon);

        propertyLocation = propertyLoc;

        map = new google.maps.Map(document.getElementById(target), {
            zoom: 14,
            center: myLatLng,
            //mapTypeId: "OSM",
            mapTypeControl: false,
            streetViewControl: false,
            panControl: false,
            scaleControl: true,
            zoomControl: true,
            fullscreenControl: false,
            zoomControlOptions: {
                style: google.maps.ZoomControlStyle.DEFAULT,
                position: google.maps.ControlPosition.LEFT_TOP
            },
            //mapTypeControlOptions: {
            //    mapTypeIds: mapTypeIds
            //},
            styles:
                [
                    {
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#f5f5f5"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.icon",
                        "stylers": [
                            {
                                "visibility": "off"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#616161"
                            }
                        ]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "color": "#f5f5f5"
                            }
                        ]
                    },
                    {
                        "featureType": "administrative.land_parcel",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#bdbdbd"
                            }
                        ]
                    },
                    {
                        "featureType": "landscape.man_made",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#ff7a7b"
                            },
                            {
                                "saturation": -100
                            },
                            {
                                "lightness": 35
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#eeeeee"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#e5e5e5"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#9e9e9e"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#ffffff"
                            }
                        ]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#757575"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#dadada"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#616161"
                            }
                        ]
                    },
                    {
                        "featureType": "road.local",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#9e9e9e"
                            }
                        ]
                    },
                    {
                        "featureType": "transit.line",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#e5e5e5"
                            }
                        ]
                    },
                    {
                        "featureType": "transit.station",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#eeeeee"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#c9c9c9"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry.fill",
                        "stylers": [
                            {
                                "color": "#9fd5ff"
                            },
                            {
                                "weight": 1
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#9e9e9e"
                            }
                        ]
                    }
                ]
        });

        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            icon: icon,
            animation: google.maps.Animation.DROP
        });

        map.setOptions({ 'scrollwheel': false });

        map.mapTypes.set("OSM", new google.maps.ImageMapType({
            getTileUrl: function (coord, zoom) {
                return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
            },
            tileSize: new google.maps.Size(256, 256),
            name: "Street",
            maxZoom: 18
        }));

        panorama = map.getStreetView();
        panorama.setPosition(myLatLng);

        panorama.setPov(({
            heading: SVHeading,
            pitch: SVPitch
        }));

        panorama.setOptions({
            motionTracking: true,
            motionTrackingControl: true,
            motionTrackingControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            zoomControlOptions: {
                position: google.maps.ControlPosition.TOP_LEFT
            }
        });

        panorama.setVisible(false);
        google.maps.event.trigger(map, "resize");


        doPlacesSearch(propertyLoc);
    }

    $(document).on('click', '.indexItem', function () {
        var target = '#' + $(this).data('link');
        var $paragraph = $(target).next('p');

        $paragraph.addClass('fast-fade').css('background-color', '#fff8bf').css('color', '#111');

        $('html, body').animate({
            scrollTop: $(target).offset().top - 70
        }, 1000, 'swing');

        setTimeout(function () {
            $paragraph.removeClass('fast-fade').css('background-color', 'transparent').css('color', '#888');
        }, 1000);

    });

    $(document).on('click', '.property-item-link', function () {
        var target = $(this).data('url') + $(this).data('seo') + '/' + $(this).data('id');
        window.location.href = target;
    }); 

    $(document).on('click', '.prop-dev-link', function () {
        var target = $(this).data('link');
        window.location.href = target;
    });

    $(document).on('click', '.btnquickserch', function () {
        QuickSearch($(this));
    }); 

    $(document).on('click', '.pagelink:not(.active)', function () {
        var target = $(this).data('target');
        $('.post-item').hide().removeClass('active');
        $('.pagelink').removeClass('active');

        var $stage = '.post-item[data-id="' + target + '"]';
        $($stage).show();
        $(this).addClass('active');

        if (target === 'site-plan') {
            InitSitePlan();
        }
    });

    $(document).on('click', '.btnquickserch', function () {
        QuickSearch($(this));
    }); 

    if ($('#developments-table').length > 0) {
        $('#developments-table').DataTable({
            "paging": false,
            "ordering": true,
            "info": false,
            "columnDefs": [{
                "targets": 'no-sort',
                "orderable": false,
                "order": []
            }],
            "order": [[1, "asc"]]
        });
    }

    if ($('#parallax h1').length > 0) {
        if ($('#parallax h1').text() != '') {
            $('.post-description h2').addClass('hidden-lg').addClass('hidden-md');
        }
    }

    CreatePageIndex();

    initMap();





    $('.blogging .share .btn-share').on('click', function (e) {
        var url = $(this).data('url');
        socialWindow(url);
    });

    function socialWindow(url) {
        var left = (screen.width - 570) / 2;
        var top = (screen.height - 570) / 2;
        var params = "menubar=no,toolbar=no,status=no,width=570,height=570,top=" + top + ",left=" + left;
        window.open(url, "NewWindow", params);
    }

    function QuickSearch($target) {

        var url = $target.data('url');
        var custom = $('#quicksearch').val();

        var form = $('<form />', { action: url, method: 'POST' })
            .append('<input type="text" name="customArea" id="customArea" value="' + custom + '"/>')
            .appendTo('body').submit();

    }

});





function CreatePageIndex() {

    if ($('.page-html h4').length > 5) {

        var $indexDIV = $('<div class="pageIndex"><div class="title">This page contains:</div></div>');

        var n = 0;
        $('.page-html h4').each(function () {

            n++;
            var newID = 'anchor' + n;
            $(this).attr('id', newID);

            var $indexItem = $('<div class="index-outer col-xs-12 col-sm-6 col-lg-4"><div class="indexItem" data-link="' + newID + '">' + $(this).text() + '</div></div>');

            $indexDIV.append($indexItem);

        });

        var $h2 = $('.page-html').find('h2').clone();
        $('.page-html').find('h2').remove();

        $('.page-html').prepend($indexDIV);
        $('.page-html').prepend($h2);

    }

}