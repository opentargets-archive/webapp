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
		var resp = view.key(function () {});
		assert.equal(resp, view);
	    });
	    it('sets new keys', function () {
		var k = "size";
		view.key(k);
		var retf = view.key();
		assert.equal(k, retf);
		assert.notEqual("value", retf);
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
		var data = [
		    {"name":"1", "value":1},
		    {"name":"2", "value":2}
		];
		var key = "value";
		view.key(key)
		    .data(data);
		var d = view.data();
		assert.equal(d, data);
		newd = [];
		assert.notEqual(newd, d);
	    });
	});
	describe ("width", function () {
	    it('has the width method', function () {
		assert.isDefined(view.width);
		assert.isFunction(view.width);
	    });
	    it('works as a getter on empty args', function () {
		assert.isDefined(view.width());
	    });
	    it('works as a setter when args are given', function () {
		view.width(300);
		assert.equal(view.width(), 300);
	    });
	});
	describe ("height", function () {
	    it('has the height method', function () {
		assert.isDefined(view.height);
		assert.isFunction(view.height);
	    });
	    it('works as a getter on empty args', function () {
		assert.isDefined(view.height());
	    });
	    it('works as a setter when args are given', function () {
		view.height(300);
		assert.equal(view.height(), 300);
	    });
	});
	describe ("flat", function () {
	    it ('has the flat method', function () {
		assert.isDefined (view.flat);
		assert.isFunction (view.flat);
	    });
	    it ("works as a getter on empty args", function () {
		assert.isDefined (view.flat());
	    });
	    it ("defaults to true", function () {
		assert.equal (view.flat(), true);
	    });
	    it ("works as a setter when args are given", function () {
		view.flat(false);
		assert.equal(view.flat(), false);
	    });
	});

    });
    describe('Render', function () {
	var data;
	var view;
	beforeEach (function () {
	    data = [
		{"name":"first", "value":1},
		{"name":"second", "value":2}
	    ];
	    view = bubblesView()
		.key ("value")
		.data(data);
	});
	it ('Renders', function () {
	    view (fixture.el);
	});
	it ('Creates the correct number of flat circles', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("circle").length, dataLen);
	});
	it ('Creates the correct number of flat titles', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("title").length, dataLen);
	});
	it ('Creates the correct number of flat texts', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("text").length, dataLen);
	});
	it ('Creates the correct number of non flat circles', function () {
	    var dataLen = data.length;
	    view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("circle").length, dataLen+1);
	});
	it ('Creates then correct number of non flat titles', function () {
	    var dataLen = data.length;
	    view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("title").length, dataLen+1);
	});
	it ('Creates the correct number of non flat texts', function () {
	    var dataLen = data.length;
	    view.flat (false);
	    view (fixture.el);
	    assert.equal (fixture.el.querySelectorAll("text").length, dataLen+1);
	});
	it ('Sets the height', function () {
	    var height = 600;
	    view.height (height);
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("svg")[0].getAttribute("height"), height);
	});
	it ('Sets the width', function () {
	    var width = 600;
	    view.width (width);
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("svg")[0].getAttribute("width"), width);
	});
    });
});

