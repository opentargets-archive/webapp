var Page = require("./Page.js");

var HomePage = function () {
    Page.call(this);
    browser.get("/");
};

HomePage.prototype = Object.create(Page.prototype, {
    logoImage : {
        get : function () {
            return element(by.css("img[src=imgs/CTTV_logo_webheader.png]"));
        }
    }
});

module.exports = HomePage;
