module.exports = (function() {
    'use strict';

    // Module dependencies
    var crypto  = require('crypto'),
        request = require('request'),
        nonce   = require('nonce')();

    // Constants
    var version         = '0.0.5',
        PUBLIC_API_URL  = 'https://poloniex.com/public',
        PRIVATE_API_URL = 'https://poloniex.com/tradingApi',
        USER_AGENT      = 'poloniex.js ' + version
        //USER_AGENT    = 'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:26.0) Gecko/20100101 Firefox/26.0'


    // Constructor
    function Poloniex(key, secret){
        // Generate headers signed by this user's key and secret.
        // The secret is encapsulated and never exposed
        this._getPrivateHeaders = function(parameters){
            var paramString, signature;

            if (!key || !secret){
                throw 'Poloniex: Error. API key and secret required';
            }

            // Sort parameters alphabetically and convert to `arg1=foo&arg2=bar`
            paramString = Object.keys(parameters).map(function(param){
                return encodeURIComponent(param) + '=' + encodeURIComponent(parameters[param]);
            }).join('&');

            signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');

            return {
                Key: key,
                Sign: signature
            };
        };
    }

    // Currently, this fails with `Error: CERT_UNTRUSTED`
    // Poloniex.STRICT_SSL can be set to `false` to avoid this. Use with caution.
    // Will be removed in future, once this is resolved.
    Poloniex.STRICT_SSL = true;

    // Helper methods
    function joinCurrencies(currencyA, currencyB){
        return currencyA + '_' + currencyB;
    }

    // Prototype
    Poloniex.prototype = {
        constructor: Poloniex,

        // Make an API request
        _request: function(options, callback){
            if (!('headers' in options)){
                options.headers = {};
            }

            options.headers['User-Agent'] = USER_AGENT;
            options.json = true;
            options.strictSSL = Poloniex.STRICT_SSL;

            request(options, function(err, response, body) {
                callback(err, body);
            });

            return this;
        },

        // Make a public API request
        _public: function(parameters, callback){
            var options = {
                method: 'GET',
                url: PUBLIC_API_URL,
                qs: parameters
            };

            return this._request(options, callback);
        },

        // Make a private API request
        _private: function(parameters, callback){
            var options;

            parameters.nonce = nonce();
            options = {
                method: 'POST',
                url: PRIVATE_API_URL,
                form: parameters,
                headers: this._getPrivateHeaders(parameters)
            };

            return this._request(options, callback);
        },


        /////


        // PUBLIC METHODS

        getTicker: function(callback){
            var parameters = {
                    command: 'returnTicker'
                };

            return this._public(parameters, callback);
        },

        get24hVolume: function(callback){
            var parameters = {
                    command: 'return24hVolume'
                };

            return this._public(parameters, callback);
        },

        getOrderBook: function(currencyA, currencyB, callback){
            var parameters = {
                    command: 'returnOrderBook',
                    currencyPair: joinCurrencies(currencyA, currencyB)
                };

            return this._public(parameters, callback);
        },

        getTradeHistory: function(currencyA, currencyB, callback){
            var parameters = {
                    command: 'returnTradeHistory',
                    currencyPair: joinCurrencies(currencyA, currencyB)
                };

            return this._public(parameters, callback);
        },


        /////


        // PRIVATE METHODS

        myBalances: function(callback){
            var parameters = {
                    command: 'returnBalances'
                };

            return this._private(parameters, callback);
        },

        myOpenOrders: function(currencyA, currencyB, callback){
            var parameters = {
                    command: 'returnOpenOrders',
                    currencyPair: joinCurrencies(currencyA, currencyB)
                };

            return this._private(parameters, callback);
        },

        myTradeHistory: function(currencyA, currencyB, callback){
            var parameters = {
                    command: 'returnTradeHistory',
                    currencyPair: joinCurrencies(currencyA, currencyB)
                };

            return this._private(parameters, callback);
        },

        buy: function(currencyA, currencyB, rate, amount, callback){
            var parameters = {
                    command: 'buy',
                    currencyPair: joinCurrencies(currencyA, currencyB),
                    rate: rate,
                    amount: amount
                };

            return this._private(parameters, callback);
        },

        sell: function(currencyA, currencyB, rate, amount, callback){
            var parameters = {
                    command: 'sell',
                    currencyPair: joinCurrencies(currencyA, currencyB),
                    rate: rate,
                    amount: amount
                };

            return this._private(parameters, callback);
        },

        cancelOrder: function(currencyA, currencyB, orderNumber, callback){
            var parameters = {
                    command: 'cancelOrder',
                    currencyPair: joinCurrencies(currencyA, currencyB),
                    orderNumber: orderNumber
                };

            return this._private(parameters, callback);
        },

        withdraw: function(currency, amount, address, callback){
            var parameters = {
                    command: 'withdraw',
                    currency: currency,
                    amount: amount,
                    address: address
                };

            return this._private(parameters, callback);
        }
    };

    return Poloniex;
})();
