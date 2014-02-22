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
    options = $.extend({
      viewport: {
        width: 800,
        height: 600,
        background: '#333'
      },
      canvas: {
        width: 400,
        height: 300
      }
    }, options);
    var self = this;
    var croquis = new Croquis();
    var viewport = makeViewPort(croquis, options.viewport);
    croquis.lockHistory();
    croquis.setCanvasSize(options.canvas.width, options.canvas.height);
    croquis.addLayer();
    croquis.fillLayer('#fff');
    croquis.addLayer();
    croquis.selectLayer(1);
    croquis.unlockHistory();
    croquis.setToolStabilizeLevel(10);
    croquis.setToolStabilizeWeight(0.5);
    viewport.croquisElement.toCenter();
    $(container).append(viewport);
    self.destroy = function () {
      $(container).removeData('winterboard').empty();
    };
  };
  function makeViewPort(croquis, options) {
    var viewport = $('<iframe sandbox="allow-scripts allow-same-origin" frameborder="0">');
    var viewportDocument;
    var croquisElement = viewport.croquisElement = croquis.getDOMElement();
    croquisElement.relativeCoord = function (absoluteX, absoluteY) {
      var marginLeft = parseInt($(croquisElement).css('margin-left'));
      var marginTop = parseInt($(croquisElement).css('margin-top'));
      return {
        x: absoluteX - marginLeft,
        y: absoluteY - marginTop
      };
    };
    croquisElement.toCenter = function () {
      var canvasCenterX = croquis.getCanvasWidth() >> 1;
      var canvasCenterY = croquis.getCanvasHeight() >> 1;
      var viewportCenterX = parseInt($(viewport).css('width')) >> 1;
      var viewportCenterY = parseInt($(viewport).css('height')) >> 1;
      $(croquisElement).css('margin-left', viewportCenterX - canvasCenterX)
                       .css('margin-top', viewportCenterY - canvasCenterY);
      return croquisElement;
    };
    $(viewport).css('width', options.width)
               .css('height', options.height);
    viewport.ready(function () {
      viewportDocument = viewport.contents()[0];
      var viewportBody = viewportDocument.body;
      $(viewportBody).append(croquisElement)
                     .css('margin', '0')
                     .css('overflow', 'hidden')
                     .css('background-color', options.background);
      $(viewportDocument).on('mousedown', down);
    });
    function down(e) {
      var relativeCoord = croquisElement.relativeCoord(e.clientX, e.clientY);
      croquis.down(relativeCoord.x, relativeCoord.y);
      $(viewportDocument).on('mousemove', move)
                         .on('mouseup', up);
    }
    function move(e) {
      var relativeCoord = croquisElement.relativeCoord(e.clientX, e.clientY);
      croquis.move(relativeCoord.x, relativeCoord.y);
    }
    function up(e) {
      var relativeCoord = croquisElement.relativeCoord(e.clientX, e.clientY);
      croquis.up(relativeCoord.x, relativeCoord.y);
      $(viewportDocument).off('mousemove', move)
                         .off('mouseup', up);
    }
    return viewport;
  };
}(jQuery));
