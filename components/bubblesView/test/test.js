describe ('bubbleView', function () {
    beforeEach (function () {
	this.result = fixture.load('html_fixture');
    });
    afterEach (function () {
	fixture.cleanup();
    });
    it ('Exists', function () {
	assert.isDefined(bubblesView);
	assert.isFunction(bubblesView);
    });
    it('Returns a callback', function () {
	var view = bubblesView();
	assert.isDefined(view);
	assert.isFunction(view);
    });
    describe ("API", function () {
	var view;
	beforeEach (function () {
	    view = bubblesView();
	});
	
	describe ('node', function () {
	    it ('Has the node property', function () {
		assert.isDefined(bubblesView.node);
		assert.isFunction(bubblesView.node);
	    });
	});

	describe ("key", function () {
	    it('has the "key" method', function () {
		assert.isDefined(view.key);
		assert.isFunction(view.key);
	    });
	    it('works as a getter on empty arguments', function () {
		assert.isDefined(view.key());
	    });
	    it('returns a string when working as a getter', function () {
		assert.isString(view.key());
	    });
	    it('returns the bubbles object on setter', function () {
		var resp = view.key("name");
		assert.equal(resp, view);
	    });
	    it('sets new property name', function () {
		var n = "size";
		view.key(n);
		var retf = view.key();
		assert.equal(n, retf);
		assert.notEqual("value", retf);
	    });
	});

	describe ("value", function () {
	    it('has the "value" method', function () {
		assert.isDefined(view.value);
		assert.isFunction(view.value);
	    });
	    it('works as a getter on empty arguments', function () {
		assert.isDefined(view.value());
	    });
	    it('returns a string when working as a getter', function () {
		assert.isString(view.value());
	    });
	    it('returns the bubbles object on setter', function () {
		var resp = view.value("values");
		assert.equal(resp, view);
	    });
	    it('sets new property value', function () {
		var n = "vals";
		view.value(n);
		var retf = view.value();
		assert.equal(n, retf);
		assert.notEqual("value", retf);
	    });
	});

	describe ("focus", function () {
	    it ('has the focus method', function () {
		assert.isDefined(view.focus);
	    });
	    it ('does not return anything as a getter without rendering', function () {
		var focusNode = view.focus();
		assert.isUndefined(focusNode);
	    });
	});
	describe ("onclick", function () {
	    it('has the "onclick" method', function () {
		assert.isDefined(view.onclick);
	    });
	    it('returns the current "onclick" callback on getter', function () {
		var cbak = view.onclick();
		assert.isDefined(cbak);
		assert.isFunction(cbak);
	    });
	    it('works as a setter when a new callbck is passed', function () {
		var cbak = function () {
		    console.log("onclick event fired");
		};
		view.onclick(cbak);
		var newcbak = view.onclick();
		assert.equal(cbak, newcbak);
	    });
	    it('returns the bubble object on setter', function () {
		var ret = view.onclick(function () {});
		assert.isDefined(ret);
		assert.equal(ret, view);
	    });
	});
	describe ("data", function () {
	    it('has the data method', function () {
		assert.isDefined(view.data);
	    });
	    it('returns the bubble object on setter', function () {
		var ret = view.data([]);
		assert.isDefined(ret);
		assert.equal(ret, view);
	    });
	    it('works as a setter when arguments are given', function () {
		var d = [];
		view.data(d);
		assert.equal(view.data(), d);
	    });
	    it('Accepts new data', function () {
		var data = {
		    "name" : "Root",
		    "value" : 3,
		    "children" : [
			{
			    "name":"1",
			    "value":1
			},
			{
			    "name":"2",
			    "value":2
			}
		    ]
		};
		var key = "value";
		view
		    .key(key)
		    .data(data);
		var d = view.data();
		assert.equal(d, data);
		newd = [];
		assert.notEqual(newd, d);
	    });
	});
	describe ("diameter", function () {
	    it('has the diameter method', function () {
		assert.isDefined(view.diameter);
		assert.isFunction(view.diameter);
	    });
	    it('works as a getter on empty args', function () {
		assert.isDefined(view.diameter());
	    });
	    it('works as a setter when args are given', function () {
		view.diameter(800);
		assert.equal(view.diameter(), 800);
	    });
	});
	// describe ("flat", function () {
	//     it ('has the flat method', function () {
	// 	assert.isDefined (view.flat);
	// 	assert.isFunction (view.flat);
	//     });
	//     it ("works as a getter on empty args", function () {
	// 	assert.isDefined (view.flat());
	//     });
	//     it ("defaults to true", function () {
	// 	assert.equal (view.flat(), true);
	//     });
	//     it ("works as a setter when args are given", function () {
	// 	view.flat(false);
	// 	assert.equal(view.flat(), false);
	//     });
	// });

    });

    describe('Render', function () {
	var data;
	var view;
	beforeEach (function () {
	    data = { "name": "Root",
		     "value": 3,
		     "children": [
			 {"name":"first", "value":1},
			 {"name":"second", "value":2}
		     ]
		   };
	    view = bubblesView()
		.value ("value")
		.data(bubblesView.node(data));
	});
	it ('Renders', function () {
	    view (fixture.el);
	});
	// it ('Creates the correct number of flat circles', function () {
	//     var dataLen = data.children.length;
	//     view (fixture.el);
	//     assert.equal(fixture.el.querySelectorAll("circle").length, dataLen);
	// });
	// it ('Creates the correct number of flat titles', function () {
	//     var dataLen = data.children.length;
	//     view (fixture.el);
	//     assert.equal(fixture.el.querySelectorAll("title").length, dataLen);
	// });
	// it ('Creates the correct number of flat texts', function () {
	//     var dataLen = data.children.length;
	//     view (fixture.el);
	//     assert.equal(fixture.el.querySelectorAll("text").length, dataLen);
	// });
	it ('Creates the correct number of non flat circles', function () {
	    var dataLen = data.children.length;
	    // view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("circle").length, dataLen+1);
	});
	it ('Creates then correct number of non flat titles', function () {
	    var dataLen = data.children.length;
	    // view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("title").length, dataLen+1);
	});
	it ('Creates the correct number of non flat texts', function () {
	    var dataLen = data.children.length;
	    // view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("text").length, dataLen+1);
	});
	it ('Sets the diameter', function () {
	    var diameter = 800;
	    view.diameter (diameter);
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("svg")[0].getAttribute("height"), diameter);
	    assert.equal(fixture.el.querySelectorAll("svg")[0].getAttribute("width"), diameter);
	});
	it ('Sets the focus node', function () {
	    view (fixture.el);
	    assert.isDefined (view.focus());
	    assert.propertyVal(view.focus().data(), "name", "Root"); 
	});
    });
});

