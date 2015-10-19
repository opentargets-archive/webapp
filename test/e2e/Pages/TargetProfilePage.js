var SectionBasedPage = require("./SectionBasedPage.js");

var TargetProfilePage = function () {
    SectionBasedPage.call(this);
    browser.get("/target/ENSG00000157764");
    this.waitForSpinner();
};


TargetProfilePage.prototype = Object.create(SectionBasedPage.prototype, {
    uniprotTabs: {
        get: function () {
            var uniprotBody = this.sectionBody('Uniprot');
            var tabs = uniprotBody.element(by.css('ul.nav-tabs')).all(by.tagName('li'));

            this.waitForVisible(tabs);
            return tabs;
        }
    },

    uniprotGraphicalTab: {
        get: function () {
            var tabs = this.uniprotTabs;
            return tabs.filter(function (elem, index) {
                return elem.getAttribute("heading").then (function (h) {
                    return h === 'Graphical';
                });
            });
        }
    },

    pathwayLinks: {
        get: function () {
            var pathwaysBody = this.sectionBody('Pathways');
            var list = pathwaysBody.element(by.tagName('ul'));
            this.waitForVisible(list);
            return pathwaysBody.all(by.repeater('pathway in pathways'));
        }
    }
});




// Add any partials needed
// Uniprot widget
UniprotWidget = require("./partials/uniprotWidget.js");
TargetProfilePage.prototype.extend (UniprotWidget.prototype);

module.exports = TargetProfilePage;



// var AngularPage = function () {
//     browser.get('http://www.angularjs.org');
// };
//
// AngularPage.prototype = Object.create({}, {
//     todoText: { get: function () { return element(by.model('todoText')); }},
//     addButton: { get: function () { return element(by.css('[value="add"]')); }},
//     yourName: { get: function () { return element(by.model('yourName')); }},
//     greeting: { get: function () { return element(by.binding('yourName')).getText(); }},
//     todoList: { get: function () { return element.all(by.repeater('todo in todos')); }},
//     typeName: { value: function (keys) { return this.yourName.sendKeys(keys); }},
//     todoAt: { value: function (idx) { return this.todoList.get(idx).getText(); }},
//     addTodo: { value: function (todo) {
//         this.todoText.sendKeys(todo);
//         this.addButton.click();
//     }}
// });
//
// module.exports = AngularPage;
