var Page = require("./Page.js");

var TargetProfilePage = function () {
    Page.call(this);
    browser.get("/target/ENSG00000157764");
    this.waitForSpinner();
};


TargetProfilePage.prototype = Object.create(Page.prototype, {
    pathwaySection: {
        get: function () {
            return element(by.css("div[heading=Pathways]"));
        },
    },
    pathwayPanelLink: {
        get: function () {
            return element(by.css("div[heading=Pathways] .accordion-toggle"));
        }
    },
    pathwayPanelBody: {
        get: function () {
            var elem = element(by.css("div[heading=Pathways] .panel-body"));
            this.waitForVisible(elem);
            return elem;
        }
    },
    pathwayLinks: {
        get: function () {
            return this.pathwayPanelBody.all(by.repeater('pathway in pathways'));
        }
    }
});


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
