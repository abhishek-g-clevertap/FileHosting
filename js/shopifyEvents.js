(function(cleverWindow, cleverDocument, cleverApp){

    'use strict';

    var cookieVariable, isCustomerLogged, currentCartItem, isCartEventTrack;

   //  localStoragesetWithExpiry and getWithExpiry can be used when debounce checkout does not work
   //  function setWithExpiry(key, value, ttl) {
   //      const now = new Date()
   //
   //      // `item` is an object which contains the original value
   //      // as well as the time when it's supposed to expire
   //      const item = {
   //          value: value,
   //          expiry: now.getTime() + ttl,
   //      }
   //      localStorage.setItem(key, JSON.stringify(item))
   //  }
   //
   //  function getWithExpiry(key) {
   //      const itemStr = localStorage.getItem(key)
   //      // if the item doesn't exist, return null
   //      if (!itemStr) {
   //          return null
   //      }
   //      const item = JSON.parse(itemStr)
   //      const now = new Date()
   //      // compare the expiry time of the item with the current time
   //      if (now.getTime() > item.expiry) {
   //          // If the item is expired, delete the item from storage
   //          // and return null
   //          localStorage.removeItem(key)
   //          return null
   //      }
   //      return item.value
   //  }

    cookieVariable = {
        customerLoginToken: 'customer-login-event',
        customerRegisterToken: 'customer-register-event',
        addToCartToken: 'add-to-cart-event'
    }

    /* SET COOKIE START */
    function setCookie(cname, cvalue, expire, expireType = 'day'){

        var currentDate, expires;

        if(expireType == 'hour')
            expire = expire * 60 * 60 * 1000;
        else if(expireType == 'minute')
            expire = expire * 60 * 1000;
        else if(expireType == 'second')
            expire = expire * 1000;
        else
            expire = expire * 24 * 60 * 60 * 1000;

        currentDate = new Date();
        currentDate.setTime(currentDate.getTime() + expire);
        expires = "expires="+ currentDate.toUTCString();
        cleverDocument.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        return cvalue;
    };
    /* SET COOKIE END */

    /* GET COOKIE START */
    function getCookie(cname){

        var name, decodedCookie, cookieSplit;

        name = cname + "=";
        decodedCookie = decodeURIComponent(cleverDocument.cookie);
        cookieSplit = decodedCookie.split(';');
        for(var i = 0; i < cookieSplit.length; i++){

            var cookie;

            cookie = cookieSplit[i];
            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1);
            }
            if(cookie.indexOf(name) == 0){
                return cookie.substring(name.length, cookie.length);
            }
        }
        return null;
    };
    /* GET COOKIE END */

    /* DELETE COOKIE START */
    function deleteCookie(cname){
        cleverDocument.cookie = cname + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/";
        return true;
    };
    /* DELETE COOKIE END */

    /* CONVERT FORM TO JSON START */
    function getFromJson(form){

        var formDataObject;

        formDataObject = {};
        new FormData(form).forEach(function(value, key){
            if(key != 'utf8')
                formDataObject[key] = value;
        });
        return formDataObject;
    };
    /* CONVERT FORM TO JSON END */

    /* REQUEST TO JSON START */
    function getRequestToJson(request){

        var requestJson;

        requestJson = {};
        if(request == undefined || request.trim() == '')
            return {};

        if(typeof request == 'string'){
            try{
                requestJson = JSON.parse(request);
            }catch(errorMessage){

                if(request.indexOf('&') > -1 && request.indexOf('=') > -1){

                    var formDataObject = {};
                    for(var pair of new URLSearchParams(request).entries()){
                        formDataObject[pair[0]] = pair[1];
                    }
                    requestJson = formDataObject;
                }
            }
        }else if(request instanceof FormData){

            var formDataObject = {};
            fetchBody.forEach(function(value, key){
                if(key != 'utf8')
                    formDataObject[key] = value;
            });
            requestJson = formDataObject;
        }else if(typeof request == 'object'){
            requestJson = request;
        }
        return requestJson;
    };
    /* REQUEST TO JSON START */

    /* PARSE BOOLEAN SATRT */
    function parseBoolean(value){
        return (value == 'true') ? true : false;
    };
    /* PARSE BOOLEAN END */

    /* CHECK IS NUMERIC START */
    function isNumeric(number){
        return !isNaN(parseFloat(number)) && isFinite(number);
    };
    /* CHECK IS NUMERIC END */

    /* PUSH CLEVERTAP EVENT START */
    function pushEvent(eventName, eventPayload){

        console.log(eventName, eventPayload);
        clevertap.event.push(eventName, eventPayload);
        return true;
    };
    /* PUSH CLEVERTAP EVENT END */

    /* PUSH CLEVERTAP PROFILE START */
    function pushProfile(eventPayload){

        console.log('Profile Push', eventPayload);
        clevertap.profile.push(eventPayload);
        return true;
    };
    /* PUSH CLEVERTAP PROFILE END */

    /* FULL SCRIPT HANDLER START */
    function eventHandler(){

        var originalSendEvent, originalFetchEvent, customerAccountUrl, customerLoginUrl, addToCartUrl, changeCartUrl, updateCartUrl, checkoutUrl;

        /* GENERATE ALL URL IN LIQUID OBJECT START */
        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.customer && cleverApp.config.routes.customer.account)
            customerAccountUrl = cleverApp.config.routes.customer.account;

        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.customer && cleverApp.config.routes.customer.login)
            customerLoginUrl = cleverApp.config.routes.customer.login;

        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.cart && cleverApp.config.routes.cart.add)
            addToCartUrl = cleverApp.config.routes.cart.add;

        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.cart && cleverApp.config.routes.cart.change)
            changeCartUrl = cleverApp.config.routes.cart.change;

        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.cart && cleverApp.config.routes.cart.update)
            updateCartUrl = cleverApp.config.routes.cart.update;

        if(cleverApp && cleverApp.config && cleverApp.config.routes && cleverApp.config.routes.cart && cleverApp.config.routes.cart.list)
            checkoutUrl = cleverApp.config.routes.cart.list;
        /* GENERATE ALL URL IN LIQUID OBJECT END */

        /* CART PAGE HANDLER START */
        if(cleverApp && cleverApp.config && cleverApp.config.meta && cleverApp.config.meta.type && cleverApp.config.meta.type == 'cart'){

            var addToCartToken;
            addToCartToken = getCookie(cookieVariable.addToCartToken);
            addToCartToken = (addToCartToken != null) ? parseInt(addToCartToken) : addToCartToken;

            if(isNumeric(addToCartToken)){
                currentCartItem.forEach(function(item){
                    if(item.id == addToCartToken){
                        onAddedToCart(item);
                        deleteCookie(cookieVariable.addToCartToken);
                        return false;
                    }
                });
            }
        }
        /* CART PAGE HANDLER END */

        /* XHR & AJX REQUEST HANDLER START */
        originalSendEvent = cleverWindow.XMLHttpRequest.prototype.send;
        cleverWindow.XMLHttpRequest.prototype.send = function(sendData){
            this.addEventListener('load', function(loadData){
                if(isCartEventTrack !== false && (this._url == '/cart/add.js' || (addToCartUrl && this._url == addToCartUrl))){

                    var itemJson, addToCartToken, addToCartQty;

                    itemJson = getRequestToJson(sendData);

                    if(typeof itemJson == 'object' && (itemJson.id || itemJson.items)){

                        addToCartToken = getCookie(cookieVariable.addToCartToken);
                        addToCartToken = (addToCartToken != null) ? parseInt(addToCartToken) : addToCartToken;

                        if(itemJson.items){
                            itemJson.items.forEach(function(item){
                                if(isNumeric(addToCartToken) && parseInt(item.id) == addToCartToken)
                                    deleteCookie(cookieVariable.addToCartToken);
                            });
                        }else{
                            if(isNumeric(addToCartToken) && parseInt(itemJson.id) == addToCartToken)
                                deleteCookie(cookieVariable.addToCartToken);
                        }

                        addToCartQty = (itemJson.quantity) ? itemJson.quantity : 1;
                        itemJson = JSON.parse(this.response);
                        itemJson.quantity = addToCartQty;

                        onAddedToCart(itemJson);
                    }
                }else if(isCartEventTrack !== false && (this._url == '/cart/change.js' || (updateCartUrl && this._url == updateCartUrl) || (changeCartUrl && this._url == changeCartUrl))){
                    onChangeCart(JSON.parse(this.response));
                }
            });
            return originalSendEvent.apply(this, arguments);
        };
        /* XHR & AJX REQUEST HANDLER END */

        /* FETCH REQUEST HANDLER START */
        originalFetchEvent = cleverWindow.fetch;
        cleverWindow.fetch = function(fetchUrl, options){
            return originalFetchEvent.apply(window, arguments).then((response) => {
                if(isCartEventTrack !== false && (fetchUrl == '/cart/add.js' || (addToCartUrl && fetchUrl == addToCartUrl))){

                    var itemJson, addToCartToken, addToCartQty;

                    itemJson = getRequestToJson(options.body);
                    if(typeof itemJson == 'object' && (itemJson.id || itemJson.items)){

                        addToCartToken = getCookie(cookieVariable.addToCartToken);
                        addToCartToken = (addToCartToken != null) ? parseInt(addToCartToken) : addToCartToken;

                        if(itemJson.items){
                            itemJson.items.forEach(function(item){
                                if(isNumeric(addToCartToken) && parseInt(item.id) == addToCartToken)
                                    deleteCookie(cookieVariable.addToCartToken);
                            });
                        }else{
                            if(isNumeric(addToCartToken) && parseInt(itemJson.id) == addToCartToken)
                                deleteCookie(cookieVariable.addToCartToken);
                        }
                        onChangeCart();
                    }
                }else if(isCartEventTrack !== false && (fetchUrl == '/cart/change.js' || (updateCartUrl && fetchUrl == updateCartUrl) || (changeCartUrl && fetchUrl == changeCartUrl))){
                    onChangeCart();
                }
                return response;
            });
        };
        /* FETCH REQUEST HANDLER START */

        /* FROM SUBMIT HANDLER START */
        cleverDocument.addEventListener('submit', function(event){
            if(customerAccountUrl && event.target.getAttribute('action') == customerAccountUrl)
                setCookie(cookieVariable.customerRegisterToken, 'Yes', 10, 'minute');
            else if(customerLoginUrl && event.target.getAttribute('action') == customerAccountUrl)
                setCookie(cookieVariable.customerLoginToken, 'Yes', 10, 'minute');
            else if(addToCartUrl && event.target.getAttribute('action') == addToCartUrl)
                setCookie(cookieVariable.addToCartToken, getFromJson(event.target).id, 2, 'minute');
            else if(event.target.getAttribute('action') == '/cart' || event.target.getAttribute('action') == checkoutUrl){
                debouncedCheckout()
                // let checkout = getWithExpiry("clevertap_checkout");
                // if (!checkout) {
                //     onCheckout(currentCartItem);
                //     setWithExpiry("clevertap_checkout", "yes", 2000)
                // }
                // window.location.href = '/checkout';
            }
        });
        /* FROM SUBMIT HANDLER END */

        var checkoutBtn = cleverDocument.querySelector('[name="checkout"]')

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                debouncedCheckout()
                // let checkout = getWithExpiry("clevertap_checkout");
                // if (!checkout) {
                //     onCheckout(currentCartItem);
                //     setWithExpiry("clevertap_checkout", "yes", 2000)
                // }
            })
        }

    };
    /* FULL SCRIPT HANDLER END */

    /* PAGE BROWSE EVENT HANDLER START */
    function onPageBrowse(){
        /* PUSH EVENT START */
        return pushEvent('Page Browsed', {
            URL: cleverApp.config.meta.url,
            Page: cleverApp.config.meta.type,
            Title: cleverApp.config.meta.title,
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */
    };
    /* PAGE BROWSE EVENT HANDLER END */

    /* PRODUCT SEARCH EVENT HANDLER START */
    function onSearchProduct(){
        /* PUSH EVENT START */
        return pushEvent('Searched Product', {
            Terms: cleverApp.searchProduct.terms,
            'Total Items': cleverApp.searchProduct.items.length,
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */
    };
    /* PRODUCT SEARCH EVENT HANDLER END */

    /* COLLECTION VIEW EVENT HANDLER START */
    function onCategoryView(){
        /* PUSH EVENT START */
        return pushEvent('Category Viewed', {
            Id: cleverApp.collection.id,
            URL: cleverApp.collection.url,
            Title: cleverApp.collection.title,
            Image: cleverApp.collection.image,
            "Product Count": cleverApp.collection.productCount,
            "CT Source": "Shopify"

        });
        /* PUSH EVENT END */
    };
    /* COLLECTION VIEW EVENT HANDLER END */

    /* Product VIEW EVENT HANDLER START */
    function onProductView(){
        /* PUSH EVENT START */
        return pushEvent('Product Viewed', {
            ID: cleverApp.product.id,
            URL: cleverApp.product.url,
            Price: cleverApp.product.price,
            Title: cleverApp.product.title,
            Handle: cleverApp.product.handle,
            Currency: cleverApp.config.currency,
            Available: cleverApp.product.available,
            'Total Variants': Object.keys(cleverApp.product.variants).length,
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */
    };
    /* Product VIEW EVENT HANDLER END */

    /* CUSTOMER REGISTER EVENT HANDLER START */
    function onCustomerRegister(){

        deleteCookie(cookieVariable.customerRegisterToken);
        isCustomerLogged = setCookie(cookieVariable.customerLoginToken, true, 30);

        let profile = getUserProps(cleverApp.customer);

        clevertap.onUserLogin.push({
            "Site": profile
        })
        /* PUSH EVENT START */
        delete profile.Tags;
        profile["CT Source"] = "Shopify";
        return pushEvent('Customer Registered', profile);
        /* PUSH EVENT END */

    };
    /* CUSTOMER REGISTER EVENT HANDLER END */

    /* CUSTOMER LOGIN EVENT HANDLER START */
    function onCustomerLogin(){

        isCustomerLogged = setCookie(cookieVariable.customerLoginToken, true, 30);

        let profile = getUserProps(cleverApp.customer);

        clevertap.onUserLogin.push({
            "Site": profile
        })
        /* PUSH EVENT START */
        delete profile.Tags;
        profile["CT Source"] = "Shopify";
        return pushEvent('Customer Logged In', profile);
        /* PUSH EVENT END */
    };
    /* CUSTOMER LOGIN EVENT HANDLER END */

    /* CUSTOMER LOGOUT EVENT HANDLER START */
    function onCustomerLogout(){

        isCustomerLogged = false;
        deleteCookie(cookieVariable.customerLoginToken);
        /* PUSH EVENT START */
        pushEvent('Customer Logged Out', {
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */

        clevertap.logout();
        return
    };
    /* CUSTOMER LOGOUT EVENT HANDLER END */

    function getUserProps(customer) {
        return {
            "Email": customer.email,
            "Phone": customer.phone,
            "Name": customer.name,
            "Identity": customer.email,
            "Tags": customer.tags,
            "City": customer.city,
            "Accepts Marketing": customer.acceptsMarketing,
            "Has Account": customer.hasAccount,
            "Orders Count": customer.ordersCount,
            "Tax Exempt": customer.taxExempt,
            "Total Spent": customer.totalSpent,
            "Shopify ID": customer.id,
            "First Name": customer.firstName,
            "Last Name": customer.lastName
        }
    }

    /* ADD TO CART ITEM EVENT HANDLER START */
    function onAddedToCart(item){

        /* PUSH EVENT START */
        pushEvent('Added To Cart', {
            URL: item.url,
            Title: item.title,
            Image: item.image,
            Vendor: item.vendor,
            Quantity: item.quantity,
            'Product ID': item.product_id,
            'Variant ID': item.variant_id,
            'Product Type': item.product_type,
            'Variant Title': item.variant_title,
            Currency: cleverApp.config.currency,
            Price: parseFloat((parseInt(item.price) / 100).toFixed(2)),
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */

        /* CART UPDATE START */
        return onUpdateCart();
        /* CART UPDATE START */
    };
    /* ADD TO CART ITEM EVENT HANDLER END */

    /* REMOVE CART ITEM EVENT HANDLER START */
    function onRemoveToCart(item){

        /* PUSH EVENT START */
        return pushEvent('Removed From Cart', {
            URL: item.url,
            Title: item.title,
            Image: item.image,
            Vendor: item.vendor,
            Quantity: item.quantity,
            'Product ID': item.product_id,
            'Variant ID': item.variant_id,
            'Product Type': item.product_type,
            'Variant Title': item.variant_title,
            Currency: cleverApp.config.currency,
            Price: parseFloat((parseInt(item.price) / 100).toFixed(2)),
            "CT Source": "Shopify"
        });
        /* PUSH EVENT END */
    };
    /* REMOVE CART ITEM EVENT HANDLER END */

    /* CART ITEM CHANGE EVENT HANDLER START */
    function onChangeCart(response = {}){

        if(currentCartItem != undefined && currentCartItem.length !== 0){
            if(response == undefined || (Object.keys(response).length === 0 && response.constructor === Object)){

                var oldCurrentCartItem = currentCartItem;
                onUpdateCart(function(){
                    response.items = currentCartItem;
                    currentCartItem = oldCurrentCartItem;
                    onCartHandler(response);
                });
            }else{

                onCartHandler(response);
            }
        }else{

            onUpdateCart(function(){
                currentCartItem.forEach(function(cartItem){
                    onAddedToCart(cartItem);
                });
            });
        }

        return true;
    };
    /* CART ITEM CHANGE EVENT HANDLER END */

    /* CART ITEM CHANGE TYPE HANDLER START */
    function onCartHandler(response){

        var cartItemList;

        cartItemList = {};
        currentCartItem.forEach(function(cartItem){
            cartItemList[cartItem.key] = cartItem;
        });

        response.items.forEach(function(item){
            if(cartItemList[item.key]){

                var cartItem = cartItemList[item.key];
                if(parseInt(cartItem.quantity) != parseInt(item.quantity)){
                    if(cartItem.quantity < item.quantity)
                        onAddedToCart(fetchCartItemDifference(cartItem, item));
                    else
                        onRemoveToCart(fetchCartItemDifference(cartItem, item));
                }
                delete cartItemList[item.key];
            }else{
                onAddedToCart(item);
            }
        });

        if(Object.keys(cartItemList).length !== 0 && cartItemList.constructor === Object){

            for (var key in cartItemList) {
                if (cartItemList.hasOwnProperty(key)) {
                    var item = cartItemList[key]
                    onRemoveToCart(item)
                    delete cartItemList[key]
                }
            }

            // cartItemList.forEach(function(item){
            // 	onRemoveToCart(item);
            // 	delete cartItemList[item.key];
            // });
        }
        return onUpdateCart();
    };
    /* CART ITEM CHANGE TYPE HANDLER START */

    /* CART UPDATE EVENT HANDLER START */
    async function onUpdateCart(callback = new Function){

        await fetch('/cart.js').then(function(response){
            if(response.status == 200)
                return response.json();
        }).then(function(response){
            if(response != undefined)
                currentCartItem = response.items;
            callback();
        });
        return buyItNowInit();
    };
    /* CART UPDATE EVENT HANDLER START */

    /* CART ITEM DIFFERENCE HANDLER START */
    function fetchCartItemDifference(oldItem, newItem){

        var itemQty, imageUrl;

        itemQty = newItem.quantity;
        if(oldItem.quantity < newItem.quantity)
            itemQty = parseInt(newItem.quantity) - parseInt(oldItem.quantity);
        else if(oldItem.quantity > newItem.quantity)
            itemQty = parseInt(oldItem.quantity) - parseInt(newItem.quantity);

        newItem.quantity = itemQty;
        return newItem;
    };
    /* CART ITEM DIFFERENCE HANDLER END */

    /* BUY IT NOW EVENT HANDLER START */
    function buyItNowInit(){

        /* CHECK ALREADY EVENT ASSIGN OR NOT START */
        if(!cleverDocument.querySelectorAll('.clevertap-payment-button').length){

            var shopifyPaymentButton, shopifyPaymentButtonParent, shopifyPaymentButtonReplace;

            /* CHECK SHOPIFY BUY IT NOW ENABLE START */
            shopifyPaymentButton = cleverDocument.querySelector('.shopify-payment-button .shopify-payment-button__button.shopify-payment-button__button--unbranded');
            if(shopifyPaymentButton){

                /* ASSIGN EVENT START */
                // shopifyPaymentButtonParent = shopifyPaymentButton.parentNode;
                // shopifyPaymentButtonReplace = shopifyPaymentButton.cloneNode(true);

                shopifyPaymentButton.classList.add('clevertap-payment-button');
                // shopifyPaymentButtonParent.replaceChild(shopifyPaymentButtonReplace, shopifyPaymentButton);

                // cleverDocument.querySelector('.clevertap-payment-button').removeEventListener('click', new Function);
                shopifyPaymentButton.addEventListener('click', function(){
                    onCheckoutInit(function(item){

                        if(item != undefined)
                            onCheckout([item]);
                        // shopifyPaymentButton.click();
                    });
                });
                /* ASSIGN EVENT END */
            }
            /* CHECK SHOPIFY BUY IT NOW ENABLE END */
        }
        /* CHECK ALREADY EVENT ASSIGN OR NOT START */
    };
    /* BUY IT NOW EVENT HANDLER START */

    /* DIRECT CHECKOUT BUTTON EVENT HANDLER START */
    function onCheckoutInit(callback = new Function){

        var productForm, productFormData, checkoutQty;

        productForm = cleverDocument.querySelector('form[action="/cart/add"]');
        productFormData = new FormData(productForm);
        checkoutQty = productFormData.get('quantity');
        if(checkoutQty == undefined || checkoutQty == null || checkoutQty == '')
            checkoutQty = 1;
        isCartEventTrack = false;

        fetch('/cart/add.js', {
            method: 'post',
            body: productFormData
        }).then(function(response) {
            return response.json();
        }).then(function(checkoutData){

            var updateFormData;

            updateFormData = new FormData();
            updateFormData.append('id', checkoutData.id);
            updateFormData.append('quantity', parseInt(checkoutData.quantity) - parseInt(checkoutQty));
            checkoutData.quantity = checkoutQty;

            fetch('/cart/change.js', {
                method: 'post',
                body: updateFormData
            }).then(function(response) {
                return response.json();
            }).then(function(){
                callback(checkoutData);
                isCartEventTrack = true;
            }).catch((error) => {
                callback();
                isCartEventTrack = true;
            });
        }).catch((error) => {
            callback();
            isCartEventTrack = true;
        });
    };
    /* DIRECT CHECKOUT BUTTON EVENT HANDLER START */

    var push_checkout = function() {
        var len = Shopify.checkout.line_items.length;
        var items = [];
        for (var i = 0; i < len; i++) {
            var obj = {};
            obj["Product_id"] = Shopify.checkout.line_items[i].product_id;
            obj["Title"] = Shopify.checkout.line_items[i].title;
            obj["Quantity"] = Shopify.checkout.line_items[i].quantity;
            obj["Vendor"] = Shopify.checkout.line_items[i].vendor;
            items.push(obj);
        }
        var checkout = Shopify.checkout;
        if(typeof checkout !== "undefined"){
            var shipping_address = checkout.shipping_address;
            var amount = checkout.total_price;
            
            var eventData={
                "Amount": amount,
                "Currency": checkout.currency,
                "Email": checkout.email,
                "Charged ID": checkout.order_id,
                "Items": items,
                "CT Source": "Shopify"
            };
    
            if(__wzrk_webhook_enabled !== "undefined" && __wzrk_webhook_enabled !== "" && __wzrk_webhook_enabled == "true"){
                eventName="Charged SDK";
                delete eventData['Items'];
            }
            if(typeof shipping_address !== "undefined"){
                eventData["Ship_country"]=shipping_address.country;                
                eventData["Ship_region"]=shipping_address.province;                
                eventData["Ship_city"]=shipping_address.city;                
            }
            clevertap.event.push(eventName, eventData);
        }
    };

    const LOCAL_STORAGE_TTL = 12 * 60 * 60 * 1000;

    function getLastChargedItems() {
        var validLastChargedItems = [];
        try {
            var lastChargedIdItems = JSON.parse(localStorage.getItem("WZRK_LST_CHID") || "[]");
            var now = new Date().getTime();
            validLastChargedItems = lastChargedIdItems.filter(item => now < item.expiry);
        } catch(err) {
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
                expiry: (new Date().getTime()) + LOCAL_STORAGE_TTL
            };
            localStorage.setItem("WZRK_LST_CHID", JSON.stringify([...lastChargedIdItems, lastChargedIdItem]));
        }
    }

    function handleCharged(accountId) {
        if (typeof Shopify.checkout !== "undefined" && accountId !== "W88-4Z5-9Z6Z") { //plixlife account does not want charged event to be raised via plugin
            var shouldPushCharged = true;
            var chargedId = "" + Shopify.checkout.order_id;
            if(localStorage && localStorage.getItem("WZRK_LST_CHID") !== null) {
                var lastChargedIdItems = getLastChargedItems();
                shouldPushCharged = !lastChargedIdItems.some(item => item.chargedId === chargedId);
            }
            if(shouldPushCharged) {
                profile_push_checkout();
                push_checkout();
                insertChargedId(chargedId);
            }
        }
    }

    const debounced = (func, delay) => {
        let timer;
        return function(){
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(context, args), delay);
        }
    }

    let debouncedCheckout = debounced( function() {
        onCheckout(currentCartItem)
    }, 500)

    /* CHECKOUT EVENT HANDLER START */
    function onCheckout(items){

        var checkoutJson;

        /* PUSH EVENT START */

        var totalPrice = 0;
        items.forEach(function(item){
            totalPrice += item.price;
        });

        var eventName="Checkout";
        if(__wzrk_webhook_enabled !== "undefined" && __wzrk_webhook_enabled !== "" && __wzrk_webhook_enabled == "true"){
                eventName="Checkout SDK";
        }

        checkoutJson = {
            'Total Items': items.length,
            'Currency': cleverApp.config.currency,
            'Total Price': parseFloat((parseInt(totalPrice) / 100).toFixed(2))
        };

        if (cleverApp.customer) {
            pushProfile(getUserProps(cleverApp.customer))
        }
        return pushEvent(eventName, checkoutJson);
        /* PUSH EVENT END */
    };
    /* CHECKOUT EVENT HANDLER END */

    /* SCRIPT INIT START */
    (function(){

        var customerRegisterToken;

        /* CUSTOMER REGISTER EVENT HANDLING START */
        customerRegisterToken = getCookie(cookieVariable.customerRegisterToken);
        if(customerRegisterToken != null && cleverApp.customer)
            onCustomerRegister();
        /* CUSTOMER REGISTER EVENT HANDLING END */

        /* CUSTOMER LOGIN EVENT HANDLING START */
        isCustomerLogged = parseBoolean(getCookie(cookieVariable.customerLoginToken));
        if(cleverApp.customer && isCustomerLogged !== true)
            onCustomerLogin();
        /* CUSTOMER LOGIN EVENT HANDLING END */

        /* CUSTOMER LOGOUT EVENT HANDLING START */
        if(isCustomerLogged === true && !cleverApp.customer)
            onCustomerLogout();
        /* CUSTOMER LOGOUT EVENT HANDLING END */

        /* SEARCH PRODUCT EVENT HANDLING START */
        if(cleverApp.searchProduct)
            onSearchProduct();
        /* SEARCH PRODUCT EVENT HANDLING END */

        /* CATEGORY VIEW EVENT HANDLING START */
        if(cleverApp && cleverApp.collection)
            onCategoryView();
        /* CATEGORY VIEW EVENT HANDLING END */

        /* PRODUCT VIEW EVENT HANDLING START */
        if(cleverApp && cleverApp.product)
            onProductView();
        /* PRODUCT VIEW EVENT HANDLING END */

        let accountId;
        if (typeof clevertap !== "undefined" && typeof clevertap.account !== "undefined" && clevertap.account.length > 0) {
            accountId = clevertap.account[0].id
        }

        handleCharged(accountId);


    })(onPageBrowse(), onUpdateCart(), setTimeout(buyItNowInit, 1500), eventHandler());
})(window, window.document, window.clevertapApp);
