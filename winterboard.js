;(function ($) {
  $.fn.winterboard = function (options) {
    return this.each(function () {
      var board = $(this).data('winterboard');
      if (board)
        $(this).empty();
      board = new WinterBoard(this, options);
      $(this).data('winterboard', board);
    });
  };
  $.winterboard = function (options) {
    return $(document.body).winterboard(options).data('winterboard');
  }
  var WinterBoard = function (container, options) {
    var croquis = new Croquis();
    var croquisDOMElement = croquis.getDOMElement();
    $(container).append(croquisDOMElement);
    $(croquisDOMElement).bind('mousedown', function (e) {
      croquis.down(e.clientX, e.clientY);
      $(document).bind('mousemove', function (e) {
        croquis.move(e.clientX, e.clientY);
      });
      $(document).bind('mouseup', function (e) {
        croquis.up(e.clientX, e.clientY);
        $(document).unbind('mousemove');
        $(document).unbind('mouseup');
      });
    });
    croquis.setCanvasSize(400, 300);
    croquis.addLayer();
    croquis.fillLayer('#fff');
  };
}(jQuery));
