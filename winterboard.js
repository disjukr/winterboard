;(function ($) {
  $.fn.winterboard = function (options) {
    return this.each(function () {
      var board = $(this).data('winterboard');
      if (board)
        board.destroy();
      board = new WinterBoard(this, options);
      $(this).data('winterboard', board);
    });
  };
  $.winterboard = function (options) {
    return $(document.body).winterboard(options).data('winterboard');
  };
  var WinterBoard = function (container, options) {
    var self = this;
    var croquis = new Croquis();
    var croquisDOMElement = croquis.getDOMElement();
    $(container).append(croquisDOMElement);
    $(croquisDOMElement).on('mousedown', down);
    function down(e) {
      croquis.down(e.clientX, e.clientY);
      $(document).on('mousemove', move)
                 .on('mouseup', up);
    }
    function move(e) {
      croquis.move(e.clientX, e.clientY);
    }
    function up(e) {
      croquis.up(e.clientX, e.clientY);
      $(document).off('mousemove', move)
                 .off('mouseup', up);
    }
    croquis.setCanvasSize(400, 300);
    croquis.addLayer();
    croquis.fillLayer('#fff');
    self.destroy = function () {
      $(container).removeData('winterboard');
      $(container).empty();
    };
  };
}(jQuery));
