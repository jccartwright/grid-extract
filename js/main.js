require([
    "dojo/_base/lang",
    "dojo/topic",
    "esri/core/lang",
    "esri/widgets/CoordinateConversion",
    "esri/widgets/Expand",
    "esri/widgets/Home",
    "esri/layers/ImageryLayer",
    "esri/layers/TileLayer",
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/support/MosaicRule",
    "esri/layers/support/RasterFunction",
    "app/BboxEntryWidget",
    "app/CoordinatesTool",
    "app/DatasetSelectWidget",
    "app/DrawExtentTool",
    "app/Globals",
    "dojo/domReady"
], function (
    lang,
    topic, 
    esriLang, 
    CoordinateConversion, 
    Expand,  
    Home, 
    ImageryLayer,
    TileLayer,
    Map, 
    MapView, 
    MosaicRule, 
    RasterFunction, 
    BboxEntryWidget,
    CoordinatesTool,
    DatasetSelectWidget, 
    DrawExtentTool, 
    globals) {
    
    document.getElementById("resetBtn").addEventListener('click', lang.hitch(this, resetButtonHandler));

    var map = new Map({
        basemap: "topo-vector",
        layers: globals.getMapLayers()
    });
    
    var view = new MapView({
        container: "viewDiv",
        map: map,
        center: [-97, 38],
        zoom: 4
    });

    view.when(function() { 
        // tool to draw area of interest on map
        const drawExtentTool = new DrawExtentTool({
            mapView: view, 
            outlineColor: [0,0,0]
        }, 'drawExtentTool');
        // lifecycle method 'startup' called automatically when added to View UI
        view.ui.add(drawExtentTool, "top-left");

        const homeWidget = new Home({view: view});
        view.ui.add(homeWidget, "top-right");

        const coordinatesTool = new CoordinatesTool({mapView: view});
        view.ui.add(coordinatesTool, "bottom-left");

        // const coordinateDisplayWidget = new CoordinateConversion({
        //     container: document.createElement("div"),
        //     view: view
        // });
        // view.ui.add(coordinateDisplayWidget, "bottom-left");

        // coordinateDisplayExpand = new Expand({
        //     expandIconClass: "esri-icon-tracking",  // see https://developers.arcgis.com/javascript/latest/guide/esri-icon-font/
        //     view: view,
        //     content: coordinateDisplayWidget.domNode,
        //     expanded: false
        //   });
        // view.ui.add(coordinateDisplayExpand, "bottom-left");
    })

    // doesn't need to wait for MapView or datafile to load
    const datasetSelectWidget = new DatasetSelectWidget({}, 'datasetSelectWidgetDiv');
    datasetSelectWidget.startup();

    const bboxEntryWidget = new BboxEntryWidget({textEntryNode: 'bboxText'}, 'bboxEntryWidgetDiv');
    bboxEntryWidget.startup();
    
    // populate dialog with current coords each time it opens. 
    // TODO bit of a hack but couldn't find better way to listen for dialog being opened
    $('#bboxDialog').on('show.bs.modal', function (event) {
        bboxEntryWidget.initDialog(document.getElementById("bboxText").value);
    });

    // TODO should these subscriptions be wrapped w/ this.own() to prevent memory leaks?

    // do something with the area of interest as set on map
    topic.subscribe("aoi/change", function(){
        this.extent = arguments[0]
        // console.log('area of interest set to: ', extentToString(this.extent));
        document.getElementById("bboxText").value = extentToString(this.extent,2);
        updateUrl();
    }.bind(this));

    // do something with change of dataset
    topic.subscribe("dataset/change", function(){
        this.dataset = arguments[0];
        updateUrl();
        togglePreviewLayers(dataset);
    }.bind(this));

    topic.subscribe("bbox/change", function() {
        this.extent = arguments[0];
        document.getElementById("bboxText").value = extentToString(this.extent,2);
        updateUrl();
    }.bind(this));


    function resetButtonHandler(evt) {
        // clear graphics from map
        topic.publish("map/clear");
    
        datasetSelectWidget.reset();
        dataset = null;
        document.getElementById('bboxText').value = "";
        extent = null;
        togglePreviewLayers();
        updateUrl();
    };


    function enableDownload(enable) {
        if (! enable) {
            document.getElementById("downloadBtn").classList.add("disabled");
            document.getElementById('downloadBtn').href = "";
        } else {
            document.getElementById("downloadBtn").classList.remove("disabled");
        }
    }


    function extentToString(extent, precision=4) {
        coords = [extent.xmin, extent.ymin, extent.xmax, extent.ymax].map(x => x.toFixed(precision));
        return(coords.join(', '));
    }


    function calculateCellCount(resolution, extent) {
        // console.log('inside calculateCellCount with ', resolution);	
        var xDist = extent.xmax - extent.xmin;
        // console.log('deltaX = ', xDist);
        // console.log('cellsX = ', xDist/resolution);

        var yDist = extent.ymax - extent.ymin;
        // console.log('deltaY = ', yDist);
        // console.log('cellsY = ', yDist/resolution);

        var cols = Math.round(xDist / resolution);
        var rows = Math.round(yDist / resolution);
		return ([rows, cols]);
    }
    

    function snapToGridResolution(extent, resolution) {
        // extent needs to represent the outer boundary of cell
        let cellOffset = resolution / 2;

        // deep copy
        let newExtent = esriLang.clone(extent);

        // first expand the bbox to match dataset's resolution
        newExtent.xmin = snapToGrid(extent.xmin, resolution);
        newExtent.ymin = snapToGrid(extent.ymin, resolution);
        newExtent.xmax = snapToGrid(extent.xmax, resolution);
        newExtent.ymax = snapToGrid(extent.ymax, resolution);
        // coords = [newExtent.xmin, newExtent.ymin, newExtent.xmax, newExtent.ymax].map(x => x.toFixed(12));
        // console.log("Expanded but not translated SW: ",coords.join(', '));

        // then shift to the SW to align bbox with outer edge of dataset's grid cell
        newExtent.xmin -= cellOffset;
        newExtent.ymin -= cellOffset;
        newExtent.xmax -= cellOffset;
        newExtent.ymax -= cellOffset;

        // coords = [newExtent.xmin, newExtent.ymin, newExtent.xmax, newExtent.ymax].map(x => x.toFixed(12));
        // console.log("Expanded and translated SW: ",coords.join(', '));
        return(newExtent);
    };


    // expand the original bbox so that length and width are multiple of 
    // the provided resolution. This, subject floating point variability,
    // gets close to an integer number of cells 
    function snapToGrid(value, resolution) {
        // return Math.round(value/interval) * interval;
        if (value < 0) {
            var val = Math.abs(value)
            var result = Math.ceil(val/resolution) * resolution
            return (result * -1)
        } else {
            return (Math.ceil(value/resolution) * resolution)
        }
    }    


    // poor-man's template replacement since storing template literal w/in 
    // variable didn't seem to work
    function populateUrlTemplate(template, extent, width, height) {
        let bbox = [extent.xmin, extent.ymin, extent.xmax, extent.ymax].map(x => x.toFixed(5));
        let result = template.replace("${bbox}", bbox.join(','));
        result = result.replace("${width}", width);
        result = result.replace("${height}", height);
        return(result);
    }


    function updateUrl() {
        if (this.dataset && this.extent) {
            if (this.extent.xmin > this.extent.xmax) {
                // TODO alert dialog
                console.error('Area of interest cannot cross the antimeridian');
                return;
            }

            let newExtent = snapToGridResolution(this.extent, this.dataset.resolution);
            let [rows, cols] = calculateCellCount(this.dataset.resolution, newExtent);
            console.log(`rows: ${rows}; cols: ${cols}`);
            console.log("modified bbox: ", extentToString(newExtent));
        
            const url = populateUrlTemplate(this.dataset.urlTemplate, newExtent, cols, rows);
            // console.log(url);

            document.getElementById('downloadBtn').href = url;
            enableDownload(true);
        } else {
            // console.warn('both dataset and area of interest must be set');
            enableDownload(false);
        }
    }


    function togglePreviewLayers(dataset) {
        const previewLayerId = dataset ? dataset.previewLayerId: "";

        map.layers.forEach(function(layer){
            if (layer.id === previewLayerId) {
                layer.visible = true;
            } else {
                layer.visible = false;
            }
        }) 
    }
});