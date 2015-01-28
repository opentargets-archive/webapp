var data = {
    "name": "Root",
    "value": 4,
    "children": [
	{"name": "first", "value":1},
	{"name": "second", "value":3}
    ]
};

var data1 = {
    "name": "Root",
    "value": 20,
    "children" : [
	{
	    "name": "first",
	    "value": 12,
	    "children" : [
		{
		    "name": "subFirst1",
		    "value": 3,
		    "children": [
			{
			    "name": "subsubFirst1",
			    "value": 2
			},
			{
			    "name": "subsubFirst2",
			    "value": 1
			}
		    ]
		},
		{
		    "name": "subFirst2",
		    "value": 9
		}
	    ]
	},
	{
	    "name": "second",
	    "value": 8,
	    "children" : [
		{
		    "name": "subSecond1",
		    "value": 5
		},
		{
		    "name": "subSecond2",
		    "value": 2
		},
		{
		    "name": "subSecond3",
		    "value": 1
		}
	    ]
	}
    ]
};
