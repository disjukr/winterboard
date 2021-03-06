;(function ($) {
  $.fn.winterboard = function (option) {
    return this.each(function () {
      var board = $(this).data('winterboard');
      if (board)
        board.destroy();
      board = new Winterboard(this, option);
      $(this).data('winterboard', board);
    });
  };
  $.winterboard = function (option) {
    return $(document.body).winterboard(option).data('winterboard');
  };
  var Winterboard = function (container, option) {
    option = $.extend(true, {
      width: 800,
      height: 600,
      viewport: {
        canvas: {
          width: 400,
          height: 300
        },
        background: '#333'
      }
    }, option);
    var self = this;
    var croquis = self.croquis = new Croquis();
    ;(function () { // manipulate croquis
      croquis.lockHistory();
      croquis.setCanvasSize(option.viewport.canvas.width, option.viewport.canvas.height);
      croquis.addLayer();
      croquis.fillLayer('#fff');
      croquis.addLayer();
      croquis.selectLayer(1);
      croquis.unlockHistory();
      croquis.setToolStabilizeLevel(10);
      croquis.setToolStabilizeWeight(0.5);
    })();
    var viewport = self.viewport = makeViewport(croquis, option.viewport);
    var stage = $('<div>');
    stage.css('position', 'relative')
         .css('width', option.width)
         .css('height', option.height);
    stage.append(viewport);
    $(container).append(stage);
    ui(stage, croquis, viewport, option);
    self.destroy = function () {
      $(container).removeData('winterboard').empty();
    };
  };
  function makeScriptFrame(onload) {
    var frame = $('<iframe src="about:blank" sandbox="allow-scripts allow-same-origin" frameborder="0">');
    frame.load(onload.bind(this, frame));
    return frame;
  }
  function makeViewport(croquis, option) {
    return makeScriptFrame(function (viewport) {
      var viewportDocument = viewport.contents()[0];
      var croquisElement = viewport.croquisElement = croquis.getDOMElement();
      var brushPointer = $('<svg xmlns="http://www.w3.org/2000/svg">');
      var currentPointer;
      var blackPointer;
      var whitePointer;
      var canvasX;
      var canvasY;
      croquisElement.getTransform = function () {
        var transform = $(croquisElement).css('transform');
        var scale = 1;
        var rotation = 0;
        if (/matrix\(/.test(transform)) {
          transform = transform.substr('matrix('.length).split(','); // parse css transform(matrix)
          var x = parseFloat(transform[0]); // the vector(1, 0) transformed by matrix
          var y = parseFloat(transform[1]);
          scale = Math.sqrt(x * x + y * y);
          rotation = Math.atan2(y, x) * 180 / Math.PI;
        }
        return {scale: scale, rotation: rotation};
      };
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
          var a = parseFloat(transform[0]); // get matrix elements
          var b = parseFloat(transform[1]);
          var c = parseFloat(transform[2]);
          var d = parseFloat(transform[3]);
          var det = 1. / (a * d - b * c); // inverse determinant
          return {
            x: (d * det) * x + (-c * det) * y + canvasCenterX,
            y: (-b * det) * x + (a * det) * y + canvasCenterY
          }
        }
        return {x: x, y: y};
      };
      viewport.transformCanvas = function (scale, rotation, relative) {
        scale = parseFloat(scale);
        rotation = parseFloat(rotation);
        var transform = 'scale(' + scale + ') rotate(' + rotation + 'deg)';
        if (relative) {
          var original = $(croquisElement).css('transform');
          transform = (original != 'none') ? original + transform : transform;
        }
        $(croquisElement).css('transform', transform);
        brushPointer.css('transform', transform);
        return croquisElement;
      };
      viewport.translateCanvas = function (x, y) {
        canvasX = x;
        canvasY = y;
        var canvasCenterX = croquis.getCanvasWidth() >> 1;
        var canvasCenterY = croquis.getCanvasHeight() >> 1;
        var viewportCenterX = viewportDocument.documentElement.clientWidth >> 1;
        var viewportCenterY = viewportDocument.documentElement.clientHeight >> 1;
        $(croquisElement).css('margin-left', (viewportCenterX - canvasCenterX) + x)
                         .css('margin-top', (viewportCenterY - canvasCenterY) + y);
        return croquisElement;
      };
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
      function showBrushPointer() {
        brushPointer.css('visibility', 'visible');
      }
      function hideBrushPointer() {
        brushPointer.css('visibility', 'hidden');
      }
      function moveBrushPointer(e) {
        var svg = brushPointer.get(0);
        var centerX = svg.getAttribute('width') >> 1;
        var centerY = svg.getAttribute('height') >> 1;
        brushPointer.css('left', e.clientX - centerX).css('top', e.clientY - centerY);
        var relativeCoord = croquisElement.relativeCoord(e.clientX, e.clientY);
        var eyeDrop = croquis.eyeDrop(relativeCoord.x, relativeCoord.y);
        if (eyeDrop) {
          var gray = (eyeDrop.r * 0.2989 + eyeDrop.g * 0.5870 + eyeDrop.b * 0.1140) | 0; // grayscale
          var targetPointer = (gray > 0x80) ? blackPointer : whitePointer;
          if (currentPointer != targetPointer) {
            brushPointer.get(0).replaceChild(targetPointer, currentPointer);
            currentPointer = targetPointer;
          }
        }
      }
      function updateBrushPointer() {
        var tool = croquis.getTool();
        brushPointer.empty();
        if (!tool || !tool.getImage || !tool.getSize || !tool.getAngle) {
          currentPointer = blackPointer = whitePointer = null;
          return;
        }
        var image = tool.getImage();
        var size = tool.getSize();
        var angle = tool.getAngle();
        var threshold = image == null ? 0xff : 0x30;
        var width;
        var height;
        function createPointerImage(color, shadow) {
          var image = Croquis.createBrushPointer(image, size, angle, threshold, true, color, shadow);
          width = image.width;
          height = image.height;
          var dataURL = image.toDataURL('image/png');
          var pointerImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          pointerImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataURL);
          pointerImage.setAttribute('width', width);
          pointerImage.setAttribute('height', height);
          return pointerImage;
        }
        blackPointer = createPointerImage('#000', '#fff');
        whitePointer = createPointerImage('#fff', '#000');
        currentPointer = blackPointer;
        var svg = brushPointer.get(0);
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.appendChild(currentPointer);
      }
      viewport.updateBrushPointer = updateBrushPointer; // manual update
      croquis.addEventListener('ontool', updateBrushPointer);
      updateBrushPointer();
      viewport.css('position', 'absolute')
              .css('width', '100%')
              .css('height', '100%');
      brushPointer.css('position', 'absolute')
                  .css('pointer-events', 'none')
                  .css('visibility', 'hidden')
                  .css('z-index', 999);
      $(viewportDocument.body).append(croquisElement, brushPointer)
                              .css('margin', '0')
                              .css('overflow', 'hidden')
                              .css('background-color', option.background);
      $(viewportDocument.documentElement).css('cursor', 'crosshair');
      $(viewportDocument).on('mousedown', down)
                         .on('mouseenter', showBrushPointer)
                         .on('mouseleave', hideBrushPointer)
                         .on('mousemove', moveBrushPointer);
      var viewportWindow = viewport.get(0).contentWindow;
      viewportWindow.onscroll = function () { // for ie
        viewportWindow.scrollTo(0, 0);
      };
      viewportWindow.onresize = function () {
        viewport.translateCanvas(canvasX, canvasY);
      };
      viewport.translateCanvas(0, 0);
    });
  };
  function ui(stage, croquis, viewport, option) {
    var div = $('<div style="position: absolute;">');
    var color = $('<input type="color">');
    color.change(function () {
      var tool = croquis.getTool();
      if (tool.setColor) {
        tool.setColor(color[0].value);
      }
    });
    div.append(color);
    stage.append(div);
  }
}(jQuery));
