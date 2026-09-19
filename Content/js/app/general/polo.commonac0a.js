function findBootstrapEnvironment() {
    var envs = ["ExtraExtraSmall", "ExtraSmall", "Small", "Medium", "Large", "ExtraLarge"];
    var envValues = ["xxs", "xs", "sm", "md", "lg", "xlg"];

    //var $el = $('<div>');
    //$el.appendTo($('body'));

    for (var i = envValues.length - 1; i >= 0; i--) {
        var envVal = envValues[i];

        //$el.addClass('hidden-' + envVal);
        //if ($el.is(':hidden')) {
        //    $el.remove();
        //    return envs[i]
        //}

        var testClass = 'device-' + envVal;
        if ($('body').hasClass(testClass)) {
            return envs[i]
        }
    };
}

$('a[href="#"]:not(.gototop)').click(function (event) {

    // This will prevent the default action of the anchor
    event.preventDefault();

    // Failing the above, you could use this, however the above is recommended
    return false;

});

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

String.prototype.setCharAt = function (index, chr) {
    if (index > this.length - 1) return str;
    return this.substr(0, index) + chr + this.substr(index + 1);
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
};

String.prototype.toSentenceCase = function () {
    var n = this.split(".");
    var vfinal = ""
    for (i = 0; i < n.length; i++) {
        var spaceput = ""
        var spaceCount = n[i].replace(/^(\s*).*$/, "$1").length;
        n[i] = n[i].replace(/^\s+/, "");
        var newstring = n[i].charAt(n[i]).toUpperCase() + n[i].slice(1);
        for (j = 0; j < spaceCount; j++)
            spaceput = spaceput + " ";
        vfinal = vfinal + spaceput + newstring + ".";
    }
    vfinal = vfinal.substring(0, vfinal.length - 1);
    return vfinal;
};

String.prototype.trunc = String.prototype.trunc ||
    function (n) {
        return (this.length > n) ? this.substr(0, n - 1) + '&hellip;' : this;
    };

$.fn.extend({
    isChildOf: function (filter) {
        return $(filter).find(this).length > 0;
    }
});

function formatMoney(n, c, d, t) {
    var c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

function isValidEmailAddress(emailAddress) {
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return pattern.test(emailAddress);
}

function Currency(sSymbol, vValue) {
    aDigits = vValue.toFixed(0).split(".");
    aDigits[0] = aDigits[0].split("").reverse().join("").replace(/(\d{3})(?=\d)/g, "$1,").split("").reverse().join("");
    return sSymbol + aDigits.join(".");
}

function ShowFixFlowDialog() {

    $.confirm({
        theme: 'modern', // 'material', 'bootstrap'
        title: 'Request a Repair',
        content: $('#fixflo-modal').html(),
        animation: 'top',
        closeAnimation: 'bottom',
        animationBounce: 1.5,
        animateFromElement: false,
        // Same 2027 look as the "Begin Your Search" dialog: no coloured top border,
        // compact fixed box, shared .polo-dialog-box / .polo-dialog-btn styling.
        draggable: true,
        backgroundDismiss: true,
        closeIcon: true,
        onOpenBefore: function () {
            if (this.$jconfirmBox) { this.$jconfirmBox.addClass('polo-dialog-box'); }
            if (this.$jconfirmBg) { this.$jconfirmBg.addClass('polo-dialog-bg'); }
        },
        useBootstrap: false,
        boxWidth: '460px',
        buttons: {
            Report: {
                text: 'Request a Repair',
                action: function () {
                    window.location.href = 'https://cookeandco.com/repairs';
                },
                btnClass: 'btn-red polo-dialog-btn',
            }
        }
    });

}

function ShowSearchDialog() {

    $.confirm({
        theme: 'modern', // 'material', 'bootstrap'
        title: 'Begin Your Search',
        content: $('#beginsearch-modal').html(),
        animation: 'top',
        closeAnimation: 'bottom',
        animationBounce: 1.5,
        animateFromElement: false,
        backgroundDismiss: true,
        closeIcon: true,
        draggable: true,
        // No `type` (was 'red') so there's no coloured top border on the box.
        // Tag the box so the scoped .polo-dialog-box CSS (padding/radius) applies
        // (this jconfirm build ignores the `boxClass` option). Use onOpenBefore -
        // BEFORE the open animation - so the rounded corners are set from the first
        // paint (onOpen fired after, so the box morphed square -> rounded).
        onOpenBefore: function () {
            if (this.$jconfirmBox) { this.$jconfirmBox.addClass('polo-dialog-box'); }
            if (this.$jconfirmBg) { this.$jconfirmBg.addClass('polo-dialog-bg'); }
        },
        // Fixed, narrower box (was col-md-8, too wide) to match the compact
        // 2027 "Request a viewing" modal.
        useBootstrap: false,
        boxWidth: '460px',
        buttons: {
            Buy: {
                text: 'For Sale',
                // Unified search: For Sale is the default /properties/ view.
                action: function () {
                    window.location.href = "/properties/";
                },
                btnClass: 'btn-red polo-dialog-btn',
            },
            Rent: {
                text: 'To Let',
                // Unified search: To Let is the same route with ?let=true.
                action: function () {
                    window.location.href = "/properties/?let=true";
                },
                btnClass: 'btn-red polo-dialog-btn',
            }
        }
    });

}

function ShowRentalListhDialog() {

    var newurl;
    newurl = '/Output/RentalList/';
    window.location.href = newurl;

    $.confirm({
        theme: 'modern', // 'material', 'bootstrap'
        title: 'Rental List',
        content: $('#rentallist-modal').html(),
        animation: 'top',
        closeAnimation: 'bottom',
        animationBounce: 1.5,
        animateFromElement: false,
        backgroundDismiss: true,
        closeIcon: true,
        type: 'red',
        draggable: true,
        columnClass: 'col-xxs-12 xol-xs-12 col-sm-12 col-md-8 col-md-offset-2',
        buttons: {
            OK: function () { }
        }
    });

}

function OpenValuationLink() {

    //$('#valuation-modal').find('iframe').attr('src', 'https://platform.pro-val.co.uk/?c=cookeandco&t=3&p=374');

    var url = 'https://value-my-house.cookeandco.com';
    window.open(url, 'blank');

    //$.confirm({
    //    theme: 'bootstrap', // 'material', 'bootstrap'
    //    title: 'Request a Valuation',
    //    titleClass: 'hidden',
    //    content: $('#valuation-modal').html(),
    //    animation: 'top',
    //    closeAnimation: 'bottom',
    //    animationBounce: 1.5,
    //    animateFromElement: false,
    //    backgroundDismiss: false,
    //    closeIcon: false,
    //    type: 'red',
    //    draggable: true,
    //    columnClass: 'col-xxs-12 xol-xs-12',
    //    buttons: {
    //        Close: {
    //            btnClass: 'btn-danger',
    //            text: 'Close'
    //        }
    //    }
    //});
}

// FTR-118 (2026-09-09): the gdpr-cookie-law plugin is gone; the banner is
// Views/Shared/_CookieConsent2027.cshtml (window.cookieConsent). Kept as a no-op so
// any stray caller does not throw.
function InitGDPRCookieLaw() {
    if (window.cookieConsent || !$.fn.gdprCookieLaw) { return; }

    $(document).gdprCookieLaw({
        // The policy page's slug comes from Admin > Options (set by _Layout as POLO_PRIVACY_URL);
        // the old hard-coded /cookie-and-privacy-policy was a 404 (BUG-10).
        moreLinkHref: window.POLO_PRIVACY_URL || '/cookies-complaints-statutory-documents-links-and-rules-for-naea-arla',
        desc: '<span class="far fa-info-circle"></span> This site uses cookies. By continuing to browse the site you are agreeing to our use of cookies.',
        moreLinkText: 'Read More',
        btnAcceptText: '<span class="fa fa-check"></span>&nbsp;It\'s ok',
        position: 'top',
        animationStatus: true,
        animationDuration: 500,
        animationName: 'slide',
        theme: 'theme-6'
    });

}

function OpenObscuredEmailLink($link) {
    var email = 'mailto:' + $link.data('name') + '@' + $link.data('domain');
    window.location.href = email;
}


function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}

function lockBodyScroll() {

    setTimeout(function () {
        $('body').css('overflow-y', 'hidden');
        $('html').css('overflow-y', 'hidden').css('position', 'fixed');
        //window.scrollTo(0, 100);
        //window.scrollTo(0, 0);
    }, 300);
}



var resizeCommonTimer;

$(document).ready(function () {

    $(window).scroll(function () {

        clearTimeout(resizeCommonTimer);
        resizeCommonTimer = setTimeout(function () {
            if ($(this).scrollTop() > 300) {
                $('.gototop-button').addClass('visible');
            } else {
                $('.gototop-button').removeClass('visible');
            }
        }, 250);

    });

    $('.obscured-email-link').on('click', function () {
        OpenObscuredEmailLink($(this));
    });

    $('.fixflo-modal').on('click', function () {
        ShowFixFlowDialog();
    });

    //$('#footer-menu > li > a').click(function (e) {
    //    e.preventDefault();
    //    $(this).closest('li').toggleClass('active');
    //});

    $('.beginsearch-modal').on('click', function () {
        ShowSearchDialog();
    });

    $('.display-valuation-modal').on('click', function () {
        OpenValuationLink();
    });

    // Main slide-in menu
    $('.open-menu-trigger').on('click', function () {
        $(this).closest('.header-buttons').find('.menu-toggler').first().trigger('click');
    });



    $('#main-nav').hcOffcanvasNav({
        levelOpen: 'overlap',
        side: 'right',
        levelSpacing: 40,
        levelTitles: true,
        navTitle: null,
        navClass: '',
        disableBody: true,
        closeOnClick: true,
        customToggle: '.menu-toggler',
        insertClose: false,
        closeEvent: function () {
            if ($('#fullpage').length > 0 && $('html').hasClass('touch') && $(window).height() < 750) {
                //fullpage_api.setResponsive(false);  
                //setTimeout(function () {
                //    $('.hc-offcanvas-nav').removeClass('fp-forced-responsive');
                //}, 400);
            }
        },
        openEvent: function () {
            if ($('#fullpage').length > 0 && $('html').hasClass('touch') && $(window).height() < 750) {
                //$('.hc-offcanvas-nav').addClass('fp-forced-responsive');
                //setTimeout(function () {
                //    fullpage_api.setResponsive(true);
                //}, 400);
            }
        }
    });

    // Contact Menu
    var bodyEl = document.body,
        content = document.querySelector('.wrapper'),
        openbtn = document.getElementById('open-button'),
        openbtnRSP = $('body').find('.hc-offcanvas-nav').first().find('.open-button-responsive')[0],
        closebtn = document.getElementById('close-button'),
        isOpen = false;  

    function initContactMenuEvents() {
        openbtn.addEventListener('click', toggleMenu);
        openbtnRSP.addEventListener('click', toggleMenu);

        if (closebtn) {
            closebtn.addEventListener('click', toggleMenu);
        }

        // close the menu element if the target it´s not the menu element or one of its descendants..
        content.addEventListener('click', function (ev) {
            var target = ev.target;
            if (isOpen && (target !== openbtn && target !== openbtnRSP)) {
                toggleMenu();
            }
        });
    }

    function toggleMenu() {
        if (isOpen) {
            //SetFPScrolling(false);
            classie.remove(bodyEl, 'show-menu');
            //$('#root-wrapper').removeClass('fp-forced-responsive');
        }
        else {
            //$('#root-wrapper').addClass('fp-forced-responsive');
            //setTimeout(function () {
                SetFPScrolling(true);
            //}, 400);
            classie.add(bodyEl, 'show-menu');
        }
        isOpen = !isOpen;
    }


    function SetFPScrolling(scroll) {
        if ($('#fullpage').length > 0 && $('html').hasClass('touch') && $(window).height() < 750) {      
            //setTimeout(function () {
            //    fullpage_api.setResponsive(scroll);               
            //}, 100);
        }
    }

    initContactMenuEvents();

    InitGDPRCookieLaw();
});

