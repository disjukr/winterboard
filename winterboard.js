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
    var viewport = $('<iframe sandbox="allow-scripts allow-same-origin" frameborder="0">');
    var viewportDocument;
    viewport.ready(function () {
      viewportDocument = viewport.contents()[0];
      var viewportBody = viewportDocument.body;
      $(viewportBody).append(croquisDOMElement);
      $(viewportBody).css('margin', '0');
      $(viewportBody).css('overflow', 'hidden');
      $(viewportBody).css('background-color', '#333');
      $(viewportDocument).on('mousedown', down);
    });
    $(container).append(viewport);
    $(viewport).css('width', '800px');
    $(viewport).css('height', '600px');
    function down(e) {
      croquis.down(e.clientX, e.clientY);
      $(viewportDocument).on('mousemove', move)
                         .on('mouseup', up);
    }
    function move(e) {
      croquis.move(e.clientX, e.clientY);
    }
    function up(e) {
      croquis.up(e.clientX, e.clientY);
      $(viewportDocument).off('mousemove', move)
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
