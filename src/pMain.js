var colors = [
	new Color(getRandomColor(0.5)),
	new Color(getRandomColor(0.5)),
	new Color(getRandomColor(0.5)),
	new Color(getRandomColor(0.5))
];

for (var i = 0; i < colors.length; ++i) {
	var textItem = new PointText({
		content: 'Label' + i + ':',
		point: new Point(20, 60 + 20 * i),
		fillColor: 'black',
	});
	var pa = new Path.Rectangle({
		center: [70, 55 + 20 * i],
		size: [10, 10],
		fillColor: colors[i] + new Color(0, 0, 0, 0.5)
	});
	pa.selectable = false;
}

var currentPath;
var currentColor = colors[0];

var hitOptions = {
	segments: true,
	stroke: true,
	fill: true,
	tolerance: 5
};

function onPathMouseDown(event) {
	select(this);
}

function onPathMouseDrag(event) {
	if (currentPath == this) {
		if (this.selected) {
			this.position += event.delta;
		}
	}
}

function onMouseDown(event) {
	var hitResult = project.hitTest(event.point, hitOptions);
	if (!hitResult) {
		if (currentPath) {
			currentPath.selected = false;
		}

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
	} else if (hitResult.item.selectable) {
		if (currentPath) {
			currentPath.selected = false;
		}
		currentPath = hitResult.item;
		currentPath.selected = true;
	} else {
		if (currentPath) {
			currentPath.selected = false;
		}
		currentPath = null;

		currentColor = hitResult.item.fillColor - new Color(0, 0, 0, 0.5);
	}
}

function onMouseDrag(event) {
	if (currentPath) {
		if (!currentPath.selected) {
			currentPath.add(event.point);
		}
	}
}

function onMouseUp(event) {
	if (currentPath) {
		if (!currentPath.selected) {
			currentPath.closed = true;
			currentPath.fillColor = currentColor;
			currentPath.simplify();
			if (currentPath.segments.length == 1) {
				currentPath.remove();
			}
		}

		select(currentPath);
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
	unselect();

	var backupLayer = project._children[0].clone({ "insert": false });

	project._children[0]._children.forEach(function(el, i) {
		if (el.constructor == Path && el.selectable) {
			el.fillColor.alpha = 1;
			el.strokeColor = el.fillColor;
		} else {
			el.visible = false;
		}
	});

	var img = document.getElementById('background');
	var a = $('#background').offset();
	var b = img.clientWidth;
	var c = img.clientHeight;

	var svg = project.exportSVG({
		bounds: new Rectangle(a.left, a.top, b, c)
	});
	svg.setAttribute('width', img.naturalWidth);
	svg.setAttribute('height', img.naturalHeight);

	var svgString = new XMLSerializer().serializeToString(svg);

	downloadDataUri({
		data: 'data:image/svg+xml;base64,' + btoa(svgString),
		filename: 'export.svg'
	});

	project.clear();
	project.addLayer(backupLayer);
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
	var obj = JSON.parse(event.target.result);

	project.clear();
	project.importJSON(obj);

	getFirstLayerChildren(obj).forEach(function(el, i) {
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

function getFirstLayerChildren(obj) {
	return obj[0][1].children;
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

function addSelectable(jsonString) {
	var jsonObject = JSON.parse(jsonString);
	jsonObject[0][1].children.forEach(function(el) {
		if (el[0] == "Path") {
			el[1].selectable = true;
		}
	});
	return JSON.stringify(jsonObject);
}