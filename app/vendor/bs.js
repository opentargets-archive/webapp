// This is a collection of fixes for Bootstrap 3.3.7
// It probably shouldn't live in ./vendor but it needs to be imported in a specific order so it will be here for the time being.

// More hacks.
// It seems that Bootstrap v3.3.7 introduced an error when calling 'destroy' on popover/tooltip
// so here we override the destroy function as detailed here https://github.com/twbs/bootstrap/issues/21830 
// This hack should proably live elsewhere in the app though.   
jQuery.fn.popover.Constructor.prototype.destroy = function () {
    var that = this;
    clearTimeout(this.timeout);
    this.hide(function () {
        if (that.$element === null) {
            return;
        }
        that.$element.off('.' + that.type).removeData('bs.' + that.type);
        if (that.$tip) {
            that.$tip.detach();
        }
        that.$tip = null;
        that.$arrow = null;
        that.$viewport = null;
        that.$element = null;
    });
};
