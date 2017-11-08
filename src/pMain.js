var colors = [
    new Color(getRandomColor(0.5)),
    new Color(getRandomColor(0.5)),
    new Color(getRandomColor(0.5)),
    new Color(getRandomColor(0.5))
];

for (var i = 0; i < colors.length; ++i) {
    var textItem = new PointText({
        content: 'Label' + i + ':',
        point: new Point(20, 30 + 20 * i),
        fillColor: 'black',
    });
    var pa = new Path.Rectangle({
        center: [70, 25 + 20 * i],
        size: [10, 10],
        fillColor: colors[i] + new Color(0, 0, 0, 0.5)
    });
}

var currentPath;
var currentColor = colors[0];

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
};

function onMouseDown(event) {
    var hitResult = project.hitTest(event.point, hitOptions);
    if (!hitResult) {
        if (currentPath) {
            currentPath.selected = false;
        }

        // new Color(currentColor) - new Color(0,0,0,0.5);
        currentPath = new Path({
            segments: [event.point],
            strokeColor: currentColor + new Color(0, 0, 0, 0.2),
            strokeWidth: 3,
            fullySelected: true
        });

        currentPath.selected = false;
        currentPath.selectable = true;

        return;
    } else if (hitResult.item.selectable) {
        if (currentPath) {
            currentPath.selected = false;
        }
        currentPath = hitResult.item;
        currentPath.selected = true;
    } else {
        console.log(hitResult.item);

        if (currentPath) {
            currentPath.selected = false;
        }
        currentPath = null;

        currentColor = hitResult.item.fillColor - new Color(0, 0, 0, 0.5);
    }
}

// While the user drags the mouse, points are added to the path
// at the position of the mouse:
function onMouseDrag(event) {
    if (currentPath) {
        if (!currentPath.selected) {
            currentPath.add(event.point);
        } else {
            currentPath.position += event.delta;
        }
    }
}

// When the mouse is released, we simplify the path:
function onMouseUp(event) {
    // var segmentCount = path.segments.length;

    // // When the mouse is released, simplify it:
    // path.simplify(10);

    // // Select the path, so we can see its segments:
    // // path.fullySelected = true;
    if (currentPath) {
        if (!currentPath.selected) {
            currentPath.closed = true;
            currentPath.selected = true;
            currentPath.fillColor = currentColor;

            if (currentPath.segments.length == 1) {
                currentPath.remove();
            }
        }
    }


    // var newSegmentCount = path.segments.length;
    // var difference = segmentCount - newSegmentCount;
    // var percentage = 100 - Math.round(newSegmentCount / segmentCount * 100);
    // textItem.content = difference + ' of the ' + segmentCount + ' segments were removed. Saving ' + percentage + '%';

}

$(document).keydown(function(e) {
    // var offset = $drag_drop.offset();
    if (currentPath && currentPath.selected) {
        switch (e.which) {
            case 37: // left
                currentPath.position += new Point(-5, 0);
                break;
            case 38: // up
                currentPath.position += new Point(0, -5);
                break;

            case 39: // right
                currentPath.position += new Point(5, 0);
                break;

            case 40: // down
                currentPath.position += new Point(0, 5);
                break;
            case 8: // macOS
            case 46: // Windows
                if (currentPath) {
                    currentPath.remove();
                }
                break;

            default:
                return; // exit this handler for other keys
        }
    }
    // e.preventDefault(); // prevent the default action (scroll / move caret)
});

$('#remove-button').click(function() {
    if (currentPath) {
        currentPath.remove();
    }
});

$('#export-button').click(function() {
    console.log(project._children[0]._children);
    project._children[0]._children.forEach(function(el, i) {
        if (el.constructor == Path && el.selectable) {
            el.fillColor.alpha = 1;
            el.strokeColor.alpha = 1;
        } else {
            el.visible = false;
        }
    });

    var svg = project.exportSVG({ asString: true });

    downloadDataUri({
        data: 'data:image/svg+xml;base64,' + btoa(svg),
        filename: 'export.svg'
    });
});

$('#save-button').click(function() {
    unselect();

    var jsonString = addSelectable(project.exportJSON());

    downloadDataUri({
        data: 'data:application/json,' + encodeURIComponent(jsonString),
        filename: 'save.json'
    });
})

$('#selectedFile')[0].onchange = function(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event) {
    //alert(event.target.result);
    // console.log(event.target.result);
    var obj = JSON.parse(event.target.result);

    getFirstLayerChildren(obj).forEach(function(el, i) {
        if (el[1].selectable) {
            project._children[0]._children[i].selectable = el[1].selectable;
        }
    });
}

function downloadDataUri(options) {
    if (!options.url)
        options.url = "https://download-data-uri.appspot.com/";
    $('<form method="post" action="' + options.url +
        '" style="display:none"><input type="hidden" name="filename" value="' +
        options.filename + '"/><input type="hidden" name="data" value="' +
        options.data + '"/></form>').appendTo('body').submit().remove();
}

function getFirstLayerChildren(obj) {
    return obj[0][1].children;
}

function unselect() {
    project._children[0]._children.forEach(function(el, i) {
        if (el.constructor == Path && el.selectable) {
            el.selected = false;
        }
    });
}

function addSelectable(jsonString) {
    var jsonString = project.exportJSON();
    var jsonObject = JSON.parse(jsonString);
    jsonObject[0][1].children.forEach(function(el) {
        if (el[0] == "Path") {
            el[1].selectable = true;
        }
    });
    return JSON.stringify(jsonObject);
}