var path;

// var textItem = new PointText({
//     content: 'Click and drag to draw a line.',
//     point: new Point(20, 30),
//     fillColor: 'black',
// });

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

function onMouseDown(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {

        if (path) {
            path.selected = false;
        }

        path = new Path({
            segments: [event.point],
            strokeColor: 'red',
            strokeWidth: 5,
            fullySelected: true
        });

        path.selected = false;


        return;
    } else {
        path.selected = false;
        path = hitResult.item;
        path.selected = true;
    }


}

// While the user drags the mouse, points are added to the path
// at the position of the mouse:
function onMouseDrag(event) {
    if (!path.selected) {
        path.add(event.point);
    } else {
        console.log(event.delta);
        path.position += event.delta;
    }
}

// When the mouse is released, we simplify the path:
function onMouseUp(event) {
    // var segmentCount = path.segments.length;

    // // When the mouse is released, simplify it:
    // path.simplify(10);

    // // Select the path, so we can see its segments:
    // // path.fullySelected = true;
    if (!path.selected) {
        path.closed = true;
        path.selected = true;
        path.fillColor = new Color(1, 0, 0, 0.5);

        if (path.segments.length == 1) {
            path.remove();
        }
    }


    // var newSegmentCount = path.segments.length;
    // var difference = segmentCount - newSegmentCount;
    // var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    // textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';

}

$(document).keydown(function(e) {
    // var offset = $drag_drop.offset();
    if (path && path.selected) {
        switch (e.which) {
            case 37: // left
                path.position += new Point(-5, 0);
                break;
            case 38: // up
                path.position += new Point(0, -5);
                break;

            case 39: // right
                path.position += new Point(5, 0);
                break;

            case 40: // down
                path.position += new Point(0, 5);
                break;
            case 46:
                if (path) {
                    path.remove();
                }
                break;

            default:
                return; // exit this handler for other keys
        }
    }

    e.preventDefault(); // prevent the default action (scroll / move caret)
});

function downloadDataUri(options) {
    if (!options.url)
        options.url = "http://download-data-uri.appspot.com/";
    $('<form method="post" action="' + options.url +
        '" style="display:none"><input type="hidden" name="filename" value="' +
        options.filename + '"/><input type="hidden" name="data" value="' +
        options.data + '"/></form>').appendTo('body').submit().remove();
}

$('#export-button').click(function() {
    var svg = project.exportSVG({ asString: true });
    downloadDataUri({
        data: 'data:image/svg+xml;base64,' + btoa(svg),
        filename: 'export.svg'
    });
});

$('#remove-button').click(function() {
    if (path) {
        path.remove();
    }
});