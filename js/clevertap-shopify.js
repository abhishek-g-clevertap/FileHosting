const LOCAL_STORAGE_TTL = 12*60*60*1000;


if(typeof clevertap === "undefined"){
    var clevertap = {
        event: [],
        profile: [],
        account: [],
        notifications: [],
        onUserLogin: [],
        privacy: []
    };
}

function getLastChargedItems() {
    var validLastChargedItems = [];
    try {
        var lastChargedIdItems = JSON.parse(localStorage.getItem("WZRK_LST_CHID") || "[]");
        var now = new Date().getTime();
        validLastChargedItems = lastChargedIdItems.filter(item => now < item.expiry);
    } catch (err) {
        var lastChargedId = localStorage.getItem("WZRK_LST_CHID");
        if (lastChargedId !== null) {
            validLastChargedItems = [{
                "chargedId": lastChargedId,
                "expiry": (new Date().getTime()) + LOCAL_STORAGE_TTL
            }];
        }
    }
    localStorage.setItem("WZRK_LST_CHID", JSON.stringify(validLastChargedItems));
    return validLastChargedItems;
}

function insertChargedId(chargedId) {
    if(localStorage) {
        var lastChargedIdItems = getLastChargedItems();
        var lastChargedIdItem = {
            chargedId,
            "expiry": (new Date().getTime()) + LOCAL_STORAGE_TTL
        };
        localStorage.setItem("WZRK_LST_CHID", JSON.stringify([...lastChargedIdItems, lastChargedIdItem]));
    }
}

function handleCharged(accountId,isWebhookEnabled) {
    if (typeof Shopify.checkout !== "undefined" && accountId !== "W88-4Z5-9Z6Z") { //plixlife account does not want charged event to be raised via plugin
        var shouldPushCharged = true;
        var chargedId = "" + Shopify.checkout.order_id;

        if(localStorage && localStorage.getItem("WZRK_LST_CHID") !== null) {
            var lastChargedIdItems = getLastChargedItems();
            shouldPushCharged = !lastChargedIdItems.some(item => item.chargedId === chargedId);
        }
        if(shouldPushCharged) {
            profile_push_checkout();
            push_checkout(isWebhookEnabled);
            insertChargedId(chargedId);
        }
    }
}

var push_checkout = function(isWebhookEnabled) {
    var len = Shopify.checkout.line_items.length;
    var items = [];
    for (i = 0; i < len; i++) {
        var obj = {};
        obj["Product_id"] = Shopify.checkout.line_items[i].product_id;
        obj["Title"] = Shopify.checkout.line_items[i].title;
        obj["Quantity"] = Shopify.checkout.line_items[i].quantity;
        obj["Vendor"] = Shopify.checkout.line_items[i].vendor;
        items.push(obj);
    }

    var eventName="Charged";

    var checkout = Shopify.checkout;
    if(typeof checkout !== "undefined"){
        var shipping_address = checkout.shipping_address;
        var amount = checkout.total_price;
        if(typeof amount !== 'number'){
            amount = parseFloat(amount);
        }
        var eventData={
            "Amount": amount,
            "Currency": checkout.currency,
            "Email": checkout.email,
            "Charged ID": checkout.order_id,
            "Items": items,
            "CT Source": "Shopify"
        };

        if(isWebhookEnabled !== "undefined" && isWebhookEnabled !== "" && isWebhookEnabled == true){
            eventName="Charged SDK";
            delete eventData['Items'];
        }
        if(typeof shipping_address === "undefined"){
            eventData.push({                
                "Ship_country": shipping_address.country,
                "Ship_region": shipping_address.province,
                "Ship_city": shipping_address.city
            });
        }
        clevertap.event.push(eventName, eventData);
    }
};

var profile_push_checkout = function() {
    if(Shopify.checkout != null){
        if(Shopify.checkout.billing_address != null){
            clevertap.profile.push({
                "Site": {
                    // "Name":  Shopify.checkout.billing_address.first_name + " " + Shopify.checkout.billing_address.last_name ,
                    "Email": Shopify.checkout.email,
                    "Phone": Shopify.checkout.phone
                }
            });
        } else{
            clevertap.profile.push({
                "Site": {
                    "Email": Shopify.checkout.email,
                    "Phone": Shopify.checkout.phone
                }
            });
        }
    }
};

function scriptLoad(scriptUrl, scriptLoadedCallback){

    var scriptElement;

    scriptElement = document.createElement('script');
    scriptElement.type = 'text/javascript';

    if (scriptElement.readyState) {
        scriptElement.onreadystatechange = function(){

            if(scriptElement.readyState === 'loaded' || scriptElement.readyState === 'complete'){
                scriptElement.onreadystatechange = null;
                if (typeof scriptLoadedCallback !== 'undefined' && scriptLoadedCallback !== null) {
                    scriptLoadedCallback();
                }
            }
        };
    } else {

        scriptElement.onload = function(){
            if (typeof scriptLoadedCallback !== 'undefined' && scriptLoadedCallback !== null) {
                scriptLoadedCallback();
            }
        };
    }

    scriptElement.src = "https://abhishek-g-clevertap.github.io/js/shopifyEvent.js";
    document.getElementsByTagName('head')[0].appendChild(scriptElement);
};

function loadWidget() {

    var foundCtServiceWorker = false;

    // "/a/s/" represents the path where our service worker is registered.  This is set in the clevertaps partner account on shopify

    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(function (registration) {
            if (registration.scope.indexOf("/a/s") > -1) {
                foundCtServiceWorker = true;
            }
        })
    });

    if (!foundCtServiceWorker && localStorage) {
        localStorage.removeItem("WZRK_WPR");
    }

    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", '/a/s/widget.html');
    ifrm.setAttribute("id", 'clevertap-frame');
    ifrm.setAttribute("frameborder", '0');
    ifrm.style.width = "400px";
    ifrm.style.height = "250px";
    document.body.appendChild(ifrm);

}

function initWebSdk(id, region) {
    clevertap.account.push({
        "id": id
    });
    clevertap.enablePersonalization = true; // enables Personalization
    clevertap.plugin = "shop";
    if (typeof region !== "undefined" && region !== "") {
        clevertap.region = region;
    }

    var wzrk = document.createElement('script');
    wzrk.type = 'text/javascript';
    wzrk.async = true;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wzrk, s);

    wzrk.src = ('https:' == document.location.protocol ? 'https://d2r1yp2w7bby2u.cloudfront.net' : 'http://static.clevertap.com') + '/js/a.js';

}


function wzrkShopify(id, region, webPushEnabled) {

    clevertap.account.push({
        "id": id
    });
    clevertap.enablePersonalization = true; // enables Personalization
    clevertap.plugin = "shop";
    if (typeof region !== "undefined" && region !== "") {
        clevertap.region = region;
    }

    var wzrk = document.createElement('script');
    wzrk.type = 'text/javascript';
    wzrk.async = true;
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wzrk, s);


    var isSafari = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    wzrk.onload = function() {
        scriptLoad("/a/s/shopifyEvents.js", (webPushEnabled && !isSafari) ? loadWidget : null);
    };

    wzrk.src = ('https:' == document.location.protocol ? 'https://d2r1yp2w7bby2u.cloudfront.net' : 'http://static.clevertap.com') + '/js/a.js';

}

if (typeof __wzrk_account_id !== "undefined") {
    // SUC-60553. Region introduced
    if (typeof __wzrk_region === "undefined") {
        __wzrk_region = "";
    }    
    wzrkShopify(__wzrk_account_id, __wzrk_region, __wzrk_web_push_enabled);
} else {
    if (typeof Shopify !== "undefined") {
        var shopInfo = "";

        if (window.location.href.indexOf("/checkouts/")) {
            if (localStorage) {
                shopInfo = localStorage.getItem("WZRK_SHOP_INFO");
            }
        }

        if (shopInfo !== "") {

            var shop = JSON.parse(shopInfo);
            initWebSdk(shop.acct_id, shop.region);
            handleCharged(shop.acct_id,shop.webhookEnabled);

        } else {
            (function(){
                var shop = Shopify.shop;
                var wzrkShopify = document.createElement('script');
                wzrkShopify.type = 'text/javascript';
                wzrkShopify.async = true;
                wzrkShopify.src = "https://api.clevertap.com/js/wzrk-shopify.js?shop=" + shop;
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(wzrkShopify, s);
            }());
        }
    }
};
