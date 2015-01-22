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
	    it('returns a callback when working as a getter', function () {
		assert.isFunction(view.key());
	    });
	    it('returns the bubbles object on setter', function () {
		var resp = view.key(function () {});
		assert.equal(resp, view);
	    });
	    it('sets new keys', function () {
		var f = function () { return a + b };
		view.key(f);
		var retf = view.key();
		assert.equal(f, retf);
		assert.notEqual(function () {return b + c}, retf);
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
		var data = [{q:1},{q:2}];
		var key = function (o) {
		    return o.q;
		};
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
    });
    describe('Render', function () {
	var data;
	var view;
	beforeEach (function () {
	    data = [{q:1},{q:2}];
	    view = bubblesView()
		.key (function (o) {
		    return o.q;
		})
		.data(data);
	});
	it ('Renders', function () {
	    view (fixture.el);
	});
	it ('Creates the correct number of circles', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("circle").length, dataLen);
	});
	it ('Creates the correct number of titles', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("title").length, dataLen);
	});
	it ('Creates the correct number of texts', function () {
	    var dataLen = data.length;
	    view (fixture.el);
	    assert.equal(fixture.el.querySelectorAll("text").length, dataLen);
	})
    });
});

