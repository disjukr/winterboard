;(function ($) {
  $.fn.winterboard = function (options) {
    return this.each(function () {
      var board = $(this).data('winterboard');
      if (board)
        board.destroy();
      board = new Winterboard(this, options);
      $(this).data('winterboard', board);
    });
  };
  $.winterboard = function (options) {
    return $(document.body).winterboard(options).data('winterboard');
  };
  var Winterboard = function (container, options) {
    options = $.extend(true, {
      viewport: {
        width: 800,
        height: 600,
        canvas: {
          width: 400,
          height: 300
        },
        background: '#333'
      },
      ui: {}
    }, options);
    var self = this;
    var croquis = self.croquis = new Croquis();
    ;(function () { // manipulate croquis
      croquis.lockHistory();
      croquis.setCanvasSize(options.viewport.canvas.width, options.viewport.canvas.height);
      croquis.addLayer();
      croquis.fillLayer('#fff');
      croquis.addLayer();
      croquis.selectLayer(1);
      croquis.unlockHistory();
      croquis.setToolStabilizeLevel(10);
      croquis.setToolStabilizeWeight(0.5);
    })();
    var viewport = self.viewport = makeViewport(croquis, options.viewport);
    var ui = self.ui = makeUI(croquis, viewport, options.ui);
    var layers = $('<div style="position: relative;">');
    layers.append(viewport, ui);
    $(container).append(layers);
    self.destroy = function () {
      $(container).removeData('winterboard').empty();
    };
  };
  function makeViewport(croquis, options) {
    var viewport = $('<iframe src="about:blank"\
      sandbox="allow-scripts allow-same-origin"\
      frameborder="0" style="position: absolute;">');
    var viewportDocument;
    var croquisElement = viewport.croquisElement = croquis.getDOMElement();
    croquisElement.relativeCoord = function (absoluteX, absoluteY) {
      var marginLeft = parseInt($(croquisElement).css('margin-left'));
      var marginTop = parseInt($(croquisElement).css('margin-top'));
      var transform = $(croquisElement).css('transform');
      var x = absoluteX - marginLeft;
      var y = absoluteY - marginTop;
      if (/matrix\(/.test(transform)) {
        var canvasCenterX = croquis.getCanvasWidth() >> 1;
        var canvasCenterY = croquis.getCanvasHeight() >> 1;
        x -= canvasCenterX;
        y -= canvasCenterY;
        transform = transform.substr('matrix('.length).split(','); // parse css transform(matrix)
        var a = parseFloat(transform[0]);
        var b = parseFloat(transform[1]);
        var c = parseFloat(transform[2]);
        var d = parseFloat(transform[3]);
        var det = 1. / (a * d - b * c); // determinant
        return {
          x: (d * det) * x + (-c * det) * y + canvasCenterX,
          y: (-b * det) * x + (a * det) * y + canvasCenterY
        }
      }
      return {x: x, y: y};
    };
    viewport.transformCanvas = function (scale, rotation) {
      scale = parseFloat(scale);
      rotation = parseFloat(rotation);
      var transform = 'scale(' + scale + ') rotate(' + rotation + 'deg)';
      $(croquisElement).css('transform', transform);
      return croquisElement;
    };
    viewport.translateCanvas = function (x, y) {
      var canvasCenterX = croquis.getCanvasWidth() >> 1;
      var canvasCenterY = croquis.getCanvasHeight() >> 1;
      var viewportCenterX;
      var viewportCenterY;
      if (viewportDocument) {
        viewportCenterX = viewportDocument.documentElement.clientWidth >> 1;
        viewportCenterY = viewportDocument.documentElement.clientHeight >> 1;
      }
      else {
        viewportCenterX = parseInt($(viewport).css('width')) >> 1;
        viewportCenterY = parseInt($(viewport).css('height')) >> 1;
      }
      $(croquisElement).css('margin-left', (viewportCenterX - canvasCenterX) + x)
                       .css('margin-top', (viewportCenterY - canvasCenterY) + y);
      return croquisElement;
    };
    $(viewport).css('width', options.width)
               .css('height', options.height);
    viewport.load(function () {
      viewportDocument = viewport.contents()[0];
      $(viewportDocument.body).append(croquisElement)
                              .css('margin', '0')
                              .css('overflow', 'hidden')
                              .css('background-color', options.background);
      $(viewportDocument).on('mousedown', down);
      var viewportWindow = viewport.get(0).contentWindow;
      viewportWindow.onscroll = function () { // for ie
        viewportWindow.scrollTo(0, 0);
      };
      viewport.translateCanvas(0, 0);
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
  function makeUI(croquis, viewport, options) {
    var ui = $('<div style="position: absolute;">');
    ui.append($('<p style="color: #fff;">UI here</p>'));
    return ui;
  }
}(jQuery));
