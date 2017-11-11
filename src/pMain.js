var background = new Raster('static/img/4.jpg');
background.position = view.center;

var canvas = document.getElementById("mainCanvas");

var LABEL_NUM = 4;
var palettes = [];
var labels = [];

for (var i = 0; i < LABEL_NUM; ++i) {
	var color = new Color(getRandomColor());

	// label
	var textItem = new PointText({
		content: 'Label' + i + ':',
		point: new Point(20, 60 + 20 * i),
		fillColor: 'black',
	});
	labels.push(textItem);

	// palette
	var pa = new Path.Rectangle({
		center: [70, 55 + 20 * i],
		size: [10, 10],
		fillColor: color
	});
	pa.selectable = false;
	palettes.push(pa);
}

var currentPath;
var currentColor = palettes[0].fillColor - new Color(0, 0, 0, 0.5);

var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 5
};

window.setBackground = function(url) {
	background.remove();
	background = new Raster(url);
	background.sendToBack();
}

view.onMouseDown = function(event) {
	console.log("view");

	var hitResult = project.hitTest(event.point, hitOptions);

	if (!hitResult || hitResult.item == background) {
		unselect();
		currentPath = new Path({
			segments: [event.point],
			strokeColor: currentColor + new Color(0, 0, 0, 0.2),
			strokeWidth: 3,
			fullySelected: true
		});
		currentPath.selected = false;
		currentPath.selectable = true;

		currentPath.onMouseDown = onPathMouseDown;
		currentPath.onMouseDrag = onPathMouseDrag;
		return;
	} else if (hitResult.item.selectable) {
		// currentPath = hitResult.item;
	} else {
		currentColor = hitResult.item.fillColor - new Color(0, 0, 0, 0.5);
	}
}

view.onMouseDrag = function(event) {
	// view.translatet([100, 0]);
	if (currentPath) {
		if (!currentPath.selected) {
			currentPath.add(event.point);

		}
	}
}

view.onMouseUp = function(event) {
	if (currentPath) {
		if (!currentPath.selected) {
			currentPath.simplify();
			currentPath.closed = true;
			currentPath.fillColor = new Color(currentColor); // for deep copy
			if (currentPath.segments.length == 1) {
				currentPath.remove();
			}
		}

		select(currentPath);
	}
}

function onPathMouseDown(event) {
	console.log("path");
	select(this);
	// event.stopPropagation();

}

function onPathMouseDrag(event) {
	if (currentPath == this) {
		if (this.selected) {
			this.position += event.delta;
			// event.stopPropagation();
			// event.stop();
			// return false;
		}
	}
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
				unselect();
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


$('#export-button').unbind('click').bind('click', function() {
	unselectAll();

	background.remove();
	palettes.forEach(function(el) { el.remove(); });
	labels.forEach(function(el) { el.remove(); })

	var backupLayer = project._children[0].clone({ "insert": false });
	addSelectableToLayer(backupLayer);
	console.log(backupLayer);

	// change all color
	project._children[0]._children.forEach(function(el, i) {
		if (el.constructor == Path && el.selectable) {
			el.fillColor.alpha = 1;
			el.strokeColor = el.fillColor;
		} else {
			el.visible = false;
		}
	});

	var svg = project.exportSVG();
	var ratio = background.width / svg.getAttribute('width');
	console.log(background.width);
	svg.setAttribute("transform", "scale(" + ratio + ")");

	var svgString = new XMLSerializer().serializeToString(svg);

	downloadDataUri({
		data: 'data:image/svg+xml;base64,' + btoa(svgString),
		filename: 'export.svg'
	});

	project.clear();

	project.addLayer(backupLayer);

	backupLayer.insertChild(0, background);
	backupLayer.insertChildren(1, palettes);
	backupLayer.insertChildren(2, labels);
	// palettes.forEach(function(el){backupLayer.addChild(el);});
	// labels.forEach(function(el){backupLayer.addChild(el);})


	console.log(currentColor);
});

$('#save-button').click(function() {
	unselect();

	var jsonObject = project.exportJSON({ "asString": false });
	//project._children[0]._children[i]
	jsonObject[0][1].children.forEach(function(el, i) {
		if (el[0] == "Path") {
			el[1].selectable = project._children[0]._children[i].selectable;
		}
	});

	var jsonString = JSON.stringify(jsonObject);

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
	var jsonObject = JSON.parse(event.target.result);

	project.clear();
	project.importJSON(jsonObject);

	jsonObject[0][1].children.forEach(function(el, i) {
		if (el[1] && project._children[0]._children[i]) {
			var item = project._children[0]._children[i];
			item.onMouseDown = onPathMouseDown;
			item.onMouseDrag = onPathMouseDrag;
			item.selectable = el[1].selectable;
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

function unselect(item) {
	if (item) {
		item.selected = false;
	} else if (currentPath) {
		currentPath.selected = false;
	}
}

function select(item) {
	unselect();
	if (item.selectable) {
		currentPath = item;
		currentPath.selected = true;
	}
}

function unselectAll() {
	project._children[0]._children.forEach(function(el, i) {
		if (el.constructor == Path) {
			unselect(el);
		}
	});
}

function addSelectableToJSON(jsonObject) {
	jsonObject[0][1].children.forEach(function(el, i) {
		if (el[0] == "Path") {
			el[1].selectable = true;
		}
	});
	console.log(jsonObject[0][1].children);
	return JSON.stringify(jsonObject);
}

function addSelectableToLayer(layer) {
	layer.children.forEach(function(el) {
		if (el.constructor == Path) {
			el.selectable = true;
			el.onMouseDown = onPathMouseDown;
			el.onMouseDrag = onPathMouseDrag;
		}
	});
}