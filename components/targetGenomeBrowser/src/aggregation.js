function aggregation (arr, xScale) {
    var lim = 5;
    arr.map (function (d) {
        d.label = "";
        d._px = xScale(d.pos);
    });
    arr.sort (function (a, b) {
        return a.pos - b.pos;
    });
    var groups = [];
    var currGroup = [arr[0]];
    var curr = arr[0];
    for (var i=1; i<arr.length; i++) {
        if ((arr[i]._px - curr._px) < lim) {
            currGroup.push(arr[i]);
            curr = arr[i];
        } else {
            groups.push (currGroup);
            currGroup = [arr[i]];
            curr = arr[i];
        }
    }
    groups.push (currGroup);
    for (var g=0; g<groups.length; g++) {
        if (groups[g].length > 1) {
            var med = groups[g][~~(groups[g].length / 2)];
            med.label = groups[g].length;
        }
    }
}

module.exports = exports = aggregation;
